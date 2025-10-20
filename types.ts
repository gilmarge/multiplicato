export type Player = 'Rouge' | 'Bleu' | 'Vert';

export interface CellData {
  number: number;
  owner: Player | null;
}

export type GameBoard = CellData[][];

export type GameLevel = 1 | 2 | 3;

export type GameState = 'setup' | 'playing' | 'gameOver';

export interface Scores {
  Rouge: number;
  Bleu: number;
  Vert: number;
}

export interface Move {
  player: Player;
  number: number;
  factor1: number;
  factor2: number;
}

export type Role = 'attacker' | 'defender' | null;

export interface Coordinate {
  r: number;
  c: number;
}

export interface WinningLine {
  player: Player;
  coords: Coordinate[];
}

export interface AiMove {
  r: number;
  c: number;
  factor2: number;
}

export type AiDifficulty = 1 | 2 | 3;

export interface PlayerConfig {
  isAi: boolean;
  difficulty: AiDifficulty;
  name: string;
}