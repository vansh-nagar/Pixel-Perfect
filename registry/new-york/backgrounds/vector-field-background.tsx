/**
 * A living vector-field plot: a grid of short strokes that turn to follow a drifting flow and swirl into a vortex around the pointer.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface VectorFieldBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Stroke colour. */
  color?: string;
  backgroundColor?: string;
  /** Distance between stroke centres in px. */
  spacing?: number;
  speed?: number;
  paused?: boolean;
}

/** Moves angle `a` toward angle `b` by `w`, the short way round. */
const blendAngle = (a: number, b: number, w: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * w;

export default function VectorFieldBackground({
  children, className = "", style, color = "#9fe870", backgroundColor = "#0e1116",
  spacing = 18, speed = 1, paused = false,
}: VectorFieldBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const gap = Number.isFinite(spacing) ? Math.max(8, spacing) : 18;
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
      const radius = Math.min(width, height) * 0.3;
      const columns = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;
      const originX = (width - (columns - 1) * gap) / 2;
      const originY = (height - (rows - 1) * gap) / 2;
      // Two buckets, faint and bright, so each is one stroke call.
      const faint = new Path2D();
      const bright = new Path2D();
      for (let row = 0; row < rows; row++) {
        const y = originY + row * gap;
        for (let column = 0; column < columns; column++) {
          const x = originX + column * gap;
          // Layered sines stand in for noise: smooth, cheap and never quite repeating.
          let angle = (Math.sin(x * 0.0061 + t * 0.35) + Math.cos(y * 0.0073 - t * 0.28) + Math.sin((x - y) * 0.0032 + t * 0.21)) * 1.6;
          // Flow strength here; it drives stroke length and brightness.
          let magnitude = 0.5 + 0.5 * Math.sin(x * 0.004 + y * 0.005 + t * 0.5 + Math.cos(y * 0.003 - t * 0.2) * 2);
          if (pointer.strength > 0.001) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const w = pointer.strength * Math.exp(-(dx * dx + dy * dy) / (radius * radius));
            // Tangent to the circle around the pointer, so strokes orbit it.
            angle = blendAngle(angle, Math.atan2(dy, dx) + Math.PI / 2, w);
            magnitude += (1 - magnitude) * w;
          }
          const length = gap * (0.16 + 0.3 * magnitude);
          const ux = Math.cos(angle) * length;
          const uy = Math.sin(angle) * length;
          const path = magnitude > 0.55 ? bright : faint;
          path.moveTo(x - ux, y - uy);
          path.lineTo(x + ux, y + uy);
        }
      }
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.2, gap * 0.09);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.32;
      ctx.stroke(faint);
      ctx.globalAlpha = 1;
      ctx.stroke(bright);
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
  }, [color, spacing, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
