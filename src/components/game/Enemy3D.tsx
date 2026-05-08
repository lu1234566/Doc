import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

interface EnemyProps {
  x: number;
  y: number;
  type: 'rusher' | 'rifleman' | 'sniper';
  hp: number;
  color: string;
  cellSize: number;
}

export function Enemy3D({ x, y, type, hp, color, cellSize }: EnemyProps) {
  const rootRef = useRef<THREE.Group>(null);
  const hpRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const maxHp = type === 'rusher' ? 50 : 100;
  const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
  const bodyHeight = type === 'sniper' ? cellSize * 0.86 : cellSize * 0.72;
  const bodyRadius = type === 'rusher' ? cellSize * 0.18 : cellSize * 0.21;

  useFrame(() => {
    if (!rootRef.current) return;

    const dx = camera.position.x - rootRef.current.position.x;
    const dz = camera.position.z - rootRef.current.position.z;
    rootRef.current.rotation.y = Math.atan2(dx, dz);

    if (hpRef.current) {
      hpRef.current.scale.x = THREE.MathUtils.lerp(hpRef.current.scale.x, hpRatio, 0.2);
    }
  });

  return (
    <group ref={rootRef} position={[x, 0, y]}>
      <Float speed={type === 'rusher' ? 4 : 2.4} rotationIntensity={0.05} floatIntensity={0.12}>
        <group position={[0, bodyHeight / 2, 0]}>
          <mesh castShadow receiveShadow>
            <capsuleGeometry args={[bodyRadius, bodyHeight * 0.55, 6, 12]} />
            <meshStandardMaterial color={color} metalness={0.38} roughness={0.5} />
          </mesh>

          <mesh position={[0, bodyHeight * 0.18, bodyRadius * 0.95]}>
            <boxGeometry args={[bodyRadius * 1.35, bodyRadius * 0.28, bodyRadius * 0.14]} />
            <meshStandardMaterial color="#020617" emissive="#38bdf8" emissiveIntensity={0.45} />
          </mesh>

          <mesh position={[bodyRadius * 0.9, -bodyHeight * 0.05, bodyRadius * 0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[cellSize * 0.035, cellSize * 0.035, cellSize * 0.68, 12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.65} roughness={0.35} />
          </mesh>

          <mesh position={[0, bodyHeight * 0.67, 0]}>
            <boxGeometry args={[cellSize * 0.5, cellSize * 0.045, cellSize * 0.045]} />
            <meshBasicMaterial color="#111827" />
          </mesh>

          <mesh ref={hpRef} position={[0, bodyHeight * 0.67, cellSize * 0.032]}>
            <boxGeometry args={[cellSize * 0.5, cellSize * 0.05, cellSize * 0.05]} />
            <meshBasicMaterial color={hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#facc15' : '#ef4444'} />
          </mesh>

          <mesh position={[0, bodyHeight * 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[cellSize * 0.25, cellSize * 0.015, 12, 36]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} transparent opacity={0.45} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}
