"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createAnimatedTexture } from "./animated-texture";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform vec2 uResA;
  uniform vec2 uResB;
  uniform vec2 resolution;
  uniform float uSplit;
  varying vec2 vUv;

  vec2 coverUV(vec2 uv, vec2 res) {
    float sa = resolution.x / resolution.y;
    float ia = res.x / res.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    float dx = vUv.x - uSplit;
    // liquid warp: pull pixels toward the seam, strongest right at it
    float warp = smoothstep(0.07, 0.0, abs(dx)) * 0.05;
    vec2 off = vec2(-sign(dx) * warp, 0.0);
    vec3 a = texture2D(uA, coverUV(vUv + off, uResA)).rgb;
    vec3 b = texture2D(uB, coverUV(vUv + off, uResB)).rgb;
    vec3 col = dx < 0.0 ? a : b;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const BeforeAfter = ({
  image,
  imageB,
  className,
  dpr = 2,
  interactive = false,
}: {
  image: string;
  imageB: string;
  className?: string;
  dpr?: number;
  interactive?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const a = createAnimatedTexture(image);
    const b = createAnimatedTexture(imageB);

    const uniforms = {
      uA: { value: a.texture },
      uB: { value: b.texture },
      uResA: { value: new THREE.Vector2(1, 1) },
      uResB: { value: new THREE.Vector2(1, 1) },
      resolution: { value: new THREE.Vector2() },
      uSplit: { value: 0.5 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const split = { value: 0.5, target: 0.5 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      split.target = Math.min(Math.max((e.clientX - r.left) / r.width, 0.02), 0.98);
    };
    if (interactive) canvas.addEventListener("pointermove", onMove);

    let shaderTime = 0;
    let last = performance.now();
    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      shaderTime += dt;

      a.update(shaderTime * 1000);
      b.update(shaderTime * 1000);
      const ia = a.texture.image as { width: number; height: number };
      const ib = b.texture.image as { width: number; height: number };
      if (ia && ia.width > 1) uniforms.uResA.value.set(ia.width, ia.height);
      if (ib && ib.width > 1) uniforms.uResB.value.set(ib.width, ib.height);

      if (!interactive) split.target = 0.5 + 0.42 * Math.sin(shaderTime * 0.6);
      split.value += (split.target - split.value) * Math.min(dt * 12, 1); // ease
      uniforms.uSplit.value = split.value;
      if (handleRef.current) handleRef.current.style.left = `${split.value * 100}%`;

      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
      render();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); }, { rootMargin: "150px", threshold: 0 });
    io.observe(container);

    let raf = 0;
    const animate = () => { raf = requestAnimationFrame(animate); if (visible) render(); };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onMove);
      if (canvas.parentNode === container) container.removeChild(canvas);
      a.dispose();
      b.dispose();
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [image, imageB, dpr, interactive]);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", overflow: "hidden" }}>
      <div
        ref={handleRef}
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: 0,
          zIndex: 10,
          pointerEvents: "none",
          transform: "translateX(-1px)",
        }}
      >
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 2, background: "rgba(255,255,255,0.85)", boxShadow: "0 0 8px rgba(0,0,0,0.4)" }} />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            transform: "translate(-50%, -50%)",
            width: 30,
            height: 30,
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.92)",
            color: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,0.5)",
          }}
        >
          ‹›
        </div>
      </div>
    </div>
  );
};

export default BeforeAfter;
