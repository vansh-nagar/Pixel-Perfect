"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

/* -------------------------------------------------------------------------- *
 * VortexPull — a swirling whirlpool chases the cursor with momentum. The swirl
 * centre eases toward the pointer, and its strength spins up while the cursor is
 * present and unwinds when it leaves — both with inertia, so the vortex lags,
 * overshoots and keeps turning for a moment after you stop. The shader rotates
 * UVs around the centre by an angle that falls off with distance.
 * -------------------------------------------------------------------------- */

const VortexPull = ({
  image,
  className,
  dpr = 2,
  controls = false,
}: {
  /** Public path (or URL) of the image to swirl. */
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

    const config = { swirl: 4.0, radius: 0.45, spin: 1.4 };

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

    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uAngle: { value: 0 },
      uRadius: { value: config.radius },
    };

    const material = new THREE.ShaderMaterial({
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
        uniform vec2 uResolution;
        uniform vec2 uImageResolution;
        uniform vec2 uCenter;
        uniform float uAngle;
        uniform float uRadius;
        varying vec2 vUv;

        vec2 coverUV(vec2 uv) {
          float sa = uResolution.x / uResolution.y;
          float ia = uImageResolution.x / uImageResolution.y;
          vec2 s = vec2(1.0);
          if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
          return (uv - 0.5) * s + 0.5;
        }

        void main() {
          float aspect = uResolution.x / uResolution.y;
          vec2 d = vUv - uCenter;
          d.x *= aspect;
          float dist = length(d);
          // smooth falloff: full twist at the centre → none past the radius
          float f = smoothstep(uRadius, 0.0, dist);
          float a = uAngle * f;
          float s = sin(a), c = cos(a);
          vec2 rd = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
          rd.x /= aspect;
          vec2 uv = uCenter + rd;
          gl_FragColor = vec4(texture2D(uTexture, coverUV(uv)).rgb, 1.0);
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
      mouse.y = 1 - (e.clientY - r.top) / r.height;
      active = true;
    };
    const onLeave = () => {
      active = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    // Inertial state: the centre lags the cursor, the angle keeps spinning.
    let cx = 0.5;
    let cy = 0.5;
    let strength = 0; // eases toward config.swirl while active
    let angle = 0;

    let shaderTime = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      shaderTime += dt;
      animated.update(shaderTime * 1000);
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }

      // centre chases the cursor (when it's left, it stays put and unwinds)
      if (active) {
        cx += (mouse.x - cx) * Math.min(1, dt * 6);
        cy += (mouse.y - cy) * Math.min(1, dt * 6);
      }
      // strength spins up while engaged, unwinds when not — with inertia
      const target = active ? config.swirl : 0;
      strength += (target - strength) * Math.min(1, dt * 2.5);
      angle += strength * config.spin * dt;

      uniforms.uCenter.value.set(cx, cy);
      uniforms.uAngle.value = angle;
      uniforms.uRadius.value = config.radius;
      renderer.render(scene, camera);
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
      gui.add(config, "swirl", 0, 10, 0.1).name("swirl");
      gui.add(config, "spin", 0, 3, 0.05).name("spin speed");
      gui.add(config, "radius", 0.1, 0.9, 0.01).name("radius");
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

export default VortexPull;
