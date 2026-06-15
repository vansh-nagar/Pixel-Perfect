"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

/* -------------------------------------------------------------------------- *
 * CursorTrailSmear — the cursor leaves a liquid streak. Recent pointer samples
 * (position + velocity) are tracked JS-side with an age and packed into small
 * uniform arrays. The shader smears the image along each sample's velocity with
 * a soft gaussian blob, weighted by how fresh it is, so a stroke trails behind
 * the cursor and heals as the samples expire. No float render targets — robust
 * on every WebGL device.
 * -------------------------------------------------------------------------- */

const MAX_TRAIL = 24;

const CursorTrailSmear = ({
  image,
  className,
  dpr = 2,
  controls = false,
}: {
  /** Public path (or URL) of the image to smear. */
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

    const config = { strength: 0.5, tightness: 90, decay: 1.6 };

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
    const trailVecs = Array.from(
      { length: MAX_TRAIL },
      () => new THREE.Vector4(),
    );
    const weights = new Float32Array(MAX_TRAIL);

    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uTrail: { value: trailVecs }, // xy = uv, zw = velocity
      uWeights: { value: weights },
      uCount: { value: 0 },
      uStrength: { value: config.strength },
      uTightness: { value: config.tightness },
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
        uniform vec4 uTrail[${MAX_TRAIL}];
        uniform float uWeights[${MAX_TRAIL}];
        uniform int uCount;
        uniform float uStrength;
        uniform float uTightness;
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
          vec2 disp = vec2(0.0);
          for (int i = 0; i < ${MAX_TRAIL}; i++) {
            if (i >= uCount) break;
            vec4 t = uTrail[i];
            vec2 d = vUv - t.xy;
            d.x *= aspect;
            float g = exp(-dot(d, d) * uTightness); // soft blob around the sample
            disp += t.zw * g * uWeights[i];
          }
          vec3 col = texture2D(uTexture, coverUV(vUv + disp * uStrength)).rgb;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- pointer ----------------------------------------------------------
    const trail: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      start: number;
    }[] = [];
    let shaderTime = 0;
    let px = -1;
    let py = -1;
    const LIFE = 1.2; // seconds a sample stays alive

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (px >= 0) {
        const vx = x - px;
        const vy = y - py;
        if (vx * vx + vy * vy > 1e-6) {
          trail.push({ x, y, vx, vy, start: shaderTime });
          if (trail.length > MAX_TRAIL) trail.shift();
        }
      }
      px = x;
      py = y;
    };
    const onLeave = () => {
      px = -1;
      py = -1;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const render = () => {
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }
      // expire old samples, then pack newest-first into the uniform arrays
      for (let i = trail.length - 1; i >= 0; i--) {
        if (shaderTime - trail[i].start > LIFE) trail.splice(i, 1);
      }
      const n = Math.min(trail.length, MAX_TRAIL);
      for (let i = 0; i < n; i++) {
        const s = trail[trail.length - 1 - i];
        trailVecs[i].set(s.x, s.y, s.vx, s.vy);
        const age = (shaderTime - s.start) / LIFE; // 0 → 1
        weights[i] = Math.exp(-age * config.decay) * (1 - age);
      }
      uniforms.uCount.value = n;
      renderer.render(scene, camera);
    };

    let last = performance.now();
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
        .add(config, "strength", 0, 1.2, 0.02)
        .name("strength")
        .onChange((v: number) => {
          uniforms.uStrength.value = v;
        });
      gui
        .add(config, "tightness", 30, 200, 5)
        .name("focus")
        .onChange((v: number) => {
          uniforms.uTightness.value = v;
        });
      gui.add(config, "decay", 0.5, 4, 0.1).name("decay");
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

export default CursorTrailSmear;
