/**
 * A GSAP cursor trail where each image lands as a 3x3 grid of tiles that scatter and fade apart.
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
const SIZE = 160;
const THRESHOLD = 80;
const ROWS = 3;
const COLS = 3;

const CLIPS = Array.from({ length: ROWS * COLS }, (_, i) => {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  const top = `${(100 / ROWS) * row}%`;
  const bottom = `${(100 / ROWS) * (row + 1)}%`;
  const left = `${(100 / COLS) * col}%`;
  const right = `${(100 / COLS) * (col + 1)}%`;
  return `polygon(${left} ${top}, ${right} ${top}, ${right} ${bottom}, ${left} ${bottom})`;
});

const MotionTrailTile = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = itemsRef.current.filter(Boolean);
    const wrap = gsap.utils.wrap(0, items.length);
    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

    let mouse = { x: 0, y: 0 };
    let last = { x: 0, y: 0 };
    let cache = { x: 0, y: 0 };
    let inside = false;
    let idx = 0;
    let z = 1;

    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const nowInside = x >= 0 && x <= r.width && y >= 0 && y <= r.height;
      if (nowInside && !inside) {
        mouse = last = cache = { x, y };
      } else {
        mouse = { x, y };
      }
      inside = nowInside;
    };

    const showNextImage = () => {
      z++;
      idx = wrap(idx + 1);
      const el = items[idx];
      const tiles = el.children;
      gsap.killTweensOf(tiles);
      gsap
        .timeline()
        .set(el, { opacity: 1, zIndex: z, x: mouse.x - SIZE / 2, y: mouse.y - SIZE / 2 }, 0)
        .set(tiles, { x: 0, y: 0, scale: 1, opacity: 1 }, 0)
        .to(
          tiles,
          {
            duration: 0.3,
            ease: "power3",
            x: () => gsap.utils.random(-20, 20),
            y: () => gsap.utils.random(-20, 20),
            opacity: 0,
            scale: () => gsap.utils.random(0.7, 1),
            stagger: { each: 0.01, from: "random" },
            onComplete: () => gsap.set(el, { opacity: 0 }),
          },
          0.05
        );
    };

    const render = () => {
      const dist = Math.hypot(mouse.x - last.x, mouse.y - last.y);
      cache.x = lerp(cache.x, mouse.x, 0.3);
      cache.y = lerp(cache.y, mouse.y, 0.3);
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
      items.forEach((el) => gsap.killTweensOf(el.children));
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
          className="absolute left-0 top-0 opacity-0"
          style={{ width: SIZE, height: SIZE }}
        >
          {CLIPS.map((clip, j) => (
            <div
              key={j}
              className="absolute inset-0 rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${src})`, clipPath: clip }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MotionTrailTile;
