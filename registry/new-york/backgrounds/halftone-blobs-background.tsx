/**
 * A print-style halftone screen whose dots swell and shrink as unseen blobs drift beneath it — ink on paper.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface HalftoneBlobsBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Ink colour. */
  color?: string;
  /** Paper colour. */
  paperColor?: string;
  /** Distance between dot centres in px. */
  spacing?: number;
  /** How many blobs drift under the screen. */
  blobs?: number;
  speed?: number;
  paused?: boolean;
}

export default function HalftoneBlobsBackground({
  children, className = "", style, color = "#141311", paperColor = "#f2ede3",
  spacing = 11, blobs = 5, speed = 1, paused = false,
}: HalftoneBlobsBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const gap = positive(spacing, 11, 4);
    const count = Math.round(positive(blobs, 5, 1));
    const rate = positive(speed, 1, 0);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let frameNumber = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    // Each blob wanders on its own Lissajous path, so they cross and merge
    // without ever repeating exactly.
    const paths = Array.from({ length: count }, (_, i) => ({
      ax: 0.55 + 0.4 * ((i * 7) % 5) / 5,
      ay: 0.4 + 0.5 * ((i * 3) % 4) / 4,
      fx: 0.11 + 0.05 * ((i * 5) % 3),
      fy: 0.09 + 0.06 * ((i * 2) % 4),
      phase: i * 1.7,
      radius: 0.18 + 0.12 * ((i * 4) % 3) / 3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const base = Math.min(width, height);
      const centres = paths.map((p) => ({
        x: width / 2 + Math.sin(elapsed * p.fx + p.phase) * p.ax * width * 0.45,
        y: height / 2 + Math.cos(elapsed * p.fy + p.phase * 0.7) * p.ay * height * 0.45,
        r: p.radius * base,
      }));
      ctx.fillStyle = color;
      ctx.beginPath();
      const rows = Math.ceil(height / gap) + 1;
      const columns = Math.ceil(width / gap) + 2;
      const maxRadius = gap * 0.58;
      for (let row = 0; row < rows; row++) {
        // Alternate rows shift half a step so the screen reads as a
        // hexagonal lattice rather than a square one.
        const offset = row % 2 ? gap / 2 : 0;
        const y = row * gap;
        for (let column = 0; column < columns; column++) {
          const x = column * gap + offset;
          // Metaball field: inverse-square contributions, summed.
          let v = 0;
          for (let i = 0; i < centres.length; i++) {
            const dx = x - centres[i].x;
            const dy = y - centres[i].y;
            v += (centres[i].r * centres[i].r) / (dx * dx + dy * dy + 1);
          }
          // Soft base tone so the paper is never completely empty.
          const t = Math.min(1, v * 0.42 + 0.05);
          const r = Math.sqrt(t) * maxRadius;
          if (r < 0.35) continue;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
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
  }, [color, spacing, blobs, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: paperColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
