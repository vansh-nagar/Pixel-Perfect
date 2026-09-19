/**
 * A slowly drifting terrain drawn in Unicode braille, so every character carries its own 2×4 dither cell.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface BrailleTerrainBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Glyph colour at full brightness. */
  color?: string;
  background?: string;
  /** Width of one braille cell in px; height is 1.6× this. */
  cellSize?: number;
  /** How much terrain fits across the frame; smaller is broader hills. */
  scale?: number;
  speed?: number;
  opacity?: number;
  paused?: boolean;
}

/** Braille dot bit for each of the 2×4 sub-cells, column-major. */
const DOT_BITS = [0x01, 0x02, 0x04, 0x40, 0x08, 0x10, 0x20, 0x80];
/**
 * Ordered thresholds for the eight sub-cells, so a cell's brightness maps to
 * how many dots light up rather than to a hard on/off edge.
 */
const DOT_ORDER = [0.06, 0.56, 0.31, 0.81, 0.43, 0.93, 0.18, 0.68];

function field(x: number, y: number, t: number) {
  return (
    Math.sin(0.9 * x + 0.25 * t) * Math.cos(0.7 * y - 0.18 * t) * 0.5 +
    0.3 * Math.sin(1.7 * x - 1.1 * y + 0.22 * t) +
    Math.sin(0.35 * x + 0.3 * t) * Math.cos(0.45 * y + 0.2 * t) * 0.55 +
    0.2 * Math.sin(3.1 * x + 0.12 * t) * Math.cos(2.7 * y - 0.1 * t)
  );
}

export default function BrailleTerrainBackground({
  children, className = "", style, color = "#c3cad4", background = "#0a0b0d",
  cellSize = 10, scale = 0.06, speed = 1, opacity = 1, paused = false,
}: BrailleTerrainBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const cw = positive(cellSize, 10, 4);
    const ch = cw * 1.6;
    const zoom = positive(scale, 0.06, 0.001);
    const rate = positive(speed, 1, 0);
    const alpha = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let frameNumber = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    // Three brightness buckets, one fillStyle each, instead of a colour per cell.
    const tiers = [{ min: 0.1, alpha: 0.3 }, { min: 0.4, alpha: 0.62 }, { min: 0.66, alpha: 1 }];
    const buckets: (number | string)[][] = tiers.map(() => []);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `400 ${cw * 1.25}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      buckets.forEach((bucket) => { bucket.length = 0; });
      const columns = Math.ceil(width / cw) + 1;
      const rows = Math.ceil(height / ch) + 1;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          let bits = 0;
          let sum = 0;
          for (let dot = 0; dot < 8; dot++) {
            const sx = column + (dot < 4 ? 0.25 : 0.75);
            const sy = row + ((dot % 4) + 0.5) / 4;
            const raw = (field(sx * zoom * 2, sy * zoom * 2 * 1.6, elapsed) + 1.55) / 3.1;
            // Push the mid-tones apart so hills read as hills, not haze.
            const v = raw < 0.5 ? 2 * raw * raw : 1 - 2 * (1 - raw) * (1 - raw);
            sum += v;
            if (v > DOT_ORDER[dot]) bits |= DOT_BITS[dot];
          }
          // An empty cell still gets one faint dot, so valleys read as dark
          // ground rather than holes in the grid.
          if (!bits) bits = 0x02;
          const mean = sum / 8;
          for (let i = tiers.length - 1; i >= 0; i--) {
            if (mean >= tiers[i].min) {
              buckets[i].push(String.fromCharCode(0x2800 + bits), column * cw + cw / 2, row * ch + ch / 2);
              break;
            }
          }
        }
      }
      buckets.forEach((bucket, index) => {
        ctx.globalAlpha = alpha * tiers[index].alpha;
        ctx.fillStyle = color;
        for (let i = 0; i < bucket.length; i += 3) ctx.fillText(bucket[i] as string, bucket[i + 1] as number, bucket[i + 2] as number);
      });
      ctx.globalAlpha = 1;
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      // Every second frame is plenty for a texture this slow.
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
  }, [color, cellSize, scale, speed, opacity, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
