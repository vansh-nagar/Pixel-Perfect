/**
 * Acid-green glyph zones — targets, rounded squares, crosses, plus signs and dots — drifting across a black grid while solid blocks snap to new places on a beat.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface GlyphBlocksBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Glyph and block colour. */
  color?: string;
  backgroundColor?: string;
  /** Grid cell size in px. */
  size?: number;
  /** Number of solid blocks. */
  blocks?: number;
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

type Block = { x: number; y: number; w: number; h: number };

export default function GlyphBlocksBackground({
  children, className = "", style, color = "#c6ff00", backgroundColor = "#000000",
  size = 18, blocks = 3, speed = 1, paused = false,
}: GlyphBlocksBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const cell = Number.isFinite(size) ? Math.max(10, size) : 18;
    const blockCount = Number.isFinite(blocks) ? Math.max(0, Math.round(blocks)) : 4;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let lastStep = -1;
    let lastBeat = -1;
    let visible = false;
    let solids: Block[] = [];

    const randomBlock = (seed: number): Block => {
      const w = 4 + Math.floor(hash(seed, 1) * Math.max(4, columns * 0.2));
      const h = 3 + Math.floor(hash(seed, 2) * Math.max(3, rows * 0.3));
      return {
        x: Math.floor(hash(seed, 3) * Math.max(1, columns - w / 2)),
        y: Math.floor(hash(seed, 4) * Math.max(1, rows - h / 2)),
        w,
        h,
      };
    };

    const draw = (step: number) => {
      ctx.clearRect(0, 0, width, height);
      const thin = new Path2D();
      const bold = new Path2D();
      const fill = new Path2D();
      const r = cell / 2;
      // Zones drift in whole steps, so the field changes like a display refreshing.
      const drift = step * 0.035;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const zone = noise(i * 0.09 + drift, j * 0.09 - drift * 0.4) * 0.75 + noise(i * 0.23 - drift, j * 0.23 + 5) * 0.25;
          const x = i * cell + r;
          const y = j * cell + r;
          const seed = hash(i, j);
          if (zone < 0.52) {
            if (seed < 0.08) fill.rect(x - cell * 0.06, y - cell * 0.06, cell * 0.12, cell * 0.12);
            continue;
          }
          if (zone < 0.56) {
            fill.rect(x - cell * 0.06, y - cell * 0.06, cell * 0.12, cell * 0.12);
            continue;
          }
          // Each cell re-rolls its glyph now and then, on its own schedule.
          const roll = hash(seed * 97, Math.floor(step / 6 + seed * 6));
          const a = cell * 0.22;
          if (zone < 0.62) {
            if (roll < 0.5) {
              thin.moveTo(x - a, y);
              thin.lineTo(x + a, y);
              thin.moveTo(x, y - a);
              thin.lineTo(x, y + a);
            } else if (roll < 0.8) {
              thin.moveTo(x - a * 0.7, y - a * 0.7);
              thin.lineTo(x + a * 0.7, y + a * 0.7);
              thin.moveTo(x + a * 0.7, y - a * 0.7);
              thin.lineTo(x - a * 0.7, y + a * 0.7);
            } else {
              thin.moveTo(x - a * 0.7, y - a * 0.7);
              thin.lineTo(x + a * 0.7, y + a * 0.7);
            }
            continue;
          }
          if (roll < 0.4) {
            // Target: ring around a ring.
            thin.moveTo(x + cell * 0.36, y);
            thin.arc(x, y, cell * 0.36, 0, Math.PI * 2);
            thin.moveTo(x + cell * 0.16, y);
            thin.arc(x, y, cell * 0.16, 0, Math.PI * 2);
          } else if (roll < 0.62) {
            // Rounded square with a centre dot.
            thin.roundRect(x - cell * 0.33, y - cell * 0.33, cell * 0.66, cell * 0.66, cell * 0.14);
            fill.rect(x - cell * 0.08, y - cell * 0.08, cell * 0.16, cell * 0.16);
          } else if (roll < 0.82) {
            const b = cell * 0.27;
            bold.moveTo(x - b, y - b);
            bold.lineTo(x + b, y + b);
            bold.moveTo(x + b, y - b);
            bold.lineTo(x - b, y + b);
          } else {
            // Clover: four blobs around an empty centre.
            const o = cell * 0.19;
            for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
              fill.moveTo(x + dx * o + cell * 0.13, y + dy * o);
              fill.arc(x + dx * o, y + dy * o, cell * 0.13, 0, Math.PI * 2);
            }
          }
        }
      }
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.2, cell * 0.09);
      ctx.stroke(thin);
      ctx.lineWidth = Math.max(2, cell * 0.17);
      ctx.stroke(bold);
      ctx.fill(fill);
      for (const block of solids) ctx.fillRect(block.x * cell, block.y * cell, block.w * cell, block.h * cell);
    };

    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      // About eight refreshes a second: stepped on purpose.
      const step = Math.floor(elapsed * 8);
      const beat = Math.floor(elapsed / 1.4);
      if (beat !== lastBeat && solids.length) {
        // On each beat one block snaps somewhere new; no tween, it just moves.
        solids[beat % solids.length] = randomBlock(beat * 7.31 + 1);
        lastBeat = beat;
      }
      if (step !== lastStep) {
        lastStep = step;
        draw(step);
      }
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) elapsed = 0;
      lastStep = Math.floor(elapsed * 8);
      draw(lastStep);
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
      solids = Array.from({ length: blockCount }, (_, i) => randomBlock(i * 13.7 + 0.5));
      lastBeat = Math.floor(elapsed / 1.4);
      draw(Math.floor(elapsed * 8));
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
  }, [color, size, blocks, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
