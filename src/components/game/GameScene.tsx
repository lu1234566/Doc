import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars, PerspectiveCamera, ContactShadows } from '@react-three/drei';
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

function PlayerController({ player, cellSize, mapData }: { player: any; cellSize: number; mapData: number[][] }) {
  const { camera } = useThree();

  useFrame(() => {
    const mapWidth = mapData[0].length * cellSize;
    const mapHeight = mapData.length * cellSize;
    const p = player.current;

    camera.position.set(
      p.x - mapWidth / 2,
      cellSize * 0.72,
      p.y - mapHeight / 2,
    );

    camera.rotation.order = 'YXZ';
    camera.rotation.set(p.pitch, -p.angle - Math.PI / 2, 0);
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
  const mapWidth = mapData[0].length * cellSize;
  const mapHeight = mapData.length * cellSize;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <PerspectiveCamera makeDefault fov={74} />
        <fog attach="fog" args={['#0f172a', 320, 1350]} />
        <ambientLight intensity={0.42} />
        <hemisphereLight args={['#9cc8ff', '#1f2937', 0.55]} />
        <directionalLight position={[360, 520, 240]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[0, 160, 0]} intensity={1.1} distance={900} color="#f97316" />

        <Sky sunPosition={[120, 35, 80]} turbidity={7} rayleigh={0.8} mieCoefficient={0.02} mieDirectionalG={0.7} />
        <Stars radius={1200} depth={80} count={1400} factor={3} saturation={0} fade speed={0.25} />

        <World mapData={mapData} cellSize={cellSize} />

        <ContactShadows resolution={768} scale={90} blur={2.5} opacity={0.32} far={18} color="#000000" />

        <Particles3D particles={particles} cellSize={cellSize} />

        {enemies.map((enemy) => (
          <Enemy3D
            key={enemy.id}
            {...enemy}
            cellSize={cellSize}
            x={enemy.x - mapWidth / 2}
            y={enemy.y - mapHeight / 2}
          />
        ))}

        <PlayerController player={player} cellSize={cellSize} mapData={mapData} />
      </Canvas>

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
