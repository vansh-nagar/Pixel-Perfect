/**
 * A demoscene warp tunnel: checkered rings rush out of a dark centre that drifts as if the camera can't hold still.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface WarpTunnelBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** First checker colour. */
  color?: string;
  /** Second checker colour. */
  secondColor?: string;
  background?: string;
  /** Rings visible down the tunnel. */
  rings?: number;
  /** Checkers around the tunnel. */
  segments?: number;
  speed?: number;
}

const VERTEX = `attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uSize;
uniform float uTime;
uniform float uRings;
uniform float uSegments;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uFog;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uSize) / uSize.y;
  // The centre wanders, which is what sells the sense of flying.
  uv += 0.09 * vec2(sin(uTime * 0.7), cos(uTime * 0.93));
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  // Depth falls off with 1/r: rings bunch up toward the centre.
  float depth = 0.32 / (r + 0.02);
  float ring = depth * uRings - uTime * 2.4;
  float seg = a / 6.28318 * uSegments + sin(uTime * 0.4) * 0.5;
  float checker = mod(floor(ring) + floor(seg), 2.0);
  vec3 col = mix(uColorA, uColorB, checker);
  // Bright seams on the ring edges read as light catching the tunnel walls.
  float fr = fract(ring);
  float seam = 1.0 - smoothstep(0.0, 0.08, min(fr, 1.0 - fr));
  col += seam * 0.35;
  // Sides dim toward the far centre and toward the edges of the frame.
  float fog = smoothstep(0.03, 0.42, r) * (1.0 - smoothstep(0.55, 1.0, r) * 0.6);
  gl_FragColor = vec4(mix(uFog, col, fog), 1.0);
}
`;

export default function WarpTunnelBackground({
  children, className = "", style, color = "#ff3d81", secondColor = "#2a1552", background = "#07030f",
  rings = 8, segments = 16, speed = 1,
}: WarpTunnelBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
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
    const position = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const sizeUniform = uniform("uSize");
    const timeUniform = uniform("uTime");
    const rgb = (value: string, fallback: string) => {
      const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
      return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    };
    gl.uniform3fv(uniform("uColorA"), rgb(color, "#ff3d81"));
    gl.uniform3fv(uniform("uColorB"), rgb(secondColor, "#2a1552"));
    gl.uniform3fv(uniform("uFog"), rgb(background, "#07030f"));
    gl.uniform1f(uniform("uRings"), Number.isFinite(rings) ? Math.max(1, rings) : 8);
    gl.uniform1f(uniform("uSegments"), Number.isFinite(segments) ? Math.max(2, Math.round(segments)) : 16);
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let elapsed = 0;
    let previous = 0;
    let frame = 0;
    let visible = false;

    const draw = () => {
      gl.uniform1f(timeUniform, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) elapsed = 0;
      draw();
      if (rate > 0 && visible && !document.hidden && !reducedMotion.matches) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(host.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(host.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(sizeUniform, canvas.width, canvas.height);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    intersection.observe(host);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      gl.deleteBuffer(buffer);
      dispose();
    };
  }, [color, secondColor, background, rings, segments, speed]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
