"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  attribute vec2 aUv;     // home uv (0..1)
  attribute vec2 aRand;   // per-particle randoms

  uniform float uTime;
  uniform vec2 uMouse;        // cursor in NDC (y up); off-screen when idle
  uniform vec2 uResolution;   // drawing-buffer size, px
  uniform float uCols;        // particle columns (for point size)
  uniform float uPointScale;
  uniform float uRadius;      // scatter radius (NDC)
  uniform float uScatter;     // scatter strength
  uniform float uDrift;       // idle drift amplitude

  varying vec2 vUv;
  varying float vForce;

  float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }

  void main() {
    vUv = aUv;
    vec2 home = position.xy;
    float aspect = uResolution.x / uResolution.y;

    // gentle idle drift so the field is always alive
    vec2 drift = vec2(
      sin(uTime * 0.9 + aRand.x * 6.2831),
      cos(uTime * 1.1 + aRand.y * 6.2831)
    ) * uDrift;

    // repulsion / scatter around the cursor (aspect-corrected falloff)
    vec2 d = home - uMouse;
    d.x *= aspect;
    float dist = length(d);
    float force = smoothstep(uRadius, 0.0, dist);
    vec2 dir = d / (dist + 1e-4);
    dir.x /= aspect;
    // chaotic per-particle scatter direction, biased outward from the cursor
    vec2 rnd = vec2(hash11(aRand.x * 91.7), hash11(aRand.y * 57.3 + 3.1)) - 0.5;
    vec2 scatter = (dir * 0.6 + rnd * 1.4) * force * uScatter;

    vForce = force;
    vec2 pos = home + drift + scatter;
    gl_Position = vec4(pos, 0.0, 1.0);
    // shrink particles a touch as they scatter, so the cloud feels dispersed
    gl_PointSize = (uResolution.x / uCols) * uPointScale * (1.0 - 0.45 * force);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;

  varying vec2 vUv;
  varying float vForce;

  // cover-fit (like background-size: cover) so the image is never stretched
  vec2 coverUV(vec2 uv) {
    float sa = uResolution.x / uResolution.y;
    float ia = uImageResolution.x / uImageResolution.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    // round point sprite
    vec2 pc = gl_PointCoord - 0.5;
    float d = length(pc);
    if (d > 0.5) discard;
    vec3 col = texture2D(uTexture, coverUV(vUv)).rgb;
    col *= 1.0 + vForce * 0.15;                 // scattered specks glint slightly
    float alpha = smoothstep(0.5, 0.4, d);      // soft round edge
    gl_FragColor = vec4(col, alpha);
  }
`;

const COLS = 192;
const ROWS = 108;

const ImageParticles = ({
  image,
  className,
  dpr = 2,
  controls = false,
}: {
  image: string;
  className?: string;
  dpr?: number;
  controls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera(); // positions are already in clip space
    const scene = new THREE.Scene();

    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const rands = new Float32Array(count * 2);
    let p = 0;
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const u = (i + 0.5) / COLS;
        const v = (j + 0.5) / ROWS;
        positions[p * 3] = u * 2 - 1;
        positions[p * 3 + 1] = v * 2 - 1;
        positions[p * 3 + 2] = 0;
        uvs[p * 2] = u;
        uvs[p * 2 + 1] = v;
        rands[p * 2] = Math.random();
        rands[p * 2 + 1] = Math.random();
        p++;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute("aRand", new THREE.BufferAttribute(rands, 2));

    const animated = createAnimatedTexture(image);

    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(1000, 1000) }, // idle = off-screen
      uCols: { value: COLS },
      uPointScale: { value: 1.15 },
      uRadius: { value: 0.34 },
      uScatter: { value: 0.26 },
      uDrift: { value: 0.004 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    renderer.setClearColor(0x000000, 0); // gaps show the (black) tile behind
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;

    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const target = new THREE.Vector2(1000, 1000);
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      target.set(x * 2 - 1, (1 - y) * 2 - 1);
    };
    const onPointerLeave = () => target.set(1000, 1000);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const render = () => {
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }
      renderer.render(scene, camera);
    };

    let shaderTime = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      shaderTime += dt;
      uniforms.uTime.value = shaderTime;
      animated.update(shaderTime * 1000);
      const m = uniforms.uMouse.value;
      if (target.x > 100) m.copy(target);
      else m.lerp(target, Math.min(1, dt * 12));
      render();
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
      render();
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        last = performance.now();
      },
      { rootMargin: "150px", threshold: 0 },
    );
    intersectionObserver.observe(container);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      tick();
    };
    animate();

    let gui: GUI | null = null;
    if (controls) {
      gui = new GUI();
      gui.domElement.style.zIndex = "10000";
      gui.add(uniforms.uScatter, "value", 0, 0.8, 0.01).name("scatter");
      gui.add(uniforms.uRadius, "value", 0.1, 0.8, 0.01).name("radius");
      gui.add(uniforms.uDrift, "value", 0, 0.02, 0.001).name("drift");
      gui.add(uniforms.uPointScale, "value", 0.6, 2.5, 0.05).name("point size");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (canvas.parentNode === container) container.removeChild(canvas);
      animated.dispose();
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [image, dpr, controls]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ overflow: "hidden" }}
    />
  );
};

export default ImageParticles;
