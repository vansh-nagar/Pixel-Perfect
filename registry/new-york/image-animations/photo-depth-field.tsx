/**
 * A cloud of photos hanging at different depths; the cursor steers a gentle parallax, dragging flies you forward through it, and photos stream past to loop back into the distance.
 */
"use client";

import { useEffect, useRef } from "react";

export type DepthFieldImage = { src: string; alt: string };
export type PhotoDepthFieldProps = {
  images?: DepthFieldImage[];
  className?: string;
  /** How many photos hang in the field. */
  count?: number;
  /** Cruising speed when nobody is dragging, in field-lengths per second. */
  drift?: number;
};

const DEMO_IMAGES: DepthFieldImage[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/image-animations/photo-${i + 1}.jpg`,
  alt: `Photo ${i + 1}`,
}));

/** Length of the loop, in depth units. */
const DEPTH = 6;
/** Distance from the camera to the nearest a photo can be before it's behind you. */
const NEAR = 0.45;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const noise = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export default function PhotoDepthField({
  images = DEMO_IMAGES,
  className = "",
  count = 22,
  drift = 0.06,
}: PhotoDepthFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const items = images.length ? images : DEMO_IMAGES;
  const total = clamp(Math.round(count), 4, 60);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>("[data-field-card]")];
    const motion = matchMedia("(prefers-reduced-motion: reduce)");

    // Photos are spaced evenly along the loop with jitter, and kept off the
    // exact centre line so the camera never flies straight through one.
    const field = cards.map((_, i) => {
      const angle = noise(i) * Math.PI * 2;
      const radius = 0.28 + noise(i + 11) * 0.72;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.85,
        z: ((i + noise(i + 23) * 0.6) / total) * DEPTH,
        size: 0.17 + noise(i + 37) * 0.1,
        aspect: [1, 0.78, 1.28][i % 3],
      };
    });

    let width = root.clientWidth;
    let height = root.clientHeight;
    let camZ = 0;
    let velocity = 0;
    const look = { x: 0, y: 0, sx: 0, sy: 0 };
    let pointer: number | null = null;
    let previousY = 0;
    let dragging = false;
    let visible = true;
    let frame = 0;
    let last = 0;

    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min(32, now - (last || now)) / 16.667;
      last = now;

      if (motion.matches) velocity = 0;
      else {
        // Cruise while idle; dragging adds to that and bleeds off with friction.
        if (!dragging) camZ += (drift * DEPTH) / 60 * dt;
        camZ += velocity * dt;
        velocity *= Math.pow(0.93, dt);
      }
      camZ = ((camZ % DEPTH) + DEPTH) % DEPTH;

      const ease = motion.matches ? 1 : 1 - Math.pow(0.9, dt);
      look.sx += (look.x - look.sx) * ease;
      look.sy += (look.y - look.sy) * ease;

      const focal = 1.35;
      const base = Math.min(width, height);

      cards.forEach((card, i) => {
        const p = field[i];
        // Distance ahead of the camera, wrapped so the field loops seamlessly.
        const ahead = (((p.z - camZ) % DEPTH) + DEPTH) % DEPTH;
        const scale = focal / (ahead + NEAR);
        // Parallax: the camera looks toward the cursor, and near photos swing
        // across the frame more than far ones.
        const sx = (p.x - look.sx * 0.35) * scale * base * 0.7;
        const sy = (p.y - look.sy * 0.35) * scale * base * 0.7;
        const w = p.size * base * scale;
        const h = w / p.aspect;
        // Fade in from the far end, fade out as it passes the camera.
        const fadeIn = clamp((DEPTH - ahead) / 1.4, 0, 1);
        const fadeOut = clamp((ahead - 0.05) / 0.4, 0, 1);
        card.style.width = `${w}px`;
        card.style.height = `${h}px`;
        card.style.transform = `translate3d(${width / 2 + sx - w / 2}px, ${height / 2 + sy - h / 2}px, 0)`;
        card.style.opacity = String(fadeIn * fadeOut);
        card.style.zIndex = String(Math.round((DEPTH - ahead) * 1000));
        card.style.borderRadius = `${Math.min(18, w * 0.09)}px`;
      });

      const looking = Math.abs(look.x - look.sx) + Math.abs(look.y - look.sy) > 0.0005;
      const flying = Math.abs(velocity) > 0.00005 || (!motion.matches && !dragging);
      if (visible && !document.hidden && (flying || looking || dragging)) frame = requestAnimationFrame(draw);
    };

    const wake = () => {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = event.pointerId;
      previousY = event.clientY;
      dragging = true;
      root.setPointerCapture(event.pointerId);
      root.style.cursor = "grabbing";
      wake();
    };
    const move = (event: PointerEvent) => {
      // Steering is a hover thing. While dragging, the drag is the only input,
      // otherwise pulling down to fly forward also shoves the whole field up.
      if (!dragging) {
        const rect = root.getBoundingClientRect();
        look.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        look.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      }
      if (pointer === event.pointerId) {
        const dy = event.clientY - previousY;
        previousY = event.clientY;
        // Pull down to fly forward, like dragging the world toward you.
        if (motion.matches) camZ += dy * 0.01;
        else velocity += dy * 0.0022;
      }
      wake();
    };
    const up = (event: PointerEvent) => {
      if (pointer !== event.pointerId) return;
      pointer = null;
      dragging = false;
      root.style.cursor = "grab";
      if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
      wake();
    };
    const leave = () => {
      look.x = 0;
      look.y = 0;
      wake();
    };
    const key = (event: KeyboardEvent) => {
      const step = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1 : event.key === "ArrowDown" || event.key === "ArrowLeft" ? -1 : 0;
      if (step) {
        event.preventDefault();
        if (motion.matches) camZ += step * 0.6;
        else velocity += step * 0.05;
        wake();
      }
      if (event.key === "Home") {
        event.preventDefault();
        camZ = 0;
        velocity = 0;
        wake();
      }
    };

    const resize = new ResizeObserver(() => {
      width = root.clientWidth;
      height = root.clientHeight;
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

    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("lostpointercapture", up);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", visibility);

    wake();

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("lostpointercapture", up);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", visibility);
    };
  }, [items, total, drift]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Photos floating at different depths. Drag down to fly forward through them; arrow keys also move; Home resets."
      tabIndex={0}
      className={`relative aspect-square w-full max-w-[min(90%,26rem)] cursor-grab touch-none select-none overflow-hidden text-foreground outline-offset-[-2px] focus-visible:outline-2 ${className}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const item = items[(i * 5 + Math.floor(i / items.length)) % items.length];
        return (
          <div
            key={i}
            data-field-card
            className="absolute left-0 top-0 overflow-hidden bg-muted opacity-0 will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}
