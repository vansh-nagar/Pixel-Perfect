/**
 * A striped sun sinking behind a neon perspective grid that streams toward you, under a sky of slow-twinkling stars.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface SynthwaveHorizonBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Sun and sky tint. */
  accent?: string;
  /** Grid colour. */
  gridColor?: string;
  background?: string;
  speed?: number;
  paused?: boolean;
}

const hexToRgb = (value: string, fallback: string) => {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
};
const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

export default function SynthwaveHorizonBackground({
  children, className = "", style, accent = "#ff2fa8", gridColor = "#2ff0ff", background = "#0d0620",
  speed = 1, paused = false,
}: SynthwaveHorizonBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const bg = hexToRgb(background, "#0d0620");
    const glow = hexToRgb(accent, "#ff2fa8");
    const sunTop = [255, 214, 102];
    const stars = Array.from({ length: 70 }, (_, i) => ({
      x: ((i * 0.618) % 1), y: ((i * 0.377 + 0.11) % 1) * 0.75, rate: 0.6 + (i % 5) * 0.35, phase: i * 1.3,
    }));
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const line = (x0: number, y0: number, x1: number, y1: number, alpha: number) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      // Soft pass then sharp pass stands in for a neon glow without shadowBlur.
      ctx.globalAlpha = alpha * 0.18;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const horizon = height * 0.58;
      const cx = width / 2;

      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, background);
      sky.addColorStop(1, mix(bg, glow, 0.5));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, horizon + 1);

      ctx.fillStyle = "#ffffff";
      for (const star of stars) {
        ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(elapsed * star.rate + star.phase));
        ctx.fillRect(star.x * width, star.y * horizon, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // Sun: a clipped disc with dark bands that thicken toward the bottom and
      // slide down, so it reads as sinking even though it never moves.
      const r = Math.min(width, height) * 0.27;
      const sy = horizon - r * 0.12;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, sy, r, 0, Math.PI * 2);
      ctx.clip();
      const disc = ctx.createLinearGradient(0, sy - r, 0, sy + r);
      disc.addColorStop(0, mix(sunTop, glow, 0));
      disc.addColorStop(1, accent);
      ctx.fillStyle = disc;
      ctx.fillRect(cx - r, sy - r, r * 2, r * 2);
      ctx.fillStyle = mix(bg, glow, 0.5);
      const slide = reducedMotion.matches ? 0 : (elapsed * 0.22) % 1;
      for (let k = 0; k < 9; k++) {
        const p = (k + slide) / 9;
        const y = sy - r * 0.05 + p * r * 1.05;
        ctx.fillRect(cx - r, y, r * 2, 1 + p * p * 15);
      }
      ctx.restore();

      // Ground plane.
      ctx.fillStyle = background;
      ctx.fillRect(0, horizon, width, height - horizon);
      const haze = ctx.createLinearGradient(0, horizon, 0, horizon + (height - horizon) * 0.5);
      haze.addColorStop(0, mix(bg, glow, 0.55));
      haze.addColorStop(1, background);
      ctx.fillStyle = haze;
      ctx.fillRect(0, horizon, width, height - horizon);

      ctx.strokeStyle = gridColor;
      ctx.lineCap = "round";
      for (let u = -14; u <= 14; u++) {
        line(cx + u * width * 0.03, horizon, cx + u * width * 0.34, height + 2, 0.6);
      }
      // Horizontal lines projected from the ground plane: y = horizon + K / z.
      // Sliding z toward 1 streams them at the viewer.
      const frac = reducedMotion.matches ? 0 : (elapsed * rate * 0.9) % 1;
      for (let i = 0; i < 40; i++) {
        const z = 1 + (i + 1 - frac) * 0.42;
        const y = horizon + (height - horizon) / z;
        line(0, y, width, y, Math.min(1, 1.4 / z));
      }
      line(0, horizon, width, horizon, 0.9);
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
  }, [accent, gridColor, background, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
