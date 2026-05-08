import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

interface EnemyProps {
  x: number;
  y: number;
  type: 'rusher' | 'rifleman' | 'sniper';
  hp: number;
  color: string;
  cellSize: number;
}

export function Enemy3D({ x, y, type, color, cellSize }: EnemyProps) {
  const meshRef = useRef<THREE.Group>(null);

  // Convert game coordinates to 3D scene coordinates
  // Game logic: rx = x * cellSize + cellSize / 2
  // We need to match World's global offset: -mapWidth/2, -mapHeight/2
  
  return (
    <group position={[x, cellSize / 2, y]}>
      <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={meshRef}>
          {/* Main Body */}
          <mesh castShadow>
            <capsuleGeometry args={[cellSize / 4, cellSize / 2, 4, 8]} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
          </mesh>

          {/* Eye Visor */}
          <mesh position={[0, cellSize / 4, cellSize / 4]}>
            <boxGeometry args={[cellSize / 3, cellSize / 10, cellSize / 10]} />
            <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.5} />
          </mesh>

          {/* Weapon (Simplified) */}
          <mesh position={[cellSize / 4, 0, cellSize / 4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, cellSize / 1.5]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* Floating Health Ring */}
          <mesh position={[0, cellSize / 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[cellSize / 4, 0.02, 16, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.5} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}
