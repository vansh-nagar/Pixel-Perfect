/**
 * A cursor trail where each image bursts open from a growing, spinning sparkle clip-path, then fades.
 */
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const IMAGES = [
  "https://cdn.cosmos.so/9beb0a06-e008-4b95-a5b8-15c2d255a4c4?format=jpeg",
  "https://cdn.cosmos.so/6a854a1b-5c06-45b1-b055-4a4652ba4e21?format=jpeg",
  "https://cdn.cosmos.so/3c35a1b1-717b-4219-9282-881a762724f2?format=jpeg",
  "https://cdn.cosmos.so/8a6998b4-fce7-48c4-b40c-9b90bcf0007c?format=jpeg",
  "https://cdn.cosmos.so/f798acc8-6bc8-4f2c-ace2-2440f2be4795?format=jpeg",
  "https://cdn.cosmos.so/39a80b7b-29fb-4079-a251-176df0fa15eb?format=jpeg",
];
const POOL = [...IMAGES, ...IMAGES];
const SIZE = 150;
const THRESHOLD = 85;

// The sparkle, authored in an 18x18 box centered on (9, 9).
const STAR_PATH =
  "M7.71519 0.738646C7.93701 -0.246165 9.34033 -0.246182 9.56216 0.738628C10.3456 4.21619 13.0612 6.9319 16.5388 7.71526C17.5236 7.93711 17.5236 9.34048 16.5388 9.56233C13.0612 10.3457 10.3456 13.0613 9.56216 16.5389C9.34033 17.5237 7.93701 17.5237 7.71519 16.5389C6.93176 13.0613 4.21616 10.3457 0.738557 9.56233C-0.246299 9.34048 -0.246299 7.93711 0.738557 7.71526C4.21599 6.9319 6.93176 4.21619 7.71519 0.738646Z";
const STAR_CENTER = 9;
const STAR_NUMS = STAR_PATH.match(/-?\d*\.?\d+/g)!.map(Number);

// Scale + rotate the path around (cx, cy), in CSS pixels.
const starClip = (s: number, rotation: number, cx: number, cy: number) => {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const out: number[] = [];
  for (let k = 0; k < STAR_NUMS.length; k += 2) {
    const dx = (STAR_NUMS[k] - STAR_CENTER) * s;
    const dy = (STAR_NUMS[k + 1] - STAR_CENTER) * s;
    out.push(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
  }
  let j = 0;
  const d = STAR_PATH.replace(/-?\d*\.?\d+/g, () => out[j++].toFixed(2));
  return `path("${d}")`;
};

const CX = SIZE / 2;
const MAX_SCALE = (Math.hypot(CX, CX) / 4.5) * 1.15;

const MaskTrailStar = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = itemsRef.current.filter(Boolean);
    const wrap = gsap.utils.wrap(0, items.length);

    let mouse = { x: 0, y: 0 };
    let last = { x: 0, y: 0 };
    let inside = false;
    let idx = 0;
    let z = 1;

    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const nowInside = x >= 0 && x <= r.width && y >= 0 && y <= r.height;
      if (nowInside && !inside) mouse = last = { x, y };
      else mouse = { x, y };
      inside = nowInside;
    };

    const showNextImage = () => {
      z++;
      idx = wrap(idx + 1);
      const el = items[idx];
      gsap.killTweensOf(el);
      const st = { s: 0, r: 20 };
      const apply = () => {
        el.style.clipPath = starClip(st.s, st.r, CX, CX);
      };
      gsap.set(el, { opacity: 1, scale: 1.12, zIndex: z, x: mouse.x - SIZE / 2, y: mouse.y - SIZE / 2 });
      apply();
      gsap
        .timeline()
        .to(st, { s: MAX_SCALE, r: 0, duration: 0.6, ease: "power4.inOut", onUpdate: apply }, 0)
        .to(el, { scale: 1, duration: 0.6, ease: "power4.inOut" }, 0)
        .to(el, { opacity: 0, duration: 0.45, ease: "power2.in" }, 0.85);
    };

    const render = () => {
      const dist = Math.hypot(mouse.x - last.x, mouse.y - last.y);
      if (inside && dist > THRESHOLD) {
        showNextImage();
        last = { ...mouse };
      }
    };

    window.addEventListener("mousemove", onMove);
    gsap.ticker.add(render);
    return () => {
      window.removeEventListener("mousemove", onMove);
      gsap.ticker.remove(render);
      items.forEach((el) => gsap.killTweensOf(el));
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {POOL.map((src, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) itemsRef.current[i] = el;
          }}
          className="absolute left-0 top-0 bg-cover bg-center opacity-0"
          style={{ width: SIZE, height: SIZE, backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
};

export default MaskTrailStar;
