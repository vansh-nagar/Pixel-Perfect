/**
 * A pale blue Bayer-dithered cursor trail with a softly tapered tail that fades at rest.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface DitherCursorTrailProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Six-digit hex color. */
  color?: string;
  opacity?: number;
  /** Size of each square in CSS pixels. */
  pixelSize?: number;
  /** Radius relative to the container height; Vessa uses 0.045. */
  radius?: number;
}

const POINTS = 24;
const VERTEX = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 cells;
uniform float aspect;
uniform vec3 ink;
uniform float opacity;
uniform vec4 points[24];
float bayer2(vec2 p) { p = floor(p); return fract(p.x / 2.0 + p.y * p.y * 0.75); }
float bayer4(vec2 p) { return bayer2(0.5 * p) * 0.25 + bayer2(p); }
float bayer8(vec2 p) { return bayer4(0.5 * p) * 0.25 + bayer2(p); }
void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 uv = (cell + 0.5) / cells;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float density = 0.0;
  for (int i = 0; i < 23; i++) {
    vec4 a = points[i];
    vec4 b = points[i + 1];
    vec2 segment = b.xy - a.xy;
    float t = clamp(dot(p - a.xy, segment) / max(dot(segment, segment), 1e-6), 0.0, 1.0);
    float distance = length(p - a.xy - segment * t);
    float radius = mix(a.z, b.z, t);
    density = max(density, mix(a.w, b.w, t) * exp(-distance * distance / max(radius * radius, 1e-6)));
  }
  float alpha = step(bayer8(cell), density) * step(0.002, density) * opacity;
  gl_FragColor = vec4(ink * alpha, alpha);
}`;

export default function DitherCursorTrail({
  children,
  className = "",
  style,
  color = "#1f2de6",
  opacity = 0.1,
  pixelSize = 3,
  radius = 0.045,
}: DitherCursorTrailProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) return;
    const program = gl.createProgram();
    if (!program) return;
    const shaders: WebGLShader[] = [];
    const dispose = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
    };
    for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]] as const) {
      const shader = gl.createShader(type);
      if (!shader) { dispose(); return; }
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { dispose(); return; }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      cells: gl.getUniformLocation(program, "cells"),
      aspect: gl.getUniformLocation(program, "aspect"),
      points: gl.getUniformLocation(program, "points[0]"),
    };
    const hex = /^#[0-9a-f]{6}$/i.test(color) ? color : "#1f2de6";
    gl.uniform3fv(gl.getUniformLocation(program, "ink"), [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));
    gl.uniform1f(gl.getUniformLocation(program, "opacity"), Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 0.1);
    const cellSize = Number.isFinite(pixelSize) ? Math.max(1, pixelSize) : 3;
    const trailRadius = Number.isFinite(radius) ? Math.max(0.001, Math.min(1, radius)) : 0.045;
    const maxGap = trailRadius * 2 / (POINTS - 1);
    const chain = Array.from({ length: POINTS }, () => ({ x: 0, y: 0 }));
    const packed = new Float32Array(POINTS * 4);
    const target = { x: 0, y: 0 };
    let aspect = 1;
    let frame = 0;
    let previous = 0;
    let lastMove = -Infinity;
    let strength = 0;
    let initialized = false;

    const draw = () => {
      chain.forEach((point, i) => {
        const taper = i / (POINTS - 1);
        packed.set([point.x, point.y, trailRadius * (1 - 0.22 * taper), 0.75 * (1 - 0.7 * taper) * strength], i * 4);
      });
      gl.uniform4fv(uniforms.points, packed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      strength = 0;
      initialized = false;
      lastMove = -Infinity;
      draw();
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(Math.max((now - previous) / 1000, 0.001), 0.05);
      previous = now;
      const active = now - lastMove < 60 ? 1 : 0;
      strength += (active - strength) * (1 - Math.pow(0.88, dt * 60));
      if (!active && strength < 0.002) { stop(); return; }
      const ease = 1 - Math.pow(0.7, dt * 60);
      chain.forEach((point, i) => {
        const leader = i === 0 ? target : chain[i - 1];
        point.x += (leader.x - point.x) * ease;
        point.y += (leader.y - point.y) * ease;
        if (i === 0) return;
        const dx = point.x - leader.x;
        const dy = point.y - leader.y;
        const distance = Math.hypot(dx, dy);
        if (distance > maxGap) {
          point.x = leader.x + dx / distance * maxGap;
          point.y = leader.y + dy / distance * maxGap;
        }
      });
      draw();
      frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      canvas.width = Math.ceil(width / cellSize);
      canvas.height = Math.ceil(height / cellSize);
      canvas.style.width = `${canvas.width * cellSize}px`;
      canvas.style.height = `${canvas.height * cellSize}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.cells, canvas.width, canvas.height);
      aspect = width / height;
      gl.uniform1f(uniforms.aspect, aspect);
      stop();
    };
    const move = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches || event.pointerType === "touch" || document.hidden) return;
      // Window listening also works through showcase controls layered over this surface.
      const rect = host.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) { lastMove = -Infinity; return; }
      target.x = x / rect.width * aspect;
      target.y = 1 - y / rect.height;
      lastMove = performance.now();
      if (!initialized) {
        chain.forEach((point) => Object.assign(point, target));
        initialized = true;
      }
      if (!frame) { previous = lastMove; frame = requestAnimationFrame(tick); }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    motion.addEventListener("change", stop);
    pointer.addEventListener("change", stop);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
      motion.removeEventListener("change", stop);
      pointer.removeEventListener("change", stop);
      gl.deleteBuffer(buffer);
      dispose();
    };
  }, [color, opacity, pixelSize, radius]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={style}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0" style={{ imageRendering: "pixelated" }} />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
