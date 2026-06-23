"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

const MAX_RIPPLES = 14;

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform vec3 uRipples[${MAX_RIPPLES}]; // xy = uv origin, z = age (s)
  uniform int uCount;
  uniform float uWaveSpeed;
  uniform float uFreq;
  uniform float uWidth;
  uniform float uAmp;
  uniform float uDecay;

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
    float crest = 0.0;

    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      if (i >= uCount) break;
      vec3 r = uRipples[i];
      vec2 d = vUv - r.xy;
      d.x *= aspect;
      float dist = length(d);
      float age = r.z;
      float radius = age * uWaveSpeed;
      float band = exp(-pow((dist - radius) * uWidth, 2.0)); // ring envelope
      float env = band * exp(-age * uDecay);
      float wave = sin((dist - radius) * uFreq);
      vec2 dir = d / (dist + 1e-5);
      dir.x /= aspect;
      disp += dir * wave * env * uAmp;
      crest += env * max(wave, 0.0);
    }

    vec3 col = texture2D(uTexture, coverUV(vUv + disp)).rgb;
    col += crest * 0.12;                 // bright glint on the crests
    gl_FragColor = vec4(col, 1.0);
  }
`;

const RippleTouch = ({
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
    const geometry = new THREE.PlaneGeometry(2, 2);

    const animated = createAnimatedTexture(image);
    const rippleVecs = Array.from(
      { length: MAX_RIPPLES },
      () => new THREE.Vector3(),
    );
    const uniforms = {
      uTexture: { value: animated.texture },
      uResolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uRipples: { value: rippleVecs },
      uCount: { value: 0 },
      uWaveSpeed: { value: 0.55 },
      uFreq: { value: 34 },
      uWidth: { value: 11 },
      uAmp: { value: 0.022 },
      uDecay: { value: 1.1 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const LIFE = 2.6; // seconds a ripple stays alive
    const ripples: { x: number; y: number; start: number }[] = [];
    let shaderTime = 0;
    let lastEmitX = -1;
    let lastEmitY = -1;

    const emit = (x: number, y: number) => {
      ripples.push({ x, y, start: shaderTime });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      lastEmitX = x;
      lastEmitY = y;
    };
    const toUv = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height,
      };
    };
    const onPointerMove = (e: PointerEvent) => {
      const uv = toUv(e);
      if (!uv) return;
      const dx = uv.x - lastEmitX;
      const dy = uv.y - lastEmitY;
      if (dx * dx + dy * dy > 0.0025) emit(uv.x, uv.y);
    };
    const onPointerDown = (e: PointerEvent) => {
      const uv = toUv(e);
      if (uv) emit(uv.x, uv.y);
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);

    const render = () => {
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (shaderTime - ripples[i].start > LIFE) ripples.splice(i, 1);
      }
      const n = Math.min(ripples.length, MAX_RIPPLES);
      for (let i = 0; i < n; i++) {
        const r = ripples[ripples.length - 1 - i];
        rippleVecs[i].set(r.x, r.y, shaderTime - r.start);
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
      gui.add(uniforms.uAmp, "value", 0, 0.06, 0.002).name("strength");
      gui.add(uniforms.uWaveSpeed, "value", 0.2, 1.2, 0.02).name("wave speed");
      gui.add(uniforms.uFreq, "value", 10, 70, 1).name("frequency");
      gui.add(uniforms.uDecay, "value", 0.4, 2.5, 0.05).name("decay");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
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

export default RippleTouch;
