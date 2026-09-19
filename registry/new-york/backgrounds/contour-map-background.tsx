/**
 * Animated topographic contour lines over a slowly morphing landscape, with a bolder index line every fifth level.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface ContourMapBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Line colour. */
  color?: string;
  background?: string;
  /** How many contour levels span the landscape. */
  levels?: number;
  /** Line thickness in px. */
  lineWidth?: number;
  speed?: number;
}

const VERTEX = `attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uSize;
uniform float uTime;
uniform float uLevels;
uniform float uWidth;
uniform vec3 uInk;
uniform vec3 uPaper;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y);
}

// Three octaves; the landscape morphs by sliding each octave a different way.
float landscape(vec2 p, float t) {
  float v = 0.0;
  v += 0.55 * noise(p * 1.4 + vec2(t * 0.05, -t * 0.03));
  v += 0.30 * noise(p * 3.1 + vec2(-t * 0.04, t * 0.06) + 7.0);
  v += 0.15 * noise(p * 6.5 + vec2(t * 0.08, t * 0.02) + 19.0);
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  vec2 p = vec2(uv.x * uSize.x / uSize.y, uv.y);
  float h = landscape(p, uTime) * uLevels;
  // Distance to the nearest whole level, in levels. The field's gradient
  // converts a pixel width into level units, so lines stay the same width on
  // steep slopes and on flats.
  float grad = length(vec2(dFdx(h), dFdy(h))) + 1e-5;
  float f = fract(h);
  float d = min(f, 1.0 - f);
  // ("half" is reserved in GLSL ES, hence the longer name.)
  float halfWidth = uWidth * grad;
  float aa = grad;
  float line = 1.0 - smoothstep(halfWidth, halfWidth + aa, d);
  float thick = 1.0 - smoothstep(halfWidth * 2.2, halfWidth * 2.2 + aa, d);
  // Every fifth contour is an index line: thicker and fully opaque.
  float level = floor(h + 0.5);
  float isIndex = 1.0 - step(0.2, fract(level / 5.0));
  float ink = max(line * 0.55, thick * isIndex);
  gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}
`;

export default function ContourMapBackground({
  children, className = "", style, color = "#c9d1c4", background = "#0f1412",
  levels = 14, lineWidth = 1, speed = 1,
}: ContourMapBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;
    // dFdx/dFdy need this extension on WebGL1; without it the lines can't be
    // made resolution-independent, so bail to the plain background.
    if (!gl.getExtension("OES_standard_derivatives")) return;
    const program = gl.createProgram();
    if (!program) return;
    const shaders: WebGLShader[] = [];
    const dispose = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
    };
    const sources = [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, `#extension GL_OES_standard_derivatives : enable\n${FRAGMENT}`]] as const;
    for (const [type, source] of sources) {
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
    gl.uniform3fv(uniform("uInk"), rgb(color, "#c9d1c4"));
    gl.uniform3fv(uniform("uPaper"), rgb(background, "#0f1412"));
    gl.uniform1f(uniform("uLevels"), Number.isFinite(levels) ? Math.max(2, levels) : 14);
    const widthUniform = uniform("uWidth");
    const px = Number.isFinite(lineWidth) ? Math.max(0.25, lineWidth) : 1;
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
      gl.uniform1f(widthUniform, px * dpr * 0.5);
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
  }, [color, background, levels, lineWidth, speed]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
