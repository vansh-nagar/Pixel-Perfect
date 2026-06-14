/**
 * A GSAP image trail where images cascade from the cursor, fall, and bounce off the bottom edge.
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

const GravityImageTrail = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let incr = 0;
    let oldX = 0;
    let oldY = 0;
    let imgIndex = 0;

    // Track the elements/timelines we spawn so we can clean up on unmount.
    const active = new Set<{ el: HTMLImageElement; tl: gsap.core.Timeline }>();

    const createMedia = (x: number, y: number, deltaX: number) => {
      const H = root.clientHeight;
      // Skip if spawned too close to the floor — there's no room to fall/bounce.
      if (y > H - H * 0.2) return;

      const el = document.createElement("img");
      el.src = Images[imgIndex];
      el.className = "absolute left-0 top-0 w-24 select-none pointer-events-none";
      imgIndex = (imgIndex + 1) % Images.length;
      root.appendChild(el);

      const entry = { el, tl: gsap.timeline() };
      const tl = entry.tl;
      active.add(entry);
      tl.eventCallback("onComplete", () => {
        tl.kill();
        el.remove();
        active.delete(entry);
      });

      // Appear with an elastic pop.
      tl.fromTo(
        el,
        {
          xPercent: -50 + (Math.random() - 0.5) * 80,
          yPercent: -50 + (Math.random() - 0.5) * 10,
          scaleX: 1.3,
          scaleY: 1.3,
          rotation: (Math.random() - 0.5) * 20,
        },
        {
          scaleX: 1,
          scaleY: 1,
          ease: "elastic.out(2, 0.6)",
          duration: 0.4,
        }
      );

      // Drift horizontally in the cursor's direction of travel.
      tl.fromTo(
        el,
        { x },
        {
          x: "+=" + deltaX * 2,
          rotation: 0,
          ease: "power1.in",
          duration: 0.4,
        },
        "<"
      );

      // Fall to the floor.
      tl.fromTo(
        el,
        { y },
        {
          y: "+=" + (H - y),
          scale: 0.9,
          yPercent: -95,
          ease: "back.in(1.1)",
          duration: 0.4,
        },
        "<"
      );

      // Bounce back up and out — stronger overshoot the higher it started.
      tl.to(el, {
        x: "+=" + deltaX * 1.6,
        rotation: (Math.random() - 0.5) * 40,
        ease: "power1.in",
        duration: 0.3,
      });
      tl.to(
        el,
        {
          yPercent: 150,
          ease: "back.in(" + (1.5 + (1 - y / H)) + ")",
          duration: 0.3,
        },
        "<"
      );
    };

    // Listen on the window — an overlay (borders + copy button) sits on top of
    // this container in the grid, so a container-scoped listener never fires.
    const handleMouseMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const valX = e.clientX - rect.left;
      const valY = e.clientY - rect.top;

      // Only react while the cursor is actually inside this cell.
      const inside =
        valX >= 0 && valX <= rect.width && valY >= 0 && valY <= rect.height;
      if (!inside) {
        oldX = valX;
        oldY = valY;
        return;
      }

      const resetDist = rect.width / 8;
      incr += Math.abs(valX - oldX) + Math.abs(valY - oldY);

      if (incr > resetDist) {
        incr = 0;
        createMedia(valX, valY, valX - oldX);
      }

      oldX = valX;
      oldY = valY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      active.forEach(({ el, tl }) => {
        tl.kill();
        el.remove();
      });
      active.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
    >
      {/* Preload images so spawned copies appear instantly, no network delay. */}
      <div className="pointer-events-none absolute h-px w-px opacity-0">
        {Images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" />
        ))}
      </div>
    </div>
  );
};

export default GravityImageTrail;
