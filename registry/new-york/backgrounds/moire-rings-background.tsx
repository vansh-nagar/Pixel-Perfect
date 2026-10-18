/**
 * Two sets of concentric rings drifting over each other, their overlap blooming into moiré interference; one set follows the pointer.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface MoireRingsBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Ring colour. */
  color?: string;
  backgroundColor?: string;
  /** Distance between rings in px. */
  spacing?: number;
  speed?: number;
  paused?: boolean;
}

export default function MoireRingsBackground({
  children, className = "", style, color = "#171717", backgroundColor = "#ecebe6",
  spacing = 9, speed = 1, paused = false,
}: MoireRingsBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const gap = Number.isFinite(spacing) ? Math.max(4, spacing) : 9;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    // The second ring set eases toward the pointer, or back to its own orbit.
    const pointer = { x: 0, y: 0, active: false };
    const follower = { x: NaN, y: NaN };

    const rings = (x: number, y: number, phase: number) => {
      const reach = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
      for (let r = phase; r < reach; r += gap) {
        if (r <= 0) continue;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = elapsed;
      const ax = width * (0.5 + 0.22 * Math.sin(t * 0.23));
      const ay = height * (0.5 + 0.2 * Math.cos(t * 0.31));
      const orbitX = width * (0.5 + 0.24 * Math.sin(t * 0.19 + 2.1));
      const orbitY = height * (0.5 + 0.22 * Math.sin(t * 0.27 + 0.6));
      const goalX = pointer.active ? pointer.x : orbitX;
      const goalY = pointer.active ? pointer.y : orbitY;
      if (Number.isNaN(follower.x) || reducedMotion.matches) {
        follower.x = goalX;
        follower.y = goalY;
      } else {
        follower.x += (goalX - follower.x) * 0.07;
        follower.y += (goalY - follower.y) * 0.07;
      }
      // Rings flow outward from one centre and inward toward the other.
      const flow = (t * 6) % gap;
      ctx.beginPath();
      rings(ax, ay, flow);
      rings(follower.x, follower.y, gap - flow);
      ctx.lineWidth = gap * 0.42;
      ctx.strokeStyle = color;
      ctx.stroke();
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
        pointer.active = false;
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
      pointer.active = true;
    };
    const leave = () => {
      pointer.active = false;
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
