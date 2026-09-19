/**
 * A flyover of wireframe mountains: a 3D mesh streams toward the viewer with near ridges hiding the far ones, like an 80s vector display.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface WireframeTerrainBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Wire colour. */
  color?: string;
  background?: string;
  /** Mesh columns across the width. */
  columns?: number;
  /** Mesh rows into the distance. */
  rows?: number;
  /** Mountain height, in cells. */
  amplitude?: number;
  speed?: number;
  paused?: boolean;
}

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};

export default function WireframeTerrainBackground({
  children, className = "", style, color = "#7cf5c1", background = "#050a09",
  columns = 40, rows = 26, amplitude = 4.4, speed = 1, paused = false,
}: WireframeTerrainBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const cols = Math.round(positive(columns, 40, 6));
    const depth = Math.round(positive(rows, 26, 4));
    const amp = positive(amplitude, 4.4, 0);
    const rate = positive(speed, 1, 0);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const near = 2;
    let width = 0;
    let height = 0;
    let frame = 0;
    let frameNumber = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    const projected: { x: number; y: number }[][] = [];

    // A valley down the middle with mountains at the sides, so the viewer
    // flies through rather than over.
    const heightAt = (wx: number, wz: number) => {
      const n = noise(wx * 0.16, wz * 0.16) * 0.7 + noise(wx * 0.37 + 5, wz * 0.37) * 0.3;
      const side = Math.pow(Math.abs(wx) / (cols / 2), 1.5);
      return (n - 0.12) * amp * (0.3 + side * 1.5);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const horizon = height * 0.44;
      const cx = width / 2;
      const focal = width * 0.11;
      // Camera height chosen so the nearest row lands at the bottom edge.
      const camera = ((height - horizon) * near) / focal;
      const travel = elapsed * rate * 2.2;
      const slide = travel % 1;
      const base = Math.floor(travel);
      for (let r = 0; r < depth; r++) {
        const z = near + r - slide;
        const row = (projected[r] ??= []);
        for (let c = 0; c <= cols; c++) {
          const wx = c - cols / 2;
          const h = heightAt(wx, r + base);
          row[c] = { x: cx + (wx * focal) / z, y: horizon + ((camera - h) * focal) / z };
        }
      }
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.fillStyle = background;
      // Far to near: each strip is filled with the background before it is
      // stroked, so nearer ridges hide whatever is behind them.
      for (let r = depth - 2; r >= 0; r--) {
        const nearRow = projected[r];
        const farRow = projected[r + 1];
        const alpha = 0.18 + 0.82 * Math.pow(1 - r / depth, 1.4);
        ctx.beginPath();
        nearRow.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        for (let c = cols; c >= 0; c--) ctx.lineTo(farRow[c].x, farRow[c].y);
        ctx.closePath();
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        nearRow.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        for (let c = 0; c <= cols; c += 2) {
          ctx.moveTo(nearRow[c].x, nearRow[c].y);
          ctx.lineTo(farRow[c].x, farRow[c].y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Fog at the horizon.
      const fog = ctx.createLinearGradient(0, horizon - height * 0.05, 0, horizon + height * 0.18);
      fog.addColorStop(0, background);
      fog.addColorStop(1, "transparent");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, width, horizon + height * 0.18);
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1);
      previous = now;
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
  }, [color, background, columns, rows, amplitude, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
