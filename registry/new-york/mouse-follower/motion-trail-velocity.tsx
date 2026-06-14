/**
 * A GSAP cursor trail whose images grow, brighten, blur and desaturate in proportion to cursor speed.
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
const THRESHOLD = 80;

const MotionTrailVelocity = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = itemsRef.current.filter(Boolean);
    const wrap = gsap.utils.wrap(0, items.length);
    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
    const map = (speed: number, min: number, max: number, maxSpeed: number) =>
      min + (max - min) * Math.min(speed / maxSpeed, 1);

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
      const dx = mouse.x - cache.x;
      const dy = mouse.y - cache.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      z++;
      idx = wrap(idx + 1);
      const el = items[idx];
      const inner = el.firstElementChild as HTMLElement;

      const scaleFactor = map(speed, 0.3, 2, 200);
      const brightness = map(speed, 0, 1.3, 70);
      const blur = map(speed, 20, 0, 90);
      const gray = map(speed, 600, 0, 90);

      gsap.killTweensOf(el);
      gsap
        .timeline()
        .fromTo(
          el,
          { opacity: 1, scale: 0, zIndex: z, x: cache.x - SIZE / 2, y: cache.y - SIZE / 2 },
          {
            duration: 0.8,
            ease: "power3",
            scale: scaleFactor,
            filter: `grayscale(${gray * 100}%) brightness(${brightness * 100}%) blur(${blur}px)`,
            x: mouse.x - SIZE / 2,
            y: mouse.y - SIZE / 2,
          },
          0
        )
        .fromTo(inner, { scale: 2 }, { duration: 0.8, ease: "power3", scale: 1 }, 0)
        .to(el, { duration: 0.4, ease: "power3.in", opacity: 0, scale: 0.2 }, 0.45);
    };

    const render = () => {
      const dist = Math.hypot(mouse.x - last.x, mouse.y - last.y);
      cache.x = lerp(cache.x, mouse.x, 0.1);
      cache.y = lerp(cache.y, mouse.y, 0.1);
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
          className="absolute left-0 top-0 overflow-hidden rounded opacity-0"
          style={{ width: SIZE, height: SIZE }}
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
          />
        </div>
      ))}
    </div>
  );
};

export default MotionTrailVelocity;
