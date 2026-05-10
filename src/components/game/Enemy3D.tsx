import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Billboard } from '@react-three/drei';

interface EnemyProps {
  x: number;
  y: number;
  type: 'rusher' | 'rifleman' | 'sniper';
  hp: number;
  maxHp: number;
  color: string;
  cellSize: number;
  isBoss?: boolean;
}

export function Enemy3D({ x, y, type, color, cellSize, isBoss, hp, maxHp }: EnemyProps) {
  const meshRef = useRef<THREE.Group>(null);
  const scale = isBoss ? 4 : 1;

  // Health Calculation
  const healthPercent = Math.max(0, Math.min(1, hp / maxHp));
  
  // Health Color Logic
  const getHealthColor = () => {
    if (healthPercent > 0.6) return "#22c55e"; // Green
    if (healthPercent > 0.3) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  const healthColor = getHealthColor();

  // Adjusted dimensions for health bar to not become massive on scaled-up boss
  const barWidth = isBoss ? (cellSize * 0.2) : (cellSize * 0.5);
  const barHeight = isBoss ? (cellSize * 0.03) : (cellSize * 0.08);
  const fillHeight = isBoss ? (cellSize * 0.02) : (cellSize * 0.05);

  return (
    <group position={[x, (cellSize / 2) * scale, y]} scale={scale}>
      <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={meshRef}>
          {/* Main Body */}
          <mesh castShadow={false}>
            <capsuleGeometry args={[cellSize / 4, cellSize / 2, 4, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.5} roughness={0.5} />
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

          {/* Floating Health Ring - Now reactive to HP */}
          <mesh position={[0, cellSize / 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[cellSize / 4, 0.015, 16, 32]} />
            <meshStandardMaterial 
              color={healthColor} 
              emissive={healthColor} 
              emissiveIntensity={1.5} 
              transparent 
              opacity={0.6} 
            />
          </mesh>
        </group>
      </Float>

      {/* 3D Health Bar Billboard */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, cellSize * 0.8, 0]}
      >
        {/* Background Rail */}
        <mesh>
          <planeGeometry args={[barWidth, barHeight]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.5} />
        </mesh>
        {/* Active Health Fill */}
        <mesh position={[(-barWidth * (1 - healthPercent)) / 2, 0, 0.01]}>
          <planeGeometry args={[barWidth * healthPercent, fillHeight]} />
          <meshBasicMaterial color={healthColor} />
        </mesh>
      </Billboard>
    </group>
  );
}
