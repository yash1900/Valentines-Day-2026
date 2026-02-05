export enum GameStage {
  INTRO = 'INTRO',
  GAME = 'GAME',
  PROPOSAL = 'PROPOSAL',
  VICTORY = 'VICTORY'
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject extends Position, Size {
  type: string;
}