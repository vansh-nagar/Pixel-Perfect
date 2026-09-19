/**
 * A wall of cubes tiled with one photo; sweep the cursor across it and each cube flips to reveal the next photo piece by piece, until the whole wall has turned over.
 */
"use client";

import { useEffect, useRef } from "react";

export type FlipWallImage = { src: string; alt: string };
export type PhotoFlipWallProps = {
  images?: FlipWallImage[];
  className?: string;
  /** Cubes per side. */
  columns?: number;
  /** Milliseconds for one cube to turn over. */
  flipDuration?: number;
  /** Run a diagonal sweep on its own whenever the cursor is away. */
  autoSweep?: boolean;
};

const DEMO_IMAGES: FlipWallImage[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/image-animations/photo-${i + 1}.jpg`,
  alt: `Photo ${i + 1}`,
}));

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function PhotoFlipWall({
  images = DEMO_IMAGES,
  className = "",
  columns = 5,
  flipDuration = 720,
  autoSweep = true,
}: PhotoFlipWallProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const items = images.length ? images : DEMO_IMAGES;
  const n = clamp(Math.round(columns), 2, 10);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cubes = [...root.querySelectorAll<HTMLElement>("[data-flip-cube]")];
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const duration = Number.isFinite(flipDuration) ? Math.max(80, flipDuration) : 720;

    // Alternating axes give the wall a woven look as it turns over.
    const cells = cubes.map((cube, i) => {
      const c = i % n;
      const r = Math.floor(i / n);
      const faces = [...cube.querySelectorAll<HTMLElement>("[data-flip-face]")];
      return { c, r, faces, axis: (c + r) % 2 === 0 ? "X" : "Y", turns: 0, photo: 0, lastFlip: -1e9 };
    });

    const paintFace = (face: HTMLElement, c: number, r: number, photo: number) => {
      face.style.backgroundImage = `url("${items[photo].src}")`;
      face.style.backgroundSize = `${n * 100}% ${n * 100}%`;
      face.style.backgroundPosition = `${(c / (n - 1)) * 100}% ${(r / (n - 1)) * 100}%`;
    };

    let size = Math.min(root.clientWidth, root.clientHeight);
    let hovering = false;
    let visible = true;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const layout = () => {
      size = Math.min(root.clientWidth, root.clientHeight);
      root.style.perspective = `${size * 1.4}px`;
      const cell = size / n;
      const originX = (root.clientWidth - size) / 2;
      const originY = (root.clientHeight - size) / 2;
      cells.forEach(({ c, r, faces, axis }, i) => {
        const cube = cubes[i];
        cube.style.width = `${cell}px`;
        cube.style.height = `${cell}px`;
        cube.style.left = `${originX + c * cell}px`;
        cube.style.top = `${originY + r * cell}px`;
        // The back face is pre-turned on the same axis the cube flips on, so
        // it faces the viewer exactly when the cube has done a half turn.
        faces[1].style.transform = `rotate${axis}(180deg)`;
      });
    };

    const flip = (i: number, now: number) => {
      const cell = cells[i];
      // One flip has to finish before the same cube can go again.
      if (now - cell.lastFlip < duration + 160) return;
      cell.lastFlip = now;
      const hiddenFace = cell.faces[(cell.turns + 1) % 2];
      cell.photo = (cell.photo + 1) % items.length;
      paintFace(hiddenFace, cell.c, cell.r, cell.photo);
      cell.turns += 1;
      const cube = cubes[i];
      cube.style.transitionDuration = motion.matches ? "0ms" : `${duration}ms`;
      cube.style.transform = `rotate${cell.axis}(${cell.turns * 180}deg)`;
    };

    const sweep = () => {
      const now = performance.now();
      cells.forEach((cell, i) => {
        // Diagonal wave from the top-left corner.
        later(() => flip(i, performance.now()), (cell.c + cell.r) * 70 + (now % 1));
      });
    };

    let autoTimer = 0;
    const schedule = () => {
      clearTimeout(autoTimer);
      if (!autoSweep) return;
      autoTimer = window.setTimeout(() => {
        if (visible && !document.hidden && !hovering) sweep();
        schedule();
      }, 3200 + (n * 2 * 70));
    };

    const move = (event: PointerEvent) => {
      hovering = true;
      const rect = root.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const cell = size / n;
      const originX = (rect.width - size) / 2;
      const originY = (rect.height - size) / 2;
      const now = performance.now();
      cells.forEach(({ c, r }, i) => {
        const cx = originX + (c + 0.5) * cell;
        const cy = originY + (r + 0.5) * cell;
        if (Math.hypot(cx - px, cy - py) < cell * 0.75) flip(i, now);
      });
    };
    const leave = () => {
      hovering = false;
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        sweep();
      }
    };

    const resize = new ResizeObserver(layout);
    resize.observe(root);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(root);

    root.addEventListener("pointermove", move);
    root.addEventListener("pointerdown", move);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointercancel", leave);
    root.addEventListener("keydown", key);

    cells.forEach(({ c, r, faces }) => {
      paintFace(faces[0], c, r, 0);
      paintFace(faces[1], c, r, 1 % items.length);
    });
    layout();
    schedule();

    return () => {
      clearTimeout(autoTimer);
      timers.forEach((id) => clearTimeout(id));
      resize.disconnect();
      intersection.disconnect();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerdown", move);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointercancel", leave);
      root.removeEventListener("keydown", key);
    };
  }, [items, n, flipDuration, autoSweep]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={`Wall of cubes showing ${items[0].alt}; sweeping the cursor flips them to the next photo. Enter runs a full sweep.`}
      tabIndex={0}
      className={`relative aspect-square w-full max-w-[min(90%,26rem)] touch-none select-none text-foreground outline-offset-[-2px] focus-visible:outline-2 ${className}`}
    >
      {Array.from({ length: n * n }, (_, i) => (
        <div
          key={i}
          data-flip-cube
          className="absolute [transform-style:preserve-3d] transition-transform ease-[cubic-bezier(.2,.7,.2,1)] will-change-transform"
        >
          <div data-flip-face className="absolute inset-px rounded-[3px] bg-muted bg-no-repeat [backface-visibility:hidden]" />
          <div data-flip-face className="absolute inset-px rounded-[3px] bg-muted bg-no-repeat [backface-visibility:hidden]" />
        </div>
      ))}
    </div>
  );
}
