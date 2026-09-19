/**
 * A phosphor radar scope: the sweep turns with a fading wake, and contacts ping and decay each time it passes over them.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface RadarSweepBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Phosphor colour. */
  color?: string;
  background?: string;
  /** Number of contacts on the scope. */
  contacts?: number;
  /** Seconds per revolution. */
  period?: number;
  paused?: boolean;
}

const hexToRgb = (value: string, fallback: string) => {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
};

export default function RadarSweepBackground({
  children, className = "", style, color = "#3dff8f", background = "#03100a",
  contacts = 14, period = 4, paused = false,
}: RadarSweepBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const count = Math.round(positive(contacts, 14, 0));
    const revolution = positive(period, 4, 0.5);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const [cr, cg, cb] = hexToRgb(color, "#3dff8f");
    const rgba = (alpha: number) => `rgba(${cr},${cg},${cb},${alpha})`;
    const TAU = Math.PI * 2;
    // Contacts sit on a seeded spread and drift very slowly, so the scope
    // never looks identical two revolutions running.
    const blips = Array.from({ length: count }, (_, i) => ({
      angle: ((i * 2.399) % TAU),
      radius: 0.18 + ((i * 0.618) % 1) * 0.78,
      drift: ((i % 3) - 1) * 0.02,
      lastPing: -1e9,
    }));
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.47;
      const sweep = reducedMotion.matches ? -Math.PI / 3 : (elapsed / revolution) * TAU;

      // Scope rings, spokes, and bearing ticks.
      ctx.strokeStyle = rgba(0.22);
      ctx.lineWidth = 1;
      for (const f of [0.25, 0.5, 0.75, 1]) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, TAU);
        ctx.stroke();
      }
      ctx.beginPath();
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * TAU;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(0.35);
      ctx.beginPath();
      for (let t = 0; t < 72; t++) {
        const a = (t / 72) * TAU;
        const inner = R * (t % 9 === 0 ? 0.94 : 0.975);
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      }
      ctx.stroke();

      // The wake: brightest at the arm, fading back through the last 80°.
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.clip();
      const wake = 1.4;
      // Read the method through an optional type so the fallback branch keeps
      // `ctx` intact — an `in` guard narrows it to never on older lib.dom.
      const conic = (ctx as { createConicGradient?: (start: number, x: number, y: number) => CanvasGradient }).createConicGradient;
      if (conic) {
        const gradient = conic.call(ctx, sweep - wake, cx, cy);
        gradient.addColorStop(0, rgba(0));
        gradient.addColorStop(wake / TAU, rgba(0.34));
        gradient.addColorStop(wake / TAU + 0.001, rgba(0));
        gradient.addColorStop(1, rgba(0));
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      } else {
        for (let i = 0; i < 24; i++) {
          const a0 = sweep - wake + (i / 24) * wake;
          ctx.fillStyle = rgba(0.34 * (i / 24));
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, R, a0, a0 + wake / 24 + 0.01);
          ctx.fill();
        }
      }
      ctx.restore();
      ctx.strokeStyle = rgba(0.9);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.stroke();

      // Contacts light up as the arm crosses them and fade until the next pass.
      for (const blip of blips) {
        const angle = blip.angle + elapsed * blip.drift;
        const delta = ((sweep - angle) % TAU + TAU) % TAU;
        if (delta < 0.08 && elapsed - blip.lastPing > revolution * 0.5) blip.lastPing = elapsed;
        const age = reducedMotion.matches ? 0.4 : elapsed - blip.lastPing;
        const glow = Math.exp(-age * 1.1);
        if (glow < 0.02) continue;
        const x = cx + Math.cos(angle) * blip.radius * R;
        const y = cy + Math.sin(angle) * blip.radius * R;
        ctx.fillStyle = rgba(glow);
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, TAU);
        ctx.fill();
        // An expanding ring that fades: the "ping".
        ctx.strokeStyle = rgba(glow * 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 3 + age * 9, 0, TAU);
        ctx.stroke();
      }

      // Scanlines over the glass.
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1);
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      draw();
      if (!paused && visible && !document.hidden && !reducedMotion.matches) {
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
  }, [color, contacts, period, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
