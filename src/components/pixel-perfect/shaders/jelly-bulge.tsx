"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

const JellyBulge = ({
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

    const config = { magnify: 0.45, radius: 0.32, stiffness: 180, damping: 14 };

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
      uMagnify: { value: 0 },
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
        uniform float uMagnify;
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
          // bell-shaped lens: pull samples toward the centre to magnify
          float lens = uMagnify * exp(-dist * dist / (uRadius * uRadius));
          vec2 dir = d;
          dir.x /= aspect;
          vec2 uv = vUv - dir * lens;
          // subtle chromatic split at the lens rim
          float ca = lens * 0.02;
          vec2 off = dir * ca;
          float r = texture2D(uTexture, coverUV(uv + off)).r;
          float g = texture2D(uTexture, coverUV(uv)).g;
          float b = texture2D(uTexture, coverUV(uv - off)).b;
          vec3 col = vec3(r, g, b);
          // faint glassy highlight
          col += smoothstep(uRadius, 0.0, dist) * lens * 0.06;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

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

    let px = 0.5;
    let py = 0.5;
    let vpx = 0;
    let vpy = 0;
    let m = 0;
    let vm = 0;

    const spring = (
      pos: number,
      vel: number,
      target: number,
      dt: number,
    ): [number, number] => {
      const a = (target - pos) * config.stiffness - vel * config.damping;
      const nv = vel + a * dt;
      return [pos + nv * dt, nv];
    };

    let shaderTime = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      shaderTime += dt;
      animated.update(shaderTime * 1000);
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }

      [px, vpx] = spring(px, vpx, mouse.x, dt);
      [py, vpy] = spring(py, vpy, mouse.y, dt);
      [m, vm] = spring(m, vm, active ? 1 : 0, dt);

      uniforms.uCenter.value.set(px, py);
      uniforms.uMagnify.value = m * config.magnify;
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
      gui.add(config, "magnify", 0, 0.9, 0.01).name("magnify");
      gui.add(config, "radius", 0.12, 0.6, 0.01).name("radius");
      gui.add(config, "stiffness", 60, 320, 5).name("stiffness");
      gui.add(config, "damping", 6, 30, 0.5).name("damping");
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

export default JellyBulge;
