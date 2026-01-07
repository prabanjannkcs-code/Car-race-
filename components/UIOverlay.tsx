
import React from 'react';
import { GameStatus, GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  onStart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, onStart }) => {
  if (gameState.status === GameStatus.PLAYING) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-cyan-500/30 p-8 rounded-2xl shadow-2xl shadow-cyan-500/10">
        {gameState.status === GameStatus.START ? (
          <>
            <h1 className="text-5xl font-orbitron font-bold text-white mb-2 tracking-tighter italic">
              NEON<span className="text-cyan-400">RACER</span>
            </h1>
            <p className="text-cyan-200/60 mb-8 font-medium">Arcade Survival Protocol v2.5</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-[10px] uppercase text-slate-500 tracking-widest mb-1">Last Score</div>
                <div className="text-white font-orbitron text-xl">{Math.floor(gameState.score)}</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-cyan-500/20">
                <div className="text-[10px] uppercase text-cyan-500 tracking-widest mb-1">High Score</div>
                <div className="text-cyan-400 font-orbitron text-xl">{Math.floor(gameState.highScore)}</div>
              </div>
            </div>

            <button 
              onClick={onStart}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/40"
            >
              INITIALIZE DRIVE
            </button>
            
            <div className="mt-8 text-slate-500 text-xs flex justify-center gap-6">
              <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-white/10">A</kbd> LEFT</span>
              <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-white/10">D</kbd> RIGHT</span>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-orbitron font-bold text-pink-500 mb-2">SYSTEM FAILURE</h2>
            <p className="text-slate-400 mb-8">Collision detected. Engine shutdown.</p>
            
            <div className="flex flex-col gap-3 mb-8">
               <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl">
                 <span className="text-slate-400 text-sm">FINAL SCORE</span>
                 <span className="text-white font-orbitron text-2xl">{Math.floor(gameState.score)}</span>
               </div>
               <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-cyan-500/20">
                 <span className="text-cyan-500 text-sm">PERSONAL BEST</span>
                 <span className="text-cyan-400 font-orbitron text-2xl">{Math.floor(gameState.highScore)}</span>
               </div>
            </div>

            <button 
              onClick={onStart}
              className="w-full bg-pink-500 hover:bg-pink-400 text-white font-orbitron font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-pink-500/40"
            >
              REBOOT SYSTEM
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UIOverlay;
