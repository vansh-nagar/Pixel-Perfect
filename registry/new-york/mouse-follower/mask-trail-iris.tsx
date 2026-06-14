/**
 * A cursor trail where each image irises open from a growing circular clip-path, then fades.
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

const MaskTrailIris = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = itemsRef.current.filter(Boolean);
    const wrap = gsap.utils.wrap(0, items.length);
    const maxR = Math.hypot(SIZE / 2, SIZE / 2);

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
      const st = { p: 0 };
      const apply = () => {
        el.style.clipPath = `circle(${maxR * st.p}px at 50% 50%)`;
      };
      gsap.set(el, { opacity: 1, scale: 1.12, zIndex: z, x: mouse.x - SIZE / 2, y: mouse.y - SIZE / 2 });
      apply();
      gsap
        .timeline()
        .to(st, { p: 1, duration: 0.55, ease: "power3.out", onUpdate: apply }, 0)
        .to(el, { scale: 1, duration: 0.55, ease: "power3.out" }, 0)
        .to(el, { opacity: 0, duration: 0.45, ease: "power2.in" }, 0.8);
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

export default MaskTrailIris;
