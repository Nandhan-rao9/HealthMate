import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';

interface MacronutrientGlobeProps {
  position: [number, number, number];
  color: string;
  label: string;
  value: number;
  maxValue: number;
}

export const MacronutrientGlobe = ({
  position,
  color,
  label,
  value,
  maxValue,
}: MacronutrientGlobeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = Math.max(0.5, (value / maxValue) * 1.5);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} scale={scale}>
        <Sphere args={[1, 32, 32]}>
          <meshPhysicalMaterial
            color={color}
            roughness={0.2}
            metalness={0.8}
            transmission={0.9}
            thickness={0.5}
          />
        </Sphere>
      </mesh>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {`${label}\n${value}g`}
      </Text>
    </group>
  );
};