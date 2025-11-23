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

// Check if player can bear off (all checkers in home board)
function canBearOff(game, playerColor) {
  const playerBar = playerColor === 'white' ? game.board.whiteBar : game.board.blackBar;
  
  // Can't bear off if checkers on bar
  if (playerBar > 0) {
    console.log(`❌ ${playerColor} has checkers on bar, cannot bear off`);
    return false;
  }
  
  // Check if all checkers are in home board
  // White home board: points 19-24 (indices 18-23) - White moves clockwise, bears off from top right
  // Black home board: points 1-6 (indices 0-5) - Black moves counter-clockwise, bears off from bottom right
  const homeBoard = playerColor === 'white' ? [18, 19, 20, 21, 22, 23] : [0, 1, 2, 3, 4, 5];
  
  for (let i = 0; i < 24; i++) {
    const point = game.board.points[i];
    if (point && point.color === playerColor && point.checkers > 0) {
      if (!homeBoard.includes(i)) {
        console.log(`❌ ${playerColor} has checker at point ${i}, not in home board ${homeBoard}`);
        return false; // Found checker outside home board
      }
    }
  }
  
  console.log(`✅ ${playerColor} can bear off - all checkers in home board`);
  return true;
}

// Check if a player has any legal moves available
function checkForLegalMoves(game, playerColor) {
  const playerBar = playerColor === 'white' ? game.board.whiteBar : game.board.blackBar;
  
  // If player has checkers on bar, check if they can enter
  if (playerBar > 0) {
    const entryPoints = playerColor === 'white' ? [0, 1, 2, 3, 4, 5] : [18, 19, 20, 21, 22, 23];
    
    for (const dieValue of game.dice) {
      let targetPoint;
      if (playerColor === 'white') {
        targetPoint = dieValue - 1; // Die 1 → point 0, die 6 → point 5
      } else {
        targetPoint = 24 - dieValue; // Die 1 → point 23, die 6 → point 18
      }
      
      if (entryPoints.includes(targetPoint)) {
        const point = game.board.points[targetPoint];
        // Can enter if point is empty, has our checkers, or has only 1 opponent checker
        if (!point.color || point.color === playerColor || point.checkers <= 1) {
          console.log(`✅ Legal move found: Enter from bar to point ${targetPoint} with die ${dieValue}`);
          return true;
        }
      }
    }
    return false; // Can't enter from bar
  }
  
  // Check all points where player has checkers
  for (let fromPoint = 0; fromPoint < 24; fromPoint++) {
    const point = game.board.points[fromPoint];
    if (!point || point.color !== playerColor || point.checkers === 0) continue;
    
    // Try each die value and combinations
    const uniqueDice = [...new Set(game.dice)];
    
    for (const dieValue of uniqueDice) {
      // Calculate target point based on player direction
      let toPoint;
      if (playerColor === 'white') {
        toPoint = fromPoint + dieValue;
      } else {
        toPoint = fromPoint - dieValue;
      }
      
      // Check if move is within board
      if (toPoint < 0 || toPoint > 23) continue;
      
      // Check if destination is available
      const destPoint = game.board.points[toPoint];
      if (!destPoint.color || destPoint.color === playerColor || destPoint.checkers <= 1) {
        console.log(`✅ Legal move found: Point ${fromPoint} → ${toPoint} with die ${dieValue}`);
        return true;
      }
    }
    
    // Check combined moves (for non-doubles with 2 dice)
    if (game.dice.length === 2 && game.dice[0] !== game.dice[1]) {
      const combinedDistance = game.dice[0] + game.dice[1];
      let toPoint;
      if (playerColor === 'white') {
        toPoint = fromPoint + combinedDistance;
      } else {
        toPoint = fromPoint - combinedDistance;
      }
      
      if (toPoint >= 0 && toPoint <= 23) {
        const destPoint = game.board.points[toPoint];
        if (!destPoint.color || destPoint.color === playerColor || destPoint.checkers <= 1) {
          console.log(`✅ Legal move found: Point ${fromPoint} → ${toPoint} with combined dice ${game.dice[0]}+${game.dice[1]}`);
          return true;
        }
      }
    }
    
    // Check combined moves for doubles (any multiple)
    if (game.dice.length >= 2 && game.dice.every(d => d === game.dice[0])) {
      const dieValue = game.dice[0];
      for (let multiplier = 2; multiplier <= game.dice.length; multiplier++) {
        const combinedDistance = dieValue * multiplier;
        let toPoint;
        if (playerColor === 'white') {
          toPoint = fromPoint + combinedDistance;
        } else {
          toPoint = fromPoint - combinedDistance;
        }
        
        if (toPoint >= 0 && toPoint <= 23) {
          const destPoint = game.board.points[toPoint];
          if (!destPoint.color || destPoint.color === playerColor || destPoint.checkers <= 1) {
            console.log(`✅ Legal move found: Point ${fromPoint} → ${toPoint} with ${multiplier}×${dieValue}`);
            return true;
          }
        }
      }
    }
  }
  
  console.log(`❌ No legal moves found for ${playerColor} with dice ${game.dice}`);
  return false;
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
      
      // Check if moving from bar (-1) or bearing off (-2)
      const isFromBar = from === -1;
      const isBearingOff = to === -2;
      const playerBar = player.color === 'white' ? game.board.whiteBar : game.board.blackBar;
      
      console.log(`🎯 ${player.color} moving from ${isFromBar ? 'BAR' : `point ${from}`} to ${isBearingOff ? 'OFF' : `point ${to}`}, dice: ${game.dice}`);
      
      // If player has checkers on bar, they MUST move from bar first
      if (!isFromBar && !isBearingOff && playerBar > 0) {
        socket.emit('backgammon:error', { message: 'Must move checker from bar first!' });
        return;
      }
      
      let distance;
      let diceToUse = [];
      
      if (isBearingOff) {
        // Handle bearing off
        if (!canBearOff(game, player.color)) {
          socket.emit('backgammon:error', { message: 'Cannot bear off - not all checkers in home board!' });
          return;
        }
        
        // Check if from point is valid
        const fromPoint = game.board.points[from];
        if (!fromPoint || fromPoint.checkers === 0 || fromPoint.color !== player.color) {
          socket.emit('backgammon:error', { message: 'No checker to bear off from this point' });
          return;
        }
        
        // Calculate distance to bear off
        // White home board: 19-24 (indices 18-23), bears off past 24
        // Black home board: 1-6 (indices 0-5), bears off past 0
        if (player.color === 'white') {
          // Point 18 needs die 6, point 19 needs 5, ..., point 23 needs 1
          distance = 24 - from;
        } else {
          // Point 0 needs die 1, point 1 needs 2, ..., point 5 needs 6
          distance = from + 1;
        }
        
        console.log(`🏁 Bearing off from point ${from} (point number ${from + 1}), distance ${distance} needed`);
        
        // Check if exact die matches
        if (game.dice.includes(distance)) {
          diceToUse = [distance];
          console.log(`✅ Exact match: die ${distance}`);
        } else {
          // Can use higher die if no checkers behind (further from bearing off)
          const higherDice = game.dice.filter(d => d > distance);
          
          if (higherDice.length > 0) {
            // Check if there are checkers further from bearing off
            let hasCheckersBehind = false;
            
            if (player.color === 'white') {
              // Check points 18 to from-1 (further from bearing off = lower point numbers)
              for (let i = 18; i < from; i++) {
                const pt = game.board.points[i];
                if (pt && pt.color === player.color && pt.checkers > 0) {
                  hasCheckersBehind = true;
                  console.log(`❌ White has checker at point ${i}, further from bear off`);
                  break;
                }
              }
            } else {
              // Check points from+1 to 5 (further from bearing off = higher point numbers)
              for (let i = from + 1; i <= 5; i++) {
                const pt = game.board.points[i];
                if (pt && pt.color === player.color && pt.checkers > 0) {
                  hasCheckersBehind = true;
                  console.log(`❌ Black has checker at point ${i}, further from bear off`);
                  break;
                }
              }
            }
            
            if (!hasCheckersBehind) {
              // Can use any higher die
              diceToUse = [higherDice[0]];
              console.log(`✅ Using higher die ${higherDice[0]} (no checkers behind)`);
            } else {
              socket.emit('backgammon:error', { 
                message: `Cannot bear off - need exact die ${distance} or move other checkers first` 
              });
              return;
            }
          } else {
            socket.emit('backgammon:error', { 
              message: `Invalid bear off - no die matches distance ${distance}` 
            });
            return;
          }
        }
      } else if (isFromBar) {
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
      
      // Validate distance matches dice combination (only if not already set by bearing off)
      if (diceToUse.length === 0) {
        // Check if distance matches a single die
        if (game.dice.includes(distance)) {
          diceToUse = [distance];
        }
        // For doubles (e.g., 4,4,4,4), allow any valid combination
        else if (game.dice.length >= 2 && game.dice.every(d => d === game.dice[0])) {
          const dieValue = game.dice[0];
          const availableDice = game.dice.length;
          
          // Check if distance is a multiple of the die value
          if (distance % dieValue === 0) {
            const diceNeeded = distance / dieValue;
            
            // Check if we have enough dice
            if (diceNeeded <= availableDice && diceNeeded > 0) {
              // Validate each intermediate step for doubles moves
              let currentPos = from;
              let allStepsClear = true;
              
              for (let step = 0; step < diceNeeded; step++) {
                let nextPos;
                if (player.color === 'white') {
                  nextPos = currentPos + dieValue;
                } else {
                  nextPos = currentPos - dieValue;
                }
                
                // Check if intermediate position is blocked (has 2+ opponent checkers)
                if (nextPos >= 0 && nextPos <= 23) {
                  const checkPoint = game.board.points[nextPos];
                  if (checkPoint.color && checkPoint.color !== player.color && checkPoint.checkers > 1) {
                    console.log(`❌ Step ${step + 1}: Point ${nextPos} is blocked by opponent`);
                    allStepsClear = false;
                    break;
                  }
                }
                
                currentPos = nextPos;
              }
              
              if (allStepsClear) {
                diceToUse = Array(diceNeeded).fill(dieValue);
                console.log(`✅ Doubles combined move: ${diceNeeded}×${dieValue} = ${distance} (all steps clear)`);
              } else {
                console.log(`❌ Cannot move ${distance}: intermediate steps are blocked`);
              }
            }
          }
        }
        // For two different dice, allow combining them
        else if (game.dice.length === 2 && game.dice[0] !== game.dice[1]) {
          const sum = game.dice[0] + game.dice[1];
          if (distance === sum) {
            // Validate both possible paths for combined moves
            let pathValid = false;
            
            // Try first die then second die
            let firstStep, secondStep;
            if (player.color === 'white') {
              firstStep = from + game.dice[0];
              secondStep = firstStep + game.dice[1];
            } else {
              firstStep = from - game.dice[0];
              secondStep = firstStep - game.dice[1];
            }
            
            if (firstStep >= 0 && firstStep <= 23) {
              const firstPoint = game.board.points[firstStep];
              if (!firstPoint.color || firstPoint.color === player.color || firstPoint.checkers <= 1) {
                pathValid = true;
                console.log(`✅ Combined move path 1 valid: ${from} → ${firstStep} → ${to}`);
              }
            }
            
            // Try second die then first die (alternative path)
            if (!pathValid) {
              if (player.color === 'white') {
                firstStep = from + game.dice[1];
                secondStep = firstStep + game.dice[0];
              } else {
                firstStep = from - game.dice[1];
                secondStep = firstStep - game.dice[0];
              }
              
              if (firstStep >= 0 && firstStep <= 23) {
                const firstPoint = game.board.points[firstStep];
                if (!firstPoint.color || firstPoint.color === player.color || firstPoint.checkers <= 1) {
                  pathValid = true;
                  console.log(`✅ Combined move path 2 valid: ${from} → ${firstStep} → ${to}`);
                }
              }
            }
            
            if (pathValid) {
              diceToUse = [...game.dice];
              console.log(`✅ Combined move: ${game.dice[0]} + ${game.dice[1]} = ${distance}`);
            } else {
              console.log(`❌ Cannot combine dice: both paths blocked`);
            }
          }
        }
      }
      
      if (diceToUse.length === 0) {
        socket.emit('backgammon:error', { 
          message: `Invalid move - distance ${distance} doesn't match available dice ${game.dice}` 
        });
        return;
      }
      
      // Validate direction for regular moves (not bearing off)
      if (!isFromBar && !isBearingOff) {
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
        
        // Check destination
        const toPoint = game.board.points[to];
        if (toPoint.color && toPoint.color !== player.color && toPoint.checkers > 1) {
          socket.emit('backgammon:error', { message: 'Invalid move - destination blocked by opponent' });
          return;
        }
      }
      
      // Execute the move
      if (isBearingOff) {
        // Bear off - remove checker from board
        const fromPoint = game.board.points[from];
        fromPoint.checkers--;
        if (fromPoint.checkers === 0) {
          fromPoint.color = null;
        }
        
        // Increment off count
        if (player.color === 'white') {
          game.board.whiteOff++;
        } else {
          game.board.blackOff++;
        }
        
        console.log(`🏁 ${player.color} bore off from point ${from}`);
      } else if (isFromBar) {
        // Move from bar
        if (player.color === 'white') {
          game.board.whiteBar--;
        } else {
          game.board.blackBar--;
        }
        console.log(`📤 ${player.color} moved from bar to point ${to}`);
        
        // Handle capturing (hit) when entering from bar
        const toPoint = game.board.points[to];
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
      } else {
        // Regular move from point to point
        const fromPoint = game.board.points[from];
        fromPoint.checkers--;
        if (fromPoint.checkers === 0) {
          fromPoint.color = null;
        }
        
        // Handle capturing (hit)
        const toPoint = game.board.points[to];
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
      }
      
      // Remove used dice
      if (diceToUse.length === 1) {
        // Single die used
        const dieIndex = game.dice.indexOf(diceToUse[0]);
        game.dice.splice(dieIndex, 1);
      } else {
        // Multiple dice used (combined move)
        // Remove the exact number of dice that were used
        for (let i = 0; i < diceToUse.length; i++) {
          const dieIndex = game.dice.indexOf(diceToUse[i]);
          if (dieIndex !== -1) {
            game.dice.splice(dieIndex, 1);
          }
        }
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

  // Pass turn (when no legal moves available)
  socket.on('backgammon:pass', ({ gameId }) => {
    try {
      const game = activeGames.get(gameId);
      if (!game) return;
      
      const player = game.players.find(p => p.socketId === socket.id);
      if (!player || player.color !== game.currentPlayer) {
        socket.emit('backgammon:error', { message: 'Not your turn' });
        return;
      }
      
      if (game.state !== 'moving') {
        socket.emit('backgammon:error', { message: 'Can only pass during moving phase' });
        return;
      }
      
      // Check if player has legal moves available
      const hasLegalMoves = checkForLegalMoves(game, player.color);
      
      if (hasLegalMoves) {
        socket.emit('backgammon:error', { 
          message: 'You still have legal moves available! Cannot pass turn.' 
        });
        console.log(`❌ ${player.color} tried to pass but has legal moves`);
        return;
      }
      
      console.log(`⏭️ ${player.color} passed turn (verified no legal moves)`);
      
      // Clear remaining dice and switch turn
      game.dice = null;
      game.state = 'rolling';
      game.currentPlayer = game.currentPlayer === 'white' ? 'black' : 'white';
      
      console.log(`🔄 Turn passed to ${game.currentPlayer}`);
      
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
      console.error('Error in backgammon:pass:', error);
      socket.emit('backgammon:error', { message: 'Failed to pass turn' });
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
