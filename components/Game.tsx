
import React, { useEffect, useRef, useCallback } from 'react';
import { GameStatus, Entity } from '../types';

interface GameProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onUpdate: (score: number, distance: number, speed: number) => void;
}

const Game: React.FC<GameProps> = ({ status, onGameOver, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game state held in refs for the loop
  const scoreRef = useRef(0);
  const speedRef = useRef(5);
  const distanceRef = useRef(0);
  const playerRef = useRef<Entity>({
    x: 0,
    y: 0,
    width: 40,
    height: 80,
    speed: 0,
    color: '#00f2ff'
  });
  const obstaclesRef = useRef<Entity[]>([]);
  const roadLinesRef = useRef<number[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    playerRef.current = {
      x: canvas.width / 2 - 20,
      y: canvas.height - 120,
      width: 40,
      height: 80,
      speed: 0,
      color: '#00f2ff'
    };
    
    obstaclesRef.current = [];
    roadLinesRef.current = [0, 150, 300, 450, 600];
    scoreRef.current = 0;
    speedRef.current = 5;
    distanceRef.current = 0;
  }, []);

  const spawnObstacle = useCallback((canvasWidth: number) => {
    const width = 45;
    const height = 90;
    const laneWidth = canvasWidth / 3;
    const lane = Math.floor(Math.random() * 3);
    const x = lane * laneWidth + (laneWidth - width) / 2;
    
    const colors = ['#ff0055', '#ffaa00', '#aa00ff'];
    
    obstaclesRef.current.push({
      x,
      y: -height,
      width,
      height,
      speed: speedRef.current * 0.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }, []);

  const update = useCallback((time: number) => {
    if (status !== GameStatus.PLAYING) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Movement logic
    const moveSpeed = 6;
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      playerRef.current.x = Math.max(10, playerRef.current.x - moveSpeed);
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      playerRef.current.x = Math.min(canvas.width - playerRef.current.width - 10, playerRef.current.x + moveSpeed);
    }

    // Road animation
    distanceRef.current += speedRef.current;
    scoreRef.current += speedRef.current / 100;
    speedRef.current += 0.001; // Gradual speed increase

    roadLinesRef.current = roadLinesRef.current.map(y => {
      let ny = y + speedRef.current;
      if (ny > canvas.height) ny = -100;
      return ny;
    });

    // Obstacles
    if (Math.random() < 0.02) {
      spawnObstacle(canvas.width);
    }

    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.y += speedRef.current;
      
      // Collision check
      const p = playerRef.current;
      if (
        p.x < obs.x + obs.width &&
        p.x + p.width > obs.x &&
        p.y < obs.y + obs.height &&
        p.y + p.height > obs.y
      ) {
        onGameOver(Math.floor(scoreRef.current));
        return false;
      }

      return obs.y < canvas.height;
    });

    // Render
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road edges
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f2ff';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(5, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width - 5, 0);
    ctx.lineTo(canvas.width - 5, canvas.height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw road lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    roadLinesRef.current.forEach(y => {
      ctx.fillRect(canvas.width / 3 - 2, y, 4, 80);
      ctx.fillRect((canvas.width / 3) * 2 - 2, y, 4, 80);
    });

    // Draw Player
    ctx.shadowBlur = 15;
    ctx.shadowColor = playerRef.current.color;
    ctx.fillStyle = playerRef.current.color;
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    // Player details (windows)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(playerRef.current.x + 5, playerRef.current.y + 15, playerRef.current.width - 10, 20);
    
    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = obs.color;
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(obs.x + 5, obs.y + 50, obs.width - 10, 20);
    });
    ctx.shadowBlur = 0;

    onUpdate(scoreRef.current, distanceRef.current, speedRef.current);
    requestRef.current = requestAnimationFrame(update);
  }, [status, onGameOver, onUpdate, spawnObstacle]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      initGame();
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, update, initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle Resize
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full cursor-none"
    />
  );
};

export default Game;
