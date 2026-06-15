"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

/* -------------------------------------------------------------------------- *
 * MagneticWarp — the image behaves like iron filings. A grid of per-cell
 * offsets is held JS-side, each cell driven by a little spring. While the cursor
 * is over the canvas, cells within its radius are pulled toward it; the rest
 * spring back toward home. Because each spring has velocity + damping, the image
 * gathers and bulges where you hover, then wobbles and overshoots back into
 * place when you leave. The offsets are uploaded as a float DataTexture that the
 * display shader reads to warp the sampled UVs.
 * -------------------------------------------------------------------------- */

const GRID = 44; // grid cells per axis

const MagneticWarp = ({
  image,
  className,
  dpr = 2,
  controls = false,
}: {
  /** Public path (or URL) of the image to warp. */
  image: string;
  className?: string;
  /** Max pixel ratio. Use a lower value for small thumbnails. */
  dpr?: number;
  /** Show the lil-gui customization panel. */
  controls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config = { strength: 0.07, stiffness: 0.1, damping: 0.84, radius: 0.32 };

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const animated = createAnimatedTexture(image);

    // rg = current offset; the matching velocity lives in a parallel JS array.
    const data = new Float32Array(GRID * GRID * 4);
    const vel = new Float32Array(GRID * GRID * 2);
    const dataTexture = new THREE.DataTexture(
      data,
      GRID,
      GRID,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    dataTexture.needsUpdate = true;

    const uniforms = {
      uTexture: { value: animated.texture },
      uDataTexture: { value: dataTexture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uStrength: { value: config.strength },
    };

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D uTexture;
        uniform sampler2D uDataTexture;
        uniform vec2 uResolution;
        uniform vec2 uImageResolution;
        uniform float uStrength;
        varying vec2 vUv;
        vec2 coverUV(vec2 uv) {
          float sa = uResolution.x / uResolution.y;
          float ia = uImageResolution.x / uImageResolution.y;
          vec2 s = vec2(1.0);
          if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
          return (uv - 0.5) * s + 0.5;
        }
        void main() {
          vec2 off = texture2D(uDataTexture, vUv).rg;
          gl_FragColor = texture2D(uTexture, coverUV(vUv) - uStrength * off);
        }
      `,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- pointer ----------------------------------------------------------
    const mouse = { x: 0.5, y: 0.5 };
    let active = false;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      active = true;
    };
    const onLeave = () => {
      active = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const updateGrid = () => {
      const gx = GRID * mouse.x;
      const gy = GRID * (1 - mouse.y);
      const rCells = config.radius * GRID;
      const r2 = rCells * rCells;
      for (let j = 0; j < GRID; j++) {
        for (let i = 0; i < GRID; i++) {
          const i2 = (i + GRID * j) * 2;
          const i4 = (i + GRID * j) * 4;
          let tx = 0;
          let ty = 0;
          if (active) {
            const dx = gx - i;
            const dy = gy - j;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < r2) {
              const dist = Math.sqrt(dist2) + 1e-4;
              const f = 1 - dist / rCells; // 0 at edge → 1 at cursor
              tx = (dx / dist) * f;
              ty = -(dy / dist) * f;
            }
          }
          // critically-damped-ish spring toward the target offset
          const ax = (tx - data[i4]) * config.stiffness;
          const ay = (ty - data[i4 + 1]) * config.stiffness;
          vel[i2] = (vel[i2] + ax) * config.damping;
          vel[i2 + 1] = (vel[i2 + 1] + ay) * config.damping;
          data[i4] += vel[i2];
          data[i4 + 1] += vel[i2 + 1];
        }
      }
      dataTexture.needsUpdate = true;
    };

    let shaderTime = 0;
    let last = performance.now();
    const render = () => {
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }
      updateGrid();
      renderer.render(scene, camera);
    };
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      shaderTime += dt;
      animated.update(shaderTime * 1000);
      render();
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let visible = true;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        last = performance.now();
      },
      { rootMargin: "150px", threshold: 0 },
    );
    io.observe(container);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (visible) tick();
    };
    animate();

    let gui: GUI | null = null;
    if (controls) {
      gui = new GUI();
      gui.domElement.style.zIndex = "10000";
      gui
        .add(config, "strength", 0, 0.16, 0.005)
        .name("strength")
        .onChange((v: number) => {
          uniforms.uStrength.value = v;
        });
      gui.add(config, "stiffness", 0.02, 0.3, 0.005).name("stiffness");
      gui.add(config, "damping", 0.7, 0.95, 0.005).name("damping");
      gui.add(config, "radius", 0.1, 0.6, 0.01).name("radius");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      if (canvas.parentNode === container) container.removeChild(canvas);
      animated.dispose();
      dataTexture.dispose();
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

export default MagneticWarp;
