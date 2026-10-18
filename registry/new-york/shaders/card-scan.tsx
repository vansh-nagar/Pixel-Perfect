"use client";

/**
 * Hover it and it turns holographic: thin-film foil that shifts as you move, light rippling out from the cursor, and a soft flash as you leave.
 */

import { animate, useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";

/*
 * A card being read by a phone, drawn as light on black:
 *
 *   foil     thin-film colour that shifts with the tilt (the pointer's x) and drifts, caught in
 *            a broad sheet of light that slides across
 *   ripples  light ripples out from the pointer
 *   rim      the top edge catches the light as it tips
 *   flash    as the pointer leaves (the beep), one soft cold flash, then it all fades
 *
 * In over 300ms as the pointer arrives (ease-out quint); out over 450ms as it leaves (ease-in-out
 * cubic). Nothing animates while the pointer is away: the loop sleeps on a black frame.
 * To light a surface instead, lay this over it with `mix-blend-mode: screen` (black leaves it
 * untouched).
 */

const VERTEX = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uAspect; // width / height
  uniform float uScan;   // 0..1, the read's envelope
  uniform float uT;      // seconds since the read began
  uniform float uTilt;   // 0..1, how far it's tipped
  uniform float uFlash;  // 0..1, the beep
  uniform vec2 uOrigin;  // where the ripples start, uv (y up)

  varying vec2 vUv;

  float sq(float x) { return x * x; }
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
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
    return v;
  }
  // thin-film colour: a smooth walk round the hue wheel
  vec3 film(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }

  void main() {
    vec2 uv = vUv; // y up
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float n = fbm(p * 2.2 + vec2(uT * 0.15, 0.0));

    // --- foil: colour by angle, caught in a sliding sheet of light ----------------------
    vec3 holo = film(dot(uv, vec2(0.8, 0.55)) * 1.4 + n * 0.9 + uTilt * 1.2 + uT * 0.18);
    float along = dot(uv, normalize(vec2(1.0, 0.6)));
    float sheetAt = mix(-0.3, 1.5, fract(uTilt * 0.45 + uT * 0.32));
    float sheet = exp(-sq(along - sheetAt) * 10.0);
    float foil = (0.06 + 0.94 * sheet) * (0.55 + 0.45 * n);

    // --- ripples from the pointer ---------------------------------------------------------
    vec2 q = p - vec2(uOrigin.x * uAspect, uOrigin.y);
    float r = length(q) + (fbm(p * 6.0) - 0.5) * 0.05;
    float ripple = 0.0;
    for (int k = 0; k < 3; k++) {
      float front = fract(uT * 0.75 + float(k) / 3.0) * 1.9;
      float w = 0.01 + front * 0.018;
      ripple += (1.0 - smoothstep(0.0, w, abs(r - front))) * (1.0 - front / 1.9);
    }

    // --- the top edge catches the light as it tips --------------------------------------
    float rim = exp(-(1.0 - uv.y) * 38.0) * uTilt * 0.6;

    vec3 col = holo * foil * 0.55
             + vec3(0.75, 0.92, 1.0) * ripple * 0.65
             + vec3(rim);
    col *= uScan;
    col += vec3(0.9, 0.97, 1.0) * uFlash * 0.38 * (0.6 + 0.4 * n);
    gl_FragColor = vec4(min(col, 1.0), 1.0);
  }
`;

const IN = { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const };
const OUT = { duration: 0.45, ease: [0.645, 0.045, 0.355, 1] as const };
const FLASH = { duration: 0.45, times: [0, 0.2, 1], ease: [0.23, 1, 0.32, 1] as const };

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
  return shader;
}

export default function CardScan({
  className,
  dpr = 2,
}: {
  className?: string;
  dpr?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scan = useMotionValue(0);
  const flash = useMotionValue(0);

  useEffect(() => {
    const container = containerRef.current!;
    // A fresh canvas per effect run, so cleanup can drop its context without the next run
    // (StrictMode's remount) getting the lost one back.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    container.appendChild(canvas);
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return () => canvas.remove();
    const program = gl.createProgram()!;
    try {
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
    } catch {
      return () => canvas.remove();
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const [uAspect, uScan, uT, uTilt, uFlash, uOrigin] = [
      u("uAspect"),
      u("uScan"),
      u("uT"),
      u("uTilt"),
      u("uFlash"),
      u("uOrigin"),
    ];

    const pointer = { x: 0.5, y: 0.5, startedAt: 0 };
    let raf = 0;
    const frame = () => {
      raf = 0;
      if (!canvas.width) return;
      gl.uniform1f(uScan, scan.get());
      gl.uniform1f(uFlash, flash.get());
      gl.uniform1f(uTilt, pointer.x);
      gl.uniform2f(uOrigin, pointer.x, pointer.y);
      gl.uniform1f(uT, (performance.now() - pointer.startedAt) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (scan.get() > 0.001 || flash.get() > 0.001) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const scale = Math.min(dpr, window.devicePixelRatio || 1);
      canvas.width = Math.round(container.clientWidth * scale);
      canvas.height = Math.round(container.clientHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uAspect, canvas.width / (canvas.height || 1));
      wake();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let fades: { stop: () => void }[] = [];
    const track = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      pointer.y = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
    };
    const onEnter = (e: PointerEvent) => {
      track(e);
      pointer.startedAt = performance.now();
      fades.forEach((fade) => fade.stop());
      fades = [animate(scan, 1, IN)];
    };
    const onLeave = () => {
      fades.forEach((fade) => fade.stop());
      fades = [animate(scan, 0, OUT), animate(flash, [0, 1, 0], FLASH)];
    };
    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointermove", track);
    container.addEventListener("pointerleave", onLeave);
    const stops = [scan.on("change", wake), flash.on("change", wake)];

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      fades.forEach((fade) => fade.stop());
      stops.forEach((stop) => stop());
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointermove", track);
      container.removeEventListener("pointerleave", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [dpr, scan, flash]);

  return <div ref={containerRef} aria-hidden className={className} />;
}
