
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Game from './components/Game';
import UIOverlay from './components/UIOverlay';
import RaceEngineer from './components/RaceEngineer';
import { GameStatus, GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    speed: 5,
    distance: 0,
    status: GameStatus.START,
    highScore: parseInt(localStorage.getItem('neonRacerHighScore') || '0', 10),
  });

  const lastStatusRef = useRef<GameStatus>(GameStatus.START);

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState(prev => {
      const newHighScore = Math.max(prev.highScore, finalScore);
      localStorage.setItem('neonRacerHighScore', newHighScore.toString());
      return {
        ...prev,
        status: GameStatus.GAMEOVER,
        score: finalScore,
        highScore: newHighScore
      };
    });
  }, []);

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      distance: 0,
      speed: 5,
      status: GameStatus.PLAYING
    }));
  };

  const updateStats = useCallback((score: number, distance: number, speed: number) => {
    setGameState(prev => ({
      ...prev,
      score,
      distance,
      speed
    }));
  }, []);

  useEffect(() => {
    lastStatusRef.current = gameState.status;
  }, [gameState.status]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col md:flex-row">
      {/* Game Viewport */}
      <div className="relative flex-grow h-full overflow-hidden border-r border-cyan-500/20">
        <Game 
          status={gameState.status} 
          onGameOver={handleGameOver} 
          onUpdate={updateStats}
        />
        
        <UIOverlay 
          gameState={gameState} 
          onStart={startGame} 
        />

        {/* HUD */}
        {gameState.status === GameStatus.PLAYING && (
          <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg">
              <div className="text-cyan-400 text-xs uppercase font-orbitron tracking-widest mb-1">Score</div>
              <div className="text-white text-3xl font-orbitron">{Math.floor(gameState.score)}</div>
            </div>
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg">
              <div className="text-cyan-400 text-xs uppercase font-orbitron tracking-widest mb-1">Speed</div>
              <div className="text-white text-xl font-orbitron">{Math.floor(gameState.speed * 10)} km/h</div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Race Engineer (Gemini AI) */}
      <div className="w-full md:w-80 h-1/3 md:h-full bg-slate-900 border-l border-cyan-500/20 p-4 overflow-y-auto z-50">
        <RaceEngineer 
          gameStatus={gameState.status} 
          score={gameState.score}
          speed={gameState.speed}
        />
      </div>
    </div>
  );
};

export default App;
