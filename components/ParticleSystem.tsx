
import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { PARTICLE_COUNT, generateModelPoints } from '../constants';
import { ModelType, GestureMode } from '../types';

interface ParticleSystemProps {
  modelType: ModelType;
  color: string;
  gestureMode: GestureMode;
  scaleFactor: number;
  rotation: { x: number, y: number, z: number };
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  modelType, 
  color, 
  gestureMode, 
  scaleFactor,
  rotation 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const targetPositionsRef = useRef<Float32Array>(generateModelPoints(modelType, PARTICLE_COUNT));

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    
    // Initial random positions
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 50;
      colors[i] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update target points when model changes
  useEffect(() => {
    targetPositionsRef.current = generateModelPoints(modelType, PARTICLE_COUNT);
  }, [modelType]);

  // Update colors
  useEffect(() => {
    if (!pointsRef.current) return;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const threeColor = new THREE.Color(color);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      colors[i * 3] = threeColor.r;
      colors[i * 3 + 1] = threeColor.g;
      colors[i * 3 + 2] = threeColor.b;
    }
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  }, [color]);

  // Frame Loop for physics/morphing
  useEffect(() => {
    let frameId: number;
    const morph = () => {
      if (pointsRef.current) {
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const targets = targetPositionsRef.current;
        const lerpFactor = 0.05;

        // Apply rotation from props
        pointsRef.current.rotation.x += (rotation.x - pointsRef.current.rotation.x) * 0.1;
        pointsRef.current.rotation.y += (rotation.y - pointsRef.current.rotation.y) * 0.1;
        pointsRef.current.rotation.z += (rotation.z - pointsRef.current.rotation.z) * 0.1;

        // Apply scale/explosion
        const explosion = gestureMode === GestureMode.SCALE ? scaleFactor * 5 : 1;

        for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
          const target = targets[i] * explosion;
          positions[i] += (target - positions[i]) * lerpFactor;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
      }
      frameId = requestAnimationFrame(morph);
    };
    morph();
    return () => cancelAnimationFrame(frameId);
  }, [gestureMode, scaleFactor, rotation]);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none" />;
};

export default ParticleSystem;
