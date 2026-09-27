/**
 * A field of diagonal arrows where a red letter spells out a word one character at a time, each change sweeping across in the arrows' own direction.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface ArrowLetterBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Word to cycle through, one character at a time (A–Z, 0–9). */
  text?: string;
  /** Colour of the plain arrows. */
  color?: string;
  /** Colour of the arrows that form the letter. */
  accentColor?: string;
  backgroundColor?: string;
  /** Grid cell size in px. */
  size?: number;
  speed?: number;
  paused?: boolean;
}

// 5×7 pixel font: seven rows per character, each row five bits as two hex digits.
const FONT: Record<string, string> = {
  A: "0e11111f111111", B: "1e11111e11111e", C: "0e11101010110e", D: "1e11111111111e", E: "1f10101e10101f",
  F: "1f10101e101010", G: "0e11101711110f", H: "1111111f111111", I: "0e04040404040e", J: "0702020202120c",
  K: "11121418141211", L: "1010101010101f", M: "111b1515111111", N: "11111915131111", O: "0e11111111110e",
  P: "1e11111e101010", Q: "0e11111115120d", R: "1e11111e141211", S: "0f10100e01011e", T: "1f040404040404",
  U: "1111111111110e", V: "11111111110a04", W: "1111111515150a", X: "11110a040a1111", Y: "11110a04040404",
  Z: "1f01020408101f", 0: "0e11131519110e", 1: "040c040404040e", 2: "0e11010204081f", 3: "1f02040201110e",
  4: "02060a121f0202", 5: "1f101e0101110e", 6: "0608101e11110e", 7: "1f010204080808", 8: "0e11110e11110e",
  9: "0e11110f01020c",
};

const glyphPixel = (character: string, x: number, y: number) => {
  const rows = FONT[character];
  if (!rows || x < 0 || x > 4 || y < 0 || y > 6) return false;
  return ((parseInt(rows.slice(y * 2, y * 2 + 2), 16) >> (4 - x)) & 1) === 1;
};

/** Moves angle `a` toward angle `b` by `w`, the short way round. */
const blendAngle = (a: number, b: number, w: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * w;

export default function ArrowLetterBackground({
  children, className = "", style, text = "PIXEL", color = "#ffffff", accentColor = "#e3171e",
  backgroundColor = "#231f20", size = 22, speed = 1, paused = false,
}: ArrowLetterBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const cell = Number.isFinite(size) ? Math.max(10, size) : 22;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const characters = [...text.toUpperCase()].filter((c) => FONT[c]);
    if (!characters.length) characters.push("R");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const hold = 2.4;
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    // Per cell: 0 = plain, 1 = accent, eased; and when its current switch started.
    let mix = new Float32Array(0);
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    const pointer = { x: 0, y: 0, strength: 0, target: 0 };

    // Letter placement: each font pixel covers about scale × scale arrows, centred.
    // A fractional scale keeps the letter bold at any frame height.
    const layout = () => {
      const scale = Math.max(1, (rows * 0.74) / 7);
      return { scale, left: Math.round((columns - 5 * scale) / 2), top: Math.round((rows - 7 * scale) / 2) };
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      pointer.strength += (pointer.target - pointer.strength) * 0.08;
      const t = elapsed;
      const index = Math.floor(t / hold);
      const character = characters[index % characters.length];
      // Time since this letter began; the sweep runs diagonally, top-left first.
      const since = t - index * hold;
      const { scale, left, top } = layout();
      const reach = Math.min(width, height) * 0.18;
      const plain = new Path2D();
      const accent = new Path2D();
      const a = cell * 0.3;
      const head = cell * 0.22;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const k = j * columns + i;
          const on = glyphPixel(character, Math.floor((i - left) / scale), Math.floor((j - top) / scale)) ? 1 : 0;
          const started = reducedMotion.matches || since > (i + j) * 0.022;
          if (started) mix[k] = reducedMotion.matches ? on : mix[k] + (on - mix[k]) * 0.2;
          const m = mix[k];
          const x = (i + 0.5) * cell;
          const y = (j + 0.5) * cell;
          let angle = Math.PI / 4;
          if (pointer.strength > 0.001) {
            const dx = pointer.x - x;
            const dy = pointer.y - y;
            angle = blendAngle(angle, Math.atan2(dy, dx), 0.9 * pointer.strength * Math.exp(-(dx * dx + dy * dy) / (reach * reach)));
          }
          // Squash mid-switch, so the colour change reads as a flip.
          const s = 1 - 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, m)));
          const cos = Math.cos(angle) * s;
          const sin = Math.sin(angle) * s;
          const tipX = x + cos * a * Math.SQRT2;
          const tipY = y + sin * a * Math.SQRT2;
          const path = m > 0.5 ? accent : plain;
          path.moveTo(x - cos * a * Math.SQRT2, y - sin * a * Math.SQRT2);
          path.lineTo(tipX, tipY);
          // Arrowhead: two strokes back from the tip at ±45°.
          const back = angle + Math.PI;
          path.moveTo(tipX + Math.cos(back - Math.PI / 4) * head * s, tipY + Math.sin(back - Math.PI / 4) * head * s);
          path.lineTo(tipX, tipY);
          path.lineTo(tipX + Math.cos(back + Math.PI / 4) * head * s, tipY + Math.sin(back + Math.PI / 4) * head * s);
        }
      }
      ctx.lineWidth = Math.max(1.5, cell * 0.12);
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";
      ctx.strokeStyle = color;
      ctx.stroke(plain);
      ctx.strokeStyle = accentColor;
      ctx.stroke(accent);
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
      if (reducedMotion.matches) {
        elapsed = 0;
        pointer.target = pointer.strength = 0;
      }
      draw();
      if (!paused && rate > 0 && visible && !document.hidden && !reducedMotion.matches) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);
      mix = new Float32Array(columns * rows);
      // Start with the current letter already in place.
      const { scale, left, top } = layout();
      const character = characters[Math.floor(elapsed / hold) % characters.length];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          mix[j * columns + i] = glyphPixel(character, Math.floor((i - left) / scale), Math.floor((j - top) / scale)) ? 1 : 0;
        }
      }
      draw();
    };
    const move = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      const rect = host.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.target = 1;
    };
    const leave = () => {
      pointer.target = 0;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    intersection.observe(host);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [text, color, accentColor, size, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
