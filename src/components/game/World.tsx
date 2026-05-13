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
    color: '#0f172a', // Slate 900
    roughness: 0.8,
    metalness: 0.2,
  }), []);

  const wallTrimMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a', // Slate 900
    emissive: '#0891b2', // Cyan 600
    emissiveIntensity: 0.1,
    metalness: 0.8,
    roughness: 0.1,
  }), []);

  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#020617', // Slate 950
    metalness: 0.1,
    roughness: 0.9,
  }), []);

  const ceilingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#020617',
    metalness: 0,
    roughness: 1,
  }), []);

  const barrelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#991b1b', // Red 800
    emissive: '#450a0a',
    emissiveIntensity: 0.2,
    metalness: 0.7,
    roughness: 0.4,
  }), []);

  const crateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a', // Slate 900
    metalness: 0.2,
    roughness: 0.8,
  }), []);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#000000',
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
                <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={0.2} />
              </mesh>
            </group>
          );
        } else if (cell === 2) { // Advanced Security Door/Crate
          geometry.push(
            <group key={`crate-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              {/* Heavy Crate Body */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[cellSize * 0.8, cellSize * 0.8, cellSize * 0.8]} />
                <primitive object={crateMaterial} />
              </mesh>
              {/* Corner Protectors */}
              {[[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]].map((pos, i) => (
                <mesh key={i} position={[pos[0] * cellSize * 0.38, pos[1] * cellSize * 0.38, pos[2] * cellSize * 0.38]}>
                  <boxGeometry args={[cellSize * 0.1, cellSize * 0.1, cellSize * 0.1]} />
                  <primitive object={frameMaterial} />
                </mesh>
              ))}
              {/* Tactical Label/Caution (Yellow - Muted) */}
              <mesh position={[0, 0, cellSize * 0.41]}>
                <planeGeometry args={[cellSize * 0.4, cellSize * 0.1]} />
                <meshStandardMaterial color="#b45309" emissive="#b45309" emissiveIntensity={0.15} />
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
            args={[mapWidth * 4, 128, 0x1e293b, 0x0f172a]} 
            rotation={[0, 0, 0]}
          />
          {/* Subtle panel highlights */}
          <gridHelper 
            args={[mapWidth * 4, 32, 0x0891b2, 0x020617]} 
            position={[0, 0.001, 0]}
            visible={false}
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
