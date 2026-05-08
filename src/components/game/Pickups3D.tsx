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
          <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <mesh rotation={[0, p.rotation, 0]}>
              <boxGeometry args={[16, 16, 16]} />
              <meshStandardMaterial 
                color={p.type === 'health' ? '#ef4444' : '#eab308'} 
                emissive={p.type === 'health' ? '#ef4444' : '#eab308'}
                emissiveIntensity={0.5}
              />
            </mesh>
            
            <Text
              position={[0, 20, 0]}
              fontSize={10}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {p.type.toUpperCase()}
            </Text>
          </Float>
          
          <PointLightWithPulse color={p.type === 'health' ? '#ef4444' : '#eab308'} />
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
