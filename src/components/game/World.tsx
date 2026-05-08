import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface MapProps {
  mapData: number[][];
  cellSize: number;
}

export function World({ mapData, cellSize }: MapProps) {
  // Use high-quality materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#334155',
    metalness: 0.2,
    roughness: 0.8,
  });

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    metalness: 0.1,
    roughness: 0.9,
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: '#020617',
    metalness: 0,
    roughness: 1,
  });

  const cells = useMemo(() => {
    const geometry: React.ReactNode[] = [];
    
    mapData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const posX = x * cellSize;
        const posZ = y * cellSize;

        if (cell === 1) { // Wall
          geometry.push(
            <mesh key={`wall-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              <boxGeometry args={[cellSize, cellSize, cellSize]} />
              <primitive object={wallMaterial.clone()} />
            </mesh>
          );
        } else if (cell === 2) { // Door (Orange)
          geometry.push(
            <mesh key={`door-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              <boxGeometry args={[cellSize, cellSize, cellSize]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
            </mesh>
          );
        } else if (cell === 3) { // Barrel (Red)
          geometry.push(
            <mesh key={`barrel-${x}-${y}`} position={[posX, cellSize / 3, posZ]}>
              <cylinderGeometry args={[cellSize/3, cellSize/3, cellSize/1.5, 16]} />
              <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        }
      });
    });

    return geometry;
  }, [mapData, cellSize]);

  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  return (
    <group position={[-mapWidth / 2, 0, -mapHeight / 2]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mapWidth / 2, 0, mapHeight / 2]} receiveShadow>
        <planeGeometry args={[mapWidth * 2, mapHeight * 2]} />
        <primitive object={floorMaterial} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[mapWidth / 2, cellSize, mapHeight / 2]}>
        <planeGeometry args={[mapWidth * 2, mapHeight * 2]} />
        <primitive object={ceilingMaterial} />
      </mesh>

      {cells}
    </group>
  );
}
