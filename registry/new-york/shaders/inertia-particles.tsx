"use client";

/**
 * Move your cursor to shove the particles aside — a damped spring snaps them back.
 */


import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  attribute vec2 aUv;       // home uv (0..1)

  uniform vec2 uResolution; // drawing-buffer size, px
  uniform float uCols;      // particle columns (for point size)
  uniform float uPointScale;

  varying vec2 vUv;

  void main() {
    vUv = aUv;
    // position is the CPU-integrated live position (already in clip space)
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = (uResolution.x / uCols) * uPointScale;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;

  varying vec2 vUv;

  vec2 coverUV(vec2 uv) {
    float sa = uResolution.x / uResolution.y;
    float ia = uImageResolution.x / uImageResolution.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    if (length(pc) > 0.5) discard;            // round point sprite
    vec3 col = texture2D(uTexture, coverUV(vUv)).rgb;
    float alpha = smoothstep(0.5, 0.4, length(pc));
    gl_FragColor = vec4(col, alpha);
  }
`;

const COLS = 140;
const ROWS = 80;

const InertiaParticles = ({
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

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();

    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3); // live (uploaded each frame)
    const uvs = new Float32Array(count * 2);
    const homeX = new Float32Array(count);
    const homeY = new Float32Array(count);
    const velX = new Float32Array(count);
    const velY = new Float32Array(count);
    let p = 0;
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const u = (i + 0.5) / COLS;
        const v = (j + 0.5) / ROWS;
        const x = u * 2 - 1;
        const y = v * 2 - 1;
        homeX[p] = x;
        homeY[p] = y;
        positions[p * 3] = x;
        positions[p * 3 + 1] = y;
        positions[p * 3 + 2] = 0;
        uvs[p * 2] = u;
        uvs[p * 2 + 1] = v;
        p++;
      }
    }
    const geometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttr);
    geometry.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));

    const animated = createAnimatedTexture(image);

    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uCols: { value: COLS },
      uPointScale: { value: 1.2 },
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
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;

    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const sim = { stiffness: 70, damping: 0.88, radius: 0.3, force: 32 };

    const mouse = new THREE.Vector2(1000, 1000);
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouse.set(x * 2 - 1, (1 - y) * 2 - 1);
    };
    const onPointerLeave = () => mouse.set(1000, 1000);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const step = (dt: number, aspect: number) => {
      const { stiffness, radius, force } = sim;
      const damp = Math.pow(sim.damping, dt * 60); // frame-rate independent
      const hasMouse = mouse.x < 100;
      const mx = mouse.x;
      const my = mouse.y;
      const r2 = radius * radius;
      for (let i = 0; i < count; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];

        let ax = (homeX[i] - px) * stiffness;
        let ay = (homeY[i] - py) * stiffness;

        if (hasMouse) {
          const ex = px - mx;
          const ey = py - my;
          const exa = ex * aspect;
          const d2 = exa * exa + ey * ey;
          if (d2 < r2) {
            const dist = Math.sqrt(d2) + 1e-4;
            const f = 1 - dist / radius;
            const push = (f * f * force) / dist;
            ax += ex * push;
            ay += ey * push;
          }
        }

        let vx = (velX[i] + ax * dt) * damp;
        let vy = (velY[i] + ay * dt) * damp;
        velX[i] = vx;
        velY[i] = vy;
        positions[i * 3] = px + vx * dt;
        positions[i * 3 + 1] = py + vy * dt;
      }
      positionAttr.needsUpdate = true;
    };

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
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      shaderTime += dt;
      animated.update(shaderTime * 1000);
      const res = uniforms.uResolution.value;
      step(dt, res.y > 0 ? res.x / res.y : 1);
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
      gui.add(sim, "stiffness", 10, 200, 1).name("spring");
      gui.add(sim, "damping", 0.7, 0.99, 0.005).name("damping");
      gui.add(sim, "radius", 0.1, 0.7, 0.01).name("radius");
      gui.add(sim, "force", 5, 80, 1).name("push force");
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

export default InertiaParticles;
