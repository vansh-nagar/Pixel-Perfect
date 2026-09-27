/**
 * A Truchet tiling of quarter-circle arcs whose tiles spin a quarter turn as slow waves sweep across, re-routing the maze as it goes.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface TruchetWeaveBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Arc colour. */
  color?: string;
  backgroundColor?: string;
  /** Tile size in px. */
  size?: number;
  speed?: number;
  paused?: boolean;
}

/** Deterministic 0/1 per tile, so the starting maze looks random but never changes. */
const coin = (i: number, j: number) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x) > 0.5 ? 1 : 0;
};

export default function TruchetWeaveBackground({
  children, className = "", style, color = "#e5484d", backgroundColor = "#f3eee4",
  size = 40, speed = 1, paused = false,
}: TruchetWeaveBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const tile = Number.isFinite(size) ? Math.max(12, size) : 40;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    // Per tile: the wave state last seen, whole quarter-turns owed, and the eased angle.
    let state = new Uint8Array(0);
    let turns = new Float32Array(0);
    let angles = new Float32Array(0);
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const wave = (i: number, j: number, t: number) =>
      (Math.sin(i * 0.35 + t * 0.8) + Math.sin(j * 0.45 - t * 0.6) + Math.sin((i + j) * 0.2 + t * 0.45) > 0 ? 1 : 0) ^ coin(i, j);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = elapsed;
      const half = tile / 2;
      const originX = (width - columns * tile) / 2;
      const originY = (height - rows * tile) / 2;
      const settle = reducedMotion.matches;
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const k = j * columns + i;
          const next = wave(i, j, t);
          // Each flip of the wave owes the tile one more quarter turn.
          if (next !== state[k]) {
            state[k] = next;
            turns[k] += 1;
          }
          angles[k] = settle ? turns[k] : angles[k] + (turns[k] - angles[k]) * 0.2;
          const theta = angles[k] * (Math.PI / 2);
          const cos = Math.cos(theta);
          const sin = Math.sin(theta);
          const cx = originX + i * tile + half;
          const cy = originY + j * tile + half;
          // Two arcs centred on opposite corners, both rotated with the tile.
          for (const s of [-1, 1]) {
            const ax = cx + (cos - sin) * half * s;
            const ay = cy + (sin + cos) * half * s;
            const start = theta + (s < 0 ? 0 : Math.PI);
            ctx.moveTo(ax + half * Math.cos(start), ay + half * Math.sin(start));
            ctx.arc(ax, ay, half, start, start + Math.PI / 2);
          }
        }
      }
      ctx.lineWidth = tile * 0.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.stroke();
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
      columns = Math.ceil(width / tile) + 1;
      rows = Math.ceil(height / tile) + 1;
      state = new Uint8Array(columns * rows);
      turns = new Float32Array(columns * rows);
      angles = new Float32Array(columns * rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const k = j * columns + i;
          state[k] = wave(i, j, elapsed);
          turns[k] = angles[k] = state[k];
        }
      }
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
  }, [color, size, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
