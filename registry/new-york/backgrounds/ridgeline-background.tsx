/**
 * Stacked pulse lines that rise into restless peaks, each one hiding the lines behind it — the classic ridgeline plot, set in motion.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface RidgelineBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Line colour. */
  color?: string;
  backgroundColor?: string;
  /** Number of stacked lines. */
  lines?: number;
  speed?: number;
  paused?: boolean;
}

/** Deterministic per-line seed in [0, 1). */
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export default function RidgelineBackground({
  children, className = "", style, color = "#f4f1ea", backgroundColor = "#0b0b0b",
  lines = 34, speed = 1, paused = false,
}: RidgelineBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const count = Number.isFinite(lines) ? Math.max(4, Math.round(lines)) : 34;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const seeds = Array.from({ length: count }, (_, i) => [hash(i + 1) * 6.28, hash(i + 51) * 6.28, hash(i + 97) * 6.28]);
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = elapsed;
      const top = height * 0.16;
      const bottom = height * 0.9;
      const step = (bottom - top) / (count - 1);
      const amplitude = step * 7;
      const left = width * 0.1;
      const right = width * 0.9;
      const span = right - left;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.fillStyle = backgroundColor;
      // Back to front: each line's fill hides whatever sits behind its peaks.
      for (let i = 0; i < count; i++) {
        const base = top + i * step;
        const [a, b, c] = seeds[i];
        const curve = new Path2D();
        curve.moveTo(0, base);
        curve.lineTo(left, base);
        for (let x = left; x <= right; x += 3) {
          const u = (x - left) / span;
          // Peaks gather in the middle and flatten toward the edges.
          const envelope = Math.exp(-(((u - 0.5) / 0.17) ** 2));
          const n = 0.5 * Math.sin(u * 13 + a + t * 0.9) + 0.3 * Math.sin(u * 29 + b - t * 1.3) + 0.2 * Math.sin(u * 61 + c + t * 2.1);
          const peak = Math.pow(n * 0.5 + 0.5, 3);
          const grain = 0.03 * Math.sin(u * 180 + a * 7 + t * 3);
          curve.lineTo(x, base - amplitude * (envelope * peak + grain * (0.3 + envelope)));
        }
        curve.lineTo(right, base);
        curve.lineTo(width, base);
        const shape = new Path2D(curve);
        shape.lineTo(width, height);
        shape.lineTo(0, height);
        shape.closePath();
        ctx.fill(shape);
        ctx.stroke(curve);
      }
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
  }, [color, backgroundColor, lines, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
