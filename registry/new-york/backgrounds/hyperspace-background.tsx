/**
 * Stars streak past from a vanishing point at warp speed, surging and easing like a ship that can't quite hold a steady throttle.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface HyperspaceBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  background?: string;
  /** How many stars are in flight at once. */
  stars?: number;
  /** Streak length; 0 is dots, 1 is long light-speed trails. */
  warp?: number;
  speed?: number;
  paused?: boolean;
}

type Star = { x: number; y: number; z: number; tint: string };

const TINTS = ["#ffffff", "#ffffff", "#ffffff", "#a9c4ff", "#ffd8a6", "#c6f0ff"];

export default function HyperspaceBackground({
  children, className = "", style, background = "#020308",
  stars = 420, warp = 0.55, speed = 1, paused = false,
}: HyperspaceBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const count = Math.round(positive(stars, 420, 10));
    const trail = Number.isFinite(warp) ? Math.max(0, Math.min(1, warp)) : 0.55;
    const rate = positive(speed, 1, 0);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const spawn = (star: Star, far: boolean) => {
      // Keep a small hole at the centre so nothing pops in on top of the viewer.
      do {
        star.x = Math.random() * 2 - 1;
        star.y = Math.random() * 2 - 1;
      } while (Math.hypot(star.x, star.y) < 0.06);
      star.z = far ? 1 : 0.08 + Math.random() * 0.92;
      star.tint = TINTS[Math.floor(Math.random() * TINTS.length)];
    };
    const field: Star[] = Array.from({ length: count }, () => {
      const star = { x: 0, y: 0, z: 1, tint: "#fff" };
      spawn(star, false);
      return star;
    });

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const focal = Math.min(width, height) * 0.9;
      // Throttle that surges and eases rather than holding one speed.
      const surge = reducedMotion.matches ? 0 : 0.55 * (1 + 0.4 * Math.sin(elapsed * 0.6) + 0.15 * Math.sin(elapsed * 1.7));
      const step = surge * dt;
      ctx.lineCap = "round";
      for (const star of field) {
        if (step > 0) {
          star.z -= step;
          if (star.z <= 0.02) spawn(star, true);
        }
        const near = 1 - star.z;
        const sx = cx + (star.x / star.z) * focal;
        const sy = cy + (star.y / star.z) * focal;
        // The tail sits where the star was a moment ago, further down the line
        // from the vanishing point.
        const tz = Math.min(1, star.z + (0.02 + trail * 0.12) * star.z + trail * 0.02);
        const tx = cx + (star.x / tz) * focal;
        const ty = cy + (star.y / tz) * focal;
        ctx.strokeStyle = star.tint;
        ctx.globalAlpha = Math.min(1, 0.18 + near * 0.9);
        ctx.lineWidth = 0.7 + near * near * 2.6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Vignette pulls the eye to the vanishing point.
      const vignette = ctx.createRadialGradient(cx, cy, Math.min(width, height) * 0.45, cx, cy, Math.max(width, height) * 0.8);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.1) * rate;
      elapsed += dt;
      previous = now;
      draw(dt);
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      draw(0);
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
      draw(0);
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
  }, [background, stars, warp, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
