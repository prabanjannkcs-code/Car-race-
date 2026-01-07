
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  width: number;
  height: number;
  speed: number;
  color: string;
}

export interface GameState {
  score: number;
  speed: number;
  distance: number;
  status: GameStatus;
  highScore: number;
}
