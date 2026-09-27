/**
 * A pixel world map that pans slowly around the globe while live "user" squares pop on across the continents, ripple, and fade.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface PixelMapBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Colour of the live pings. */
  color?: string;
  /** Colour of the land squares. */
  landColor?: string;
  backgroundColor?: string;
  /** Map columns visible across the frame; lower zooms in. */
  columns?: number;
  /** Share of visible land cells lit at once. */
  density?: number;
  speed?: number;
  paused?: boolean;
}

// Natural Earth land (world-atlas, 110m) rasterised to 96×43 cells:
// equirectangular, 80°N to 55°S. Each row is 96 bits in hex.
const MAP_ROWS = [
  "000003f7ffe01c0000500000", "000065e0ffe00001c1fc0400", "0003f6f07fc0000227ffff00", "0fffff5c3fc00fc3ffffffff",
  "ffffffde3e301fffffffffff", "0fffff3418003bffffffffff", "0f7ffe1c00007bffffffff98", "0407ff9f000337fffffff820",
  "0007ffdf80077ffffffffc60", "0003ffff8001fffffffffe00", "0001ffffc001fffffffff800", "0001fffe0003ff3ffffff200",
  "0001fff800072ffbffffe400", "0001fff0000301fbffff2400", "0000fff00003e07fffff1800", "00007fe00007ffffffff8000",
  "00003c200007fffbffff0000", "00001c20000fffbcffff0000", "00000ce0001fffff3ffe0000", "00000f84001fffde1e700000",
  "000003c0001ffffc0c788000", "00000040001ffff00c380000", "0000005f000ffffc08014000", "0000001fc007fff804200000",
  "0000001fe0003ff800330000", "0000003fe0003fe000378000", "0000003ffc001fe000129c80", "0000003ffe001fe0000c0600",
  "0000001ffe001fe000010100", "0000001ffc001fe000001000", "0000000ffc001fec00007a00", "00000007fc001fc80000fe00",
  "00000007f8000fd80001ff00", "00000007e0000f800003ff80", "00000007e0000f800003ff80", "00000007c00007000001ff80",
  "00000007c000060000018700", "0000000f8000000000000701", "0000000e0000000000000002", "0000000e0000000000000004",
  "0000000c0000000000000000", "0000000c0000000000000000", "0000000c0000000000000000",
];
const MAP_COLUMNS = 96;
const MAP_HEIGHT = MAP_ROWS.length;
const LAND = MAP_ROWS.map((row) => Array.from({ length: MAP_COLUMNS }, (_, c) => (parseInt(row[c >> 2], 16) >> (3 - (c & 3))) & 1));

const isLand = (column: number, row: number) =>
  row >= 0 && row < MAP_HEIGHT && LAND[row][((column % MAP_COLUMNS) + MAP_COLUMNS) % MAP_COLUMNS] === 1;

/** Fixed per-cell shade, so the land has a little texture. */
const shade = (column: number, row: number) => {
  const x = Math.sin(column * 127.1 + row * 311.7) * 43758.5453;
  return 0.75 + 0.25 * (x - Math.floor(x));
};

type Ping = { column: number; row: number; born: number; life: number };

export default function PixelMapBackground({
  children, className = "", style, color = "#f2762e", landColor = "#3d3a37", backgroundColor = "#1f1d1c",
  columns = 50, density = 0.07, speed = 1, paused = false,
}: PixelMapBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const across = Number.isFinite(columns) ? Math.min(MAP_COLUMNS, Math.max(12, columns)) : 50;
    const share = Number.isFinite(density) ? Math.min(0.5, Math.max(0, density)) : 0.07;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let cell = 10;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    let pings: Ping[] = [];

    // Map columns scrolled past so far; the map wraps, so this grows forever.
    const pan = () => elapsed * 0.5 + 38;
    const view = () => {
      const originY = height / 2 - 16 * cell;
      const shift = pan();
      return { originY, shift, first: Math.floor(shift), offset: -(shift % 1) * cell };
    };

    const spawn = (now: number) => {
      const { originY, first } = view();
      const visibleColumns = Math.ceil(width / cell);
      for (let attempt = 0; attempt < 30; attempt++) {
        const column = first + 1 + Math.floor(Math.random() * visibleColumns);
        const row = Math.floor((Math.random() * height - originY) / cell);
        if (isLand(column, row) && !pings.some((p) => p.column === column && p.row === row)) {
          pings.push({ column, row, born: now, life: 2.5 + Math.random() * 4 });
          return;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { originY, first, offset } = view();
      const square = cell * 0.74;
      const inset = (cell - square) / 2;
      const visibleColumns = Math.ceil(width / cell) + 2;
      const rowStart = Math.max(0, Math.floor(-originY / cell));
      const rowEnd = Math.min(MAP_HEIGHT, Math.ceil((height - originY) / cell));
      let landCount = 0;
      ctx.fillStyle = landColor;
      for (let row = rowStart; row < rowEnd; row++) {
        for (let k = 0; k < visibleColumns; k++) {
          const column = first + k;
          if (!isLand(column, row)) continue;
          landCount++;
          ctx.globalAlpha = shade(((column % MAP_COLUMNS) + MAP_COLUMNS) % MAP_COLUMNS, row);
          ctx.fillRect(offset + k * cell + inset, originY + row * cell + inset, square, square);
        }
      }
      ctx.globalAlpha = 1;

      // Keep the lit count proportional to the land in view.
      const now = elapsed;
      pings = pings.filter((p) => now - p.born < p.life && p.column >= first - 1);
      const goal = Math.round(landCount * share);
      if (reducedMotion.matches) {
        while (pings.length < goal) spawn(-10);
      } else if (pings.length < goal && Math.random() < 0.35) {
        spawn(now);
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      for (const p of pings) {
        const age = now - p.born;
        const x = offset + (p.column - first) * cell + cell / 2;
        const y = originY + p.row * cell + cell / 2;
        // Quick pop in, hold, then fade over the last second.
        const pop = Math.min(1, age / 0.18);
        const fade = reducedMotion.matches ? 1 : Math.min(1, (p.life - age) / 1);
        const size = square * (pop < 1 ? 1.35 - 0.35 * pop : 1);
        ctx.globalAlpha = Math.max(0, fade) * pop;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        // A square ripple on arrival.
        if (age < 0.9 && !reducedMotion.matches) {
          const ripple = age / 0.9;
          const r = square / 2 + ripple * cell * 1.6;
          ctx.globalAlpha = (1 - ripple) * 0.6;
          ctx.lineWidth = 1;
          ctx.strokeRect(x - r, y - r, r * 2, r * 2);
        }
      }
      ctx.globalAlpha = 1;
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
        pings = [];
      }
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
      // Cover the frame: fill the width, and never leave the map shorter than the frame.
      cell = Math.max(width / across, height / 30);
      pings = [];
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
  }, [color, landColor, columns, density, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
