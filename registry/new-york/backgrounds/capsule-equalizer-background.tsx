/**
 * Rounded capsule bars that pulse like an audio equaliser, gathering into drifting diamond silhouettes with split segments and end dots.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface CapsuleEqualizerBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Bar colour. */
  color?: string;
  backgroundColor?: string;
  /** Distance between bar centres in px. */
  spacing?: number;
  speed?: number;
  paused?: boolean;
}

/** Deterministic per-column seed in [0, 1). */
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export default function CapsuleEqualizerBackground({
  children, className = "", style, color = "#111111", backgroundColor = "#ef6a2c",
  spacing = 22, speed = 1, paused = false,
}: CapsuleEqualizerBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const gap = Number.isFinite(spacing) ? Math.max(8, spacing) : 22;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const capsule = (x: number, top: number, bottom: number, w: number) => {
      if (bottom - top < w) {
        // Too short for a bar: draw a dot instead.
        const y = (top + bottom) / 2;
        ctx.moveTo(x + w / 2, y);
        ctx.arc(x, y, w / 2, 0, Math.PI * 2);
        return;
      }
      ctx.roundRect(x - w / 2, top, w, bottom - top, w / 2);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = elapsed;
      const w = gap * 0.46;
      const columns = Math.ceil(width / gap) + 1;
      const originX = (width - (columns - 1) * gap) / 2;
      const mid = height / 2;
      const reach = height * 0.46;
      // Diamond silhouettes: triangular peaks that slide slowly sideways.
      const peaks = [
        { x: 0.22 + 0.06 * Math.sin(t * 0.21), r: 0.2 },
        { x: 0.55 + 0.08 * Math.sin(t * 0.17 + 2), r: 0.26 },
        { x: 0.86 + 0.05 * Math.sin(t * 0.25 + 4), r: 0.18 },
      ];
      ctx.beginPath();
      for (let i = 0; i < columns; i++) {
        const x = originX + i * gap;
        const u = x / width;
        let envelope = 0.08;
        for (const p of peaks) envelope = Math.max(envelope, 1 - Math.abs(u - p.x) / p.r);
        const seed = hash(i + 1);
        // Layered sines at different rates read as a live signal.
        const level = 0.55 + 0.25 * Math.sin(t * 2.3 + i * 0.7 + seed * 6) + 0.2 * Math.sin(t * 3.7 - i * 1.3 + seed * 11);
        const half = reach * envelope * (0.45 + 0.55 * level);
        if (half < w * 0.5) {
          capsule(x, mid - w / 2, mid + w / 2, w);
          continue;
        }
        // Some columns split into segments; the cut drifts, which carves
        // the negative-space shapes through the silhouette.
        const split = seed < 0.45 ? 0 : 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.8 + seed * 20));
        const cut = half * split;
        const space = w * 0.9;
        if (split > 0 && cut > w && half - cut - space > w * 0.5) {
          capsule(x, mid - half, mid - cut - space / 2, w);
          capsule(x, mid - cut + space / 2, mid + cut - space / 2, w);
          capsule(x, mid + cut + space / 2, mid + half, w);
        } else {
          capsule(x, mid - half, mid + half, w);
        }
        // End dots on the taller bars, like punctuation.
        if (seed > 0.7 && envelope > 0.35) {
          capsule(x, mid - half - w * 1.9, mid - half - w * 1.9 + 0.1, w);
          capsule(x, mid + half + w * 1.9, mid + half + w * 1.9 + 0.1, w);
        }
      }
      ctx.fillStyle = color;
      ctx.fill();
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
  }, [color, spacing, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
