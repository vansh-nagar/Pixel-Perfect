/**
 * A night sky where lightning forks down at random moments, each bolt flashing the clouds and branching as it falls.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface LightningStormBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Bolt colour. */
  color?: string;
  background?: string;
  /** Average strikes per second. */
  frequency?: number;
  speed?: number;
  paused?: boolean;
}

type Point = { x: number; y: number };
type Strand = { points: Point[]; weight: number };
type Bolt = { strands: Strand[]; born: number; life: number; origin: Point; phase: number };

/** Midpoint displacement: each pass jags every segment sideways, then halves the jag. */
const displace = (points: Point[], depth: number, magnitude: number, random: () => number) => {
  let current = points;
  let amount = magnitude;
  for (let pass = 0; pass < depth; pass++) {
    const next: Point[] = [current[0]];
    for (let i = 1; i < current.length; i++) {
      const a = current[i - 1];
      const b = current[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = (random() - 0.5) * 2 * amount;
      next.push({ x: (a.x + b.x) / 2 - (dy / len) * off, y: (a.y + b.y) / 2 + (dx / len) * off }, b);
    }
    current = next;
    amount *= 0.55;
  }
  return current;
};

const makeBolt = (width: number, height: number, born: number, random: () => number): Bolt => {
  const origin = { x: width * (0.15 + random() * 0.7), y: -height * 0.04 };
  const target = { x: origin.x + (random() - 0.5) * width * 0.4, y: height * (0.72 + random() * 0.3) };
  const main = displace([origin, target], 7, height * 0.09, random);
  const strands: Strand[] = [{ points: main, weight: 1 }];
  const branches = 2 + Math.floor(random() * 3);
  for (let b = 0; b < branches; b++) {
    const at = Math.floor(main.length * (0.2 + random() * 0.55));
    const start = main[at];
    const heading = Math.atan2(target.y - start.y, target.x - start.x) + (random() < 0.5 ? -1 : 1) * (0.35 + random() * 0.6);
    const len = height * (0.12 + random() * 0.22);
    const end = { x: start.x + Math.cos(heading) * len, y: start.y + Math.sin(heading) * len };
    strands.push({ points: displace([start, end], 5, len * 0.22, random), weight: 0.45 });
  }
  return { strands, born, life: 0.3 + random() * 0.25, origin, phase: random() * Math.PI * 2 };
};

export default function LightningStormBackground({
  children, className = "", style, color = "#e6efff", background = "#04060c",
  frequency = 1.1, speed = 1, paused = false,
}: LightningStormBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const positive = (value: number, fallback: number, min: number) => (Number.isFinite(value) ? Math.max(min, value) : fallback);
    const perSecond = positive(frequency, 1.1, 0.05);
    const rate = positive(speed, 1, 0);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const random = Math.random;
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    let bolts: Bolt[] = [];
    let due: number[] = [0.4];

    const stroke = (strand: Strand, lineWidth: number, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth * strand.weight;
      ctx.beginPath();
      strand.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      bolts = bolts.filter((bolt) => elapsed - bolt.born < bolt.life);
      for (const bolt of bolts) {
        const t = (elapsed - bolt.born) / bolt.life;
        // A hard strike that flickers as it dies, the way a real bolt restrikes.
        const envelope = Math.pow(1 - t, 1.6);
        const flicker = reducedMotion.matches ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(t * 28 + bolt.phase));
        const intensity = envelope * flicker;
        if (t < 0.5) {
          const flash = ctx.createRadialGradient(bolt.origin.x, 0, 0, bolt.origin.x, 0, width * 0.7);
          flash.addColorStop(0, color);
          flash.addColorStop(1, "transparent");
          ctx.globalAlpha = 0.22 * intensity * (1 - t / 0.5);
          ctx.fillStyle = flash;
          ctx.fillRect(0, 0, width, height);
        }
        // Wide, faint pass for the glow; thin, bright pass for the core.
        for (const strand of bolt.strands) stroke(strand, 7, 0.22 * intensity);
        for (const strand of bolt.strands) stroke(strand, 1.8, intensity);
      }
      ctx.globalAlpha = 1;
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      if (due.length && elapsed >= due[0]) {
        due.shift();
        bolts.push(makeBolt(width, height, elapsed, random));
        // Roughly a third of strikes are doubles.
        if (random() < 0.35) due.push(elapsed + 0.08 + random() * 0.12);
        // Exponential gaps: strikes cluster and lull like a real storm.
        due.push(elapsed + -Math.log(1 - random()) / perSecond);
        due.sort((a, b) => a - b);
      }
      draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) {
        // One held bolt, no flicker.
        elapsed = 0;
        bolts = [makeBolt(width, height, -0.05, random)];
        bolts[0].life = 1e9;
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
      bolts = [];
      due = [elapsed + 0.3];
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
  }, [color, frequency, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor: background, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
