/**
 * Op-art stripes in the spirit of Bridget Riley: bold bands that ripple and swell in slow waves, with a magnifying lens under the pointer.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface OpArtStripesBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Stripe colour. */
  color?: string;
  backgroundColor?: string;
  /** Stripes across the full width. */
  stripes?: number;
  speed?: number;
  paused?: boolean;
}

export default function OpArtStripesBackground({
  children, className = "", style, color = "#161616", backgroundColor = "#ffd23f",
  stripes = 30, speed = 1, paused = false,
}: OpArtStripesBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const count = Number.isFinite(stripes) ? Math.max(4, Math.round(stripes)) : 30;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    const pointer = { x: 0, y: 0, strength: 0, target: 0 };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      pointer.strength += (pointer.target - pointer.strength) * 0.08;
      const t = elapsed;
      const band = width / count;
      const amplitude = band * 1.3;
      const lens = Math.min(width, height) * 0.28;
      const step = 4;
      // Horizontal displacement of a stripe edge at (x, y). Because it varies
      // with x, neighbouring edges drift apart and together, so bands swell and pinch.
      const shift = (x: number, y: number) => {
        let d = amplitude * Math.sin(y * 0.017 + x * 0.006 + t * 1.1) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(x * 0.005 - t * 0.4)));
        if (pointer.strength > 0.001) {
          const dx = x + d - pointer.x;
          const dy = y - pointer.y;
          // Push edges away from the pointer: the bands under it look magnified.
          d += dx * 0.5 * pointer.strength * Math.exp(-(dx * dx + dy * dy) / (lens * lens));
        }
        return d;
      };
      ctx.beginPath();
      for (let k = -2; k < count + 2; k++) {
        const left = k * band;
        const right = left + band * 0.5;
        ctx.moveTo(left + shift(left, -step), -step);
        for (let y = 0; y <= height + step; y += step) ctx.lineTo(left + shift(left, y), y);
        for (let y = Math.ceil((height + step) / step) * step; y >= -step; y -= step) ctx.lineTo(right + shift(right, y), y);
        ctx.closePath();
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
      if (reducedMotion.matches) {
        elapsed = 0;
        pointer.target = pointer.strength = 0;
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
      draw();
    };
    const move = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      const rect = host.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.target = 1;
    };
    const leave = () => {
      pointer.target = 0;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    intersection.observe(host);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [color, stripes, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
