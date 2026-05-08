import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, PointerLockControls, Stars, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { World } from './World';
import { Enemy3D } from './Enemy3D';
import { Particles3D } from './Particles3D';
import { Weapon3D } from '../../Weapon3D';

interface GameSceneProps {
  player: any;
  enemies: any[];
  particles: any[];
  mapData: number[][];
  cellSize: number;
  currentWeapon: string;
  isReloading: boolean;
  recoilOffset: number;
  lastShotTime: number;
}

function PlayerController({ player, cellSize }: { player: any, cellSize: number }) {
  const { camera } = useThree();

  useFrame(() => {
    // Sync React-Three-Fiber camera with our game engine player object
    // Note: In 3D we usually reverse z/y or handle mappings
    // Map Game (x, y) to 3D (x, z)
    const mapWidth = 24 * cellSize; // Hardcoded based on MAP constant
    const mapHeight = 18 * cellSize;

    camera.position.set(
      player.current.x - (mapWidth / 2),
      cellSize / 1.5, // Eye height
      player.current.y - (mapHeight / 2)
    );

    // Rotation
    camera.rotation.y = -player.current.angle - Math.PI / 2;
    // Pitch (Vertical rotation)
    camera.rotation.x = THREE.MathUtils.degToRad(player.current.pitch);
  });

  return null;
}

export function GameScene({
  player,
  enemies,
  particles,
  mapData,
  cellSize,
  currentWeapon,
  isReloading,
  recoilOffset,
  lastShotTime,
}: GameSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault fov={75} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={2} castShadow />
        <spotLight 
          position={[0, 50, 0]} 
          angle={0.5} 
          penumbra={1} 
          intensity={2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />

        <Sky sunPosition={[100, 20, 100]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <World mapData={mapData} cellSize={cellSize} />

        <ContactShadows 
          resolution={1024} 
          scale={50} 
          blur={2} 
          opacity={0.4} 
          far={10} 
          color="#000000" 
        />

        <Particles3D particles={particles} cellSize={cellSize} />

        {enemies.map((enemy) => (
           <Enemy3D 
            key={enemy.id} 
            {...enemy} 
            cellSize={cellSize} 
            // Correct coordinate transform
            x={enemy.x - (24 * cellSize / 2)}
            y={enemy.y - (18 * cellSize / 2)}
           />
        ))}

        <PlayerController player={player} cellSize={cellSize} />
      </Canvas>

      {/* Overlay the Weapon UI Component - keeps it fixed and easy to handle HUD-wise */}
      <Weapon3D 
        type={currentWeapon}
        isReloading={isReloading}
        isAds={player.current.isAds}
        recoilOffset={recoilOffset}
        lastShotTime={lastShotTime}
      />
    </div>
  );
}
