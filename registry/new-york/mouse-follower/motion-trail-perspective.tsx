/**
 * A GSAP cursor trail where images tilt in 3D and shift in depth based on the cursor's distance from center.
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

const MotionTrailPerspective = () => {
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
    let cachedRotX = 0;
    let cachedRotY = 0;
    let cachedZ = 0;

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
      const r = root.getBoundingClientRect();
      const cx = r.width / 2;
      const cy = r.height / 2;
      const relX = mouse.x - cx;
      const relY = mouse.y - cy;
      const rotX = -(relY / cy) * 30;
      const rotY = (relX / cx) * 30;
      const proportion = Math.hypot(relX, relY) / Math.hypot(cx, cy);
      const zValue = proportion * 1200 - 600;
      const normalizedZ = (zValue + 600) / 1200;
      const brightness = 0.2 + normalizedZ * 2.3;

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
            z: 0,
            scale: 1 + cachedZ / 1000,
            zIndex: z,
            x: cache.x - SIZE / 2,
            y: cache.y - SIZE / 2,
            rotationX: cachedRotX,
            rotationY: cachedRotY,
            filter: `brightness(${brightness})`,
          },
          {
            duration: 1,
            ease: "expo",
            scale: 1 + zValue / 1000,
            x: mouse.x - SIZE / 2,
            y: mouse.y - SIZE / 2,
            rotationX: rotX,
            rotationY: rotY,
          },
          0
        )
        .to(el, { duration: 0.4, ease: "power2", opacity: 0, z: -800 }, 0.3);

      cachedRotX = rotX;
      cachedRotY = rotY;
      cachedZ = zValue;
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
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ perspective: 1000 }}
    >
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

export default MotionTrailPerspective;
