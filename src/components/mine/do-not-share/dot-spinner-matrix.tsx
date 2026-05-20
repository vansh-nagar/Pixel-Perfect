"use client";

import { useEffect, useRef, useState } from "react";

type ColorKey =
  | "cyan"
  | "magenta"
  | "yellow"
  | "green"
  | "orange"
  | "blue"
  | "red"
  | "purple"
  | "white"
  | "teal"
  | "pink"
  | "lime";

const COLOR_MAP: Record<ColorKey, string> = {
  cyan: "oklch(80% 0.25 195)",
  magenta: "oklch(75% 0.3 330)",
  yellow: "oklch(90% 0.25 90)",
  green: "oklch(80% 0.3 145)",
  orange: "oklch(75% 0.28 50)",
  blue: "oklch(70% 0.28 260)",
  red: "oklch(60% 0.3 25)",
  purple: "oklch(65% 0.28 300)",
  white: "oklch(95% 0 0)",
  teal: "oklch(72% 0.24 175)",
  pink: "oklch(70% 0.26 350)",
  lime: "oklch(80% 0.28 120)",
};

export type SpinnerVariantKey =
  | "perimeter-cw"
  | "perimeter-ccw"
  | "perimeter-dual"
  | "rings-out"
  | "rings-in"
  | "pulse"
  | "heartbeat"
  | "sweep-cw"
  | "sweep-ccw"
  | "pinwheel"
  | "snake-h"
  | "snake-v"
  | "scanline-h"
  | "scanline-v"
  | "scanline-bounce"
  | "diagonal-tl"
  | "diagonal-tr"
  | "diagonal-cross"
  | "spiral-in"
  | "spiral-out"
  | "center-burst"
  | "center-implode"
  | "random-twinkle"
  | "matrix-rain"
  | "cross-rotate"
  | "x-rotate";

export const SPINNER_VARIANTS: SpinnerVariantKey[] = [
  "perimeter-cw",
  "perimeter-ccw",
  "perimeter-dual",
  "rings-out",
  "rings-in",
  "pulse",
  "heartbeat",
  "sweep-cw",
  "sweep-ccw",
  "pinwheel",
  "snake-h",
  "snake-v",
  "scanline-h",
  "scanline-v",
  "scanline-bounce",
  "diagonal-tl",
  "diagonal-tr",
  "diagonal-cross",
  "spiral-in",
  "spiral-out",
  "center-burst",
  "center-implode",
  "random-twinkle",
  "matrix-rain",
  "cross-rotate",
  "x-rotate",
];

type Props = {
  variant?: SpinnerVariantKey;
  color?: ColorKey;
  size?: number;
  dotSize?: number;
  gap?: number;
  speed?: number;
  trail?: number;
};

type Cell = [number, number];

const perimeterPath = (N: number, cw: boolean): Cell[] => {
  if (N <= 1) return [[0, 0]];
  const p: Cell[] = [];
  for (let c = 0; c < N; c++) p.push([0, c]);
  for (let r = 1; r < N; r++) p.push([r, N - 1]);
  for (let c = N - 2; c >= 0; c--) p.push([N - 1, c]);
  for (let r = N - 2; r > 0; r--) p.push([r, 0]);
  return cw ? p : p.slice().reverse();
};

const snakeHPath = (N: number): Cell[] => {
  const p: Cell[] = [];
  for (let r = 0; r < N; r++) {
    if (r % 2 === 0) for (let c = 0; c < N; c++) p.push([r, c]);
    else for (let c = N - 1; c >= 0; c--) p.push([r, c]);
  }
  return p;
};

const snakeVPath = (N: number): Cell[] => {
  const p: Cell[] = [];
  for (let c = 0; c < N; c++) {
    if (c % 2 === 0) for (let r = 0; r < N; r++) p.push([r, c]);
    else for (let r = N - 1; r >= 0; r--) p.push([r, c]);
  }
  return p;
};

const spiralInPath = (N: number): Cell[] => {
  const p: Cell[] = [];
  let r0 = 0,
    c0 = 0,
    r1 = N - 1,
    c1 = N - 1;
  while (r0 <= r1 && c0 <= c1) {
    for (let c = c0; c <= c1; c++) p.push([r0, c]);
    for (let r = r0 + 1; r <= r1; r++) p.push([r, c1]);
    if (r0 < r1) for (let c = c1 - 1; c >= c0; c--) p.push([r1, c]);
    if (c0 < c1) for (let r = r1 - 1; r > r0; r--) p.push([r, c0]);
    r0++;
    c0++;
    r1--;
    c1--;
  }
  return p;
};

const buildFrame = (
  variant: SpinnerVariantKey,
  N: number,
  step: number,
): number[] => {
  const f = new Array(N * N).fill(0);
  const idx = (r: number, c: number) => r * N + c;
  const set = (r: number, c: number, v = 1) => {
    if (r < 0 || r >= N || c < 0 || c >= N) return;
    const i = idx(r, c);
    if (v > f[i]) f[i] = v;
  };

  switch (variant) {
    case "perimeter-cw": {
      const path = perimeterPath(N, true);
      const [r, c] = path[((step % path.length) + path.length) % path.length];
      set(r, c, 1);
      return f;
    }
    case "perimeter-ccw": {
      const path = perimeterPath(N, false);
      const [r, c] = path[((step % path.length) + path.length) % path.length];
      set(r, c, 1);
      return f;
    }
    case "perimeter-dual": {
      const path = perimeterPath(N, true);
      const i1 = ((step % path.length) + path.length) % path.length;
      const i2 = (i1 + Math.floor(path.length / 2)) % path.length;
      set(path[i1][0], path[i1][1], 1);
      set(path[i2][0], path[i2][1], 1);
      return f;
    }
    case "rings-out":
    case "rings-in": {
      const maxRing = Math.ceil(N / 2);
      const phase = ((step % maxRing) + maxRing) % maxRing;
      const target = variant === "rings-out" ? phase : maxRing - 1 - phase;
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          const ring = Math.min(r, c, N - 1 - r, N - 1 - c);
          if (ring === target) set(r, c, 1);
        }
      return f;
    }
    case "pulse": {
      const cycle = 6;
      const phase = ((step % cycle) + cycle) % cycle;
      const v = phase < cycle / 2 ? phase / (cycle / 2) : (cycle - phase) / (cycle / 2);
      for (let i = 0; i < f.length; i++) f[i] = v;
      return f;
    }
    case "heartbeat": {
      const cycle = 14;
      const phase = ((step % cycle) + cycle) % cycle;
      const beats = [1, 0.7, 0.3, 0, 1, 0.7, 0.3, 0.1, 0, 0, 0, 0, 0, 0];
      const v = beats[phase] ?? 0;
      for (let i = 0; i < f.length; i++) f[i] = v;
      return f;
    }
    case "sweep-cw":
    case "sweep-ccw": {
      const period = Math.max(8, N * 3);
      const dir = variant === "sweep-cw" ? 1 : -1;
      const angle = (dir * (step / period)) * Math.PI * 2;
      const cx = (N - 1) / 2;
      const cy = (N - 1) / 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          const x = c - cx;
          const y = r - cy;
          const along = x * dx + y * dy;
          const across = Math.abs(x * dy - y * dx);
          if (along >= -0.25) {
            const v = Math.max(0, 1 - across);
            if (v > 0) set(r, c, v);
          }
        }
      return f;
    }
    case "pinwheel": {
      const period = Math.max(8, N * 3);
      const base = (step / period) * Math.PI * 2;
      const cx = (N - 1) / 2;
      const cy = (N - 1) / 2;
      for (let arm = 0; arm < 4; arm++) {
        const a = base + (arm * Math.PI) / 2;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        for (let r = 0; r < N; r++)
          for (let c = 0; c < N; c++) {
            const x = c - cx;
            const y = r - cy;
            const along = x * dx + y * dy;
            const across = Math.abs(x * dy - y * dx);
            if (along >= -0.25) {
              const v = Math.max(0, 1 - across);
              if (v > 0) set(r, c, v);
            }
          }
      }
      return f;
    }
    case "snake-h": {
      const path = snakeHPath(N);
      const [r, c] = path[((step % path.length) + path.length) % path.length];
      set(r, c, 1);
      return f;
    }
    case "snake-v": {
      const path = snakeVPath(N);
      const [r, c] = path[((step % path.length) + path.length) % path.length];
      set(r, c, 1);
      return f;
    }
    case "scanline-h": {
      const row = ((step % N) + N) % N;
      for (let c = 0; c < N; c++) set(row, c, 1);
      return f;
    }
    case "scanline-v": {
      const col = ((step % N) + N) % N;
      for (let r = 0; r < N; r++) set(r, col, 1);
      return f;
    }
    case "scanline-bounce": {
      const period = Math.max(2, 2 * (N - 1));
      let p = ((step % period) + period) % period;
      const row = p < N ? p : period - p;
      for (let c = 0; c < N; c++) set(row, c, 1);
      return f;
    }
    case "diagonal-tl": {
      const period = 2 * N - 1;
      const d = ((step % period) + period) % period;
      for (let r = 0; r < N; r++) {
        const c = d - r;
        if (c >= 0 && c < N) set(r, c, 1);
      }
      return f;
    }
    case "diagonal-tr": {
      const period = 2 * N - 1;
      const d = ((step % period) + period) % period;
      for (let r = 0; r < N; r++) {
        const c = N - 1 - (d - r);
        if (c >= 0 && c < N) set(r, c, 1);
      }
      return f;
    }
    case "diagonal-cross": {
      const period = 2 * N - 1;
      const d = ((step % period) + period) % period;
      for (let r = 0; r < N; r++) {
        const c1 = d - r;
        const c2 = N - 1 - (d - r);
        if (c1 >= 0 && c1 < N) set(r, c1, 1);
        if (c2 >= 0 && c2 < N) set(r, c2, 1);
      }
      return f;
    }
    case "spiral-in": {
      const path = spiralInPath(N);
      const [r, c] = path[((step % path.length) + path.length) % path.length];
      set(r, c, 1);
      return f;
    }
    case "spiral-out": {
      const path = spiralInPath(N).slice().reverse();
      const [r, c] = path[((step % path.length) + path.length) % path.length];
      set(r, c, 1);
      return f;
    }
    case "center-burst":
    case "center-implode": {
      const maxD = Math.ceil(N / 2);
      const phase = ((step % maxD) + maxD) % maxD;
      const target = variant === "center-burst" ? phase : maxD - 1 - phase;
      const cx = (N - 1) / 2;
      const cy = (N - 1) / 2;
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          const d = Math.max(Math.abs(r - cy), Math.abs(c - cx));
          if (Math.abs(d - target) < 0.6) set(r, c, 1);
        }
      return f;
    }
    case "random-twinkle": {
      const total = N * N;
      const lit = Math.max(2, Math.floor(total / 5));
      for (let i = 0; i < lit; i++) {
        const h = ((step * 2654435761) ^ (i * 1597334677)) >>> 0;
        const cell = h % total;
        f[cell] = Math.max(f[cell], 0.5 + ((h >>> 8) % 100) / 200);
      }
      return f;
    }
    case "matrix-rain": {
      const len = N + 3;
      for (let c = 0; c < N; c++) {
        const offset = ((c * 131) ^ (c * 17)) % len;
        const head = (((step + offset) % len) + len) % len;
        if (head < N) set(head, c, 1);
      }
      return f;
    }
    case "cross-rotate":
    case "x-rotate": {
      const period = 8;
      const phase = ((step % period) + period) % period;
      const t = phase / period;
      const baseAngle = variant === "cross-rotate" ? 0 : Math.PI / 4;
      const angle = baseAngle + t * (Math.PI / 2);
      const cx = (N - 1) / 2;
      const cy = (N - 1) / 2;
      const reach = Math.ceil(N);
      for (let k = -reach; k <= reach; k++) {
        const x1 = cx + k * Math.cos(angle);
        const y1 = cy + k * Math.sin(angle);
        const x2 = cx + k * Math.cos(angle + Math.PI / 2);
        const y2 = cy + k * Math.sin(angle + Math.PI / 2);
        set(Math.round(y1), Math.round(x1), 1);
        set(Math.round(y2), Math.round(x2), 1);
      }
      return f;
    }
  }
};

export default function DotSpinnerMatrix({
  variant = "perimeter-cw",
  color = "cyan",
  size = 5,
  dotSize = 20,
  gap = 8,
  speed = 80,
  trail = 4,
}: Props) {
  const intensitiesRef = useRef<number[]>(new Array(size * size).fill(0));
  const stepRef = useRef(0);
  const [, force] = useState(0);

  useEffect(() => {
    intensitiesRef.current = new Array(size * size).fill(0);
    stepRef.current = 0;
    force((t) => t + 1);
  }, [variant, size]);

  useEffect(() => {
    const decay = Math.pow(0.05, 1 / Math.max(1, trail));
    const interval = Math.max(16, speed);
    const id = window.setInterval(() => {
      const frame = buildFrame(variant, size, stepRef.current);
      const cur = intensitiesRef.current;
      for (let i = 0; i < cur.length; i++) {
        const next = Math.max(cur[i] * decay, frame[i] ?? 0);
        cur[i] = next < 0.005 ? 0 : next;
      }
      stepRef.current++;
      force((t) => t + 1);
    }, interval);
    return () => window.clearInterval(id);
  }, [variant, size, speed, trail]);

  const colorCss = COLOR_MAP[color];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, ${dotSize}px)`,
        gridTemplateRows: `repeat(${size}, ${dotSize}px)`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const intensity = intensitiesRef.current[i] ?? 0;
        return (
          <div
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              background: colorCss,
              opacity: intensity,
              transition: `opacity ${Math.max(16, speed)}ms linear`,
              boxShadow:
                intensity > 0.05
                  ? `0 0 ${Math.round(dotSize * 0.55)}px ${colorCss}`
                  : "none",
            }}
          />
        );
      })}
    </div>
  );
}
