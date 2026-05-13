import React, { useMemo } from 'react';
import * as THREE from 'three';
import { 
  createTacticalFloorTexture, 
  createTacticalWallTexture, 
  createTacticalCrateTexture, 
  createTacticalBarrelTexture 
} from '../../lib/textures';

interface MapProps {
  mapData: number[][];
  cellSize: number;
}

export function World({ mapData, cellSize }: MapProps) {
  // Memoized Procedural Textures
  const textures = useMemo(() => ({
    floor: createTacticalFloorTexture(),
    wall: createTacticalWallTexture(),
    wallAlt: createTacticalWallTexture(true),
    crate: createTacticalCrateTexture(),
    barrel: createTacticalBarrelTexture(),
  }), []);

  // Advanced Tactical Materials
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155', 
    map: textures.wall,
    roughness: 0.6,
    metalness: 0.4,
  }), [textures.wall]);

  const wallTrimMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#020617', 
    emissive: '#06b6d4', 
    emissiveIntensity: 1.0,
    metalness: 0.8,
    roughness: 0.2,
  }), []);

  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#475569', 
    map: textures.floor,
    metalness: 0.1,
    roughness: 0.9,
  }), [textures.floor]);

  const barrelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: textures.barrel,
    metalness: 0.7,
    roughness: 0.4,
  }), [textures.barrel]);

  const barrelEnergyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#22d3ee',
    emissive: '#22d3ee',
    emissiveIntensity: 2.0,
  }), []);

  const crateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: textures.crate,
    metalness: 0.4,
    roughness: 0.5,
  }), [textures.crate]);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.9,
    roughness: 0.1,
  }), []);

  const tacticalYellow = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#fbbf24',
    emissiveIntensity: 0.1,
  }), []);

  const cells = useMemo(() => {
    const geometry: React.ReactNode[] = [];
    
    mapData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const posX = x * cellSize + cellSize / 2;
        const posZ = y * cellSize + cellSize / 2;

        if (cell === 1) { // Advanced Tactical Wall
          geometry.push(
            <group key={`wall-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              <mesh castShadow receiveShadow material={wallMaterial}>
                <boxGeometry args={[cellSize * 0.99, cellSize, cellSize * 0.99]} />
              </mesh>
              {/* Corner Corner Pillars */}
              {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([px, pz], i) => (
                <mesh key={i} position={[px * cellSize/2.1, 0, pz * cellSize/2.1]} material={frameMaterial}>
                  <boxGeometry args={[0.06, cellSize, 0.06]} />
                </mesh>
              ))}
              {/* Horizontal Tech Bands */}
              {[0.3, -0.3].map((h, i) => (
                <mesh key={i} position={[0, h * cellSize, 0]} material={wallTrimMaterial}>
                  <boxGeometry args={[cellSize * 1.01, 0.04, cellSize * 1.01]} />
                </mesh>
              ))}
            </group>
          );
        } else if (cell === 2) { // Industrial Tactical Crate
          geometry.push(
            <group key={`crate-${x}-${y}`} position={[posX, cellSize * 0.4, posZ]}>
              <mesh castShadow receiveShadow material={crateMaterial}>
                <boxGeometry args={[cellSize * 0.8, cellSize * 0.8, cellSize * 0.8]} />
              </mesh>
              {/* Tactical Frame */}
              <mesh material={frameMaterial}>
                 <boxGeometry args={[cellSize * 0.82, cellSize * 0.15, cellSize * 0.82]} />
              </mesh>
              <mesh rotation={[Math.PI/2, 0, 0]} material={frameMaterial}>
                 <boxGeometry args={[cellSize * 0.82, cellSize * 0.15, cellSize * 0.82]} />
              </mesh>
            </group>
          );
        } else if (cell === 3) { // Energy Containment Barrel
          geometry.push(
            <group key={`barrel-${x}-${y}`} position={[posX, cellSize / 3, posZ]}>
              <mesh castShadow material={barrelMaterial}>
                <cylinderGeometry args={[cellSize/3.5, cellSize/3.5, cellSize/1.5, 12]} />
              </mesh>
              {/* Structural Hoops */}
              {[0.2, -0.2].map((h, i) => (
                <mesh key={i} position={[0, h * cellSize, 0]} material={frameMaterial}>
                  <torusGeometry args={[cellSize/3.4, 0.02, 6, 16]} />
                </mesh>
              ))}
              {/* Plasma Glow Core */}
              <mesh position={[0, 0, 0]} material={barrelEnergyMaterial}>
                <cylinderGeometry args={[0.02, 0.02, cellSize * 0.6, 8]} />
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
        <planeGeometry args={[mapWidth, mapHeight]} />
      </mesh>
      
      {/* Subtle Grid Accent */}
      <group position={[mapWidth / 2, 0, mapHeight / 2]}>
        <gridHelper 
          args={[Math.max(mapWidth, mapHeight), 16, 0x475569, 0x1e293b]} 
          position={[0, 0.005, 0]}
        />
      </group>

      {cells}
    </group>
  );
}

