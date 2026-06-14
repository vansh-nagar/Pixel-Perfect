/**
 * A GSAP cursor trail where images rotate to follow the cursor's heading and fling off along its path.
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

const MotionTrailSpin = () => {
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
    let lastAngle = 0;

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
      let dx = mouse.x - cache.x;
      let dy = mouse.y - cache.y;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      if (angle > 90 && angle <= 270) angle += 180;
      const clockwise = angle >= lastAngle;
      const startAngle = clockwise ? angle - 10 : angle + 10;
      lastAngle = angle;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist !== 0) {
        dx /= dist;
        dy /= dist;
      }
      dx *= dist / 150;
      dy *= dist / 150;

      z++;
      idx = wrap(idx + 1);
      const el = items[idx];
      gsap.killTweensOf(el);
      gsap
        .timeline()
        .fromTo(
          el,
          {
            opacity: 1,
            filter: "brightness(80%)",
            scale: 0.1,
            zIndex: z,
            x: cache.x - SIZE / 2,
            y: cache.y - SIZE / 2,
            rotation: startAngle,
          },
          {
            duration: 1,
            ease: "power2",
            scale: 1,
            filter: "brightness(100%)",
            x: mouse.x - SIZE / 2 + dx * 70,
            y: mouse.y - SIZE / 2 + dy * 70,
            rotation: angle,
          },
          0
        )
        .to(el, { duration: 0.4, ease: "expo", opacity: 0 }, 0.5)
        .to(el, { duration: 1.5, ease: "power4", x: "+=" + dx * 120, y: "+=" + dy * 120 }, 0.05);
    };

    const render = () => {
      const dist = Math.hypot(mouse.x - last.x, mouse.y - last.y);
      if (inside && dist > THRESHOLD) {
        showNextImage();
        last = { ...mouse };
      }
      cache.x = lerp(cache.x, mouse.x, 0.1);
      cache.y = lerp(cache.y, mouse.y, 0.1);
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

export default MotionTrailSpin;
