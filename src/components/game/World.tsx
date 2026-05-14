import React, { useMemo } from 'react';
import * as THREE from 'three';

interface MapProps {
  mapData: number[][];
  cellSize: number;
}

export function World({ mapData, cellSize }: MapProps) {
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#172033',
    roughness: 0.76,
    metalness: 0.24,
  }), []);

  const wallFaceMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#263449',
    roughness: 0.7,
    metalness: 0.26,
  }), []);

  const wallTrimMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#164e63',
    emissive: '#0891b2',
    emissiveIntensity: 0.18,
    metalness: 0.35,
    roughness: 0.55,
  }), []);

  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#273449',
    metalness: 0.12,
    roughness: 0.88,
  }), []);

  const crateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155',
    metalness: 0.25,
    roughness: 0.62,
  }), []);

  const barrelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155',
    metalness: 0.38,
    roughness: 0.52,
  }), []);

  const barrelEnergyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fb923c',
    emissive: '#f97316',
    emissiveIntensity: 0.55,
    roughness: 0.4,
    metalness: 0.1,
  }), []);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.45,
    roughness: 0.45,
  }), []);

  const warningMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#f59e0b',
    emissiveIntensity: 0.08,
    roughness: 0.5,
    metalness: 0.2,
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
              <mesh receiveShadow material={wallMaterial}>
                <boxGeometry args={[cellSize * 0.98, cellSize, cellSize * 0.98]} />
              </mesh>
              <mesh position={[0, cellSize * 0.18, cellSize * 0.495]} material={wallFaceMaterial}>
                <boxGeometry args={[cellSize * 0.62, cellSize * 0.34, 0.018]} />
              </mesh>
              <mesh position={[0, cellSize * 0.34, cellSize * 0.506]} material={wallTrimMaterial}>
                <boxGeometry args={[cellSize * 0.48, 0.024, 0.02]} />
              </mesh>
            </group>
          );
        } else if (cell === 2) {
          geometry.push(
            <group key={`crate-${x}-${y}`} position={[posX, cellSize * 0.38, posZ]}>
              <mesh receiveShadow material={crateMaterial}>
                <boxGeometry args={[cellSize * 0.78, cellSize * 0.74, cellSize * 0.78]} />
              </mesh>
              <mesh position={[0, cellSize * 0.39, 0]} material={frameMaterial}>
                <boxGeometry args={[cellSize * 0.82, 0.06, cellSize * 0.82]} />
              </mesh>
              <mesh position={[0, 0, cellSize * 0.398]} material={warningMaterial}>
                <boxGeometry args={[cellSize * 0.42, cellSize * 0.075, 0.012]} />
              </mesh>
            </group>
          );
        } else if (cell === 3) {
          geometry.push(
            <group key={`barrel-${x}-${y}`} position={[posX, cellSize * 0.34, posZ]}>
              <mesh material={barrelMaterial}>
                <cylinderGeometry args={[cellSize * 0.26, cellSize * 0.26, cellSize * 0.68, 12]} />
              </mesh>
              <mesh position={[0, 0, cellSize * 0.265]} material={barrelEnergyMaterial}>
                <boxGeometry args={[cellSize * 0.15, cellSize * 0.42, 0.018]} />
              </mesh>
            </group>
          );
        }
      });
    });

    return geometry;
  }, [mapData, cellSize, wallMaterial, wallFaceMaterial, wallTrimMaterial, barrelMaterial, barrelEnergyMaterial, crateMaterial, frameMaterial, warningMaterial]);

  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  return (
    <group position={[-mapWidth / 2, 0, -mapHeight / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mapWidth / 2, -0.01, mapHeight / 2]} receiveShadow material={floorMaterial}>
        <planeGeometry args={[mapWidth, mapHeight]} />
      </mesh>

      <group position={[mapWidth / 2, 0.004, mapHeight / 2]}>
        <gridHelper args={[Math.max(mapWidth, mapHeight), 18, 0x334155, 0x1e293b]} />
      </group>

      {cells}
    </group>
  );
}
