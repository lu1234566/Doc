import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export function Weapon3D({ type, isReloading, isAds, recoilOffset }: { type: string, isReloading: boolean, isAds: boolean, recoilOffset: number }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="city" />
        <WeaponModel type={type} isReloading={isReloading} isAds={isAds} recoilOffset={recoilOffset} />
      </Canvas>
    </div>
  );
}

function WeaponModel({ type, isReloading, isAds, recoilOffset }: { type: string, isReloading: boolean, isAds: boolean, recoilOffset: number }) {
  const group = useRef<THREE.Group>(null);
  
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
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.1}>
        {type === 'pistol' && (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.2, 1.2]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        )}
        {type === 'rifle' && (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.6, 2.5]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
          </mesh>
        )}
        {type === 'shotgun' && (
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 2.5, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
          </mesh>
        )}
        {type === 'sniper' && (
          <group>
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.3, 0.5, 3.5]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color="#000" />
            </mesh>
          </group>
        )}
      </Float>
    </group>
  );
}
