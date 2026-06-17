"use client";

/**
 * A pixel-art frame that flies in, then zooms to fill the box as you scroll inside it, warping with an air-friction bend on a WebGL plane.
 */

import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";
const IMG_ASPECT = 540 / 304;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
  uniform float uOpacity;
  void main() {
    vec4 c = texture2D(uTex, vUv);
    c.a *= uOpacity;
    gl_FragColor = c;
  }
`;

function BendImage({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const uniforms = useMemo(
    () => ({
      uTex: { value: null as THREE.Texture | null },
      uBendX: { value: 0 },
      uBendY: { value: 0 },
      uOpacity: { value: 0 },
    }),
    [],
  );

  const planeH = Math.min(size.height * 0.42, (size.width * 0.7) / IMG_ASPECT);
  const planeW = planeH * IMG_ASPECT;
  const coverScale = Math.max(size.width / planeW, size.height / planeH);

  useEffect(() => {
    new THREE.TextureLoader().load(SRC, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.magFilter = THREE.NearestFilter;
      setTexture(t);
    });
  }, []);

  const state = useRef({ x: 0, y: 0, s: 0, bx: 0, by: 0 });

  useEffect(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!texture || !mesh || !mat) return;
    mat.uniforms.uTex.value = texture;

    const rightX = size.width * 0.28;
    const topY = size.height * 0.28;
    const bottomY = -size.height * 0.28;

    mesh.position.set(rightX, bottomY, 0);
    state.current.x = rightX;
    state.current.y = bottomY;

    const tl = gsap
      .timeline({ defaults: { ease: "power3.inOut" } })
      .to(mat.uniforms.uOpacity, { value: 1, duration: 0.3 })
      .to(mesh.position, { y: topY, duration: 0.6 })
      .to(mesh.position, { x: 0, y: 0, duration: 0.8 });

    return () => {
      tl.kill();
    };
  }, [texture, size.width, size.height]);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    const sc = scrollRef.current;
    if (!mesh || !mat) return;

    const max = sc ? Math.max(1, sc.scrollHeight - sc.clientHeight) : 1;
    const progress = sc ? gsap.utils.clamp(0, 1, sc.scrollTop / max) : 0;
    const scale = lerp(1, coverScale, progress);
    mesh.scale.set(scale, scale, 1);

    const pvx = mesh.position.x - state.current.x;
    const pvy = mesh.position.y - state.current.y;
    const sv = sc ? sc.scrollTop - state.current.s : 0;
    state.current.x = mesh.position.x;
    state.current.y = mesh.position.y;
    state.current.s = sc ? sc.scrollTop : 0;

    const targetX = gsap.utils.clamp(-45, 45, -pvx * 2);
    const targetY = gsap.utils.clamp(-45, 45, -pvy * 2 + sv * -1.4);
    state.current.bx = lerp(state.current.bx, targetX, 0.12);
    state.current.by = lerp(state.current.by, targetY, 0.12);
    const s = mesh.scale.x || 1;
    mat.uniforms.uBendX.value = state.current.bx / s;
    mat.uniforms.uBendY.value = state.current.by / s;
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
        transparent
      />
    </mesh>
  );
}

const Page = ({ columns = 1 }: { columns?: 1 | 2 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`relative overflow-hidden rounded-md ${
        columns === 2 ? "h-full w-full" : "h-72 w-72"
      }`}
    >
      <Canvas
        className="pointer-events-none absolute inset-0 z-10"
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <BendImage scrollRef={scrollRef} />
      </Canvas>

      <div
        ref={scrollRef}
        className="scrollbar-none absolute inset-0 overflow-y-auto overscroll-contain"
      >
        <div style={{ height: "320%" }} />
      </div>
    </div>
  );
};

export default Page;
