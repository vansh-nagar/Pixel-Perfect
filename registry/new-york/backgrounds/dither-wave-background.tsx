/**
 * Slowly drifting blue-and-paper Bayer bands with a gently pointer-warped halftone texture.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";

export interface DitherWaveBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  color?: string;
  paperColor?: string;
  pixelSize?: number;
  density?: number;
  speed?: number;
  interactive?: boolean;
}

const VERTEX = `attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAGMENT = `
precision mediump float;
uniform vec2 uSize;      
uniform float uCell;     
uniform float uTime;     
uniform vec3 uInkA;      
uniform vec3 uInkB;      
uniform vec4 uCalm;      
uniform vec3 uMouse;     
uniform float uBias;     

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 cellCoord = floor(gl_FragCoord.xy / uCell);
  vec2 uv = (cellCoord * uCell) / uSize;
  float aspect = uSize.x / uSize.y;

  
  vec2 p = vec2(uv.x * aspect, uv.y);

  
  
  if (uMouse.z > 0.001) {
    vec2 dm = p - vec2(uMouse.x * aspect, uMouse.y);
    p += dm * exp(-dot(dm, dm) * 10.0) * 0.22 * uMouse.z;
  }
  
  
  
  float v = uBias
    + 0.20 * sin(dot(p, normalize(vec2(0.55, 1.0))) * 5.2 - uTime * 0.11)
    + 0.12 * sin(dot(p, normalize(vec2(1.0, 0.28))) * 8.4 + uTime * 0.07);

  
  
  
  
  
  
  
  
  if (uCalm.z > 0.0) {
    vec2 d = vec2((uv.x - uCalm.x) / uCalm.z, (uv.y - uCalm.y) / uCalm.w);
    v += 2.0 * (1.0 - smoothstep(0.75, 1.0, length(d)));
  }

  float threshold = bayer8(cellCoord);
  vec3 ink = v > threshold ? uInkA : uInkB;
  gl_FragColor = vec4(ink, 1.0);
}
`;

export default function DitherWaveBackground({
  children, className = "", style, color = "#1f2de6", paperColor = "#eef0f3",
  pixelSize = 2.5, density = 0.74, speed = 1, interactive = true,
}: DitherWaveBackgroundProps) {
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
    const cellUniform = uniform("uCell");
    const timeUniform = uniform("uTime");
    const mouseUniform = uniform("uMouse");
    const rgb = (value: string, fallback: string) => {
      const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
      return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    };
    gl.uniform3fv(uniform("uInkA"), rgb(color, "#1f2de6"));
    gl.uniform3fv(uniform("uInkB"), rgb(paperColor, "#eef0f3"));
    gl.uniform4f(uniform("uCalm"), 0, 0, 0, 0);
    gl.uniform1f(uniform("uBias"), Number.isFinite(density) ? Math.max(0, Math.min(1, density)) : 0.74);
    const cellSize = Number.isFinite(pixelSize) ? Math.max(1, pixelSize) : 2.5;
    const timeScale = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    const mouse = { x: 0.5, y: 0.5, strength: 0 };
    let elapsed = 0;
    let visible = false;
    let running = false;
    let inside = false;
    const draw = () => {
      gl.uniform1f(timeUniform, elapsed);
      gl.uniform3f(mouseUniform, mouse.x, mouse.y, mouse.strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (_time: number, delta: number) => { elapsed += delta / 1000 * timeScale; draw(); };
    const setRunning = () => {
      const next = visible && !document.hidden && !motion.matches;
      if (next === running) return;
      running = next;
      if (running) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    };
    const xTo = gsap.quickTo(mouse, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(mouse, "y", { duration: 0.5, ease: "power3.out" });
    const move = (event: PointerEvent) => {
      if (!interactive || motion.matches || !pointer.matches || event.pointerType === "touch") return;
      const rect = host.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      const nextInside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (nextInside !== inside) {
        inside = nextInside;
        gsap.to(mouse, { strength: inside ? 1 : 0, duration: inside ? 0.4 : 0.6, ease: "power2.out", overwrite: "auto" });
      }
      if (inside) { xTo(x); yTo(y); }
    };
    const resetPointer = () => {
      gsap.killTweensOf(mouse);
      mouse.strength = 0;
      inside = false;
      draw();
      setRunning();
    };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(host.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(host.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(sizeUniform, canvas.width, canvas.height);
      gl.uniform1f(cellUniform, cellSize * dpr);
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; setRunning(); });
    intersection.observe(host);
    const reveal = gsap.fromTo(canvas, { opacity: motion.matches ? 1 : 0 }, { opacity: 1, duration: motion.matches ? 0 : 0.9, ease: "power2.out" });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("visibilitychange", resetPointer);
    motion.addEventListener("change", resetPointer);
    pointer.addEventListener("change", resetPointer);
    return () => {
      gsap.ticker.remove(tick);
      reveal.kill();
      xTo.tween.kill();
      yTo.tween.kill();
      gsap.killTweensOf(mouse);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("visibilitychange", resetPointer);
      motion.removeEventListener("change", resetPointer);
      pointer.removeEventListener("change", resetPointer);
      gl.deleteBuffer(buffer);
      dispose();
    };
  }, [color, paperColor, pixelSize, density, speed, interactive]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: color, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
