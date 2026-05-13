import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';
import { createEnemyEmblemTexture } from '../../lib/textures';

interface EnemyProps {
  x: number;
  y: number;
  type: 'rusher' | 'rifleman' | 'sniper';
  hp: number;
  maxHp: number;
  color: string;
  cellSize: number;
  isBoss?: boolean;
  debug?: boolean;
}

export function Enemy3D({ x, y, type, color, cellSize, isBoss, hp, maxHp, debug }: EnemyProps) {
  const meshRef = useRef<THREE.Group>(null);
  const scale = isBoss ? 3 : (type === 'rusher' ? 1.05 : type === 'rifleman' ? 0.95 : 0.9);

  // Health Calculation
  const healthPercent = Math.max(0, Math.min(1, hp / maxHp));
  
  // Health Color Logic
  const getHealthColor = () => {
    if (healthPercent > 0.6) return "#22c55e"; // Green
    if (healthPercent > 0.3) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  const healthColor = getHealthColor();

  // Dedicated materials for a more tactical look
  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#475569', // Slate 500 - Base body
    metalness: 0.6,
    roughness: 0.5,
  }), []);

  const plateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#64748b', // Slate 400 - Secondary plating
    metalness: 0.4,
    roughness: 0.7,
  }), []);

  // Class-specific color overrides
  const tacticalColor = useMemo(() => {
    if (isBoss) return '#f43f5e'; 
    if (type === 'rusher') return '#ff3434'; 
    if (type === 'sniper') return '#06b6d4'; 
    return '#eab308'; 
  }, [type, isBoss]);

  const emissiveMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: tacticalColor,
    emissive: tacticalColor,
    emissiveIntensity: isBoss ? 2.5 : 1.5, // Controlled intensity
  }), [tacticalColor, isBoss]);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f172a', // Darkest slate for joints/frames
    metalness: 0.9,
    roughness: 0.1,
  }), []);

  const emblemTexture = useMemo(() => createEnemyEmblemTexture(isBoss ? 'titan' : type), [type, isBoss]);
  const emblemMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    map: emblemTexture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide
  }), [emblemTexture]);

  // Adjusted dimensions for health bar
  const barWidth = isBoss ? (cellSize * 0.5) : (cellSize * 0.7);
  const barHeight = isBoss ? (cellSize * 0.04) : (cellSize * 0.08);

  return (
    <group position={[x, (cellSize / 2) * scale, y]} scale={scale}>
        <group ref={meshRef}>
          {/* CLASS: RUSHER - Compact, Aggressive, Low profile */}
          {type === 'rusher' && (
            <group rotation={[0.5, 0, 0]} position={[0, -cellSize * 0.1, 0.1]}>
              {/* Main Core Body */}
              <mesh castShadow material={baseMaterial}>
                <boxGeometry args={[cellSize * 0.35, cellSize * 0.25, cellSize * 0.5]} />
              </mesh>
              {/* Aggressive Red Visor */}
              <mesh position={[0, cellSize * 0.08, cellSize * 0.22]} material={emissiveMaterial}>
                <boxGeometry args={[cellSize * 0.2, 0.06, 0.05]} />
              </mesh>
              {/* Engine Exhaust (Rear) */}
              <mesh position={[0, 0, -cellSize * 0.3]} material={emissiveMaterial}>
                 <sphereGeometry args={[cellSize * 0.1, 8, 8]} />
              </mesh>
            </group>
          )}

          {/* CLASS: RIFLEMAN - Balanced, Industrial Trooper */}
          {type === 'rifleman' && (
            <group>
              {/* Blocky Torso */}
              <mesh castShadow material={baseMaterial}>
                <boxGeometry args={[cellSize * 0.5, cellSize * 0.5, cellSize * 0.35]} />
              </mesh>
              {/* Tactical Helmet */}
              <mesh position={[0, cellSize * 0.35, 0]} material={plateMaterial}>
                <boxGeometry args={[cellSize * 0.25, cellSize * 0.2, cellSize * 0.25]} />
              </mesh>
              {/* Amber Optic strip */}
              <mesh position={[0, cellSize * 0.38, cellSize * 0.12]} material={emissiveMaterial}>
                <boxGeometry args={[cellSize * 0.18, 0.04, 0.02]} />
              </mesh>
              {/* Backpack Unit */}
              <mesh position={[0, 0.05, -cellSize * 0.22]} material={frameMaterial}>
                <boxGeometry args={[cellSize * 0.3, cellSize * 0.4, cellSize * 0.1]} />
              </mesh>
            </group>
          )}

          {/* CLASS: SNIPER - Slender, Sharp precision unit */}
          {type === 'sniper' && (
            <group position={[0, cellSize * 0.1, 0]}>
              {/* Long Slim Core */}
              <mesh castShadow material={baseMaterial}>
                <cylinderGeometry args={[0.04, 0.06, cellSize * 1.4, 4]} />
              </mesh>
              {/* Precision Head Unit */}
              <group position={[0, cellSize * 0.65, 0]}>
                <mesh material={plateMaterial}>
                  <boxGeometry args={[cellSize * 0.15, cellSize * 0.12, cellSize * 0.35]} />
                </mesh>
                {/* Cyan Scope Glow */}
                <mesh position={[0, 0.02, cellSize * 0.18]} material={emissiveMaterial}>
                  <sphereGeometry args={[0.03, 12, 12]} />
                </mesh>
              </group>
            </group>
          )}

          {/* BOSS: TITAN - Heavy Mech Overlord */}
          {isBoss && (
            <group>
              {/* Massive Center Block */}
              <mesh castShadow material={baseMaterial}>
                <boxGeometry args={[cellSize * 0.8, cellSize * 1.2, cellSize * 0.8]} />
              </mesh>
              {/* Heavy Outer Armor Shells */}
              {[-1, 1].map(x => (
                <group key={x} position={[x * cellSize * 0.5, cellSize * 0.3, 0]}>
                  <mesh material={plateMaterial}>
                    <boxGeometry args={[cellSize * 0.3, cellSize * 0.4, cellSize * 0.8]} />
                  </mesh>
                  {/* Energy Rails */}
                  <mesh position={[x * 0.16, 0, 0]} material={emissiveMaterial}>
                    <boxGeometry args={[0.02, cellSize * 0.3, cellSize * 0.6]} />
                  </mesh>
                </group>
              ))}
              {/* Central Glowing Core */}
              <mesh position={[0, 0.2, cellSize * 0.4]} rotation={[Math.PI / 2, 0, 0]} material={emissiveMaterial}>
                 <cylinderGeometry args={[cellSize * 0.25, cellSize * 0.25, 0.1, 16]} />
              </mesh>
            </group>
          )}

          {/* CLASS ICON EMBLEM */}
          <mesh position={[0, cellSize * 0.1, cellSize * 0.3]} material={emblemMaterial}>
             <planeGeometry args={[cellSize * 0.25, cellSize * 0.25]} />
          </mesh>

          {/* Standardized Tactical Weapon Appearance */}
          <group position={[cellSize * 0.3, 0, cellSize * 0.2]}>
             <mesh rotation={[Math.PI / 2, 0, 0]} material={frameMaterial}>
                <cylinderGeometry 
                  args={[
                    type === 'sniper' ? 0.015 : 0.04, 
                    type === 'sniper' ? 0.015 : 0.05, 
                    type === 'sniper' ? cellSize * 1.6 : cellSize * 0.9, 
                    8
                  ]} 
                />
             </mesh>
             {/* Muzzle Glow */}
             <mesh position={[0, 0, type === 'sniper' ? cellSize * 0.8 : cellSize * 0.45]} rotation={[Math.PI / 2, 0, 0]} material={emissiveMaterial}>
                <cylinderGeometry args={[type === 'sniper' ? 0.02 : 0.05, type === 'sniper' ? 0.02 : 0.05, 0.02, 16]} />
             </mesh>
          </group>
        </group>

      {/* 3D Health Bar Billboard */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, cellSize * 1.2, 0]}
      >
        <group>
          {/* Border */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[barWidth + 0.04, barHeight + 0.04]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
          </mesh>
          {/* BG */}
          <mesh>
            <planeGeometry args={[barWidth, barHeight]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.8} />
          </mesh>
          {/* Fill */}
          <mesh position={[(-barWidth * (1 - healthPercent)) / 2, 0, 0.01]}>
            <planeGeometry args={[barWidth * healthPercent, barHeight * 0.7]} />
            <meshBasicMaterial color={healthColor} />
          </mesh>
        </group>
      </Billboard>

      {/* DEBUG MARKER */}
      {debug && (
        <Billboard position={[0, cellSize * 1.5, 0]}>
           <mesh>
             <boxGeometry args={[cellSize/4, cellSize/4, cellSize/4]} />
             <meshBasicMaterial color="#fbbf24" wireframe />
           </mesh>
           <mesh position={[0, 0, 0.01]}>
             <planeGeometry args={[cellSize/2, cellSize/6]} />
             <meshBasicMaterial color="black" transparent opacity={0.8} />
           </mesh>
        </Billboard>
      )}
    </group>
  );
}
