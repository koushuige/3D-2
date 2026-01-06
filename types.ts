
export enum GestureMode {
  IDLE = 'IDLE',
  SCALE = 'SCALE', // Five fingers open/fist
  ROTATE_XY = 'ROTATE_XY', // Index finger only
  ROTATE_Z = 'ROTATE_Z', // Index + Middle
}

export type ModelType = 'HEART' | 'FLOWER' | 'SATURN' | 'BUDDHA' | 'FIREWORK';

export interface ParticleConfig {
  count: number;
  size: number;
  color: string;
  model: ModelType;
  gestureMode: GestureMode;
  scaleFactor: number;
  explosionFactor: number;
}
