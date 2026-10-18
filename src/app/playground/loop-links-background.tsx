/**
 * Coloured Truchet arcs threaded through a black lattice of linked rings, whose tiles flip a quarter turn on a beat to re-route the loops.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface LoopLinksBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Colour of the dots and ring holes (the "paper"). */
  backgroundColor?: string;
  /** Colour of the lattice the arcs run through. */
  linkColor?: string;
  /** Arc colours, picked at random per half-arc. */
  colors?: string[];
  /** Size of one tile in px (distance between lattice nodes). */
  tileSize?: number;
  speed?: number;
  paused?: boolean;
}

const DEFAULT_COLORS = [
  "#f7860f",
  "#ef5a33",
  "#b5dfe3",
  "#2aaba0",
  "#169a67",
  "#2c6bb3",
  "#f9d335",
  "#f48fa8",
  "#abce63",
  "#62b4de",
];

// One beat: a handful of tiles flip, then everything holds.
const BEAT = 1.6;
const FLIP = 0.55;

const easeInOutCubic = (v: number) =>
  v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;

interface Tile {
  /** 0 or 1: which pair of opposite corners the arcs wrap around. */
  turn: number;
  /** Quarter turns applied so far; animated from `from` over FLIP seconds. */
  from: number;
  flipAt: number;
  /** Two colours per arc: each quarter arc changes colour halfway round. */
  colors: [number, number, number, number];
}

export default function LoopLinksBackground({
  children,
  className = "",
  style,
  backgroundColor = "#fff9e8",
  linkColor = "#0a0a0a",
  colors = DEFAULT_COLORS,
  tileSize = 76,
  speed = 1,
  paused = false,
}: LoopLinksBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorKey = colors.join(",");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = Number.isFinite(tileSize) ? Math.max(24, tileSize) : 76;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const palette = colorKey.split(",");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let offsetX = 0;
    let offsetY = 0;
    let tiles: Tile[] = [];
    /** Per lattice node: 1 = ring with a hole, 0 = solid; animated radius. */
    let holes: { open: number; from: number; at: number }[] = [];
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let nextBeat = BEAT;
    let visible = false;

    const pick = () => Math.floor(Math.random() * palette.length);
    const build = () => {
      tiles = Array.from({ length: columns * rows }, () => ({
        turn: Math.random() < 0.5 ? 0 : 1,
        from: 0,
        flipAt: -Infinity,
        colors: [pick(), pick(), pick(), pick()],
      }));
      tiles.forEach((tile) => (tile.from = tile.turn));
      holes = Array.from({ length: (columns + 1) * (rows + 1) }, () => {
        const open = Math.random() < 0.45 ? 1 : 0;
        return { open, from: open, at: -Infinity };
      });
    };

    const beat = () => {
      // Flip ~7% of tiles; a flipped tile also recolours one of its arcs so
      // the palette keeps shifting.
      for (const tile of tiles) {
        if (Math.random() > 0.07) continue;
        tile.from = tile.turn;
        tile.turn = tile.turn + (Math.random() < 0.5 ? 1 : -1);
        tile.flipAt = elapsed;
        tile.colors[Math.floor(Math.random() * 4)] = pick();
      }
      for (const hole of holes) {
        if (Math.random() > 0.05) continue;
        hole.from = hole.open;
        hole.open = 1 - hole.open;
        hole.at = elapsed;
      }
    };

    const draw = () => {
      const t = elapsed;
      const half = size / 2;
      const band = size * 0.33;
      ctx.fillStyle = linkColor;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = band;
      ctx.lineCap = "butt";

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const tile = tiles[row * columns + col];
          const p = easeInOutCubic(
            Math.min(1, Math.max(0, (t - tile.flipAt) / FLIP)),
          );
          const quarter = tile.from + (tile.turn - tile.from) * p;
          const cx = offsetX + col * size + half;
          const cy = offsetY + row * size + half;
          ctx.save();
          ctx.beginPath();
          ctx.rect(cx - half, cy - half, size, size);
          ctx.clip();
          ctx.translate(cx, cy);
          ctx.rotate(quarter * (Math.PI / 2));
          // Two quarter arcs around opposite corners, each split in two colours.
          for (let arc = 0; arc < 2; arc++) {
            const sign = arc === 0 ? -1 : 1;
            const start = arc === 0 ? 0 : Math.PI;
            for (let part = 0; part < 2; part++) {
              ctx.strokeStyle = palette[tile.colors[arc * 2 + part]];
              ctx.beginPath();
              ctx.arc(
                sign * half,
                sign * half,
                half,
                start + (part * Math.PI) / 4,
                start + ((part + 1) * Math.PI) / 4,
              );
              ctx.stroke();
            }
          }
          ctx.restore();
        }
      }

      ctx.fillStyle = backgroundColor;
      // Dots where every arc crosses a tile edge.
      const dot = size * 0.105;
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= columns; col++) {
          const x = offsetX + col * size;
          const y = offsetY + row * size;
          ctx.beginPath();
          if (col < columns) ctx.arc(x + half, y, dot, 0, Math.PI * 2);
          ctx.moveTo(x + dot, y + half);
          if (row < rows) ctx.arc(x, y + half, dot, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Lattice nodes: some are rings, whose holes open and close.
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= columns; col++) {
          const hole = holes[row * (columns + 1) + col];
          const p = easeInOutCubic(
            Math.min(1, Math.max(0, (t - hole.at) / FLIP)),
          );
          const open = hole.from + (hole.open - hole.from) * p;
          if (open <= 0.01) continue;
          ctx.beginPath();
          ctx.arc(
            offsetX + col * size,
            offsetY + row * size,
            size * 0.13 * open,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    };

    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      if (elapsed >= nextBeat) {
        beat();
        nextBeat = elapsed + BEAT;
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
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
      const nextColumns = Math.ceil(width / size) + 1;
      const nextRows = Math.ceil(height / size) + 1;
      // Centre the lattice so the cut-off tiles are even on both sides.
      offsetX = (width - nextColumns * size) / 2;
      offsetY = (height - nextRows * size) / 2;
      if (nextColumns !== columns || nextRows !== rows) {
        columns = nextColumns;
        rows = nextRows;
        build();
      }
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
  }, [backgroundColor, linkColor, colorKey, tileSize, speed, paused]);

  return (
    <div
      ref={hostRef}
      className={`relative isolate h-full w-full overflow-hidden ${className}`}
      style={{ backgroundColor: linkColor, ...style }}
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
