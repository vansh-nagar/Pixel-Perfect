"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createAnimatedTexture } from "./animated-texture";

/* -------------------------------------------------------------------------- *
 * CursorReveal — drag the cursor to reveal the image through a brush mask that
 * persists across frames (ping-pong feedback buffer).
 *   • mode "paint":   base is black-&-white; your strokes paint colour back in
 *                     and slowly fade away.
 *   • mode "scratch": base is a frosted layer; your strokes scratch it off to
 *                     uncover the image, healing back very slowly.
 * Thumbnails auto-draw a drifting stroke so the tile is alive; the cursor adds
 * to it. -------------------------------------------------------------------- */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Accumulate the brush into the mask (R channel), fading the previous frame.
const UPDATE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uPoint;      // current cursor (0..1)
  uniform vec2 uPrevPoint;  // last cursor — paint the whole segment between
  uniform float uRadius;
  uniform float uFade;      // per-frame retention (frame-rate normalised)
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    float prev = texture2D(uPrev, vUv).r * uFade;
    vec2 pa = vUv - uPoint;     pa.x *= uAspect;
    vec2 ba = uPrevPoint - uPoint; ba.x *= uAspect;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
    float d = length(pa - ba * h);          // distance to the stroke segment
    float add = smoothstep(uRadius, 0.0, d);
    gl_FragColor = vec4(clamp(prev + add, 0.0, 1.0), 0.0, 0.0, 1.0);
  }
`;

const DISPLAY_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform sampler2D uMask;
  uniform vec2 uTextureRes;
  uniform vec2 resolution;
  uniform float uMode;       // 0 = paint, 1 = scratch
  varying vec2 vUv;

  vec2 coverUV(vec2 uv) {
    float sa = resolution.x / resolution.y;
    float ia = uTextureRes.x / uTextureRes.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }
  vec4 texCover(vec2 uv) { return texture2D(uTexture, coverUV(uv)); }
  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  void main() {
    float m = texture2D(uMask, vUv).r;
    vec3 img = texCover(vUv).rgb;
    vec3 base;
    if (uMode < 0.5) {
      base = vec3(luma(img));                 // paint: grayscale
    } else {
      // scratch: cheap frosted glass — blurred, desaturated, lightened
      vec3 b = texCover(vUv + vec2(0.012, 0.0)).rgb
             + texCover(vUv - vec2(0.012, 0.0)).rgb
             + texCover(vUv + vec2(0.0, 0.012)).rgb
             + texCover(vUv - vec2(0.0, 0.012)).rgb;
      vec3 blur = (img + b) / 5.0;
      base = mix(vec3(luma(blur)), vec3(0.92), 0.45) + 0.04;
    }
    float reveal = smoothstep(0.12, 0.5, m);
    gl_FragColor = vec4(mix(base, img, reveal), 1.0);
  }
`;

const CursorReveal = ({
  image,
  mode = "paint",
  className,
  dpr = 2,
}: {
  image: string;
  /** "paint" reveals colour over B&W; "scratch" uncovers under frosted glass. */
  mode?: "paint" | "scratch";
  className?: string;
  dpr?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const MASK = 256;
    const rtOpts: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    };
    let maskRead = new THREE.WebGLRenderTarget(MASK, MASK, rtOpts);
    let maskWrite = new THREE.WebGLRenderTarget(MASK, MASK, rtOpts);

    const animated = createAnimatedTexture(image);

    const updateMat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: UPDATE_FRAG,
      depthTest: false,
      uniforms: {
        uPrev: { value: null },
        uPoint: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevPoint: { value: new THREE.Vector2(0.5, 0.5) },
        uRadius: { value: 0.07 },
        uFade: { value: 1 },
        uAspect: { value: 1 },
      },
    });
    const displayMat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: DISPLAY_FRAG,
      depthTest: false,
      uniforms: {
        uTexture: { value: animated.texture },
        uMask: { value: null },
        uTextureRes: { value: new THREE.Vector2(1, 1) },
        resolution: { value: new THREE.Vector2() },
        uMode: { value: mode === "scratch" ? 1 : 0 },
      },
    });

    const blit = (m: THREE.Material, target: THREE.WebGLRenderTarget | null) => {
      mesh.material = m;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    };

    // pointer + idle auto-stroke
    let point: { x: number; y: number } | null = null;
    let prevPoint = { x: 0.5, y: 0.5 };
    let lastInteraction = -Infinity;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      point = { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
      lastInteraction = shaderTime;
    };
    const onLeave = () => { point = null; };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    // paint fades fairly quickly; scratch heals very slowly
    const fadeBase = mode === "scratch" ? 0.996 : 0.97;

    let shaderTime = 0;
    let last = performance.now();
    const frame = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      shaderTime += dt;

      animated.update(shaderTime * 1000);
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) displayMat.uniforms.uTextureRes.value.set(img.width, img.height);

      // current brush point (cursor, or a drifting idle stroke)
      let cur = point;
      if (!cur && shaderTime - lastInteraction > 0.8) {
        const t = shaderTime * 0.8;
        cur = { x: 0.5 + 0.33 * Math.sin(t * 1.3), y: 0.5 + 0.3 * Math.cos(t * 0.9) };
      }
      const u = updateMat.uniforms;
      if (cur) {
        u.uPoint.value.set(cur.x, cur.y);
        u.uPrevPoint.value.set(prevPoint.x, prevPoint.y);
        prevPoint = cur;
      } else {
        // no stroke this frame: paint off-canvas so only the fade applies
        u.uPoint.value.set(-1, -1);
        u.uPrevPoint.value.set(-1, -1);
      }
      u.uAspect.value = displayMat.uniforms.resolution.value.x /
        Math.max(displayMat.uniforms.resolution.value.y, 1);
      u.uFade.value = Math.pow(fadeBase, dt * 60);
      u.uPrev.value = maskRead.texture;
      blit(updateMat, maskWrite);
      const tmp = maskRead; maskRead = maskWrite; maskWrite = tmp;

      displayMat.uniforms.uMask.value = maskRead.texture;
      blit(displayMat, null);
    };

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      displayMat.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
      frame();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); }, { rootMargin: "150px", threshold: 0 });
    io.observe(container);

    let raf = 0;
    const animate = () => { raf = requestAnimationFrame(animate); if (visible) frame(); };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      if (canvas.parentNode === container) container.removeChild(canvas);
      maskRead.dispose();
      maskWrite.dispose();
      animated.dispose();
      geometry.dispose();
      updateMat.dispose();
      displayMat.dispose();
      renderer.setRenderTarget(null);
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [image, mode, dpr]);

  return <div ref={containerRef} aria-hidden className={className} style={{ overflow: "hidden" }} />;
};

export default CursorReveal;
