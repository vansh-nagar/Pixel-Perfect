"use client";

/* eslint-disable react-hooks/immutability */

/**
 * A self-contained, scrollable image collage whose frames warp with an air-friction bend driven by scroll velocity, on WebGL planes.
 */

import { RefObject, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uBendY;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float px = uv.x * 2.0 - 1.0;  // -1 (left) .. +1 (right)
    pos.y += uBendY * px * px;    // parabola: 0 at center, max at both edges
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

function Collage({
  scrollRef,
  slots,
  count,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  slots: RefObject<HTMLDivElement[]>;
  count: number;
}) {
  const { gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshes = useRef<THREE.Mesh[]>([]);

  const [material] = useState(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uTex: { value: null as THREE.Texture | null }, uBendY: { value: 0 } },
      }),
  );
  const [geometry] = useState(() => new THREE.PlaneGeometry(1, 1, 32, 24));

  useEffect(() => {
    new THREE.TextureLoader().load(SRC, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.magFilter = THREE.NearestFilter;
      material.uniforms.uTex.value = t;
      setTexture(t);
    });
  }, [material]);

  const lastScroll = useRef(0);
  const bend = useRef(0);
  useFrame(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const canvasRect = gl.domElement.getBoundingClientRect();

    for (let i = 0; i < meshes.current.length; i++) {
      const slot = slots.current[i];
      const mesh = meshes.current[i];
      if (!slot || !mesh) continue;
      const r = slot.getBoundingClientRect();
      const cx = r.left + r.width / 2 - canvasRect.left;
      const cy = r.top + r.height / 2 - canvasRect.top;
      mesh.position.set(cx - canvasRect.width / 2, -(cy - canvasRect.height / 2), 0);
      mesh.scale.set(r.width, r.height, 1);
    }

    const s = scroller.scrollTop;
    const vel = s - lastScroll.current;
    lastScroll.current = s;
    const target = gsap.utils.clamp(-0.3, 0.3, -vel * 0.02);
    bend.current = lerp(bend.current, target, 0.15);
    material.uniforms.uBendY.value = bend.current;
  });

  if (!texture) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshes.current[i] = el;
          }}
          geometry={geometry}
          material={material}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

const Page = ({ columns = 2 }: { columns?: 1 | 2 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const slots = useRef<HTMLDivElement[]>([]);
  const count = columns === 2 ? 8 : 5;

  return (
    <div
      className={`relative overflow-hidden rounded-md bg-neutral-950 ${
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
        <Collage scrollRef={scrollRef} slots={slots} count={count} />
      </Canvas>

      <div
        ref={scrollRef}
        className="scrollbar-none absolute inset-0 overflow-y-auto overscroll-contain p-2"
      >
        <div className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) slots.current[i] = el;
              }}
              className="aspect-video w-full rounded bg-neutral-900"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
