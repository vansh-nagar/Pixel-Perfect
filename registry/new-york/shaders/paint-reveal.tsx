"use client";

/**
 * A pencil sketch paints itself in with organic, noisy brush edges.
 */


import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

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
  uniform vec2 resolution;
  uniform float uProgress;   // 0 = sketch, 1 = fully painted
  uniform float uNoiseScale; // organic edge frequency
  uniform float uEdge;       // pencil-line strength

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
  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  // cover-fit sampling so the image is never stretched
  vec2 coverUV(vec2 uv) {
    float sa = resolution.x / resolution.y;
    float ia = uTextureRes.x / uTextureRes.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }
  vec4 texCover(vec2 uv) { return texture2D(uTexture, coverUV(uv)); }

  void main() {
    vec2 uv = vUv;
    vec4 painted = texCover(uv);

    // --- derive a pencil-on-paper sketch from the painted image -----------
    vec2 px = 1.5 / resolution;
    float tl = luma(texCover(uv + px * vec2(-1.0,  1.0)).rgb);
    float t  = luma(texCover(uv + px * vec2( 0.0,  1.0)).rgb);
    float tr = luma(texCover(uv + px * vec2( 1.0,  1.0)).rgb);
    float l  = luma(texCover(uv + px * vec2(-1.0,  0.0)).rgb);
    float r  = luma(texCover(uv + px * vec2( 1.0,  0.0)).rgb);
    float bl = luma(texCover(uv + px * vec2(-1.0, -1.0)).rgb);
    float b  = luma(texCover(uv + px * vec2( 0.0, -1.0)).rgb);
    float br = luma(texCover(uv + px * vec2( 1.0, -1.0)).rgb);
    float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
    float edge = smoothstep(0.12, 0.7, sqrt(gx * gx + gy * gy)) * uEdge;

    float lum = luma(painted.rgb);
    vec3 paper = vec3(0.92, 0.89, 0.82);
    float grain = fbm(uv * resolution.xy / 3.0) * 0.06;
    vec3 sketch = paper * (0.78 + 0.22 * lum) - edge * 0.65 - grain;
    sketch = clamp(sketch, 0.0, 1.0);

    // --- brush-stroke reveal: sketch -> painted (bottom-left -> top-right) -
    float rn = fbm(uv * uNoiseScale) * 0.18;
    float maskValue = (uv.x + uv.y) * 0.5 + rn;
    float threshold = uProgress * 1.6;
    float paintAmt = 1.0 - smoothstep(threshold - 0.04, threshold + 0.02, maskValue);

    // darker "wet" line right at the advancing brush edge
    float wet = smoothstep(0.0, 0.045, abs(maskValue - threshold));
    vec3 col = mix(sketch, painted.rgb, paintAmt);
    col *= mix(0.8, 1.0, wet);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const PaintReveal = ({
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

    const uniforms = {
      uTexture: { value: animated.texture },
      uTextureRes: { value: new THREE.Vector2(1, 1) },
      resolution: { value: new THREE.Vector2() },
      uProgress: { value: 0 },
      uNoiseScale: { value: 15 },
      uEdge: { value: 1 },
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

    const state = { progress: 0 };
    const makeLoop = () =>
      gsap.to(state, {
        progress: 1,
        duration: 2.4,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
      });
    let loop = makeLoop();

    const onEnter = () => {
      loop.kill();
      gsap.to(state, {
        progress: 1,
        duration: 1.0,
        ease: "power2.out",
        overwrite: true,
      });
    };
    const onLeave = () => {
      gsap.to(state, {
        progress: 0,
        duration: 0.8,
        ease: "power2.inOut",
        overwrite: true,
        onComplete: () => {
          loop = makeLoop();
        },
      });
    };
    if (!controls) {
      canvas.addEventListener("pointerenter", onEnter);
      canvas.addEventListener("pointerleave", onLeave);
    }

    const render = () => {
      uniforms.uProgress.value = state.progress;
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uTextureRes.value.set(img.width, img.height);
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
      animated.update(shaderTime * 1000);
      render();
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.resolution.value.set(
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
      gui.add(uniforms.uNoiseScale, "value", 3, 40, 0.5).name("noise scale");
      gui.add(uniforms.uEdge, "value", 0, 2, 0.05).name("pencil edge");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      loop.kill();
      gsap.killTweensOf(state);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointerenter", onEnter);
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

export default PaintReveal;
