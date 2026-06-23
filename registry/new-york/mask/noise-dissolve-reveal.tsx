"use client";

/**
 * A fragment-shader noise dissolve reveal — the image materialises in through a drifting cloud of fbm noise, with a warm grainy glow riding the dissolve edge. Click to replay.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const FALLBACK_SRC = "/bend-image-reveal.gif";

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
  uniform vec2 uTextureRes;
  uniform vec2 uResolution;
  uniform float uProgress;   // 0 = hidden, 1 = fully revealed
  uniform float uTime;

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
    return v;
  }

  vec2 coverUV(vec2 uv) {
    float sa = uResolution.x / uResolution.y;
    float ia = uTextureRes.x / uTextureRes.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    float n = fbm(uv * 4.0 + uTime * 0.04);
    n += (hash21(floor(uv * uResolution.xy * 0.5)) - 0.5) * 0.04;

    // sweep a soft threshold across the noise: low-noise areas reveal first
    float edgeW = 0.14;
    float t = mix(-edgeW, 1.0 + edgeW, uProgress);
    float mask = 1.0 - smoothstep(t - edgeW, t + edgeW, n);

    // warm grainy glow riding the dissolve front
    float rim = 1.0 - smoothstep(0.0, edgeW, abs(n - t));

    vec3 col = texture2D(uTexture, coverUV(uv)).rgb;
    col += rim * vec3(1.0, 0.95, 0.82) * 0.5;

    gl_FragColor = vec4(col, clamp(mask, 0.0, 1.0));
  }
`;

const NoiseDissolveReveal = ({
  src = FALLBACK_SRC,
}: {
  src?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uTextureRes: { value: new THREE.Vector2(1, 1) },
      uResolution: { value: new THREE.Vector2() },
      uProgress: { value: 0 },
      uTime: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    let disposed = false;
    const loader = new THREE.TextureLoader();
    const accept = (tex: THREE.Texture) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.minFilter = THREE.LinearFilter;
      uniforms.uTexture.value?.dispose();
      uniforms.uTexture.value = tex;
      const img = tex.image as { width: number; height: number };
      uniforms.uTextureRes.value.set(img.width, img.height);
    };
    loader.load(src, accept, undefined, () => {
      if (src !== FALLBACK_SRC) loader.load(FALLBACK_SRC, accept);
    });

    const state = { progress: 0 };
    const render = () => renderer.render(scene, camera);
    const replay = () => {
      gsap.fromTo(
        state,
        { progress: 0 },
        { progress: 1, duration: 1.8, ease: "power2.inOut", overwrite: true },
      );
    };
    replayRef.current = replay;

    let raf = 0;
    let last = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      uniforms.uTime.value += Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uProgress.value = state.progress;
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
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    animate();
    replay();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      gsap.killTweensOf(state);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (canvas.parentNode === container) container.removeChild(canvas);
      uniforms.uTexture.value?.dispose();
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [src]);

  return (
    <button
      onClick={() => replayRef.current()}
      className="relative aspect-video w-[40rem] max-w-[92%] cursor-pointer overflow-hidden rounded-xl bg-black/5"
      aria-label="Replay noise dissolve reveal"
    >
      <div ref={containerRef} className="size-full" aria-hidden />
    </button>
  );
};

export default NoiseDissolveReveal;
