import React, { useMemo } from 'react';
import * as THREE from 'three';

interface MapProps {
  mapData: number[][];
  cellSize: number;
}

export function World({ mapData, cellSize }: MapProps) {
  // Advanced Tactical Materials
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a', // Slate 900 base
    roughness: 0.6,
    metalness: 0.6,
  }), []);

  const wallTrimMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#020617', 
    emissive: '#06b6d4', // Bright Cyan 
    emissiveIntensity: 4.0, // Forced high for verification
    metalness: 0.9,
    roughness: 0.1,
  }), []);

  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#020617', // Near Black Navy
    metalness: 0.4,
    roughness: 0.7,
  }), []);

  const barrelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1e293b', // Muted steel
    metalness: 0.8,
    roughness: 0.3,
  }), []);

  const barrelEnergyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#22d3ee',
    emissive: '#22d3ee',
    emissiveIntensity: 3.0,
  }), []);

  const crateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1e293b', // Tactical Slate
    metalness: 0.5,
    roughness: 0.4,
  }), []);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#000000',
    metalness: 1.0,
    roughness: 0.1,
  }), []);

  const ceilingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.1,
    roughness: 0.9,
  }), []);

  const tacticalYellow = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fbbf24', // Amber
    emissive: '#fbbf24',
    emissiveIntensity: 0.3,
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
              {/* Main Structure */}
              <mesh castShadow receiveShadow material={wallMaterial}>
                <boxGeometry args={[cellSize * 0.98, cellSize, cellSize * 0.98]} />
              </mesh>
              {/* Corner Corner Pillars */}
              {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([px, pz], i) => (
                <mesh key={i} position={[px * cellSize/2.1, 0, pz * cellSize/2.1]} material={frameMaterial}>
                  <boxGeometry args={[0.08, cellSize, 0.08]} />
                </mesh>
              ))}
              {/* Horizontal Tech Bands */}
              {[0.3, -0.3].map((h, i) => (
                <mesh key={i} position={[0, h * cellSize, 0]} material={wallTrimMaterial}>
                  <boxGeometry args={[cellSize * 1.02, 0.05, cellSize * 1.02]} />
                </mesh>
              ))}
              {/* Vertical Wiring Detail */}
              <mesh position={[cellSize/2 + 0.01, 0, 0]} material={wallTrimMaterial}>
                <boxGeometry args={[0.02, cellSize * 0.8, 0.1]} />
              </mesh>
            </group>
          );
        } else if (cell === 2) { // Industrial Tactical Crate
          geometry.push(
            <group key={`crate-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              <mesh castShadow receiveShadow material={crateMaterial}>
                <boxGeometry args={[cellSize * 0.85, cellSize * 0.85, cellSize * 0.85]} />
              </mesh>
              {/* Tactical Frame */}
              <mesh material={frameMaterial}>
                 <boxGeometry args={[cellSize * 0.87, cellSize * 0.2, cellSize * 0.87]} />
              </mesh>
              <mesh rotation={[Math.PI/2, 0, 0]} material={frameMaterial}>
                 <boxGeometry args={[cellSize * 0.87, cellSize * 0.2, cellSize * 0.87]} />
              </mesh>
              {/* Data Plate (Yellow) */}
              <mesh position={[0, 0, cellSize * 0.43]} material={tacticalYellow}>
                <planeGeometry args={[cellSize * 0.3, cellSize * 0.1]} />
              </mesh>
              {/* Active Sensor Light */}
              <mesh position={[cellSize * 0.3, cellSize * 0.3, cellSize * 0.43]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={4} />
              </mesh>
            </group>
          );
        } else if (cell === 3) { // Energy Containment Barrel
          geometry.push(
            <group key={`barrel-${x}-${y}`} position={[posX, cellSize / 3, posZ]}>
              <mesh castShadow material={barrelMaterial}>
                <cylinderGeometry args={[cellSize/3, cellSize/3, cellSize/1.5, 12]} />
              </mesh>
              {/* Structural Hoops */}
              {[0.2, 0, -0.2].map((h, i) => (
                <mesh key={i} position={[0, h * cellSize, 0]} material={frameMaterial}>
                  <torusGeometry args={[cellSize/3 + 0.01, 0.02, 6, 16]} />
                </mesh>
              ))}
              {/* Plasma Glow Core */}
              <mesh material={barrelEnergyMaterial}>
                <cylinderGeometry args={[cellSize/3.5, cellSize/3.5, 0.1, 12]} />
              </mesh>
              {/* Warning Stripes */}
              <mesh position={[0, cellSize/4.5, cellSize/3 + 0.01]} material={tacticalYellow}>
                <planeGeometry args={[cellSize/6, 0.02]} />
              </mesh>
            </group>
          );
        }
      });
    });

    return geometry;
  }, [mapData, cellSize, wallMaterial, wallTrimMaterial, barrelMaterial, barrelEnergyMaterial, crateMaterial, frameMaterial, tacticalYellow]);


  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  return (
    <group position={[-mapWidth / 2, 0, -mapHeight / 2]}>
      {/* Floor: Tactical Paneling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mapWidth / 2, -0.01, mapHeight / 2]} receiveShadow material={floorMaterial}>
        <planeGeometry args={[mapWidth * 4, mapHeight * 4]} />
      </mesh>
      
      {/* Detailed Floor Paneling (Visual Only) */}
      {useMemo(() => (
        <group position={[mapWidth / 2, 0, mapHeight / 2]}>
          {/* Main Structural Grid */}
          <gridHelper 
            args={[mapWidth * 4, 64, 0x1e293b, 0x020617]} 
            position={[0, 0.01, 0]}
          />
          {/* Finer Accent Grid */}
          <gridHelper 
            args={[mapWidth * 4, 16, 0x0891b2, 0x020617]} 
            position={[0, 0.005, 0]}
            visible={true}
          />
        </group>
      ), [mapWidth, mapHeight])}

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[mapWidth / 2, cellSize, mapHeight / 2]} material={ceilingMaterial}>
        <planeGeometry args={[mapWidth * 2, mapHeight * 2]} />
      </mesh>

      {cells}
    </group>
  );
}
