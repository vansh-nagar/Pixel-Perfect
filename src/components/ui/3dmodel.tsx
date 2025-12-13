"use client";

import { Canvas } from "@react-three/fiber";

import { useGLTF, PerspectiveCamera, Float } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

interface Model3DProps {
  scale?: number;
  enableZoom?: boolean;
  path?: string;

  className?: string;
}

function AnimatedModel({ scale = 1, path }: Omit<Model3DProps, "className">) {
  const groupRef = useRef<THREE.Group>(null);

  // Load the 3D model
  const { scene } = useGLTF(`${path}`);

  return (
    <group ref={groupRef} scale={scale} position={[0, -2, -3]}>
      <primitive object={scene} />
    </group>
  );
}

export function Model3D({ scale = 1, className = "", path }: Model3DProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, 5]} intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />

        {/* Model */}
        <Float>
          <AnimatedModel scale={scale} path={path} />
        </Float>
        {/* Camera and Controls */}
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      </Canvas>
    </div>
  );
}
