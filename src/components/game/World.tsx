import React, { useMemo } from 'react';
import * as THREE from 'three';

interface MapProps {
  mapData: number[][];
  cellSize: number;
}

export function World({ mapData, cellSize }: MapProps) {
  const materials = useMemo(() => ({
    wall: new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.18,
      roughness: 0.82,
    }),
    door: new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      metalness: 0.45,
      roughness: 0.45,
      emissive: '#3b1700',
      emissiveIntensity: 0.18,
    }),
    barrel: new THREE.MeshStandardMaterial({
      color: '#ef4444',
      metalness: 0.65,
      roughness: 0.32,
      emissive: '#330000',
      emissiveIntensity: 0.2,
    }),
    floor: new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.08,
      roughness: 0.92,
    }),
    ceiling: new THREE.MeshStandardMaterial({
      color: '#020617',
      metalness: 0,
      roughness: 1,
    }),
  }), []);

  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  const cells = useMemo(() => {
    const geometry: React.ReactNode[] = [];

    mapData.forEach((row, y) => {
      row.forEach((cell, x) => {
        // Game logic uses tile centers. Visual geometry must use the same center,
        // otherwise collision/raycasting and the 3D scene are offset by half a tile.
        const posX = x * cellSize + cellSize / 2;
        const posZ = y * cellSize + cellSize / 2;

        if (cell === 1) {
          geometry.push(
            <mesh key={`wall-${x}-${y}`} position={[posX, cellSize / 2, posZ]} castShadow receiveShadow>
              <boxGeometry args={[cellSize, cellSize, cellSize]} />
              <primitive object={materials.wall} />
            </mesh>
          );
        } else if (cell === 2) {
          geometry.push(
            <mesh key={`door-${x}-${y}`} position={[posX, cellSize / 2, posZ]} castShadow receiveShadow>
              <boxGeometry args={[cellSize, cellSize, cellSize]} />
              <primitive object={materials.door} />
            </mesh>
          );
        } else if (cell === 3) {
          geometry.push(
            <mesh key={`barrel-${x}-${y}`} position={[posX, cellSize / 3, posZ]} castShadow receiveShadow>
              <cylinderGeometry args={[cellSize / 3, cellSize / 3, cellSize / 1.5, 18]} />
              <primitive object={materials.barrel} />
            </mesh>
          );
        }
      });
    });

    return geometry;
  }, [mapData, cellSize, materials]);

  return (
    <group position={[-mapWidth / 2, 0, -mapHeight / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mapWidth / 2, 0, mapHeight / 2]} receiveShadow>
        <planeGeometry args={[mapWidth, mapHeight]} />
        <primitive object={materials.floor} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[mapWidth / 2, cellSize, mapHeight / 2]}>
        <planeGeometry args={[mapWidth, mapHeight]} />
        <primitive object={materials.ceiling} />
      </mesh>

      {cells}
    </group>
  );
}
