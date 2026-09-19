/**
 * Stacked pulse lines that rise into a ridge across the middle and occlude the lines behind them, breathing slowly.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface RidgeLinesBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Line colour. */
  color?: string;
  background?: string;
  /** How many lines stack down the frame. */
  lines?: number;
  /** Peak height of the ridge, as a fraction of the frame's height. */
  amplitude?: number;
  /** Line thickness in px. */
  lineWidth?: number;
  speed?: number;
  paused?: boolean;
}

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Smooth 2D value noise; the second axis is used for time. */
const noise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};

export default function RidgeLinesBackground({
  children, className = "", style, color = "#e8e6e1", background = "#101010",
  lines = 26, amplitude = 0.42, lineWidth = 1.2, speed = 1, paused = false,
}: RidgeLinesBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const count = Math.round(positive(lines, 26, 2));
    const peak = Number.isFinite(amplitude) ? Math.max(0, Math.min(1, amplitude)) : 0.42;
    const stroke = positive(lineWidth, 1.2, 0.25);
    const rate = positive(speed, 1, 0);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let frameNumber = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = stroke;
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.fillStyle = background;
      const top = height * 0.14;
      const bottom = height * 0.92;
      const step = (bottom - top) / (count - 1);
      const columns = Math.max(24, Math.round(width / 5));
      const inset = width * 0.12;
      // Back to front, each line filling beneath itself so nearer ridges hide
      // the ones behind — the whole effect lives in that occlusion.
      for (let i = 0; i < count; i++) {
        const y = top + i * step;
        ctx.beginPath();
        for (let c = 0; c <= columns; c++) {
          const t = c / columns;
          const x = inset + (width - inset * 2) * t;
          // A bell across the middle keeps the edges flat, like the classic plot.
          const bell = Math.exp(-Math.pow((t - 0.5) / 0.19, 2));
          const n =
            noise(t * 9 + i * 0.7, elapsed * 0.35 + i * 0.13) * 0.6 +
            noise(t * 23 + i * 1.3, elapsed * 0.5 + i * 0.29) * 0.28 +
            noise(t * 61 + i * 2.1, elapsed * 0.8 + i * 0.41) * 0.12;
          const lift = bell * n * peak * height + noise(t * 4 + i, elapsed * 0.2) * 3;
          const py = y - lift;
          if (c === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.lineTo(width - inset, height + 4);
        ctx.lineTo(inset, height + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      if (++frameNumber % 2 === 0) draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) elapsed = 0;
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
    };
  }, [color, background, lines, amplitude, lineWidth, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
