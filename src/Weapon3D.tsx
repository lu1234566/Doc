import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export function Weapon3D({ type, isReloading, isAds, recoilOffset, lastShotTime }: { type: string, isReloading: boolean, isAds: boolean, recoilOffset: number, lastShotTime: number }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <WeaponModel type={type} isReloading={isReloading} isAds={isAds} recoilOffset={recoilOffset} lastShotTime={lastShotTime} />
      </Canvas>
    </div>
  );
}

export function WeaponModel({ type, isReloading, isAds, recoilOffset, lastShotTime }: { type: string, isReloading: boolean, isAds: boolean, recoilOffset: number, lastShotTime: number }) {
  const group = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const flashMeshRef = useRef<THREE.Mesh>(null);

  // Tactical Materials
  const matGraphite = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2d3748', metalness: 0.5, roughness: 0.5 }), []);
  const matMetal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#718096', metalness: 0.8, roughness: 0.2 }), []);
  const matGrip = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.1, roughness: 0.9 }), []);
  const matCyan = useMemo(() => new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#22d3ee', emissiveIntensity: 2 }), []);
  const matYellow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#fbbf24', emissiveIntensity: 1.5 }), []);
  
  useFrame((state, delta) => {
    if (group.current) {
      const t = state.clock.getElapsedTime();
      
      const targetX = isAds ? 0 : 1.4;
      const targetY = isAds ? -0.45 : -1.2; // Slightly higher
      const targetZ = isAds ? 2.2 : 1;
      
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.15);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY + Math.sin(t * 1.5) * 0.02, 0.1);
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ + recoilOffset * 0.4, 0.15);
      
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, recoilOffset * 0.3, 0.1);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, isAds ? 0 : -0.15, 0.1);
      
      if (isReloading) {
        group.current.rotation.x += delta * 6;
      }
    }

    if (flashRef.current && flashMeshRef.current) {
        const timeSinceShot = Date.now() - lastShotTime;
        if (timeSinceShot < 40 && !isReloading) {
            flashRef.current.intensity = 15;
            flashMeshRef.current.visible = true;
            flashMeshRef.current.scale.setScalar(0.8 + Math.random() * 0.4);
            flashMeshRef.current.rotation.z = Math.random() * Math.PI;
        } else {
            flashRef.current.intensity = 0;
            flashMeshRef.current.visible = false;
        }
    }
  });

  return (
    <group ref={group}>
      <pointLight ref={flashRef} color="#fb923c" intensity={0} distance={5} position={[0, 0.2, -2.5]} />
      <mesh ref={flashMeshRef} position={[0, 0.2, -2.4]} visible={false}>
          <boxGeometry args={[0.4, 0.4, 0.1]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} />
      </mesh>

      {type === 'pistol' && (
          <group scale={0.8}>
            {/* P-99 Refined Silhouette */}
            <mesh castShadow position={[0, 0.2, 0.2]} material={matGraphite}>
              <boxGeometry args={[0.18, 0.22, 1.1]} />
            </mesh>
            {/* Slide Top Detail */}
            <mesh position={[0, 0.31, 0.2]} material={matMetal}>
              <boxGeometry args={[0.1, 0.02, 1.0]} />
            </mesh>
            {/* Lower Frame */}
            <mesh position={[0, 0.1, 0.3]} material={matGraphite}>
              <boxGeometry args={[0.16, 0.15, 0.8]} />
            </mesh>
            {/* Precision Grip */}
            <mesh position={[0, -0.2, 0.5]} rotation={[-0.25, 0, 0]} material={matGrip}>
              <boxGeometry args={[0.17, 0.65, 0.28]} />
            </mesh>
            {/* Cyan Accent line */}
            <mesh position={[0, 0.15, 0.2]} material={matCyan}>
              <boxGeometry args={[0.2, 0.02, 0.4]} />
            </mesh>
            {/* Muzzle */}
            <mesh position={[0, 0.2, -0.4]} rotation={[Math.PI/2, 0, 0]} material={matMetal}>
              <cylinderGeometry args={[0.04, 0.05, 0.1, 16]} />
            </mesh>
          </group>
        )}

        {type === 'rifle' && (
          <group scale={0.9}>
            {/* M4-A1 Refined Silhouette */}
            <mesh castShadow position={[0, 0.3, 0.4]} material={matGraphite}>
              <boxGeometry args={[0.2, 0.3, 1.2]} />
            </mesh>
            {/* Handguard with Rails */}
            <mesh position={[0, 0.3, -0.6]} material={matGrip}>
              <boxGeometry args={[0.22, 0.22, 1.0]} />
            </mesh>
            {/* Decorative Rails */}
            {[-1, 1].map(x => (
              <mesh key={x} position={[x * 0.12, 0.3, -0.6]} material={matMetal}>
                <boxGeometry args={[0.02, 0.1, 0.8]} />
              </mesh>
            ))}
            {/* Top Component */}
            <mesh position={[0, 0.5, 0.2]} material={matMetal}>
              <boxGeometry args={[0.15, 0.1, 0.6]} />
            </mesh>
            {/* Long Tactical Barrel */}
            <mesh position={[0, 0.3, -1.4]} rotation={[Math.PI/2, 0, 0]} material={matMetal}>
              <cylinderGeometry args={[0.04, 0.04, 0.6, 12]} />
            </mesh>
            {/* Suppressor / Compensator */}
            <mesh position={[0, 0.3, -1.8]} rotation={[Math.PI/2, 0, 0]} material={matGraphite}>
              <cylinderGeometry args={[0.07, 0.07, 0.3, 6]} />
            </mesh>
            {/* Stock Assembly */}
            <mesh position={[0, 0.3, 1.4]} rotation={[0, 0, 0]} material={matGraphite}>
              <boxGeometry args={[0.15, 0.4, 0.8]} />
            </mesh>
            {/* Magazine - High Capacity Look */}
            <mesh position={[0, -0.2, 0.1]} rotation={[0.2, 0, 0]} material={matGrip}>
              <boxGeometry args={[0.18, 0.7, 0.3]} />
            </mesh>
            {/* Cyan Detail */}
            <mesh position={[0, 0.4, 0.4]} material={matCyan}>
              <sphereGeometry args={[0.02]} />
            </mesh>
          </group>
        )}

        {type === 'shotgun' && (
          <group scale={1.1}>
            {/* KRM-262 Heavy Silhouette */}
            <mesh castShadow position={[0, 0.2, 0.3]} material={matGraphite}>
              <boxGeometry args={[0.32, 0.4, 1.0]} />
            </mesh>
            {/* Huge Ported Barrel */}
            <mesh position={[0, 0.28, -0.9]} rotation={[Math.PI/2, 0, 0]} material={matMetal}>
              <cylinderGeometry args={[0.12, 0.12, 1.6, 16]} />
            </mesh>
            {/* Industrial Pump Body */}
            <mesh position={[0, 0.1, -0.6]} material={matGrip}>
              <boxGeometry args={[0.28, 0.25, 0.7]} />
            </mesh>
            {/* Pump Grips Detail */}
            {[0.1, 0, -0.1].map(z => (
               <mesh key={z} position={[0, 0, -0.6 + z]} material={matMetal}>
                 <boxGeometry args={[0.3, 0.26, 0.05]} />
               </mesh>
            ))}
            {/* Heat Shield - Yellow / Tactical */}
            <mesh position={[0, 0.42, -0.5]} material={matYellow}>
              <boxGeometry args={[0.1, 0.02, 0.6]} />
            </mesh>
            {/* Heavy Stock */}
            <mesh position={[0, 0.1, 1.1]} rotation={[-0.2, 0, 0]} material={matGraphite}>
              <boxGeometry args={[0.25, 0.45, 0.7]} />
            </mesh>
          </group>
        )}

        {type === 'sniper' && (
          <group scale={1.2}>
            {/* DL-Q33 Precision Silhouette */}
            <mesh castShadow position={[0, 0.25, 0.6]} material={matGraphite}>
              <boxGeometry args={[0.2, 0.35, 1.4]} />
            </mesh>
            {/* Extreme Precision Barrel */}
            <mesh position={[0, 0.32, -1.2]} rotation={[Math.PI/2, 0, 0]} material={matMetal}>
              <cylinderGeometry args={[0.03, 0.03, 3.2, 6]} />
            </mesh>
            {/* Muzzle Brake */}
            <mesh position={[0, 0.32, -2.8]} rotation={[Math.PI/2, 0, 0]} material={matGraphite}>
               <boxGeometry args={[0.12, 0.12, 0.12]} />
            </mesh>
            {/* High-Tech Scope */}
            <group position={[0, 0.55, 0.3]}>
              <mesh rotation={[Math.PI/2, 0, 0]} material={matGraphite}>
                <cylinderGeometry args={[0.14, 0.14, 1.0, 12]} />
              </mesh>
              {/* Internal Lens Glow */}
              <mesh position={[0, 0, -0.51]} rotation={[Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.1]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} />
              </mesh>
              {/* External Cyan Ring */}
              <mesh position={[0, 0, -0.52]} material={matCyan}>
                <torusGeometry args={[0.13, 0.01, 8, 32]} />
              </mesh>
            </group>
            {/* Technical Bipod Folded */}
            <mesh position={[0, 0.15, -0.8]} material={matMetal}>
              <boxGeometry args={[0.25, 0.05, 0.3]} />
            </mesh>
            {/* Ergo Grip */}
            <mesh position={[0, -0.25, 1.0]} rotation={[-0.3, 0, 0]} material={matGrip}>
              <boxGeometry args={[0.15, 0.5, 0.25]} />
            </mesh>
          </group>
        )}
    </group>
  );
}
