import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export function Weapon3D({ type, isReloading, isAds, recoilOffset, lastShotTime }: { type: string, isReloading: boolean, isAds: boolean, recoilOffset: number, lastShotTime: number }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="city" />
        <WeaponModel type={type} isReloading={isReloading} isAds={isAds} recoilOffset={recoilOffset} lastShotTime={lastShotTime} />
      </Canvas>
    </div>
  );
}

export function WeaponModel({ type, isReloading, isAds, recoilOffset, lastShotTime }: { type: string, isReloading: boolean, isAds: boolean, recoilOffset: number, lastShotTime: number }) {
  const group = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const flashMeshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (group.current) {
      // Basic sway and breathing
      const t = state.clock.getElapsedTime();
      
      const targetX = isAds ? 0 : 1.5;
      const targetY = isAds ? -0.5 : -1.5;
      const targetZ = isAds ? 2 : 1;
      
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.1);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY + Math.sin(t * 2) * 0.05, 0.1);
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ + recoilOffset * 0.5, 0.1);
      
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, recoilOffset * 0.5, 0.1);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, isAds ? 0 : -0.1, 0.1);
      
      if (isReloading) {
        group.current.rotation.x += delta * 5;
      }
    }

    // Muzzle Flash Array
    if (flashRef.current && flashMeshRef.current) {
        const timeSinceShot = Date.now() - lastShotTime;
        if (timeSinceShot < 50 && !isReloading) {
            flashRef.current.intensity = 10 * Math.random();
            flashMeshRef.current.visible = true;
            flashMeshRef.current.scale.setScalar(1 + Math.random() * 0.5);
            flashMeshRef.current.rotation.z = Math.random() * Math.PI;
        } else {
            flashRef.current.intensity = 0;
            flashMeshRef.current.visible = false;
        }
    }
  });

  return (
    <group ref={group}>
      <pointLight ref={flashRef} color="#fb923c" intensity={0} distance={10} position={[0, 0.2, -3]} />
      <mesh ref={flashMeshRef} position={[0, 0.2, -2.5]} visible={false}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial color="#fb923c" transparent opacity={0.8} />
      </mesh>
      <Float speed={2} rotationIntensity={0.05} floatIntensity={0.05}>
        {type === 'pistol' && (
          <group>
            {/* Slide/Barrel */}
            <mesh castShadow receiveShadow position={[0, 0.2, 0.2]}>
              <boxGeometry args={[0.2, 0.25, 1.2]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Grip */}
            <mesh castShadow receiveShadow position={[0, -0.2, 0.5]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.18, 0.6, 0.3]} />
              <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.8} />
            </mesh>
            {/* Sights */}
            <mesh castShadow receiveShadow position={[0, 0.35, -0.3]}>
              <boxGeometry args={[0.05, 0.05, 0.1]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
            </mesh>
          </group>
        )}
        {type === 'rifle' && (
          <group>
            {/* Upper Receiver */}
            <mesh castShadow receiveShadow position={[0, 0.3, 0.5]}>
              <boxGeometry args={[0.25, 0.3, 1.5]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Handguard */}
            <mesh castShadow receiveShadow position={[0, 0.3, -0.6]}>
              <boxGeometry args={[0.2, 0.25, 1.2]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.5} />
            </mesh>
            {/* Barrel */}
            <mesh castShadow receiveShadow position={[0, 0.3, -1.3]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Grip */}
            <mesh castShadow receiveShadow position={[0, -0.15, 0.8]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.18, 0.5, 0.25]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
            {/* Mag */}
            <mesh castShadow receiveShadow position={[0, -0.1, 0.2]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.3]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Sight */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0.2]}>
              <boxGeometry args={[0.1, 0.15, 0.2]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
            </mesh>
            {/* Stock */}
            <mesh castShadow receiveShadow position={[0, 0.2, 1.5]}>
              <boxGeometry args={[0.2, 0.4, 0.8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
        )}
        {type === 'shotgun' && (
          <group>
            {/* Receiver */}
            <mesh castShadow receiveShadow position={[0, 0.2, 0.4]}>
              <boxGeometry args={[0.25, 0.3, 1.2]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Barrel */}
            <mesh castShadow receiveShadow position={[0, 0.25, -0.8]}>
              <cylinderGeometry args={[0.08, 0.08, 1.6, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Underbarrel Tube */}
            <mesh castShadow receiveShadow position={[0, 0.1, -0.7]}>
              <cylinderGeometry args={[0.06, 0.06, 1.4, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Pump */}
            <mesh castShadow receiveShadow position={[0, 0.1, -0.5]}>
              <boxGeometry args={[0.2, 0.2, 0.6]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            {/* Grip/Stock */}
            <mesh castShadow receiveShadow position={[0, 0.05, 1.0]} rotation={[-0.3, 0, 0]}>
              <boxGeometry args={[0.2, 0.4, 0.8]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        )}
        {type === 'sniper' && (
          <group>
            {/* Receiver */}
            <mesh castShadow receiveShadow position={[0, 0.2, 0.5]}>
              <boxGeometry args={[0.22, 0.3, 1.4]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Barrel */}
            <mesh castShadow receiveShadow position={[0, 0.2, -1.0]}>
              <cylinderGeometry args={[0.06, 0.04, 2.4, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Scope */}
            <mesh castShadow receiveShadow position={[0, 0.45, 0.2]}>
              <cylinderGeometry args={[0.1, 0.12, 0.8, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#000" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Scope Mounts */}
            <mesh castShadow receiveShadow position={[0, 0.35, 0.4]}>
              <boxGeometry args={[0.05, 0.2, 0.05]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 0.35, 0.0]}>
              <boxGeometry args={[0.05, 0.2, 0.05]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            {/* Stock */}
            <mesh castShadow receiveShadow position={[0, 0.1, 1.6]}>
              <boxGeometry args={[0.18, 0.35, 1.0]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Grip */}
            <mesh castShadow receiveShadow position={[0, -0.15, 0.9]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.15, 0.4, 0.25]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Bipod (Folded) */}
            <mesh castShadow receiveShadow position={[0, 0.05, -1.0]}>
              <boxGeometry args={[0.15, 0.1, 0.4]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        )}
      </Float>
    </group>
  );
}
