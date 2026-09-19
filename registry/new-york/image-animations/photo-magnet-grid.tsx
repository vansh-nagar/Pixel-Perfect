/**
 * A tidy grid of photos that scatters away from the cursor like same-pole magnets, each tile leaning away in 3D as it flees, then springing back into place.
 */
"use client";

import { useEffect, useRef } from "react";

export type MagnetGridImage = { src: string; alt: string };
export type PhotoMagnetGridProps = {
  images?: MagnetGridImage[];
  className?: string;
  /** Tiles per side. */
  columns?: number;
  /** How far the cursor's influence reaches, as a fraction of the grid's width. */
  reach?: number;
  /** How far a tile directly under the cursor is pushed, in tile widths. */
  strength?: number;
};

const DEMO_IMAGES: MagnetGridImage[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/image-animations/photo-${i + 1}.jpg`,
  alt: `Photo ${i + 1}`,
}));

/** Gap between tiles, as a fraction of one tile. */
const GAP = 0.07;
/** Cap on how far a tile leans, in degrees. */
const MAX_LEAN = 22;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function PhotoMagnetGrid({
  images = DEMO_IMAGES,
  className = "",
  columns = 4,
  reach = 0.45,
  strength = 1.15,
}: PhotoMagnetGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const items = images.length ? images : DEMO_IMAGES;
  const n = clamp(Math.round(columns), 2, 8);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const tiles = [...root.querySelectorAll<HTMLElement>("[data-magnet-tile]")];
    const motion = matchMedia("(prefers-reduced-motion: reduce)");

    let width = root.clientWidth;
    let height = root.clientHeight;
    let tile = 0;
    const rest = tiles.map(() => ({ x: 0, y: 0 }));
    const state = tiles.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));

    const layout = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      const size = Math.min(width, height);
      // n tiles plus n+1 gaps fill the square exactly.
      tile = size / (n + (n + 1) * GAP);
      const gap = tile * GAP;
      const total = n * tile + (n + 1) * gap;
      const originX = (width - total) / 2 + gap;
      const originY = (height - total) / 2 + gap;
      root.style.perspective = `${size * 1.6}px`;
      tiles.forEach((el, i) => {
        const c = i % n;
        const r = Math.floor(i / n);
        rest[i].x = originX + c * (tile + gap);
        rest[i].y = originY + r * (tile + gap);
        el.style.width = `${tile}px`;
        el.style.height = `${tile}px`;
        el.style.borderRadius = `${Math.max(6, tile * 0.14)}px`;
      });
    };

    let px = -1e4;
    let py = -1e4;
    let hasPointer = false;
    let frame = 0;
    let last = 0;
    let visible = true;

    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min(32, now - (last || now)) / 16.667;
      last = now;
      const R = reach * Math.min(width, height);
      const push = strength * tile;
      let energy = 0;

      tiles.forEach((el, i) => {
        const s = state[i];
        let tx = 0;
        let ty = 0;
        if (hasPointer) {
          const cx = rest[i].x + tile / 2;
          const cy = rest[i].y + tile / 2;
          const dx = cx - px;
          const dy = cy - py;
          const d = Math.hypot(dx, dy) || 1;
          // Smooth falloff: full push at the cursor, nothing past the reach.
          const t = Math.max(0, 1 - d / R);
          const f = t * t * push;
          tx = (dx / d) * f;
          ty = (dy / d) * f;
        }
        if (motion.matches) {
          s.x = tx;
          s.y = ty;
          s.vx = s.vy = 0;
        } else {
          // A damped spring toward the pushed position, so tiles overshoot a
          // little on the way out and settle rather than snap on the way back.
          s.vx = (s.vx + (tx - s.x) * 0.16 * dt) * Math.pow(0.78, dt);
          s.vy = (s.vy + (ty - s.y) * 0.16 * dt) * Math.pow(0.78, dt);
          s.x += s.vx * dt;
          s.y += s.vy * dt;
        }
        const disp = Math.hypot(s.x, s.y);
        const lift = Math.min(1, disp / (tile * 0.9));
        // A tile pushed right is being shoved at its left edge, so that edge
        // lifts toward the viewer — positive rotateY. Same logic vertically.
        const leanY = clamp(s.x * 0.35, -MAX_LEAN, MAX_LEAN);
        const leanX = clamp(-s.y * 0.35, -MAX_LEAN, MAX_LEAN);
        el.style.transform = `translate3d(${rest[i].x + s.x}px, ${rest[i].y + s.y}px, ${lift * tile * 0.35}px) rotateX(${leanX}deg) rotateY(${leanY}deg)`;
        el.style.zIndex = String(1 + Math.round(lift * 100));
        energy += Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.x - tx) + Math.abs(s.y - ty);
      });

      if (visible && !document.hidden && energy > 0.05) frame = requestAnimationFrame(draw);
    };

    const wake = () => {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    const move = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      px = event.clientX - rect.left;
      py = event.clientY - rect.top;
      hasPointer = true;
      wake();
    };
    const leave = () => {
      hasPointer = false;
      wake();
    };
    const key = (event: KeyboardEvent) => {
      // Arrow keys walk a virtual cursor across the grid one tile at a time.
      const step = tile * (1 + GAP);
      const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
      const dy = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
      if (dx || dy) {
        event.preventDefault();
        if (!hasPointer) {
          px = width / 2;
          py = height / 2;
        }
        px = clamp(px + dx, 0, width);
        py = clamp(py + dy, 0, height);
        hasPointer = true;
        wake();
      }
      if (event.key === "Escape" || event.key === "Home") leave();
    };

    const resize = new ResizeObserver(() => {
      layout();
      wake();
    });
    resize.observe(root);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    });
    intersection.observe(root);
    const visibility = () => wake();

    root.addEventListener("pointermove", move);
    root.addEventListener("pointerdown", move);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointercancel", leave);
    root.addEventListener("keydown", key);
    root.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", visibility);

    layout();
    wake();

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerdown", move);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointercancel", leave);
      root.removeEventListener("keydown", key);
      root.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", visibility);
    };
  }, [items, n, reach, strength]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Grid of photos that scatter away from the cursor. Arrow keys move the cursor; Escape lets the grid settle."
      tabIndex={0}
      className={`relative aspect-square w-full max-w-[min(90%,26rem)] touch-none select-none text-foreground outline-offset-[-2px] focus-visible:outline-2 ${className}`}
    >
      {Array.from({ length: n * n }, (_, i) => {
        // (column + 2·row) keeps the same photo off every orthogonal neighbour.
        const item = items[(i % n + 2 * Math.floor(i / n)) % items.length];
        return (
          <div
            key={i}
            data-magnet-tile
            className="absolute left-0 top-0 overflow-hidden bg-muted will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}
