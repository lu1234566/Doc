import React, { useMemo } from 'react';
import * as THREE from 'three';

interface MapProps {
  mapData: number[][];
  cellSize: number;
}

export function World({ mapData, cellSize }: MapProps) {
  // Muted tactical materials. The arena should support gameplay readability, not dominate the screen.
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#172033',
    roughness: 0.72,
    metalness: 0.28,
  }), []);

  const wallTrimMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#164e63',
    emissive: '#0891b2',
    emissiveIntensity: 0.22,
    metalness: 0.45,
    roughness: 0.55,
  }), []);

  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#273449',
    metalness: 0.18,
    roughness: 0.86,
  }), []);

  const barrelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155',
    metalness: 0.45,
    roughness: 0.55,
  }), []);

  const barrelEnergyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f97316',
    emissive: '#f97316',
    emissiveIntensity: 0.75,
  }), []);

  const crateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155',
    metalness: 0.28,
    roughness: 0.62,
  }), []);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.55,
    roughness: 0.45,
  }), []);

  const tacticalYellow = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#f59e0b',
    emissiveIntensity: 0.18,
  }), []);

  const cells = useMemo(() => {
    const geometry: React.ReactNode[] = [];

    mapData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const posX = x * cellSize + cellSize / 2;
        const posZ = y * cellSize + cellSize / 2;

        if (cell === 1) {
          geometry.push(
            <group key={`wall-${x}-${y}`} position={[posX, cellSize / 2, posZ]}>
              <mesh material={wallMaterial}>
                <boxGeometry args={[cellSize * 0.96, cellSize, cellSize * 0.96]} />
              </mesh>
              <mesh position={[0, cellSize * 0.28, cellSize * 0.481]} material={wallTrimMaterial}>
                <boxGeometry args={[cellSize * 0.56, 0.025, 0.018]} />
              </mesh>
              <mesh position={[0, -cellSize * 0.22, -cellSize * 0.481]} material={wallTrimMaterial}>
                <boxGeometry args={[cellSize * 0.42, 0.025, 0.018]} />
              </mesh>
            </group>
          );
        } else if (cell === 2) {
          geometry.push(
            <group key={`crate-${x}-${y}`} position={[posX, cellSize * 0.38, posZ]}>
              <mesh material={crateMaterial}>
                <boxGeometry args={[cellSize * 0.74, cellSize * 0.74, cellSize * 0.74]} />
              </mesh>
              <mesh position={[0, cellSize * 0.25, 0]} material={frameMaterial}>
                <boxGeometry args={[cellSize * 0.76, 0.08, cellSize * 0.76]} />
              </mesh>
              <mesh position={[0, 0, cellSize * 0.375]} material={tacticalYellow}>
                <planeGeometry args={[cellSize * 0.26, cellSize * 0.08]} />
              </mesh>
            </group>
          );
        } else if (cell === 3) {
          geometry.push(
            <group key={`barrel-${x}-${y}`} position={[posX, cellSize / 3, posZ]}>
              <mesh material={barrelMaterial}>
                <cylinderGeometry args={[cellSize / 3.6, cellSize / 3.6, cellSize / 1.65, 12]} />
              </mesh>
              <mesh position={[0, 0, cellSize / 3.55]} material={barrelEnergyMaterial}>
                <planeGeometry args={[cellSize * 0.18, cellSize * 0.32]} />
              </mesh>
              <mesh position={[0, cellSize / 4.8, cellSize / 3.55]} material={tacticalYellow}>
                <planeGeometry args={[cellSize * 0.18, cellSize * 0.035]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mapWidth / 2, -0.01, mapHeight / 2]} material={floorMaterial}>
        <planeGeometry args={[mapWidth, mapHeight]} />
      </mesh>

      <group position={[mapWidth / 2, 0.006, mapHeight / 2]}>
        <gridHelper args={[Math.max(mapWidth, mapHeight), 24, 0x334155, 0x1e293b]} />
      </group>

      {cells}
    </group>
  );
}
