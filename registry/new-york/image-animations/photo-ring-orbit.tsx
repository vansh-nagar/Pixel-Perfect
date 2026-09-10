/**
 * Photos evenly spaced on a circle that expands open, then turns forever.
 */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/image-animations/photo-${n}.jpg`);

/** How far out the ring opens, as a percentage of the frame. */
const RADIUS = 30;
/** One full turn, in seconds. Slow enough to read as drift, not as a spin. */
const TURN = 8;

const PhotoRingOrbit = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-ring-item]");
      if (cards.length < 2) return;

      // Both tweens write through this one object, so the open and the turn
      // compose into a single position rather than fighting over transforms.
      const ring = { angle: 0, radius: 0 };

      const place = () => {
        cards.forEach((card, i) => {
          const a = (2 * Math.PI * i) / cards.length + ring.angle;
          gsap.set(card, {
            left: `${50 + ring.radius * Math.sin(a)}%`,
            top: `${50 - ring.radius * Math.cos(a)}%`,
            // The card nearest the viewer is the one at the bottom of the
            // circle, so depth follows cos and the overlap always reads right.
            zIndex: Math.round((1 - Math.cos(a)) * 500),
          });
        });
      };

      place();

      const tl = gsap.timeline();
      tl.to(ring, {
        radius: RADIUS,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: place,
      });
      tl.to(
        ring,
        {
          angle: Math.PI * 2,
          duration: TURN,
          ease: "none",
          repeat: -1,
          onUpdate: place,
        },
        0,
      );

      // A reader who asked for less motion gets the ring open and stop there.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.pause();
        ring.radius = RADIUS;
        place();
      }
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative aspect-square w-full max-w-[min(90%,26rem)]"
    >
      {PHOTOS.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          data-ring-item
          className="absolute size-[28%] -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover will-change-transform"
        />
      ))}
    </div>
  );
};

export default PhotoRingOrbit;
