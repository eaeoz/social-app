import { Game } from '@nodots-llc/backgammon-core';

// Store active games in memory
const activeGames = new Map();

// Initialize backgammon board state
function initializeBoard() {
  const points = Array(24).fill(null).map(() => ({ checkers: 0, color: null }));
  
  // Setup standard backgammon starting position
  // White moves from point 1 to 24, Black moves from 24 to 1
  points[0] = { checkers: 2, color: 'white' };   // Point 1
  points[11] = { checkers: 5, color: 'white' };  // Point 12
  points[16] = { checkers: 3, color: 'white' };  // Point 17
  points[18] = { checkers: 5, color: 'white' };  // Point 19
  
  points[23] = { checkers: 2, color: 'black' };  // Point 24
  points[12] = { checkers: 5, color: 'black' };  // Point 13
  points[7] = { checkers: 3, color: 'black' };   // Point 8
  points[5] = { checkers: 5, color: 'black' };   // Point 6
  
  return {
    points,
    whiteBar: 0,
    blackBar: 0,
    whiteOff: 0,
    blackOff: 0
  };
}

function setupBackgammonHandlers(io, socket) {
  console.log('🎲 Setting up backgammon handlers for socket:', socket.id);

  // Join or create a game
  socket.on('backgammon:join', async ({ gameId, userId }) => {
    try {
      console.log(`🎲 User ${userId} joining game ${gameId}`);
      
      let game = activeGames.get(gameId);
      
      if (!game) {
        // Create new game
        game = {
          id: gameId,
          players: [],
          board: initializeBoard(),
          currentPlayer: 'white',
          state: 'waiting',
          dice: null,
          coreGame: null
        };
        activeGames.set(gameId, game);
        console.log(`✅ Created new game ${gameId}`);
      }
      
      // Check if player already in game
      let player = game.players.find(p => p.userId === userId);
      
      if (!player) {
        // Assign color based on deterministic rule (consistent across sessions)
        const color = game.players.length === 0 ? 'white' : 'black';
        player = {
          userId,
          socketId: socket.id,
          color
        };
        game.players.push(player);
        console.log(`✅ Player ${userId} joined as ${color}`);
      } else {
        // Update socket ID if player reconnected
        player.socketId = socket.id;
        console.log(`✅ Player ${userId} reconnected as ${player.color}`);
      }
      
      // Join socket room
      socket.join(gameId);
      
      // If we have 2 players, set state to ready
      if (game.players.length === 2 && game.state === 'waiting') {
        game.state = 'ready';
      }
      
      // Send personalized state to each player
      game.players.forEach(p => {
        io.to(p.socketId).emit('backgammon:state', {
          board: game.board,
          playerColor: p.color,
          currentPlayer: game.currentPlayer,
          dice: game.dice,
          state: game.state
        });
      });
      
    } catch (error) {
      console.error('Error in backgammon:join:', error);
      socket.emit('backgammon:error', { message: 'Failed to join game' });
    }
  });

  // Start the game
  socket.on('backgammon:start', async ({ gameId }) => {
    try {
      const game = activeGames.get(gameId);
      if (!game) {
        socket.emit('backgammon:error', { message: 'Game not found' });
        return;
      }
      
      if (game.players.length !== 2) {
        socket.emit('backgammon:error', { message: 'Need 2 players to start' });
        return;
      }
      
      console.log(`🎮 Starting game ${gameId}`);
      
      // Initialize the core game library
      try {
        game.coreGame = Game.createNewGame(
          { userId: game.players[0].userId, isRobot: false },
          { userId: game.players[1].userId, isRobot: false }
        );
        console.log('✅ Core game initialized');
      } catch (error) {
        console.error('Error initializing core game:', error);
      }
      
      game.state = 'rolling';
      game.currentPlayer = 'white';
      
      // Send personalized state to each player
      game.players.forEach(p => {
        io.to(p.socketId).emit('backgammon:state', {
          board: game.board,
          playerColor: p.color,
          currentPlayer: game.currentPlayer,
          dice: game.dice,
          state: game.state
        });
      });
      
    } catch (error) {
      console.error('Error in backgammon:start:', error);
      socket.emit('backgammon:error', { message: 'Failed to start game' });
    }
  });

  // Roll dice
  socket.on('backgammon:roll', ({ gameId }) => {
    try {
      const game = activeGames.get(gameId);
      if (!game) return;
      
      const player = game.players.find(p => p.socketId === socket.id);
      if (!player || player.color !== game.currentPlayer) {
        socket.emit('backgammon:error', { message: 'Not your turn' });
        return;
      }
      
      // Roll two dice
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      
      // If doubles (same number), player gets 4 moves instead of 2
      if (die1 === die2) {
        game.dice = [die1, die1, die1, die1];
        console.log(`🎲🎲 ${player.color} rolled DOUBLES: ${die1}-${die1} (4 moves!)`);
      } else {
        game.dice = [die1, die2];
        console.log(`🎲 ${player.color} rolled: ${die1}, ${die2}`);
      }
      
      game.state = 'moving';
      
      // Send personalized state to each player
      game.players.forEach(p => {
        io.to(p.socketId).emit('backgammon:state', {
          board: game.board,
          playerColor: p.color,
          currentPlayer: game.currentPlayer,
          dice: game.dice,
          state: game.state
        });
      });
      
    } catch (error) {
      console.error('Error in backgammon:roll:', error);
      socket.emit('backgammon:error', { message: 'Failed to roll dice' });
    }
  });

  // Move checker
  socket.on('backgammon:move', ({ gameId, from, to }) => {
    try {
      const game = activeGames.get(gameId);
      if (!game) return;
      
      const player = game.players.find(p => p.socketId === socket.id);
      if (!player || player.color !== game.currentPlayer) {
        socket.emit('backgammon:error', { message: 'Not your turn' });
        return;
      }
      
      // Check if moving from bar (-1 represents bar)
      const isFromBar = from === -1;
      const playerBar = player.color === 'white' ? game.board.whiteBar : game.board.blackBar;
      
      console.log(`🎯 ${player.color} moving from ${isFromBar ? 'BAR' : `point ${from}`} to point ${to}, dice: ${game.dice}`);
      
      // If player has checkers on bar, they MUST move from bar first
      if (!isFromBar && playerBar > 0) {
        socket.emit('backgammon:error', { message: 'Must move checker from bar first!' });
        return;
      }
      
      let distance;
      
      if (isFromBar) {
        // Moving from bar
        // White enters from point 0-5 (home board), Black from point 18-23
        if (player.color === 'white') {
          // White enters at points 0-5 based on dice
          distance = to + 1; // Point 0 needs 1, point 5 needs 6
          if (to < 0 || to > 5) {
            socket.emit('backgammon:error', { message: 'Invalid entry point from bar' });
            return;
          }
        } else {
          // Black enters at points 18-23 based on dice
          distance = 24 - to; // Point 23 needs 1, point 18 needs 6
          if (to < 18 || to > 23) {
            socket.emit('backgammon:error', { message: 'Invalid entry point from bar' });
            return;
          }
        }
      } else {
        // Regular move - calculate distance based on player direction
        if (player.color === 'white') {
          distance = to - from;  // Positive for white
        } else {
          distance = from - to;  // Positive for black
        }
      }
      
      console.log(`📏 Calculated distance: ${distance} for ${player.color}${isFromBar ? ' (from bar)' : ''}`);
      
      // Validate distance matches one of the dice OR sum of dice (for non-doubles)
      let diceToUse = [];
      
      if (game.dice.includes(distance)) {
        // Direct match - single die
        diceToUse = [distance];
      } else if (game.dice.length === 2 && game.dice[0] !== game.dice[1]) {
        // Check if distance equals sum of both different dice
        const sum = game.dice[0] + game.dice[1];
        if (distance === sum) {
          diceToUse = [...game.dice]; // Use both dice
          console.log(`🎯 Combined move: ${game.dice[0]} + ${game.dice[1]} = ${distance}`);
        }
      }
      
      if (diceToUse.length === 0) {
        socket.emit('backgammon:error', { 
          message: `Invalid move - distance ${distance} doesn't match dice ${game.dice}` 
        });
        return;
      }
      
      // Validate direction for regular moves
      if (!isFromBar) {
        if ((player.color === 'white' && to <= from) || (player.color === 'black' && to >= from)) {
          socket.emit('backgammon:error', { message: 'Invalid move - wrong direction' });
          return;
        }
        
        // Check if we have a checker to move
        const fromPoint = game.board.points[from];
        if (!fromPoint || fromPoint.checkers === 0 || fromPoint.color !== player.color) {
          socket.emit('backgammon:error', { message: 'Invalid move - no checker to move from this point' });
          return;
        }
      }
      
      // Check destination
      const toPoint = game.board.points[to];
      if (toPoint.color && toPoint.color !== player.color && toPoint.checkers > 1) {
        socket.emit('backgammon:error', { message: 'Invalid move - destination blocked by opponent' });
        return;
      }
      
      // Execute the move
      if (isFromBar) {
        // Move from bar
        if (player.color === 'white') {
          game.board.whiteBar--;
        } else {
          game.board.blackBar--;
        }
        console.log(`📤 ${player.color} moved from bar to point ${to}`);
      } else {
        // Move from point
        const fromPoint = game.board.points[from];
        fromPoint.checkers--;
        if (fromPoint.checkers === 0) {
          fromPoint.color = null;
        }
      }
      
      // Handle capturing (hit)
      if (toPoint.color && toPoint.color !== player.color && toPoint.checkers === 1) {
        console.log(`💥 ${player.color} captured ${toPoint.color} checker!`);
        if (toPoint.color === 'white') {
          game.board.whiteBar++;
        } else {
          game.board.blackBar++;
        }
        toPoint.checkers = 0;
        toPoint.color = null;
      }
      
      // Place checker on destination
      toPoint.checkers++;
      toPoint.color = player.color;
      
      // Remove used dice
      if (diceToUse.length === 1) {
        // Single die used
        const dieIndex = game.dice.indexOf(diceToUse[0]);
        game.dice.splice(dieIndex, 1);
      } else {
        // Both dice used (combined move)
        game.dice = [];
      }
      
      console.log(`✅ Move successful! Remaining dice: ${game.dice}`);
      
      // Check if turn is complete
      if (game.dice.length === 0) {
        console.log(`🔄 Turn complete, switching to ${game.currentPlayer === 'white' ? 'black' : 'white'}`);
        game.state = 'rolling';
        game.currentPlayer = game.currentPlayer === 'white' ? 'black' : 'white';
        game.dice = null;
      }
      
      // Check for win condition
      const playerOff = player.color === 'white' ? game.board.whiteOff : game.board.blackOff;
      if (playerOff === 15) {
        game.state = 'game_over';
        io.to(gameId).emit('backgammon:game_over', { winner: player.color });
      }
      
      // Send personalized state to each player
      game.players.forEach(p => {
        io.to(p.socketId).emit('backgammon:state', {
          board: game.board,
          playerColor: p.color,
          currentPlayer: game.currentPlayer,
          dice: game.dice,
          state: game.state
        });
      });
      
    } catch (error) {
      console.error('Error in backgammon:move:', error);
      socket.emit('backgammon:error', { message: 'Failed to make move' });
    }
  });

  // Leave game
  socket.on('backgammon:leave', ({ gameId }) => {
    try {
      const game = activeGames.get(gameId);
      if (game) {
        game.players = game.players.filter(p => p.socketId !== socket.id);
        
        if (game.players.length === 0) {
          // Delete game if no players left
          activeGames.delete(gameId);
          console.log(`🗑️ Deleted empty game ${gameId}`);
        } else {
          // Notify remaining player
          socket.to(gameId).emit('backgammon:error', { message: 'Opponent left the game' });
        }
      }
      
      socket.leave(gameId);
    } catch (error) {
      console.error('Error in backgammon:leave:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Clean up any games this player was in
    activeGames.forEach((game, gameId) => {
      const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        
        if (game.players.length === 0) {
          activeGames.delete(gameId);
        } else {
          socket.to(gameId).emit('backgammon:error', { message: 'Opponent disconnected' });
        }
      }
    });
  });
}

export { setupBackgammonHandlers };
