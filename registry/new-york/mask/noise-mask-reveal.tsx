"use client";

/**
 * An image framed by a fragment-shader noise mask — the picture sits crisp in the centre while its edges and corners dissolve into a soft, cloudy fbm-noise texture that gently drifts and breathes. Pass any `src`.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

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
  uniform float uInner;   // edge distance where the fade starts (0..1)
  uniform float uFade;    // width of the fade band (smaller = harder edge)
  uniform float uSoft;    // how much noise roughens the fade edge
  uniform float uShape;   // 0 = box (wide centre), 1 = radial (round spotlight)
  uniform float uTime;    // drifts the cloud field (0 = static)

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

  // cover-fit sampling so the image is never stretched
  vec2 coverUV(vec2 uv) {
    float sa = uResolution.x / uResolution.y;
    float ia = uTextureRes.x / uTextureRes.y;
    vec2 s = vec2(1.0);
    if (sa > ia) s.y = ia / sa; else s.x = sa / ia;
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    // box distance keeps a wide centre clear; radial gives a tight round
    // spotlight where only the centre is visible. uShape blends between them.
    vec2 e = abs(uv - 0.5) * 2.0;
    float boxd = max(e.x, e.y);
    vec2 c = uv - 0.5;
    c.x *= uResolution.x / uResolution.y;          // aspect-correct → round
    float radial = length(c) / 0.5;
    float edge = mix(boxd, radial, uShape);

    // cloudy fbm + fine grain roughen the fade so corners dissolve organically.
    // the field pans slowly so the cloud edge gently shimmers.
    float n = fbm(uv * 5.0 + vec2(uTime * 0.03, uTime * 0.02)) - 0.5;
    n += (hash21(floor(uv * uResolution.xy * 0.5)) - 0.5) * 0.05;
    float ev = edge + n * uSoft;

    // the visible area breathes a touch in and out — clean and subtle
    float breathe = 0.02 * sin(uTime * 0.5);
    float mask = 1.0 - smoothstep(uInner + breathe, uInner + uFade + breathe, ev);

    vec3 col = texture2D(uTexture, coverUV(uv)).rgb;
    gl_FragColor = vec4(col, clamp(mask, 0.0, 1.0));
  }
`;

const NoiseMaskReveal = ({
  src = FALLBACK_SRC,
  className,
  drift = true,
  shape = "box",
  inner = 0.4,
  fade = 0.65,
  soft = 0.5,
}: {
  /** Public path (or URL) of the image to frame. */
  src?: string;
  className?: string;
  /** Subtle motion on by default — the cloud edge drifts and breathes. Set false to freeze. */
  drift?: boolean;
  /** "box" keeps a wide centre; "radial" is a tight round centre-only spotlight. */
  shape?: "box" | "radial";
  /** Edge distance where the fade begins (smaller = less visible, tighter centre). */
  inner?: number;
  /** Width of the fade band (smaller = harder edge). */
  fade?: number;
  /** How much the fbm noise roughens the dissolve edge. */
  soft?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      uInner: { value: inner },
      uFade: { value: fade },
      uSoft: { value: soft },
      uShape: { value: shape === "radial" ? 1 : 0 },
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

    const render = () => renderer.render(scene, camera);

    // Load the requested image; fall back to the demo asset if it 404s, so the
    // tile always shows something (drop your file in and it picks it up).
    const loader = new THREE.TextureLoader();
    let disposed = false;
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
      render();
    };
    loader.load(src, accept, undefined, () => {
      if (src !== FALLBACK_SRC) loader.load(FALLBACK_SRC, accept);
    });

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

    // Static by default (render on load/resize only); drift runs a light loop.
    let raf = 0;
    if (drift) {
      let last = performance.now();
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const now = performance.now();
        uniforms.uTime.value += Math.min((now - last) / 1000, 0.05);
        last = now;
        render();
      };
      animate();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (canvas.parentNode === container) container.removeChild(canvas);
      uniforms.uTexture.value?.dispose();
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [src, drift, shape, inner, fade, soft]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={
        className ?? "relative aspect-video w-[40rem] max-w-[92%] overflow-hidden"
      }
    />
  );
};

export default NoiseMaskReveal;
