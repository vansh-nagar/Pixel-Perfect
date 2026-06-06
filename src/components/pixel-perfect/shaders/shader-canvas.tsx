"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";

const VERTEX_SHADER = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

// Wraps every registry shader: runs its (renamed) main, then post-processes
// the result with the universal hue/saturation/contrast/brightness controls.
const WRAPPER_MAIN = /* glsl */ `
  void main() {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    userMain();
    gl_FragColor = vec4(applyAdjust(fragColor.rgb), fragColor.a);
  }
`;

// Shared helpers prepended to every fragment shader in the registry.
export const COMMON_GLSL = /* glsl */ `
  precision highp float;

  uniform vec2 resolution;
  uniform float time;
  // Cursor position in 0..1 UV space (origin bottom-left). Rests at center.
  uniform vec2 mouse;

  // Universal customization controls (neutral defaults = no change).
  uniform float uZoom;
  uniform float uHue;
  uniform float uSaturation;
  uniform float uContrast;
  uniform float uBrightness;

  // Scratch output the wrapped shader writes into (see ShaderCanvas wrapper).
  vec4 fragColor;

  #define PI 3.14159265359
  #define TAU 6.28318530718

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) {
      v += amp * vnoise(p);
      p = m * p;
      amp *= 0.5;
    }
    return v;
  }

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  // iquilezles.org cosine palette
  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
  }

  // aspect-correct, centered at origin (zoomable)
  vec2 uvCentered() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    return p / uZoom;
  }

  vec2 uv01() {
    vec2 p = gl_FragCoord.xy / resolution.xy;
    return (p - 0.5) / uZoom + 0.5;
  }

  // hue-rotate an RGB color by an angle (radians)
  vec3 hueRotate(vec3 col, float a) {
    const vec3 k = vec3(0.57735);
    float c = cos(a);
    return col * c + cross(k, col) * sin(a) + k * dot(k, col) * (1.0 - c);
  }

  // post-process applied to every shader's output via the wrapper main()
  vec3 applyAdjust(vec3 col) {
    col = hueRotate(col, uHue);
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(l), col, uSaturation);  // saturation
    col = (col - 0.5) * uContrast + 0.5;   // contrast around mid-grey
    col *= uBrightness;                    // brightness
    return clamp(col, 0.0, 1.0);
  }
`;

const ShaderCanvas = ({
  fragmentShader,
  className,
  dpr = 2,
  controls = false,
}: {
  fragmentShader: string;
  className?: string;
  /** Max pixel ratio. Use a lower value for small thumbnails. */
  dpr?: number;
  /** Show the lil-gui customization panel (speed/zoom/color). */
  controls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2() },
      mouse: { value: new THREE.Vector2(0.5, 0.5) },
      uZoom: { value: 1 },
      uHue: { value: 0 },
      uSaturation: { value: 1 },
      uContrast: { value: 1 },
      uBrightness: { value: 1 },
    };
    // Time speed lives in JS (it scales how fast `time` advances), not GLSL.
    const params = { speed: 1 };

    // Rename the shader's main() and redirect its gl_FragColor writes into the
    // scratch `fragColor`, so the wrapper can post-process the result.
    const userSrc = fragmentShader
      .replace(/\bvoid\s+main\b/, "void userMain")
      .replace(/\bgl_FragColor\b/g, "fragColor");

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: `${COMMON_GLSL}\n${userSrc}\n${WRAPPER_MAIN}`,
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
    // Allow the GPU to restore a transiently-lost context instead of going black.
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    // Track the cursor in 0..1 UV space (y flipped to match gl_FragCoord).
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      uniforms.mouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      );
    };
    const onPointerLeave = () => uniforms.mouse.value.set(0.5, 0.5);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    // Accumulate time scaled by speed so changing speed never jumps the clock.
    let shaderTime = 0;
    let last = performance.now();
    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      shaderTime += dt * params.speed;
      uniforms.time.value = shaderTime;
      renderer.render(scene, camera);
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

    // Animate only while on (or near) screen; render one frame on mount so a
    // tile is never blank before it scrolls into view.
    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "150px", threshold: 0 },
    );
    intersectionObserver.observe(container);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      render();
    };
    animate();

    // Live customization panel (full-screen preview only).
    let gui: GUI | null = null;
    if (controls) {
      gui = new GUI();
      gui.domElement.style.zIndex = "10000"; // above the z-[9999] modal
      gui.add(params, "speed", 0, 3, 0.01).name("speed");
      gui.add(uniforms.uZoom, "value", 0.2, 3, 0.01).name("zoom");
      gui.add(uniforms.uHue, "value", -Math.PI, Math.PI, 0.01).name("hue");
      gui.add(uniforms.uSaturation, "value", 0, 2, 0.01).name("saturation");
      gui.add(uniforms.uContrast, "value", 0, 2, 0.01).name("contrast");
      gui.add(uniforms.uBrightness, "value", 0, 2, 0.01).name("brightness");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [fragmentShader, dpr, controls]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ overflow: "hidden" }}
    />
  );
};

export default ShaderCanvas;
