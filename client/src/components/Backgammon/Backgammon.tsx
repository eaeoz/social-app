import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import './Backgammon.css';

interface BackgammonProps {
  socket: Socket;
  gameId: string;
  user: any;
  onClose: () => void;
}

interface BoardState {
  points: PointState[];
  whiteBar: number;
  blackBar: number;
  whiteOff: number;
  blackOff: number;
}

interface PointState {
  checkers: number;
  color: 'white' | 'black' | null;
}

type GameState = 'waiting' | 'ready' | 'rolling' | 'moving' | 'opponent_turn' | 'game_over';

function Backgammon({ socket, gameId, user, onClose }: BackgammonProps) {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [myColor, setMyColor] = useState<'white' | 'black' | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [board, setBoard] = useState<BoardState>({
    points: Array(24).fill(null).map(() => ({ checkers: 0, color: null })),
    whiteBar: 0,
    blackBar: 0,
    whiteOff: 0,
    blackOff: 0
  });
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);

  // Initialize game
  useEffect(() => {
    console.log('🎲 Backgammon component mounted, gameId:', gameId);
    
    // Request to join game
    socket.emit('backgammon:join', { gameId, userId: user.userId });

    // Listen for game state updates
    socket.on('backgammon:state', (data: {
      board: BoardState;
      playerColor: 'white' | 'black';
      currentPlayer: 'white' | 'black';
      dice: [number, number] | null;
      state: GameState;
    }) => {
      console.log('📊 Received game state:', data);
      setBoard(data.board);
      setMyColor(data.playerColor);
      setCurrentPlayer(data.currentPlayer);
      setDice(data.dice);
      setGameState(data.state);
    });

    socket.on('backgammon:error', (data: { message: string }) => {
      console.error('❌ Backgammon error:', data.message);
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });

    socket.on('backgammon:game_over', (data: { winner: 'white' | 'black' }) => {
      console.log('🏆 Game over! Winner:', data.winner);
      setWinner(data.winner);
      setGameState('game_over');
    });

    // Send activity heartbeat every 30 seconds to prevent session timeout
    const activityInterval = setInterval(() => {
      socket.emit('activity', { userId: user.userId });
    }, 30000);

    return () => {
      socket.off('backgammon:state');
      socket.off('backgammon:error');
      socket.off('backgammon:game_over');
      clearInterval(activityInterval);
      // Leave game on unmount
      socket.emit('backgammon:leave', { gameId });
    };
  }, [socket, gameId, user.userId]);

  const handleStartGame = () => {
    console.log('🎮 Starting game');
    socket.emit('backgammon:start', { gameId });
  };

  const handleRollDice = () => {
    if (gameState !== 'rolling' || myColor !== currentPlayer) return;
    console.log('🎲 Rolling dice');
    socket.emit('backgammon:roll', { gameId });
  };

  const handlePointClick = (pointIndex: number) => {
    if (gameState !== 'moving' || myColor !== currentPlayer) return;

    if (selectedPoint === null) {
      // Select a point if it has our checkers
      const point = board.points[pointIndex];
      if (point && point.color === myColor && point.checkers > 0) {
        setSelectedPoint(pointIndex);
        console.log(`✅ Selected point ${pointIndex}`);
      }
    } else {
      // If clicking the same point, deselect it
      if (selectedPoint === pointIndex) {
        console.log(`↩️ Deselected point ${pointIndex}`);
        setSelectedPoint(null);
        return;
      }
      
      // Try to move to this point
      console.log(`🎯 Attempting move from ${selectedPoint} to ${pointIndex}`);
      socket.emit('backgammon:move', {
        gameId,
        from: selectedPoint,
        to: pointIndex
      });
      setSelectedPoint(null);
    }
  };

  const handleBarClick = () => {
    if (gameState !== 'moving' || myColor !== currentPlayer) return;
    
    const barCount = myColor === 'white' ? board.whiteBar : board.blackBar;
    if (barCount > 0) {
      // If bar is already selected, deselect it
      if (selectedPoint === -1) {
        console.log(`↩️ Deselected bar`);
        setSelectedPoint(null);
      } else {
        console.log(`✅ Selected bar (${barCount} checkers)`);
        setSelectedPoint(-1); // Use -1 to represent the bar
      }
    }
  };

  const renderBoard = () => {
    const renderPoint = (i: number, isTopRow: boolean) => {
      const point = board.points[i];
      const isSelected = selectedPoint === i;
      
      return (
        <div
          key={i}
          className={`point ${isTopRow ? 'top-row' : 'bottom-row'} ${isSelected ? 'selected' : ''}`}
          onClick={() => handlePointClick(i)}
        >
          <div className="point-number">{i + 1}</div>
          {point && point.checkers > 0 && (
            <div className={`checkers ${point.color}`}>
              {Array.from({ length: Math.min(point.checkers, 5) }).map((_, idx) => (
                <div key={idx} className="checker" />
              ))}
              {point.checkers > 5 && (
                <div className="checker-count">+{point.checkers - 5}</div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <>
        {/* Right section */}
        <div className="board-section">
          {/* Top row: 12-17 */}
          <div className="board-row">
            {[12, 13, 14, 15, 16, 17].map(i => renderPoint(i, true))}
          </div>
          {/* Bottom row: 11-6 (reverse) */}
          <div className="board-row">
            {[11, 10, 9, 8, 7, 6].map(i => renderPoint(i, false))}
          </div>
        </div>
        
        {/* Left section */}
        <div className="board-section">
          {/* Top row: 18-23 */}
          <div className="board-row">
            {[18, 19, 20, 21, 22, 23].map(i => renderPoint(i, true))}
          </div>
          {/* Bottom row: 5-0 (reverse) */}
          <div className="board-row">
            {[5, 4, 3, 2, 1, 0].map(i => renderPoint(i, false))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="backgammon-container">
      <div className="backgammon-header">
        <h2>🎲 Backgammon</h2>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="game-info">
        <div className="player-info">
          <span className={myColor === 'white' ? 'active' : ''}>
            ⚪ White {myColor === 'white' && '(You)'}
          </span>
          <span className={myColor === 'black' ? 'active' : ''}>
            ⚫ Black {myColor === 'black' && '(You)'}
          </span>
        </div>
        
        {dice && (
          <div className="dice-display">
            <div className="die">{dice[0]}</div>
            <div className="die">{dice[1]}</div>
          </div>
        )}

        <div className="turn-indicator">
          {gameState === 'waiting' && 'Waiting for opponent...'}
          {gameState === 'ready' && 'Ready to start!'}
          {gameState === 'rolling' && myColor === currentPlayer && 'Your turn - Roll dice'}
          {gameState === 'rolling' && myColor !== currentPlayer && 'Opponent rolling...'}
          {gameState === 'moving' && myColor === currentPlayer && 'Your turn - Move checkers'}
          {gameState === 'moving' && myColor !== currentPlayer && 'Opponent moving...'}
          {gameState === 'opponent_turn' && 'Opponent\'s turn...'}
          {gameState === 'game_over' && winner && `🏆 ${winner === myColor ? 'You win!' : 'You lose!'}`}
        </div>
      </div>

      <div className="backgammon-board">
        {renderBoard()}
        
        <div 
          className={`bar ${selectedPoint === -1 ? 'selected' : ''}`}
          onClick={handleBarClick}
        >
          <div className="bar-label">BAR</div>
          {board.whiteBar > 0 && (
            <div className="bar-checkers white">⚪×{board.whiteBar}</div>
          )}
          {board.blackBar > 0 && (
            <div className="bar-checkers black">⚫×{board.blackBar}</div>
          )}
        </div>
        
        <div className="off-board">
          <div className="off-white">
            White Off: {board.whiteOff}
          </div>
          <div className="off-black">
            Black Off: {board.blackOff}
          </div>
        </div>
      </div>

      <div className="game-controls">
        {gameState === 'ready' && (
          <button className="game-button" onClick={handleStartGame}>
            Start Game
          </button>
        )}
        
        {gameState === 'rolling' && myColor === currentPlayer && (
          <button className="game-button" onClick={handleRollDice}>
            🎲 Roll Dice
          </button>
        )}
        
        {gameState === 'game_over' && (
          <button className="game-button" onClick={onClose}>
            Close Game
          </button>
        )}
      </div>
    </div>
  );
}

export default Backgammon;
