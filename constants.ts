
import * as THREE from 'three';
import { ModelType } from './types';

export const PARTICLE_COUNT = 15000;

export const generateModelPoints = (type: ModelType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = 0, y = 0, z = 0;

    switch (type) {
      case 'HEART': {
        const t = Math.random() * Math.PI * 2;
        // Heart formula
        x = 16 * Math.pow(Math.sin(t), 3);
        y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        z = (Math.random() - 0.5) * 2;
        const scale = 0.5;
        positions[i3] = x * scale;
        positions[i3 + 1] = y * scale;
        positions[i3 + 2] = z * scale;
        break;
      }
      case 'FLOWER': {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 10;
        const petals = 6;
        const r = radius * Math.cos(petals * angle);
        x = r * Math.cos(angle);
        y = r * Math.sin(angle);
        z = (Math.random() - 0.5) * 5;
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        break;
      }
      case 'SATURN': {
        // Sphere core
        if (i < count * 0.4) {
          const u = Math.random();
          const v = Math.random();
          const theta = 2 * Math.PI * u;
          const phi = Math.acos(2 * v - 1);
          const r = 5;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        } else {
          // Rings
          const angle = Math.random() * Math.PI * 2;
          const r = 8 + Math.random() * 4;
          x = r * Math.cos(angle);
          y = (Math.random() - 0.5) * 0.5;
          z = r * Math.sin(angle);
        }
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        break;
      }
      case 'BUDDHA': {
        // Procedural meditation shape (abstract)
        const v = Math.random() * Math.PI;
        const u = Math.random() * Math.PI * 2;
        const r = 5 * (1 + 0.3 * Math.sin(3 * v));
        x = r * Math.sin(v) * Math.cos(u);
        y = r * Math.cos(v) * 1.5;
        z = r * Math.sin(v) * Math.sin(u);
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        break;
      }
      case 'FIREWORK': {
        const r = Math.random() * 12;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        break;
      }
    }
  }
  return positions;
};
