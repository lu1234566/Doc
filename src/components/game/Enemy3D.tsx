import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Billboard } from '@react-three/drei';

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
  const scale = isBoss ? 3 : 0.8;

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
    color: '#1a1a1a', // Industrial Graphite
    metalness: 0.8,
    roughness: 0.3,
  }), []);

  const plateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2d3748', // Slate plating
    metalness: 0.6,
    roughness: 0.5,
  }), []);

  // Class-specific color overrides to follow the Art Pass exactly
  const tacticalColor = useMemo(() => {
    if (isBoss) return '#f43f5e'; // TITAN: Rose/Dark Red
    if (type === 'rusher') return '#ff3434'; // Rusher: Crimson
    if (type === 'sniper') return '#06b6d4'; // Sniper: Cyan
    return '#eab308'; // Rifleman: Amber
  }, [type, isBoss]);

  const emissiveMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: tacticalColor,
    emissive: tacticalColor,
    emissiveIntensity: isBoss ? 5 : 2.5,
  }), [tacticalColor, isBoss]);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#000000',
    metalness: 1,
    roughness: 0.1,
  }), []);

  // Adjusted dimensions for health bar
  const barWidth = isBoss ? (cellSize * 0.4) : (cellSize * 0.6);
  const barHeight = isBoss ? (cellSize * 0.05) : (cellSize * 0.1);

  return (
    <group position={[x, (cellSize / 2) * scale, y]} scale={scale}>
      <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1}>
        <group ref={meshRef}>
          {/* CLASS: RUSHER - Compact, Aggressive, Fast silhouette */}
          {type === 'rusher' && (
            <group rotation={[0.4, 0, 0]} position={[0, 0, 0.1]}>
              {/* Torso/Engine Core */}
              <mesh castShadow>
                <boxGeometry args={[cellSize * 0.3, cellSize * 0.3, cellSize * 0.5]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Side Thrust Fins */}
              {[-1, 1].map(s => (
                <mesh key={s} position={[s * cellSize * 0.2, 0, -cellSize * 0.1]} rotation={[0, 0, s * 0.5]}>
                  <boxGeometry args={[0.02, cellSize * 0.2, cellSize * 0.4]} />
                  <primitive object={emissiveMaterial} />
                </mesh>
              ))}
              {/* Forward Sensor Visor */}
              <mesh position={[0, cellSize * 0.1, cellSize * 0.2]}>
                <boxGeometry args={[cellSize * 0.25, 0.05, 0.1]} />
                <primitive object={emissiveMaterial} />
              </mesh>
              {/* Stabilizer Link */}
              <mesh position={[0, -cellSize * 0.15, -cellSize * 0.2]}>
                <cylinderGeometry args={[0.02, 0.02, cellSize * 0.3]} rotation={[Math.PI / 2, 0, 0]} />
                <primitive object={frameMaterial} />
              </mesh>
            </group>
          )}

          {/* CLASS: RIFLEMAN - Standard, Balanced, Robust silhouette */}
          {type === 'rifleman' && (
            <group>
              {/* Main Armored Torso */}
              <mesh castShadow>
                <boxGeometry args={[cellSize * 0.4, cellSize * 0.6, cellSize * 0.3]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Shoulder Pads */}
              {[-1, 1].map(s => (
                <mesh key={s} position={[s * cellSize * 0.25, cellSize * 0.2, 0]}>
                  <boxGeometry args={[cellSize * 0.15, cellSize * 0.15, cellSize * 0.35]} />
                  <primitive object={plateMaterial} />
                </mesh>
              ))}
              {/* Head / Optic Unit */}
              <group position={[0, cellSize * 0.35, 0]}>
                <mesh>
                  <boxGeometry args={[cellSize * 0.2, cellSize * 0.2, cellSize * 0.2]} />
                  <primitive object={plateMaterial} />
                </mesh>
                <mesh position={[0, 0, cellSize * 0.1]}>
                  <boxGeometry args={[cellSize * 0.15, 0.03, 0.01]} />
                  <primitive object={emissiveMaterial} />
                </mesh>
              </group>
              {/* Power Pack (Back) */}
              <mesh position={[0, 0, -cellSize * 0.2]}>
                <boxGeometry args={[cellSize * 0.25, cellSize * 0.4, cellSize * 0.1]} />
                <primitive object={frameMaterial} />
              </mesh>
            </group>
          )}

          {/* CLASS: SNIPER - Tall, Slender, High-precision silhouette */}
          {type === 'sniper' && (
            <group position={[0, cellSize * 0.1, 0]}>
              {/* Slender Main Frame */}
              <mesh castShadow>
                <cylinderGeometry args={[0.05, 0.08, cellSize * 1.3, 4]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Sensor Head with Long Lens */}
              <group position={[0, cellSize * 0.6, 0]}>
                <mesh>
                  <boxGeometry args={[cellSize * 0.2, cellSize * 0.15, cellSize * 0.25]} />
                  <primitive object={plateMaterial} />
                </mesh>
                {/* Rectangular Lens Glow */}
                <mesh position={[0, 0, cellSize * 0.13]}>
                  <planeGeometry args={[0.08, 0.04]} />
                  <primitive object={emissiveMaterial} />
                </mesh>
              </group>
              {/* Side Stabilizer Rails */}
              {[-1, 1].map(s => (
                <mesh key={s} position={[s * cellSize * 0.1, 0, 0]}>
                  <boxGeometry args={[0.01, cellSize * 0.8, 0.05]} />
                  <primitive object={frameMaterial} />
                </mesh>
              ))}
            </group>
          )}

          {/* BOSS: TITAN - Heavy, Armored, Intimidating silhouette */}
          {isBoss && (
            <group>
              {/* Massive Main Chassis */}
              <mesh castShadow>
                <boxGeometry args={[cellSize * 0.9, cellSize * 0.9, cellSize * 0.9]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Heavy Outer Armor Shells */}
              {[1, -1].map(x => (
                <group key={x} position={[x * cellSize * 0.5, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[0.15, cellSize, cellSize]} />
                    <primitive object={plateMaterial} />
                  </mesh>
                  {/* Energy Stripes on Armor */}
                  <mesh position={[x * 0.08, 0, 0]}>
                     <boxGeometry args={[0.01, cellSize * 0.8, 0.05]} />
                     <primitive object={emissiveMaterial} />
                  </mesh>
                </group>
              ))}
              {/* Reinforced Top Plate */}
              <mesh position={[0, cellSize * 0.5, 0]}>
                <boxGeometry args={[cellSize * 0.8, 0.1, cellSize * 0.8]} />
                <primitive object={frameMaterial} />
              </mesh>
              {/* CENTRAL HEART/NUCLEUS */}
              <mesh position={[0, 0, cellSize * 0.4]}>
                <sphereGeometry args={[cellSize * 0.3, 24, 24]} />
                <primitive object={emissiveMaterial} />
              </mesh>
              {/* Defense Pylons */}
              {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([px, pz], i) => (
                <mesh key={i} position={[px * cellSize * 0.3, cellSize * 0.5, pz * cellSize * 0.3]}>
                  <cylinderGeometry args={[0.05, 0.05, cellSize * 0.3]} />
                  <primitive object={baseMaterial} />
                </mesh>
              ))}
            </group>
          )}

          {/* Integrated Weapon System - Class Adjusted Appearance */}
          <group position={[cellSize * 0.25, -cellSize * 0.05, cellSize * 0.2]}>
             <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry 
                  args={[
                    type === 'sniper' ? 0.01 : 0.03, 
                    type === 'sniper' ? 0.01 : 0.04, 
                    type === 'sniper' ? cellSize * 1.5 : cellSize * 0.8, 
                    8
                  ]} 
                />
                <primitive object={frameMaterial} />
             </mesh>
             {/* Muzzle Detail */}
             <mesh position={[0, 0, type === 'sniper' ? cellSize * 0.75 : cellSize * 0.4]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[type === 'sniper' ? 0.015 : 0.045, type === 'sniper' ? 0.015 : 0.045, 0.02, 16]} />
                <primitive object={emissiveMaterial} />
             </mesh>
          </group>

          {/* Under-shadow Gradient (Visual only) */}
          <mesh position={[0, -cellSize / 2, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <circleGeometry args={[cellSize / 2]} />
            <meshBasicMaterial color="black" transparent opacity={0.3} />
          </mesh>
        </group>
      </Float>

      {/* 3D Health Bar Billboard - Hardened Visuals */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
        position={[0, cellSize * 1.1, 0]}
      >
        <group>
          {/* Border Frame */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[barWidth + 0.02, barHeight + 0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
          </mesh>
          {/* Background */}
          <mesh>
            <planeGeometry args={[barWidth, barHeight]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          {/* Health Fill with segment look */}
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
