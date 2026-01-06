
import { GestureMode } from '../types';

export interface Landmarks {
  x: number;
  y: number;
  z: number;
}

export class HandGestureService {
  public static getDistance(p1: Landmarks, p2: Landmarks) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  public static detectMode(landmarks: Landmarks[]): GestureMode {
    if (!landmarks || landmarks.length < 21) return GestureMode.IDLE;

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Heuristic for finger extension: Tip distance to wrist compared to base distance
    const isExtended = (tip: Landmarks, base: Landmarks) => this.getDistance(wrist, tip) > this.getDistance(wrist, base) * 1.5;
    
    // Joint landmarks for base comparison
    const indexBase = landmarks[5];
    const middleBase = landmarks[9];
    const ringBase = landmarks[13];
    const pinkyBase = landmarks[17];

    const isIndexExtended = isExtended(indexTip, indexBase);
    const isMiddleExtended = isExtended(middleTip, middleBase);
    const isRingExtended = isExtended(ringTip, ringBase);
    const isPinkyExtended = isExtended(pinkyTip, pinkyBase);

    // SCALE: All fingers extended
    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      return GestureMode.SCALE;
    }

    // ROTATE_Z: Index and Middle extended
    if (isIndexExtended && isMiddleExtended && !isRingExtended) {
      return GestureMode.ROTATE_Z;
    }

    // ROTATE_XY: Only Index extended
    if (isIndexExtended && !isMiddleExtended && !isRingExtended) {
      return GestureMode.ROTATE_XY;
    }

    return GestureMode.IDLE;
  }
}
