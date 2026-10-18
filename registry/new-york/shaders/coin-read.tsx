"use client";

/**
 * Glowing coins slide in under the left edge, and each one sends a wave of light and holographic foil across.
 */

import { useEffect, useRef } from "react";

/*
 * A card reading coins as they go in through its left edge, drawn as light on black. Two rows of
 * coins, staggered. Per coin:
 *
 *   ghost    the coin seen going under, as through frosted glass: a soft glow that follows it
 *            in at its own speed, its leading edge catching the light, gone two radii deep
 *   rim      the edge lights up where it goes in
 *   wave     the moment it touches the edge, one wave of light runs out of that point and
 *            across: a bright front in a soft bloom, with an oil-film fringe trailing it
 *   wake     holographic foil (thin-film colour) lit behind the wave
 *   far end  the right edge catches the wave as it arrives
 *
 * Runs while on screen; with reduced motion it stays black. To light a surface instead, lay this
 * over it with `mix-blend-mode: screen` (black leaves it untouched).
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
  uniform float uT;      // seconds
  uniform vec2 uAge;     // seconds since each row's last coin centre crossed the left edge
  uniform vec2 uRowY;    // each row's centre line, uv (y up)
  uniform float uPeriod; // seconds between one row's coins
  uniform float uR;      // a coin's radius in heights, which is also how far it goes in per second
  uniform float uOn;     // 0..1

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

  // one coin going in: a = seconds since its centre crossed the edge (negative while it nears), on row y
  vec3 coin(vec2 uv, vec2 p, float a, float y, float n) {
    if (a < -1.0 || a > 2.2) return vec3(0.0);

    // --- ghost: a soft glow with its leading edge catching the light, dissolving as it
    //     goes deeper --------------------------------------------------------------------
    float under = smoothstep(-1.0, -0.2, a) * (1.0 - smoothstep(0.6, 1.8, a));
    vec2 gc = p - vec2(a * uR, y);
    float dc = length(gc);
    float lead = smoothstep(-0.2, 0.8, gc.x / (dc + 1e-4));
    float ghost = (1.0 - smoothstep(0.0, uR * 1.05, dc)) * 0.22;
    ghost += exp(-sq((dc - uR * 0.9) / (uR * 0.09))) * lead * 0.45;
    // --- rim: the edge lights up where it goes in ---------------------------------------
    float rim = exp(-p.x * 26.0) * exp(-sq((uv.y - y) / 0.16)) * 0.5;
    vec3 col = vec3(0.88, 1.0, 0.9) * (ghost + rim) * under;

    // --- the read: from the moment the coin touches the edge (a = -1, a radius out), one
    //     wave of light runs out of that point: a bright front in a soft bloom, an oil-film
    //     fringe trailing it, and the foil lit in its wake --------------------------------
    float rw = (a + 1.0) * 1.2;
    if (rw <= 0.0) return col;
    vec2 q = (p - vec2(0.0, y)) * vec2(0.85, 1.0);
    float d = length(q);
    // strongest straight ahead, fading toward the top and bottom: a push to the right
    float ahead = smoothstep(0.0, 0.75, q.x / (d + 1e-4));
    float life = smoothstep(0.0, 0.12, rw) * (1.0 - smoothstep(0.8, 1.9, rw)) * ahead;
    float x = d - rw; // < 0 behind the front
    float w = 0.006 + rw * 0.004;
    float front = exp(-sq(x / w)) * 0.75 + exp(-abs(x) / 0.05) * 0.16;
    vec3 fringe = film(x * 22.0 + a * 0.3 + n * 0.4) * exp(-sq((x + 0.03) / 0.022)) * 0.5;
    float wake = step(x, 0.0) * exp(x / 0.2);
    vec3 foil = mix(vec3(1.0), film(d * 2.4 - a * 0.6 + n * 0.5 + uv.y * 0.6), 0.65) * wake * 0.24;
    float far = exp(-(uAspect - p.x) * 28.0) * exp(-sq(x / 0.12)) * 0.45;
    return col + (vec3(0.92, 1.0, 0.94) * (front + far) + fringe + foil) * life;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float n = fbm(p * 2.2 + vec2(uT * 0.15, 0.0));

    // each row's coin going in and the one coming, screened together
    vec3 col = vec3(0.0);
    for (int row = 0; row < 2; row++) {
      float y = row == 0 ? uRowY.x : uRowY.y;
      float a = row == 0 ? uAge.x : uAge.y;
      for (int k = -1; k <= 0; k++) {
        vec3 c = min(coin(uv, p, a + float(k) * uPeriod, y, n), 1.0);
        col = 1.0 - (1.0 - col) * (1.0 - c);
      }
    }
    gl_FragColor = vec4(col * uOn, 1.0);
  }
`;

/** Each row's centre line (uv, y up) and when its coins cross the edge, as ms into a period */
const ROWS = [
  { y: 0.67, phase: 0 },
  { y: 0.35, phase: 1500 },
];
const PERIOD = 2500; // ms between one row's coins
const COIN_R = 0.145; // heights
/** In and out as it comes on and off screen (s, time constant) */
const FADE = 0.25;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
  return shader;
}

export default function CoinRead({
  className,
  dpr = 2,
}: {
  className?: string;
  dpr?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

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
    const [uAspect, uT, uAge, uOn] = [u("uAspect"), u("uT"), u("uAge"), u("uOn")];
    gl.uniform1f(u("uR"), COIN_R);
    gl.uniform1f(u("uPeriod"), PERIOD / 1000);
    gl.uniform2f(u("uRowY"), ROWS[0].y, ROWS[1].y);

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;
    let on = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!canvas.width) return;
      const target = visible && !reduce ? 1 : 0;
      on += (target - on) * (1 - Math.exp(-(last ? now - last : 0) / 1000 / FADE));
      last = now;
      const age = (phase: number) => ((((now - phase) % PERIOD) + PERIOD) % PERIOD) / 1000;
      gl.uniform1f(uT, (now / 1000) % 1000);
      gl.uniform2f(uAge, age(ROWS[0].phase), age(ROWS[1].phase));
      gl.uniform1f(uOn, on);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (target === 1 || on > 0.002) {
        raf = requestAnimationFrame(frame);
      } else {
        on = 0;
        last = 0;
      }
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

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [dpr]);

  return <div ref={containerRef} aria-hidden className={className} />;
}
