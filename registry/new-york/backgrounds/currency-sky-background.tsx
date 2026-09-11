/**
 * A dark flowing terrain of currency glyphs, with layered waves and bright contour bands.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface CurrencySkyBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  speed?: number;
  opacity?: number;
  cellWidth?: number;
  cellHeight?: number;
  fontSize?: number;
  fontFamily?: string;
  terrainScale?: number;
  contourSpacing?: number;
  paused?: boolean;
}

const GLYPHS = [
  { min: 15, char: "·", color: "#1a1918" },
  { min: 50, char: "/", color: "#2c2a28" },
  { min: 100, char: "$", color: "#524e4a" },
  { min: 160, char: "£", color: "#959089" },
];

function waves(x: number, y: number, time: number) {
  return Math.sin(0.8 * x + 0.3 * time) * Math.cos(0.6 * y + 0.2 * time) * 0.5
    + 0.25 * Math.sin(1.6 * x + 1.2 * y + 0.15 * time)
    + Math.sin(0.3 * x - 0.4 * time) * Math.cos(0.4 * y + 0.25 * time) * 0.6
    + 0.3 * Math.sin(0.5 * (x + y) + 0.35 * time)
    + Math.sin(2.5 * x + 0.1 * time) * Math.cos(2.8 * y - 0.12 * time) * 0.15;
}

function brightness(x: number, y: number, time: number, spacing: number) {
  const field = waves(x, y, time) + 0.4 * waves(x * 2.2, y * 2.2, time * 0.7)
    + 0.15 * waves(x * 4.5, y * 4.5, time * 0.4);
  const value = Math.max(0, Math.min(1, (field + 1.8) / 3.6));
  const band = value % spacing / spacing;
  const contour = band < 0.12 || band > 0.88;
  let light = Math.round(contour ? 200 * value + 55 : 140 * value);
  if (contour) {
    const dx = waves(x + 0.01, y, time) - waves(x - 0.01, y, time);
    const dy = waves(x, y + 0.01, time) - waves(x, y - 0.01, time);
    const slope = 12 * Math.hypot(dx, dy);
    if (slope > 0.5) light = Math.min(255, light + Math.round(40 * slope));
  }
  return light;
}

export default function CurrencySkyBackground({
  children, className = "", style, speed = 0.9, opacity = 1,
  cellWidth = 12, cellHeight = 14, fontSize = 12,
  fontFamily = "ui-monospace, monospace", terrainScale = 0.13,
  contourSpacing = 0.08, paused = false,
}: CurrencySkyBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => Number.isFinite(value) ? Math.max(min, value) : fallback;
    const cw = positive(cellWidth, 12, 4);
    const ch = positive(cellHeight, 14, 4);
    const size = positive(fontSize, 12, 1);
    const scale = positive(terrainScale, 0.13, 0.001);
    const spacing = positive(contourSpacing, 0.08, 0.001);
    const rate = positive(speed, 0.9, 0);
    const alpha = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let frameNumber = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    // Reuse color buckets instead of changing fillStyle for every cell.
    const buckets: number[][] = GLYPHS.map(() => []);
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `400 ${size}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = alpha;
      buckets.forEach((bucket) => { bucket.length = 0; });
      const columns = Math.ceil(width / cw) + 1;
      const rows = Math.ceil(height / ch) + 1;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const value = brightness((column + 0.5) * scale, (row + 0.5) * scale, elapsed, spacing);
          for (let i = GLYPHS.length - 1; i >= 0; i--) {
            if (value >= GLYPHS[i].min) {
              buckets[i].push(column * cw + cw / 2, row * ch + ch / 2);
              break;
            }
          }
        }
      }
      buckets.forEach((bucket, index) => {
        ctx.fillStyle = GLYPHS[index].color;
        for (let i = 0; i < bucket.length; i += 2) ctx.fillText(GLYPHS[index].char, bucket[i], bucket[i + 1]);
      });
      ctx.globalAlpha = 1;
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      // The reference draws every second animation frame.
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
  }, [speed, opacity, cellWidth, cellHeight, fontSize, fontFamily, terrainScale, contourSpacing, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: "#0c0c0b", ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
