/**
 * A misregistered risograph print: flowing brush-stroke shapes printed as offset cyan, blue, red and yellow separations, Bayer-dithered over a grey pixel checkerboard.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface MisprintBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Paper colour, showing through the checkerboard. */
  backgroundColor?: string;
  /** Checkerboard pixel colour. */
  gridColor?: string;
  /** Ink colours, in print order: halo, base, overlap, shifted, far-shifted. */
  inks?: [string, string, string, string, string];
  /** Size of one pixel in px. */
  pixelSize?: number;
  speed?: number;
  paused?: boolean;
}

// 4×4 Bayer matrix: each pixel gets its own threshold, so a smooth ink
// density becomes an even crosshatch of inked and bare pixels.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DEFAULT_INKS: [string, string, string, string, string] = [
  "#55e3f0",
  "#2f5bf2",
  "#19ec2c",
  "#f0413a",
  "#f2ee12",
];

const fract = (v: number) => v - Math.floor(v);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const hash = (x: number, y: number) =>
  fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

// Smooth value noise in [0, 1].
const noise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};

// Ink separations are sampled at these steps "down" the stroke, so each
// colour lands slightly off the one before it — the misregistration.
const SHIFT_U = -0.22;
const SHIFT_W = 0.3;

export default function MisprintBackground({
  children,
  className = "",
  style,
  backgroundColor = "#ffffff",
  gridColor = "#b3aca4",
  inks = DEFAULT_INKS,
  pixelSize = 6,
  speed = 1,
  paused = false,
}: MisprintBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inkKey = inks.join(",");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    const buffer = document.createElement("canvas");
    const bufferCtx = buffer.getContext("2d", { willReadFrequently: true });
    if (!ctx || !bufferCtx) return;
    const cell = Number.isFinite(pixelSize)
      ? Math.max(2, Math.round(pixelSize))
      : 6;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    // Resolve any CSS colour to RGB by painting it once.
    const rgb = (value: string) => {
      bufferCtx.fillStyle = value;
      bufferCtx.fillRect(0, 0, 1, 1);
      const [r, g, b] = bufferCtx.getImageData(0, 0, 1, 1).data;
      return [r, g, b] as const;
    };
    const paper = rgb(backgroundColor);
    const grid = rgb(gridColor);
    const [halo, base, overlap, shifted, far] = inkKey.split(",").map(rgb);

    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let image: ImageData | null = null;
    let frame = 0;
    let frameNumber = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    // Stroke field in rotated, stretched space: long along u, thin across w,
    // with a slow warp so the strokes bend and taper as they drift.
    const field = (u: number, w: number, t: number) => {
      const warp = noise(u * 0.35 + t * 0.05, w * 0.25 - t * 0.04) - 0.5;
      const su = u * 0.45 - t * 0.1;
      const sw = w * 1.25 + warp * 1.6;
      return (
        noise(su, sw) * 0.6 +
        noise(su * 2.1 + 5.2, sw * 2.1 + 1.3) * 0.28 +
        noise(su * 4.3 + 9.7, sw * 4.3 + 3.1) * 0.12
      );
    };

    const draw = () => {
      if (!image) return;
      const data = image.data;
      const t = elapsed;
      const scale = 1 / 22;
      const cos = Math.cos(0.42);
      const sin = Math.sin(0.42);
      // Speckles and column streaks re-roll a few times a second, like a
      // noisy print head, rather than every frame.
      const step = Math.floor(t * 5);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const nx = x * scale;
          const ny = y * scale;
          const u = nx * cos + ny * sin;
          const w = -nx * sin + ny * cos;

          const a = field(u, w, t);
          const b = field(u + SHIFT_U, w - SHIFT_W, t);
          const c = field(u + SHIFT_U * 2, w - SHIFT_W * 2, t);

          // Inks never print solid — they cap out so the checkerboard always
          // shows through, like cheap ink on coarse paper.
          let ink: readonly number[] | null = null;
          let density = 0;
          if (c > 0.63 && b > 0.56 && a < 0.53) {
            // Far copy only where the base has already ended: a thin
            // leading edge rather than a blob.
            ink = far;
            density = Math.min(0.8, 0.45 + (c - 0.63) * 6);
          } else if (b > 0.58) {
            ink = shifted;
            density = Math.min(0.62, 0.3 + (b - 0.58) * 5);
          } else if (a > 0.56 && b > 0.54) {
            ink = overlap;
            density = 0.45;
          } else if (a > 0.54) {
            ink = base;
            density = Math.min(0.75, 0.35 + (a - 0.54) * 6);
          } else if (a > 0.44) {
            ink = halo;
            density = Math.min(0.5, (a - 0.44) * 5);
          } else if (hash(x + step * 13.1, y) < (a > 0.38 ? 0.02 : 0.004)) {
            ink = halo;
            density = 1;
          }

          // Clearings: the grey checkerboard thins out to bare paper in
          // slow-moving patches, so the strokes have space around them.
          const clearing = clamp01(
            (noise(x * 0.035 + t * 0.06, y * 0.05 - t * 0.03) - 0.5) * 3.5,
          );
          const gridThreshold = (BAYER[((y >> 1) & 3) * 4 + ((x >> 1) & 3)] + 0.5) / 16;
          const checker = ((x + y) & 1) === 0 && gridThreshold >= clearing;
          let color: readonly number[] = checker ? grid : paper;
          if (ink) {
            // Thin every other column plus a few jittered ones: the vertical
            // streaking you get when a print head skips.
            const streak =
              (x & 1 ? 0.6 : 1) * (hash(x, step) < 0.12 ? 0.5 : 1);
            const threshold = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
            if (threshold < clamp01(density) * streak) color = ink;
          }

          const i = (y * columns + x) * 4;
          data[i] = color[0];
          data[i + 1] = color[1];
          data[i + 2] = color[2];
          data[i + 3] = 255;
        }
      }
      bufferCtx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buffer, 0, 0, columns * cell, rows * cell);
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      // Every other frame: cheaper, and the stepped motion suits the pixel look.
      if (++frameNumber % 2 === 0) draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) elapsed = 0;
      draw();
      if (
        !paused &&
        rate > 0 &&
        visible &&
        !document.hidden &&
        !reducedMotion.matches
      ) {
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
      columns = Math.max(1, Math.ceil(width / cell));
      rows = Math.max(1, Math.ceil(height / cell));
      buffer.width = columns;
      buffer.height = rows;
      image = bufferCtx.createImageData(columns, rows);
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
  }, [backgroundColor, gridColor, inkKey, pixelSize, speed, paused]);

  return (
    <div
      ref={hostRef}
      className={`relative isolate h-full w-full overflow-hidden ${className}`}
      style={{ backgroundColor, ...style }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
