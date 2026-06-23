"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

const COLUMNS = 120;

const LiquidMelt = ({
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

    const config = { drip: 0.32, spread: 0.06, recover: 0.4, heat: 0.9 };

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

    const heat = new Float32Array(COLUMNS);
    const dripData = new Float32Array(COLUMNS * 4); // r = drip amount
    const dripTexture = new THREE.DataTexture(
      dripData,
      COLUMNS,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    dripTexture.needsUpdate = true;

    const uniforms = {
      uTexture: { value: animated.texture },
      uDrip: { value: dripTexture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uAmount: { value: config.drip },
      uTime: { value: 0 },
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
        uniform sampler2D uDrip;
        uniform vec2 uResolution;
        uniform vec2 uImageResolution;
        uniform float uAmount;
        uniform float uTime;
        varying vec2 vUv;

        vec2 coverUV(vec2 uv) {
          float sa = uResolution.x / uResolution.y;
          float ia = uImageResolution.x / uImageResolution.y;
          vec2 s = vec2(1.0);
          if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
          return (uv - 0.5) * s + 0.5;
        }

        void main() {
          float d = texture2D(uDrip, vec2(vUv.x, 0.5)).r;
          // wobble so the drip edge is wavy, not a flat slab
          float wob = sin(vUv.x * 60.0 + uTime * 2.0) * 0.004 * d;
          // sample from higher up → the column sags downward
          vec2 uv = vUv;
          uv.y += d * uAmount + wob;
          vec3 col = texture2D(uTexture, coverUV(uv)).rgb;
          // a touch darker where it has melted, like thick running paint
          col *= 1.0 - clamp(d, 0.0, 1.0) * 0.18;
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
      mouse.y = (e.clientY - r.top) / r.height;
      active = true;
    };
    const onLeave = () => {
      active = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const SPREAD = Math.max(1, Math.round(config.spread * COLUMNS));
    const update = (dt: number) => {
      const center = Math.round(mouse.x * (COLUMNS - 1));
      if (active) {
        for (let k = -SPREAD; k <= SPREAD; k++) {
          const c = center + k;
          if (c < 0 || c >= COLUMNS) continue;
          const f = 1 - Math.abs(k) / (SPREAD + 1);
          heat[c] = Math.min(heat[c] + config.heat * f * dt * 6, 1);
        }
      }
      for (let c = 0; c < COLUMNS; c++) {
        dripData[c * 4] += heat[c] * dt * 1.2;
        dripData[c * 4] = Math.max(0, dripData[c * 4] - config.recover * dt);
        heat[c] *= 1 - Math.min(1, dt * 2.2);
      }
      dripTexture.needsUpdate = true;
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
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }
      update(dt);
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
      gui
        .add(config, "drip", 0, 0.8, 0.01)
        .name("drip")
        .onChange((v: number) => {
          uniforms.uAmount.value = v;
        });
      gui.add(config, "recover", 0.1, 1.2, 0.02).name("recover");
      gui.add(config, "heat", 0.3, 2, 0.05).name("heat");
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
      dripTexture.dispose();
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

export default LiquidMelt;
