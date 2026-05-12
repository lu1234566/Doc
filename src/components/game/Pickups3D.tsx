import React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';

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

  return (
    <>
      {pickups.map((p) => (
        <group 
          key={p.id} 
          position={[p.x - mapWidth / 2, cellSize / 3, p.y - mapHeight / 2]}
        >
          <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
            <group rotation={[0, p.rotation, 0]}>
              {/* Main Container */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[14, 14, 14]} />
                <meshStandardMaterial 
                  color="#1e293b" 
                  metalness={0.8} 
                  roughness={0.2} 
                />
              </mesh>
              {/* Colored Accents/Corners */}
              <mesh>
                <boxGeometry args={[16, 4, 16]} />
                <meshStandardMaterial 
                   color={p.type === 'health' ? '#ef4444' : '#fbbf24'} 
                   emissive={p.type === 'health' ? '#ef4444' : '#f59e0b'}
                   emissiveIntensity={0.5}
                />
              </mesh>
              {/* Floating Symbol */}
              <mesh position={[0, 18, 0]} rotation={[0, p.rotation * 2, 0]}>
                {p.type === 'health' ? (
                  <octahedronGeometry args={[8]} />
                ) : (
                  <cylinderGeometry args={[6, 6, 4, 3]} />
                )}
                <meshStandardMaterial 
                  color={p.type === 'health' ? '#ef4444' : '#22d3ee'} 
                  emissive={p.type === 'health' ? '#ef4444' : '#22d3ee'}
                  emissiveIntensity={2}
                />
              </mesh>
            </group>
            
            <Text
              position={[0, 35, 0]}
              fontSize={10}
              color="white"
              anchorX="center"
              anchorY="middle"
              maxWidth={100}
            >
              {p.type.toUpperCase()}
            </Text>
          </Float>
          
          <PointLightWithPulse color={p.type === 'health' ? '#ef4444' : '#22d3ee'} />
        </group>
      ))}
    </>
  );
}

function PointLightWithPulse({ color }: { color: string }) {
  const lightRef = React.useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.5;
    }
  });

  return <pointLight ref={lightRef} distance={60} color={color} />;
}
