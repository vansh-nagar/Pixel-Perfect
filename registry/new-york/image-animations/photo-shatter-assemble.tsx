/**
 * One photo tiled into a mosaic that shatters into a drifting 3D cloud on click, parallaxes with the cursor, and reassembles as the next photo.
 */
"use client";

import { useEffect, useRef, useState } from "react";

export type ShatterImage = { src: string; alt: string };
export type PhotoShatterAssembleProps = {
  images?: ShatterImage[];
  className?: string;
  /** Mosaic cells per side. */
  grid?: number;
  /** How far the shards fly, as a fraction of the frame. Above ~0.45 they leave it. */
  spread?: number;
  /** Shatter and reassemble on its own until the user takes over. */
  autoPlay?: boolean;
};

const DEMO_IMAGES: ShatterImage[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/image-animations/photo-${i + 1}.jpg`,
  alt: `Photo ${i + 1}`,
}));

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Deterministic noise so every mount shatters the same way. */
const noise = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export default function PhotoShatterAssemble({
  images = DEMO_IMAGES,
  className = "",
  grid = 4,
  spread = 0.34,
  autoPlay = true,
}: PhotoShatterAssembleProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const actions = useRef<{ toggle: () => void; next: () => void }>({ toggle: () => {}, next: () => {} });
  const [shattered, setShattered] = useState(false);
  const [photo, setPhoto] = useState(0);
  const items = images.length ? images : DEMO_IMAGES;
  const n = clamp(Math.round(grid), 2, 8);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cloud = root.querySelector<HTMLElement>("[data-shatter-cloud]");
    const shards = [...root.querySelectorAll<HTMLElement>("[data-shatter-shard]")];
    if (!cloud) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");

    let size = Math.min(root.clientWidth, root.clientHeight);
    let current = 0;
    let open = false;
    let interacted = false;
    let visible = true;
    let frame = 0;
    let last = 0;
    let autoTimer = 0;
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

    // Each shard's resting cell and its flight target. The target is a point
    // measured from the frame's centre, not an offset from the cell — so the
    // open cloud has a fixed radius and corner shards can't leave the frame.
    const cells = shards.map((_, i) => {
      const c = i % n;
      const r = Math.floor(i / n);
      const cx = (c + 0.5) / n - 0.5;
      const cy = (r + 0.5) / n - 0.5;
      const angle = Math.atan2(cy, cx) + (noise(i) - 0.5) * 0.9;
      const dist = 0.35 + noise(i + 17) * 0.65;
      return {
        c,
        r,
        fx: Math.cos(angle) * dist,
        fy: Math.sin(angle) * dist,
        fz: (noise(i + 41) * 2 - 1),
        rx: (noise(i + 59) * 2 - 1) * 40,
        ry: (noise(i + 73) * 2 - 1) * 40,
        rz: (noise(i + 97) * 2 - 1) * 30,
        // Shards nearer the centre leave first, so the burst rolls outward.
        delay: Math.hypot(cx, cy) * 180,
        p: 0,
        v: 0,
        since: 0,
      };
    });

    const paint = (index: number) => {
      shards.forEach((el, i) => {
        const { c, r } = cells[i];
        el.style.backgroundImage = `url("${items[index].src}")`;
        el.style.backgroundSize = `${n * 100}% ${n * 100}%`;
        el.style.backgroundPosition = `${(c / (n - 1)) * 100}% ${(r / (n - 1)) * 100}%`;
      });
    };

    const layout = () => {
      size = Math.min(root.clientWidth, root.clientHeight);
      root.style.perspective = `${size * 1.5}px`;
      const cell = size / n;
      shards.forEach((el) => {
        el.style.width = `${cell + 0.5}px`;
        el.style.height = `${cell + 0.5}px`;
      });
    };

    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min(32, now - (last || now)) / 16.667;
      last = now;
      const ease = 1 - Math.pow(0.88, dt);
      pointer.sx += (pointer.x - pointer.sx) * ease;
      pointer.sy += (pointer.y - pointer.sy) * ease;

      const cell = size / n;
      const originX = (root.clientWidth - size) / 2;
      const originY = (root.clientHeight - size) / 2;
      const reach = spread * size;
      let energy = 0;
      let openness = 0;

      cells.forEach((s, i) => {
        const target = open ? 1 : 0;
        const started = now - s.since >= s.delay;
        if (motion.matches) {
          s.p = target;
          s.v = 0;
        } else if (started) {
          // Overshoot on the way out reads as a burst; the same spring pulls
          // the shards home with a soft settle.
          s.v = (s.v + (target - s.p) * 0.085 * dt) * Math.pow(0.8, dt);
          s.p += s.v * dt;
        }
        const p = s.p;
        openness += p;
        const restX = originX + s.c * cell;
        const restY = originY + s.r * cell;
        const centreX = originX + size / 2 - cell / 2;
        const centreY = originY + size / 2 - cell / 2;
        const openX = centreX + s.fx * reach;
        const openY = centreY + s.fy * reach;
        const flyZ = s.fz * reach * 0.7;
        // Parallax scales with depth, so far shards drift less than near ones.
        const par = motion.matches ? 0 : p * (0.5 + s.fz * 0.5) * size * 0.1;
        const x = restX + (openX - restX) * p + pointer.sx * par;
        const y = restY + (openY - restY) * p + pointer.sy * par;
        const z = flyZ * p;
        el(i).style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${s.rx * p}deg) rotateY(${s.ry * p}deg) rotateZ(${s.rz * p}deg)`;
        el(i).style.borderRadius = `${p * Math.min(10, cell * 0.16)}px`;
        energy += Math.abs(s.v) + Math.abs(target - s.p);
      });

      // The whole cloud tilts toward the cursor while it is open.
      const tilt = motion.matches ? 0 : openness / cells.length;
      cloud.style.transform = `rotateX(${-pointer.sy * 8 * tilt}deg) rotateY(${pointer.sx * 8 * tilt}deg)`;

      const parallaxMoving = Math.abs(pointer.x - pointer.sx) + Math.abs(pointer.y - pointer.sy) > 0.001;
      if (visible && !document.hidden && (energy > 0.002 || (open && parallaxMoving))) frame = requestAnimationFrame(draw);
    };
    const el = (i: number) => shards[i];

    const wake = () => {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    const setOpen = (value: boolean) => {
      if (open === value) return;
      open = value;
      const now = performance.now();
      cells.forEach((s) => {
        s.since = now;
      });
      if (!open) {
        // Swap while the shards are far and turned, so they land as the next photo.
        current = (current + 1) % items.length;
        paint(current);
        setPhoto(current);
      }
      setShattered(open);
      wake();
    };
    const toggle = () => {
      interacted = true;
      clearTimeout(autoTimer);
      setOpen(!open);
    };
    const next = () => {
      interacted = true;
      clearTimeout(autoTimer);
      if (open) setOpen(false);
      else {
        setOpen(true);
        autoTimer = window.setTimeout(() => setOpen(false), motion.matches ? 0 : 900);
      }
    };
    actions.current = { toggle, next };

    // Left alone, it shatters and reassembles on a loop until someone clicks.
    const schedule = () => {
      clearTimeout(autoTimer);
      if (!autoPlay || interacted || motion.matches) return;
      autoTimer = window.setTimeout(() => {
        if (!visible || document.hidden) return schedule();
        setOpen(true);
        autoTimer = window.setTimeout(() => {
          setOpen(false);
          schedule();
        }, 1700);
      }, 2600);
    };

    const move = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      if (open) wake();
    };
    const leave = () => {
      pointer.x = 0;
      pointer.y = 0;
      if (open) wake();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
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
      } else {
        wake();
        schedule();
      }
    });
    intersection.observe(root);
    const visibility = () => {
      wake();
      schedule();
    };

    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", visibility);

    paint(current);
    layout();
    wake();
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(autoTimer);
      resize.disconnect();
      intersection.disconnect();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", visibility);
      actions.current = { toggle: () => {}, next: () => {} };
    };
  }, [items, n, spread, autoPlay]);

  return (
    <div
      ref={rootRef}
      role="button"
      aria-pressed={shattered}
      aria-label={`${items[photo].alt}: mosaic that shatters on click and reassembles as the next photo. Enter toggles; Right arrow advances.`}
      tabIndex={0}
      onClick={() => actions.current.toggle()}
      className={`relative aspect-square w-full max-w-[min(90%,26rem)] cursor-pointer select-none overflow-visible text-foreground outline-offset-[-2px] focus-visible:outline-2 ${className}`}
    >
      <div data-shatter-cloud className="absolute inset-0 [transform-style:preserve-3d]">
        {Array.from({ length: n * n }, (_, i) => (
          <div
            key={i}
            data-shatter-shard
            className="absolute left-0 top-0 bg-muted bg-no-repeat will-change-transform"
          />
        ))}
      </div>
    </div>
  );
}
