/**
 * A seeded circuit board of Manhattan traces and vias, with bright pulses travelling along the copper.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface CircuitTracesBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Copper colour for the traces and vias. */
  color?: string;
  /** Pulse colour. */
  pulseColor?: string;
  background?: string;
  /** Grid pitch in px. */
  cellSize?: number;
  /** Rough number of traces per 100k px². */
  density?: number;
  /** Same seed, same board. */
  seed?: number;
  speed?: number;
  paused?: boolean;
}

type Point = { x: number; y: number };
type Trace = { points: Point[]; length: number; offset: number; rate: number };

/** Mulberry32 — small, fast, and deterministic per seed. */
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const DIRECTIONS: Point[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

export default function CircuitTracesBackground({
  children, className = "", style, color = "#2f6b4f", pulseColor = "#b7ffd8", background = "#07100c",
  cellSize = 14, density = 18, seed = 7, speed = 1, paused = false,
}: CircuitTracesBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const pitch = positive(cellSize, 14, 6);
    const perArea = positive(density, 18, 0.1);
    const rate = positive(speed, 1, 0);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    let traces: Trace[] = [];
    // The copper never changes between frames, so it lives on its own layer.
    const board = document.createElement("canvas");
    const boardCtx = board.getContext("2d");
    if (!boardCtx) return;

    const build = () => {
      const random = rng(Number.isFinite(seed) ? Math.floor(seed) : 7);
      const columns = Math.ceil(width / pitch) + 2;
      const rows = Math.ceil(height / pitch) + 2;
      const taken = new Set<number>();
      const key = (x: number, y: number) => y * columns + x;
      const wanted = Math.round((width * height) / 100000 * perArea);
      traces = [];
      for (let attempt = 0; attempt < wanted * 6 && traces.length < wanted; attempt++) {
        let x = Math.floor(random() * columns);
        let y = Math.floor(random() * rows);
        if (taken.has(key(x, y))) continue;
        let dir = DIRECTIONS[Math.floor(random() * 4)];
        const cells = [key(x, y)];
        const points: Point[] = [{ x, y }];
        const steps = 6 + Math.floor(random() * 16);
        for (let s = 0; s < steps; s++) {
          // Mostly keep going straight; turn now and then, never reverse.
          if (random() < 0.28) {
            const turn = DIRECTIONS.filter((d) => d !== dir && (d.x !== -dir.x || d.y !== -dir.y));
            dir = turn[Math.floor(random() * turn.length)];
          }
          const nx = x + dir.x;
          const ny = y + dir.y;
          if (nx < 0 || ny < 0 || nx >= columns || ny >= rows || taken.has(key(nx, ny))) break;
          x = nx;
          y = ny;
          cells.push(key(x, y));
          const previousPoint = points[points.length - 1];
          const before = points[points.length - 2];
          // Extend a straight run instead of adding a point per cell.
          if (before && before.x - previousPoint.x === -dir.x && before.y - previousPoint.y === -dir.y) {
            previousPoint.x = x;
            previousPoint.y = y;
          } else points.push({ x, y });
        }
        if (points.length < 2) continue;
        cells.forEach((c) => taken.add(c));
        let length = 0;
        for (let i = 1; i < points.length; i++) length += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
        traces.push({ points, length, offset: random(), rate: 0.35 + random() * 0.6 });
      }
    };

    const px = (p: Point) => ({ x: (p.x - 0.5) * pitch, y: (p.y - 0.5) * pitch });

    const paintBoard = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      board.width = canvas.width;
      board.height = canvas.height;
      boardCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      boardCtx.clearRect(0, 0, width, height);
      boardCtx.lineCap = "round";
      boardCtx.lineJoin = "round";
      boardCtx.strokeStyle = color;
      boardCtx.fillStyle = color;
      boardCtx.globalAlpha = 0.55;
      boardCtx.lineWidth = Math.max(1, pitch * 0.12);
      traces.forEach((trace) => {
        boardCtx.beginPath();
        trace.points.forEach((p, i) => {
          const { x, y } = px(p);
          if (i === 0) boardCtx.moveTo(x, y);
          else boardCtx.lineTo(x, y);
        });
        boardCtx.stroke();
      });
      // Vias at both ends of every trace.
      boardCtx.globalAlpha = 0.9;
      const via = Math.max(1.5, pitch * 0.2);
      traces.forEach((trace) => {
        [trace.points[0], trace.points[trace.points.length - 1]].forEach((p) => {
          const { x, y } = px(p);
          boardCtx.beginPath();
          boardCtx.arc(x, y, via, 0, Math.PI * 2);
          boardCtx.fill();
          boardCtx.fillStyle = background;
          boardCtx.beginPath();
          boardCtx.arc(x, y, via * 0.42, 0, Math.PI * 2);
          boardCtx.fill();
          boardCtx.fillStyle = color;
        });
      });
      boardCtx.globalAlpha = 1;
    };

    /** Point at `distance` cells along a trace, following its bends. */
    const along = (trace: Trace, distance: number): Point => {
      let remaining = distance;
      for (let i = 1; i < trace.points.length; i++) {
        const a = trace.points[i - 1];
        const b = trace.points[i];
        const seg = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
        if (remaining <= seg) {
          const t = seg ? remaining / seg : 0;
          return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        }
        remaining -= seg;
      }
      return trace.points[trace.points.length - 1];
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(board, 0, 0, width, height);
      if (reducedMotion.matches) return;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const tail = 2.4;
      traces.forEach((trace) => {
        // Each pulse runs the trace, then waits out a gap before going again.
        const cycle = trace.length + 10;
        const head = ((elapsed * trace.rate * 9 + trace.offset * cycle) % cycle);
        if (head > trace.length + tail) return;
        const from = Math.max(0, head - tail);
        const to = Math.min(trace.length, head);
        if (to <= from) return;
        ctx.beginPath();
        const start = px(along(trace, from));
        ctx.moveTo(start.x, start.y);
        // Walk the bends between `from` and `to` so the pulse turns corners.
        let walked = 0;
        for (let i = 1; i < trace.points.length; i++) {
          const a = trace.points[i - 1];
          const b = trace.points[i];
          const seg = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
          const segEnd = walked + seg;
          if (segEnd > from && walked < to) {
            const p = px(along(trace, Math.min(to, segEnd)));
            ctx.lineTo(p.x, p.y);
          }
          walked = segEnd;
          if (walked >= to) break;
        }
        ctx.strokeStyle = pulseColor;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = Math.max(2, pitch * 0.3);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(1, pitch * 0.12);
        ctx.stroke();
      });
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
      build();
      paintBoard();
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
  }, [color, pulseColor, background, cellSize, density, seed, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
