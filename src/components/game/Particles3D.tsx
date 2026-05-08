import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  life: number;
  vx: number;
  vy: number;
}

export function Particles3D({ particles, cellSize, mapData }: { particles: Particle[], cellSize: number, mapData: number[][] }) {
  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  return (
    <>
      {particles.map((p, i) => (
        <mesh 
          key={i} 
          position={[p.x - mapWidth / 2, cellSize / 3, p.y - mapHeight / 2]}
        >
          <boxGeometry args={[p.size / 4, p.size / 4, p.size / 4]} />
          <meshStandardMaterial 
            color={p.color} 
            transparent 
            opacity={p.life} 
            emissive={p.color} 
            emissiveIntensity={p.color === '#fef08a' ? 2 : 0} 
          />
        </mesh>
      ))}
    </>
  );
}
