import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface MapProps {
  mapData: number[][];
  cellSize: number;
}

export function World({ mapData, cellSize }: MapProps) {
  // Advanced Tactical Materials
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2d3748', // Dark Graphite
    emissive: '#1a202c',
    emissiveIntensity: 0.1,
    metalness: 0.5,
    roughness: 0.4,
  }), []);

  const wallTrimMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a202c',
    emissive: '#06b6d4',
    emissiveIntensity: 0.3,
    metalness: 0.8,
    roughness: 0.2,
  }), []);

  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a202c', // Deep Navy/Graphite
    metalness: 0.3,
    roughness: 0.7,
  }), []);

  const ceilingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0,
    roughness: 1,
  }), []);

  const barrelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7f1d1d', // Muted Industrial Red (avoiding excessive red)
    metalness: 0.6,
    roughness: 0.4,
  }), []);

  const crateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155', // Tactical Graphite
    metalness: 0.4,
    roughness: 0.6,
  }), []);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.9,
    roughness: 0.1,
  }), []);

  const cells = useMemo(() => {
    const geometry: React.ReactNode[] = [];
    
    mapData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const posX = x * cellSize;
        const posZ = y * cellSize;

        if (cell === 1) { // Advanced Tactical Wall
          geometry.push(
            <group key={`wall-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              {/* Main Wall Segment */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[cellSize, cellSize, cellSize]} />
                <primitive object={wallMaterial} />
              </mesh>
              {/* Vertical Structural Beams */}
              <mesh position={[cellSize/2 - 0.05, 0, 0]}>
                <boxGeometry args={[0.1, cellSize, cellSize + 0.05]} />
                <primitive object={frameMaterial} />
              </mesh>
              <mesh position={[-cellSize/2 + 0.05, 0, 0]}>
                <boxGeometry args={[0.1, cellSize, cellSize + 0.05]} />
                <primitive object={frameMaterial} />
              </mesh>
              {/* Top/Bottom Tactical Trims with Cyan Glow */}
              <mesh position={[0, cellSize/2 - 0.05, 0]}>
                <boxGeometry args={[cellSize + 0.08, 0.1, cellSize + 0.08]} />
                <primitive object={wallTrimMaterial} />
              </mesh>
              <mesh position={[0, -cellSize/2 + 0.05, 0]}>
                <boxGeometry args={[cellSize + 0.08, 0.1, cellSize + 0.08]} />
                <primitive object={wallTrimMaterial} />
              </mesh>
              {/* Interior Panel Line */}
              <mesh position={[0, 0, cellSize/2]}>
                <planeGeometry args={[cellSize * 0.8, 0.02]} />
                <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} />
              </mesh>
            </group>
          );
        } else if (cell === 2) { // Advanced Security Door/Crate
          geometry.push(
            <group key={`crate-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              {/* Heavy Crate Body */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[cellSize * 0.85, cellSize * 0.85, cellSize * 0.85]} />
                <primitive object={crateMaterial} />
              </mesh>
              {/* Corner Protectors */}
              {[[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]].map((pos, i) => (
                <mesh key={i} position={[pos[0] * cellSize * 0.4, pos[1] * cellSize * 0.4, pos[2] * cellSize * 0.4]}>
                  <boxGeometry args={[cellSize * 0.15, cellSize * 0.15, cellSize * 0.15]} />
                  <primitive object={frameMaterial} />
                </mesh>
              ))}
              {/* Tactical Label/Caution (Yellow) */}
              <mesh position={[0, 0, cellSize * 0.43]}>
                <planeGeometry args={[cellSize * 0.5, cellSize * 0.15]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
              </mesh>
              {/* Handling Bar */}
              <mesh position={[0, cellSize * 0.3, cellSize * 0.43]}>
                <boxGeometry args={[cellSize * 0.4, 0.02, 0.04]} />
                <meshStandardMaterial color="#1e293b" metalness={1} />
              </mesh>
              {/* Active Indicator (Cyan) */}
              <mesh position={[cellSize * 0.35, cellSize * 0.35, cellSize * 0.43]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
              </mesh>
            </group>
          );
        } else if (cell === 3) { // High-Energy Power Barrel
          geometry.push(
            <group key={`barrel-${x}-${y}`} position={[posX, cellSize / 3, posZ]}>
              {/* Reinforced Shell */}
              <mesh castShadow>
                <cylinderGeometry args={[cellSize/3, cellSize/3, cellSize/1.5, 16]} />
                <primitive object={barrelMaterial} />
              </mesh>
              {/* Industrial Ribs */}
              {[cellSize/6, 0, -cellSize/6].map((h, i) => (
                <mesh key={i} position={[0, h, 0]}>
                  <torusGeometry args={[cellSize/3 + 0.015, 0.025, 8, 24]} />
                  <primitive object={frameMaterial} />
                </mesh>
              ))}
              {/* Core Energy Cylinder (Cyan Glow) */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[cellSize/3.5, cellSize/3.5, 0.1, 16]} />
                <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} />
              </mesh>
              {/* Warning Triangle s (Orange/Yellow) */}
              <mesh position={[0, cellSize/8, cellSize/3 + 0.01]}>
                <planeGeometry args={[cellSize/10, cellSize/10]} />
                <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} transparent opacity={0.8} />
              </mesh>
            </group>
          );
        }
      });
    });

    return geometry;
  }, [mapData, cellSize, wallMaterial, wallTrimMaterial, barrelMaterial, crateMaterial, frameMaterial]);

  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  return (
    <group position={[-mapWidth / 2, 0, -mapHeight / 2]}>
      {/* Floor: Tactical Paneling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mapWidth / 2, 0, mapHeight / 2]} receiveShadow>
        <planeGeometry args={[mapWidth * 2, mapHeight * 2]} />
        <primitive object={floorMaterial} />
      </mesh>
      
      {/* Detailed Floor Paneling (Visual Only) */}
      {useMemo(() => (
        <group position={[mapWidth / 2, 0.005, mapHeight / 2]}>
          <gridHelper 
            args={[mapWidth * 4, 64, 0x334155, 0x1e293b]} 
            rotation={[0, 0, 0]}
          />
          {/* Subtle panel highlights */}
          <gridHelper 
            args={[mapWidth * 4, 16, 0x06b6d4, 0x0f172a]} 
            position={[0, 0.001, 0]}
          />
        </group>
      ), [mapWidth, mapHeight])}

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[mapWidth / 2, cellSize, mapHeight / 2]}>
        <planeGeometry args={[mapWidth * 2, mapHeight * 2]} />
        <primitive object={ceilingMaterial} />
      </mesh>

      {cells}
    </group>
  );
}
