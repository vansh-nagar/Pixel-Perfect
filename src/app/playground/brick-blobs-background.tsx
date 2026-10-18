/**
 * Blobby creatures built from studded toy bricks on a dark baseplate, outlined in purple and red-orange edges, snapping a stud at a time as they wander and merge.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface BrickBlobsBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Baseplate colour. */
  backgroundColor?: string;
  /** Body colour of the creatures. */
  bodyColor?: string;
  /** Edge bricks on left-facing sides. */
  coolColors?: string[];
  /** Edge bricks on right-facing sides. */
  warmColors?: string[];
  eyeColor?: string;
  /** Size of one stud in px. */
  studSize?: number;
  speed?: number;
  paused?: boolean;
}

// The blobs move in steps, like bricks being re-placed, not smoothly.
const STEP = 1 / 8;
const DROP = 0.16;

const hash = (x: number, y: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export default function BrickBlobsBackground({
  children,
  className = "",
  style,
  backgroundColor = "#1f1f21",
  bodyColor = "#0d0d0e",
  coolColors = ["#8a6cff", "#5b3de8", "#4128d4"],
  warmColors = ["#d2123d", "#ef7a10"],
  eyeColor = "#d8d8d8",
  studSize = 18,
  speed = 1,
  paused = false,
}: BrickBlobsBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorKey = [
    backgroundColor,
    bodyColor,
    eyeColor,
    coolColors.join("|"),
    warmColors.join("|"),
  ].join(",");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = Number.isFinite(studSize)
      ? Math.max(8, Math.round(studSize))
      : 18;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const [plate, body, eye, cool, warm] = colorKey.split(",");
    // Index 0 = baseplate, 1 = body, 2 = eye, then cool, then warm.
    const palette = [plate, body, eye, ...cool.split("|"), ...warm.split("|")];
    const coolStart = 3;
    const warmStart = 3 + cool.split("|").length;
    const coolCount = warmStart - coolStart;
    const warmCount = palette.length - warmStart;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let columns = 0;
    let rows = 0;
    let grid = new Uint8Array(0);
    let droppedAt = new Float32Array(0);
    let sprites: HTMLCanvasElement[] = [];
    let blobs: { x: number; y: number; r: number; phase: number; sx: number; sy: number }[] = [];
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let lastStep = -Infinity;
    let visible = false;

    // One pre-rendered brick per colour: the square, a bevel, and a stud with
    // a top-left highlight and a bottom-right shadow.
    const makeSprite = (color: string) => {
      const size = Math.round(cell * dpr);
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = size;
      const s = sprite.getContext("2d")!;
      s.fillStyle = color;
      s.fillRect(0, 0, size, size);
      s.fillStyle = "rgba(255,255,255,0.07)";
      s.fillRect(0, 0, size, Math.max(1, size * 0.06));
      s.fillRect(0, 0, Math.max(1, size * 0.06), size);
      s.fillStyle = "rgba(0,0,0,0.28)";
      s.fillRect(0, size - Math.max(1, size * 0.07), size, size);
      s.fillRect(size - Math.max(1, size * 0.07), 0, size, size);
      const c = size / 2;
      const r = size * 0.3;
      s.fillStyle = "rgba(0,0,0,0.35)";
      s.beginPath();
      s.arc(c + size * 0.05, c + size * 0.06, r, 0, Math.PI * 2);
      s.fill();
      s.fillStyle = color;
      s.beginPath();
      s.arc(c, c, r, 0, Math.PI * 2);
      s.fill();
      const shine = s.createLinearGradient(c - r, c - r, c + r, c + r);
      shine.addColorStop(0, "rgba(255,255,255,0.22)");
      shine.addColorStop(0.5, "rgba(255,255,255,0)");
      shine.addColorStop(1, "rgba(0,0,0,0.25)");
      s.fillStyle = shine;
      s.beginPath();
      s.arc(c, c, r, 0, Math.PI * 2);
      s.fill();
      return sprite;
    };

    const spawn = () => {
      const count = Math.max(2, Math.round((width * height) / 260000));
      blobs = Array.from({ length: count }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.55 + Math.random() * 0.5,
        phase: i * 1.7 + Math.random() * 6,
        sx: 0.35 + Math.random() * 0.4,
        sy: 0.3 + Math.random() * 0.4,
      }));
    };

    // Rebuild the brick layout from the blobs' current positions.
    const layout = () => {
      const t = elapsed;
      const base = Math.min(columns, rows) * 0.2;
      const centers = blobs.map((b) => ({
        x: (b.x + 0.18 * Math.sin(t * 0.13 * b.sx + b.phase)) * columns,
        y: (b.y + 0.16 * Math.cos(t * 0.11 * b.sy + b.phase * 1.3)) * rows,
        r: b.r * base,
      }));
      const field = new Float32Array(columns * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          let f = 0;
          for (const c of centers) {
            const dx = x + 0.5 - c.x;
            const dy = (y + 0.5 - c.y) * 1.1;
            f += (c.r * c.r) / (dx * dx + dy * dy + 1);
          }
          field[y * columns + x] = f;
        }
      }
      const inside = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < columns && y < rows && field[y * columns + x] > 1;

      const next = new Uint8Array(columns * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const i = y * columns + x;
          const here = inside(x, y);
          const edge =
            here &&
            (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1));
          // Outer rim: one brick outside the body, only on some cells, so the
          // outline doubles up in places like a hand-built model.
          const rim =
            !here &&
            (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) &&
            hash(x, y) < 0.45;
          if (!edge && !rim) {
            next[i] = here ? 1 : 0;
            continue;
          }
          // Which way the edge faces decides cool (left) or warm (right);
          // flat tops and bottoms pick either at random.
          const gx =
            (x + 1 < columns ? field[i + 1] : 0) - (x > 0 ? field[i - 1] : 0);
          const facesLeft = Math.abs(gx) > 0.05 ? gx > 0 : hash(y, x) < 0.5;
          const h = hash(x * 3.1, y * 1.7);
          next[i] = facesLeft
            ? coolStart + Math.floor(h * coolCount) % coolCount
            : warmStart + (rim ? warmCount - 1 : Math.floor(h * warmCount) % warmCount);
        }
      }
      // Eyes: a 1×2 pair on each blob, kept only where they land on body.
      for (const c of centers) {
        const ey = Math.round(c.y - c.r * 0.25);
        for (const side of [-1, 1]) {
          const ex = Math.round(c.x + side * c.r * 0.28);
          for (const dy of [0, 1]) {
            const i = (ey + dy) * columns + ex;
            if (ex >= 0 && ex < columns && ey + dy >= 0 && ey + dy < rows && next[i] === 1) {
              next[i] = 2;
            }
          }
        }
      }
      for (let i = 0; i < next.length; i++) {
        if (next[i] !== grid[i]) {
          // Only bricks being added get the drop; removals just vanish.
          if (next[i] !== 0) droppedAt[i] = t;
          grid[i] = next[i];
        }
      }
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const size = cell * dpr;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          ctx.drawImage(sprites[0], Math.round(x * size), Math.round(y * size));
        }
      }
      // Placed bricks, with any recent ones dropping in from slightly above.
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const i = y * columns + x;
          const kind = grid[i];
          if (kind === 0) continue;
          const p = Math.min(1, (elapsed - droppedAt[i]) / DROP);
          const px = Math.round(x * size);
          const py = Math.round(y * size);
          if (p >= 1) {
            ctx.drawImage(sprites[kind], px, py);
            continue;
          }
          const lift = (1 - p) * (1 - p);
          const scale = 1 + 0.25 * lift;
          const drawn = size * scale;
          ctx.globalAlpha = 0.35 + 0.65 * p;
          ctx.drawImage(
            sprites[kind],
            px - (drawn - size) / 2,
            py - (drawn - size) / 2 - lift * size * 0.3,
            drawn,
            drawn,
          );
          ctx.globalAlpha = 1;
        }
      }
    };

    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      if (elapsed - lastStep >= STEP) {
        lastStep = elapsed;
        layout();
      }
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
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      columns = Math.ceil(width / cell);
      rows = Math.ceil(height / cell);
      grid = new Uint8Array(columns * rows);
      droppedAt = new Float32Array(columns * rows).fill(-Infinity);
      sprites = palette.map(makeSprite);
      spawn();
      layout();
      // No drop on first paint: the model is simply there.
      droppedAt.fill(-Infinity);
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
  }, [colorKey, studSize, speed, paused]);

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
