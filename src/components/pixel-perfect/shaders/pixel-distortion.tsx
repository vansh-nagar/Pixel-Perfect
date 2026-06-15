"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

/* -------------------------------------------------------------------------- *
 * PixelDistortion — interactive grid distortion (à la akella/DistortedPixels).
 *
 * A small grid is stored in a float DataTexture of RG offsets. Each frame every
 * cell relaxes back toward zero; the cursor pushes the cells near it by its
 * velocity (scaled by 1/distance). The display shader then samples the image at
 * `uv - strength * offset.rg`, so the pixels smear along the cursor trail and
 * settle when it stops.
 * -------------------------------------------------------------------------- */

const GRID = 40; // grid cells per axis — fewer = bigger "pixels"

const PixelDistortion = ({
  image,
  className,
  dpr = 2,
  controls = false,
}: {
  /** Public path (or URL) of the image to distort. */
  image: string;
  className?: string;
  /** Max pixel ratio. Use a lower value for small thumbnails. */
  dpr?: number;
  /** Show the lil-gui customization panel (strength / relax). */
  controls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config = { strength: 0.045, relax: 0.9 };

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10, 10);
    camera.position.z = 1;

    const animated = createAnimatedTexture(image);

    const data = new Float32Array(GRID * GRID * 4);
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
      resolution: { value: new THREE.Vector4(1, 1, 1, 1) },
      uStrength: { value: config.strength },
    };

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTexture;
          uniform sampler2D uDataTexture;
          uniform vec4 resolution;
          uniform float uStrength;
          varying vec2 vUv;
          void main() {
            vec2 newUV = (vUv - 0.5) * resolution.zw + 0.5;
            vec4 offset = texture2D(uDataTexture, vUv);
            gl_FragColor = texture2D(uTexture, newUV - uStrength * offset.rg);
          }
        `,
      }),
    );
    scene.add(mesh);

    let vw = 1;
    let vh = 1;
    const applyResolution = () => {
      const img = animated.texture.image as { width: number; height: number };
      const iw = img && img.width > 1 ? img.width : 1;
      const ih = img && img.height > 1 ? img.height : 1;
      const imageAspect = ih / iw;
      let a1 = 1;
      let a2 = 1;
      if (vh / vw > imageAspect) a1 = (vw / vh) * imageAspect;
      else a2 = vh / vw / imageAspect;
      uniforms.resolution.value.set(vw, vh, a1, a2);
    };

    const resize = () => {
      vw = container.clientWidth;
      vh = container.clientHeight;
      if (!vw || !vh) return;
      renderer.setSize(vw, vh);
      applyResolution();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // --- pointer ----------------------------------------------------------
    const mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      mouse.vx = mouse.x - mouse.px;
      mouse.vy = mouse.y - mouse.py;
      mouse.px = mouse.x;
      mouse.py = mouse.y;
    };
    canvas.addEventListener("pointermove", onMove);

    const RADIUS = GRID / 8;
    const updateGrid = () => {
      for (let i = 0; i < GRID * GRID; i++) {
        data[i * 4] *= config.relax;
        data[i * 4 + 1] *= config.relax;
      }
      const gx = GRID * mouse.x;
      const gy = GRID * (1 - mouse.y);
      const r2 = RADIUS * RADIUS;
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const dist = (gx - i) ** 2 + (gy - j) ** 2;
          if (dist < r2) {
            const idx = 4 * (i + GRID * j);
            const power = Math.min(RADIUS / Math.sqrt(dist + 0.0001), 8);
            data[idx] += 70 * mouse.vx * power;
            data[idx + 1] -= 70 * mouse.vy * power;
          }
        }
      }
      mouse.vx *= 0.9;
      mouse.vy *= 0.9;
      dataTexture.needsUpdate = true;
    };

    let shaderTime = 0;
    let last = performance.now();
    const frame = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      shaderTime += dt;
      animated.update(shaderTime * 1000);
      applyResolution();
      updateGrid();
      renderer.render(scene, camera);
    };

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
      if (visible) frame();
    };
    animate();

    let gui: GUI | null = null;
    if (controls) {
      gui = new GUI();
      gui.domElement.style.zIndex = "10000";
      gui
        .add(config, "strength", 0, 0.12, 0.005)
        .name("strength")
        .onChange((v: number) => {
          uniforms.uStrength.value = v;
        });
      gui.add(config, "relax", 0.8, 0.97, 0.005).name("relax");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onMove);
      if (canvas.parentNode === container) container.removeChild(canvas);
      animated.dispose();
      dataTexture.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
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

export default PixelDistortion;
