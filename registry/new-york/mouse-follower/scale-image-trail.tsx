/**
 * A GSAP image trail that pops each image in with a bouncy scale, then shrinks it away behind the cursor.
 */
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const Images = [
  "https://cdn.cosmos.so/9beb0a06-e008-4b95-a5b8-15c2d255a4c4?format=jpeg",
  "https://cdn.cosmos.so/6a854a1b-5c06-45b1-b055-4a4652ba4e21?format=jpeg",
  "https://cdn.cosmos.so/3c35a1b1-717b-4219-9282-881a762724f2?format=jpeg",
  "https://cdn.cosmos.so/8a6998b4-fce7-48c4-b40c-9b90bcf0007c?format=jpeg",
  "https://cdn.cosmos.so/f798acc8-6bc8-4f2c-ace2-2440f2be4795?format=jpeg",
  "https://cdn.cosmos.so/39a80b7b-29fb-4079-a251-176df0fa15eb?format=jpeg",
];

// Spawn tuning.
const MOVEMENT_THRESHOLD = 100; // px the cursor must travel before a new image
const DELAY_BETWEEN = 70; // ms minimum gap between spawns
const IMG_W = 160;
const IMG_H = 240;

const ScaleImageTrail = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let index = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0; // gsap.ticker.time is in seconds

    const active = new Set<HTMLImageElement>();

    // Listen on the window — an overlay sits on top of this cell in the grid,
    // so a container-scoped listener would never receive the events.
    const handleMouseMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      if (!inside) {
        lastX = x;
        lastY = y;
        return;
      }

      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance < MOVEMENT_THRESHOLD) return;

      const now = gsap.ticker.time * 1000;
      if (now - lastTime < DELAY_BETWEEN) return;

      const el = document.createElement("img");
      el.src = Images[index];
      index = (index + 1) % Images.length;
      el.className = "absolute rounded-sm select-none pointer-events-none";
      el.style.width = `${IMG_W}px`;
      el.style.height = `${IMG_H}px`;
      el.style.objectFit = "cover";
      el.style.left = `${x - IMG_W / 2}px`;
      el.style.top = `${y - IMG_H / 2}px`;
      root.appendChild(el);
      active.add(el);

      // Pop in with a bouncy scale.
      gsap.fromTo(
        el,
        { opacity: 1, scale: 0, rotation: gsap.utils.random(-20, 20) },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }
      );

      // Then shrink away and clean up.
      gsap.to(el, {
        scale: 0,
        duration: 0.6,
        delay: 0.6,
        ease: "power2.in",
        onComplete: () => {
          el.remove();
          active.delete(el);
        },
      });

      lastX = x;
      lastY = y;
      lastTime = now;
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      active.forEach((el) => {
        gsap.killTweensOf(el);
        el.remove();
      });
      active.clear();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {/* Preload so spawned clones appear instantly. */}
      <div className="pointer-events-none absolute h-px w-px opacity-0">
        {Images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" />
        ))}
      </div>
    </div>
  );
};

export default ScaleImageTrail;
