/**
 * A woven field of hard-edged dashes on flat colour, switched on and off by a drifting noise field so the blobs flow while every mark stays in its cell.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface DitherFieldBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Colour of the dashes. */
  color?: string;
  /** Flat colour behind them. */
  backgroundColor?: string;
  /** Distance between cell centres in px — the grain of the weave. */
  spacing?: number;
  /** Size of the blobs relative to the viewport height. Below 1 makes them larger. */
  blobScale?: number;
  speed?: number;
  paused?: boolean;
}

/** Stable 0–1 value for an integer triple, so a cell's noise never flickers between frames. */
function hash(a: number, b: number, c: number) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x1b873593);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (p: number) => p * p * (3 - 2 * p);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** 3D value noise in 0–1: hashed lattice corners, smoothly interpolated. The third axis is time. */
function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const fz = smooth(z - zi);
  const face = (dz: number) =>
    lerp(
      lerp(hash(xi, yi, zi + dz), hash(xi + 1, yi, zi + dz), fx),
      lerp(hash(xi, yi + 1, zi + dz), hash(xi + 1, yi + 1, zi + dz), fx),
      fy,
    );
  return lerp(face(0), face(1), fz);
}

export default function DitherFieldBackground({
  children,
  className = "",
  style,
  color = "#ff9249",
  backgroundColor = "#ff5d00",
  spacing = 7,
  blobScale = 1,
  speed = 1,
  paused = false,
}: DitherFieldBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) =>
      (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const pitch = positive(spacing, 7, 3);
    const zoom = positive(blobScale, 1, 0.1);
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
      if (!width || !height) return;
      const t = elapsed;
      const cols = Math.ceil(width / pitch);
      const rows = Math.ceil(height / pitch);
      // Marks are wide and short, so a run of them reads as a dashed weave rather than dots.
      const markW = pitch * 0.72;
      const markH = pitch * 0.4;
      // Noise coordinates in viewport heights: blobs keep their proportions at any size.
      const step = (pitch / height) * zoom;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        const ny = j * step * 2.6;
        for (let i = 0; i < cols; i++) {
          // Every third diagonal stays empty, which is what gives the field its hatched texture.
          if (mod(i - j, 3) === 0) continue;
          const nx = i * step * 1.4 - t * 0.09;
          // A slow warp bends the lattice, so blob edges read organic instead of diagonal.
          const warp = noise(nx * 0.6 + 11, ny * 0.6, t * 0.05);
          const value =
            0.65 * noise(nx + warp * 1.2, ny, t * 0.12) +
            0.35 * noise(nx * 2.3 + 7, ny * 2.3, t * 0.2 + 3);
          if (value < 0.5) continue;
          ctx.rect(i * pitch + (pitch - markW) / 2, j * pitch + (pitch - markH) / 2, markW, markH);
        }
      }
      ctx.fill();
    };
    const tick = (now: number) => {
      // Cap the step so a backgrounded tab doesn't jump the field forward on return.
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      // The drift is slow, so painting every other frame halves the cost and still reads smooth.
      if (++frameNumber % 2 === 0) draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) elapsed = 2;
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
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
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
  }, [color, spacing, blobScale, speed, paused]);

  return (
    <div
      ref={hostRef}
      className={`relative isolate h-full w-full overflow-hidden ${className}`}
      style={{ backgroundColor, ...style }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
