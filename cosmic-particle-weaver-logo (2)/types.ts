export interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  density: number;
}

export interface MouseState {
  x: number | null;
  y: number | null;
  radius: number;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface ParticleCanvasHandle {
  downloadSnapshot: () => void;
  setInteractionPoint: (x: number | null, y: number | null) => void;
}