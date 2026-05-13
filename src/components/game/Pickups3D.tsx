import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { createPickupTexture } from '../../lib/textures';

interface Pickup {
  id: number;
  x: number;
  y: number;
  type: 'health' | 'ammo';
  rotation: number;
}

interface Pickups3DProps {
  pickups: Pickup[];
  cellSize: number;
  mapData: number[][];
}

export function Pickups3D({ pickups, cellSize, mapData }: Pickups3DProps) {
  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  // Memoized materials for performance
  const boxMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155',
    metalness: 0.7,
    roughness: 0.3,
  }), []);

  const healthIconTexture = useMemo(() => createPickupTexture('health'), []);
  const ammoIconTexture = useMemo(() => createPickupTexture('ammo'), []);

  const healthIconMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    map: healthIconTexture,
    transparent: true,
    side: THREE.DoubleSide
  }), [healthIconTexture]);

  const ammoIconMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    map: ammoIconTexture,
    transparent: true,
    side: THREE.DoubleSide
  }), [ammoIconTexture]);

  const healthAccentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: '#ef4444',
    emissiveIntensity: 0.4,
  }), []);

  const ammoAccentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#fbbf24',
    emissiveIntensity: 0.4,
  }), []);

  return (
    <>
      {pickups.map((p) => {
         const posX = p.x - mapWidth / 2;
         const posZ = p.y - mapHeight / 2;
         
         return (
            <group key={p.id} position={[posX, cellSize / 5, posZ]}>
              <AnimatedPickup 
                type={p.type} 
                boxMaterial={boxMaterial}
                accentMaterial={p.type === 'health' ? healthAccentMaterial : ammoAccentMaterial}
                iconMaterial={p.type === 'health' ? healthIconMaterial : ammoIconMaterial}
              />
              <PointLightWithPulse color={p.type === 'health' ? '#ef4444' : '#fbbf24'} />
            </group>
         );
      })}
    </>
  );
}

function AnimatedPickup({ type, boxMaterial, accentMaterial, iconMaterial }: any) {
  const groupRef = React.useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 2;
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Tactical Crate */}
      <mesh castShadow material={boxMaterial}>
        <boxGeometry args={[12, 8, 12]} />
      </mesh>
      {/* Visual Reinforcements */}
      <mesh position={[0, 0, 0]} material={accentMaterial}>
        <boxGeometry args={[13, 2, 13]} />
      </mesh>
      
      {/* Floating Icon Billboard */}
      <Billboard position={[0, 12, 0]}>
        <mesh material={iconMaterial}>
          <planeGeometry args={[10, 10]} />
        </mesh>
      </Billboard>
    </group>
  );
}

function PointLightWithPulse({ color }: { color: string }) {
  const lightRef = React.useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    }
  });

  return <pointLight ref={lightRef} distance={40} color={color} intensity={0.5} />;
}
