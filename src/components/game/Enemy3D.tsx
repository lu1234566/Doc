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
    color: '#0f172a', // Deep Navy/Graphite
    metalness: 0.8,
    roughness: 0.2,
  }), []);

  const gearMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#334155', // Industrial Slate
    metalness: 0.5,
    roughness: 0.5,
  }), []);

  // Class-specific color overrides to follow the Art Pass exactly
  const tacticalColor = useMemo(() => {
    if (isBoss) return '#f43f5e'; // TITAN: Rose/Dark Red
    if (type === 'rusher') return '#f87171'; // Rusher: Aggressive Red
    if (type === 'sniper') return '#38bdf8'; // Sniper: Precision Blue
    return '#fbbf24'; // Rifleman: Tactical Yellow
  }, [type, isBoss]);

  const emissiveMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: tacticalColor,
    emissive: tacticalColor,
    emissiveIntensity: isBoss ? 2 : 1,
  }), [tacticalColor, isBoss]);

  // Adjusted dimensions for health bar
  const barWidth = isBoss ? (cellSize * 0.3) : (cellSize * 0.5);
  const barHeight = isBoss ? (cellSize * 0.04) : (cellSize * 0.08);

  return (
    <group position={[x, (cellSize / 2) * scale, y]} scale={scale}>
      <Float speed={3} rotationIntensity={0.1} floatIntensity={0.2}>
        <group ref={meshRef}>
          {/* CLASS: RUSHER - Compact, Aggressive, Fast silhouette */}
          {type === 'rusher' && (
            <group rotation={[0.5, 0, 0]} position={[0, -cellSize/8, 0]}>
              {/* Lower Body/Engine */}
              <mesh castShadow>
                <boxGeometry args={[cellSize/3, cellSize/3, cellSize/2]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Front Blades */}
              <mesh position={[cellSize/6, 0, cellSize/4]} rotation={[0, 0.4, 0]}>
                <boxGeometry args={[0.02, cellSize/4, cellSize/3]} />
                <primitive object={emissiveMaterial} />
              </mesh>
              <mesh position={[-cellSize/6, 0, cellSize/4]} rotation={[0, -0.4, 0]}>
                <boxGeometry args={[0.02, cellSize/4, cellSize/3]} />
                <primitive object={emissiveMaterial} />
              </mesh>
              {/* Core Head */}
              <mesh position={[0, cellSize/6, cellSize/8]}>
                <sphereGeometry args={[cellSize/6, 8, 8]} />
                <primitive object={emissiveMaterial} />
              </mesh>
            </group>
          )}

          {/* CLASS: RIFLEMAN - Standard, Balanced, Robust silhouette */}
          {type === 'rifleman' && (
            <group>
              {/* Core Torso */}
              <mesh castShadow>
                <capsuleGeometry args={[cellSize/4, cellSize/3, 4, 8]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Tactical Plating */}
              <mesh position={[0, cellSize/10, 0]}>
                <boxGeometry args={[cellSize/2, cellSize/4, cellSize/3]} />
                <primitive object={gearMaterial} />
              </mesh>
              {/* Visor Unit */}
              <mesh position={[0, cellSize/3, cellSize/6]}>
                <boxGeometry args={[cellSize/3, cellSize/15, cellSize/20]} />
                <primitive object={emissiveMaterial} />
              </mesh>
              {/* Attached Module */}
              <mesh position={[cellSize/4, 0, cellSize/10]}>
                <boxGeometry args={[cellSize/6, cellSize/4, cellSize/4]} />
                <primitive object={baseMaterial} />
              </mesh>
            </group>
          )}

          {/* CLASS: SNIPER - Tall, Slender, High-precision silhouette */}
          {type === 'sniper' && (
            <group position={[0, cellSize/4, 0]}>
              {/* Main Vertical Body */}
              <mesh castShadow>
                <cylinderGeometry args={[cellSize/12, cellSize/8, cellSize * 1.2, 6]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Sensor Head */}
              <group position={[0, cellSize/2, 0]}>
                <mesh>
                  <boxGeometry args={[cellSize/4, cellSize/8, cellSize/4]} />
                  <primitive object={gearMaterial} />
                </mesh>
                <mesh position={[0, 0, cellSize/8]}>
                  <sphereGeometry args={[cellSize/15]} />
                  <primitive object={emissiveMaterial} />
                </mesh>
              </group>
              {/* Side Stabilizer */}
              <mesh position={[-cellSize/6, -cellSize/4, 0]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.05, cellSize/2, 0.05]} />
                <primitive object={gearMaterial} />
              </mesh>
            </group>
          )}

          {/* BOSS: TITAN - Heavy, Armored, Intimidating silhouette */}
          {isBoss && (
            <group>
              {/* Heavy Frame */}
              <mesh castShadow>
                <boxGeometry args={[cellSize * 0.8, cellSize * 0.8, cellSize * 0.8]} />
                <primitive object={baseMaterial} />
              </mesh>
              {/* Reactive Armor Plating */}
              {[-1, 1].map(x => (
                <mesh key={x} position={[x * cellSize * 0.45, 0, 0]}>
                  <boxGeometry args={[0.1, cellSize * 0.7, cellSize * 0.6]} />
                  <primitive object={gearMaterial} />
                </mesh>
              ))}
              {/* Upper Power Stabilizers */}
              {[-1, 1].map(x => (
                <mesh key={x} position={[x * cellSize * 0.3, cellSize * 0.4, 0]}>
                  <boxGeometry args={[cellSize/4, cellSize/6, cellSize/3]} />
                  <primitive object={baseMaterial} />
                </mesh>
              ))}
              {/* MASSIVE GLOW CORE */}
              <mesh position={[0, 0, cellSize/3]}>
                <sphereGeometry args={[cellSize/4, 16, 16]} />
                <primitive object={emissiveMaterial} />
              </mesh>
              {/* Top Sensor Array */}
              <mesh position={[0, cellSize * 0.45, 0]}>
                <boxGeometry args={[cellSize/3, 0.05, cellSize/3]} />
                <primitive object={gearMaterial} />
              </mesh>
            </group>
          )}

          {/* Integrated Weapon System - Class Adjusted */}
          <mesh 
            position={[cellSize / 3, -cellSize / 10, cellSize / 4]} 
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry 
              args={[
                type === 'sniper' ? 0.015 : 0.035, 
                0.045, 
                type === 'sniper' ? cellSize * 1.6 : cellSize * 0.7, 
                8
              ]} 
            />
            <primitive object={baseMaterial} />
          </mesh>

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
