"use client";

/**
 * A pixel-art frame that smoothly chases the cursor and warps with an air-friction bend on a WebGL plane.
 */

import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";
const IMG_ASPECT = 540 / 304;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// the whole image is one texture on a subdivided plane; the GPU bends the vertices
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uBendX;
  uniform float uBendY;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float px = uv.x * 2.0 - 1.0; // -1 (left)   .. +1 (right)
    float py = uv.y * 2.0 - 1.0; // -1 (bottom) .. +1 (top)
    pos.y += uBendY * px * px;
    pos.x += uBendX * py * py;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTex;
  void main() {
    gl_FragColor = texture2D(uTex, vUv);
  }
`;

function MouseImage({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const uniforms = useMemo(
    () => ({
      uTex: { value: null as THREE.Texture | null },
      uBendX: { value: 0 },
      uBendY: { value: 0 },
    }),
    [],
  );

  const planeH = Math.min(size.height * 0.4, (size.width * 0.55) / IMG_ASPECT);
  const planeW = planeH * IMG_ASPECT;

  useEffect(() => {
    new THREE.TextureLoader().load(SRC, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.magFilter = THREE.NearestFilter;
      setTexture(t);
    });
  }, []);

  // attach the texture once the mesh/material has mounted
  useEffect(() => {
    if (texture && matRef.current) matRef.current.uniforms.uTex.value = texture;
  }, [texture]);

  // where the cursor is (target) vs. where the image actually is (lags behind)
  const target = useRef({ x: 0, y: 0 });
  const st = useRef({ x: 0, y: 0, bx: 0, by: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // listen on window so the card's overlays can't swallow the event
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      if (inside) {
        target.current.x = e.clientX - r.left - size.width / 2;
        target.current.y = -(e.clientY - r.top - size.height / 2); // three.js: +y up
      } else {
        target.current.x = 0; // settle back to center when the cursor leaves the card
        target.current.y = 0;
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [containerRef, size.width, size.height]);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    // smoothly chase the cursor (the lag IS the "air resistance")
    const px = st.current.x;
    const py = st.current.y;
    st.current.x = lerp(st.current.x, target.current.x, 0.1);
    st.current.y = lerp(st.current.y, target.current.y, 0.1);
    mesh.position.set(st.current.x, st.current.y, 0);

    // bend opposite to travel, smoothed so it settles when the cursor stops
    const vx = st.current.x - px;
    const vy = st.current.y - py;
    st.current.bx = lerp(st.current.bx, gsap.utils.clamp(-45, 45, -vx * 1.5), 0.15);
    st.current.by = lerp(st.current.by, gsap.utils.clamp(-45, 45, -vy * 1.5), 0.15);
    mat.uniforms.uBendX.value = st.current.bx;
    mat.uniforms.uBendY.value = st.current.by;
  });

  if (!texture) return null;
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[planeW, planeH, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

const Page = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <MouseImage containerRef={containerRef} />
      </Canvas>
    </div>
  );
};

export default Page;
