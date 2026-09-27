/**
 * A dark grid where drifting clusters grow from dots into circles and bloom into four-point sparkles at their hearts; one cluster follows the pointer.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface SparkleGridBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Glyph colour. */
  color?: string;
  backgroundColor?: string;
  /** Grid cell size in px. */
  size?: number;
  speed?: number;
  paused?: boolean;
}

const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

/** Smooth value noise in [0, 1]. */
const noise = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

export default function SparkleGridBackground({
  children, className = "", style, color = "#f4f4f5", backgroundColor = "#0e0f11",
  size = 30, speed = 1, paused = false,
}: SparkleGridBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const cell = Number.isFinite(size) ? Math.max(12, size) : 30;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    // Each cell's eased intensity, so glyphs grow and shrink instead of popping.
    let shown = new Float32Array(0);
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    const pointer = { x: 0, y: 0, strength: 0, target: 0 };

    const draw = (instant = false) => {
      ctx.clearRect(0, 0, width, height);
      pointer.strength += (pointer.target - pointer.strength) * 0.08;
      const t = elapsed;
      const originX = (width - columns * cell) / 2;
      const originY = (height - rows * cell) / 2;
      const lens = cell * 1.9;

      // Hairline grid underneath.
      const grid = new Path2D();
      for (let i = 0; i <= columns; i++) {
        grid.moveTo(originX + i * cell, 0);
        grid.lineTo(originX + i * cell, height);
      }
      for (let j = 0; j <= rows; j++) {
        grid.moveTo(0, originY + j * cell);
        grid.lineTo(width, originY + j * cell);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.07;
      ctx.lineWidth = 1;
      ctx.stroke(grid);
      ctx.globalAlpha = 1;

      const dots = new Path2D();
      const sparkles = new Path2D();
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const k = j * columns + i;
          const x = originX + (i + 0.5) * cell;
          const y = originY + (j + 0.5) * cell;
          // Clusters: noise peaks sharpened so most of the grid stays empty.
          const n = noise(i * 0.24 + t * 0.12, j * 0.24 - t * 0.08) * 0.7 + noise(i * 0.55 - t * 0.14, j * 0.55 + 9) * 0.3;
          let goal = Math.max(0, (n - 0.6) / 0.21);
          if (pointer.strength > 0.001) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            goal += 1.1 * pointer.strength * Math.exp(-(dx * dx + dy * dy) / (lens * lens));
          }
          goal = Math.min(1, goal);
          shown[k] = instant ? goal : shown[k] + (goal - shown[k]) * 0.1;
          const s = shown[k];
          if (s < 0.08) continue;
          if (s < 0.72) {
            // Dot growing into a full circle.
            const r = cell * (0.04 + 0.2 * (s / 0.72));
            dots.moveTo(x + r, y);
            dots.arc(x, y, r, 0, Math.PI * 2);
          } else {
            // Four-point sparkle: curves pinched toward the centre, tips reaching the cell edges.
            const r = cell * (0.3 + 0.12 * ((s - 0.72) / 0.28));
            sparkles.moveTo(x, y - r);
            sparkles.quadraticCurveTo(x, y, x + r, y);
            sparkles.quadraticCurveTo(x, y, x, y + r);
            sparkles.quadraticCurveTo(x, y, x - r, y);
            sparkles.quadraticCurveTo(x, y, x, y - r);
          }
        }
      }
      ctx.fillStyle = color;
      ctx.fill(dots);
      ctx.fill(sparkles);
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
      draw(reducedMotion.matches);
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
      columns = Math.ceil(width / cell) + 1;
      rows = Math.ceil(height / cell) + 1;
      shown = new Float32Array(columns * rows);
      draw(true);
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
  }, [color, size, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
