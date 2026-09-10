/**
 * Photos spiralling endlessly inward, shrinking away as they are drawn into the centre.
 */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/image-animations/photo-${n}.jpg`);

/** How many photos are on the spiral at once.
 *  Spacing is really COUNT / TURNS — photos per lap. Adding photos tightens the
 *  spiral rather than lengthening it, so this is the number to lower when the
 *  arms start reading as a solid band instead of a sequence. */
const COUNT = 16;
/** Stepped by a number coprime with six, so neighbours are never the same shot. */
const TILES = Array.from(
  { length: COUNT },
  (_, i) => PHOTOS[(i * 5) % PHOTOS.length],
);

/** How many times the spiral wraps between the rim and the centre. */
const TURNS = 2.2;
/** Seconds for one photo to travel the whole way in. */
const DRIFT = 9;
/** Seconds for the spiral itself to turn once, on top of the inward drift. */
const SPIN = 26;

const PhotoSpiralVortex = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const view = scope.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-vortex-item]");
      if (!view || !cards.length) return;

      const state = { t: 0, spin: 0 };

      const place = () => {
        const radius = 0.48 * view.clientWidth;

        cards.forEach((card, i) => {
          // Each photo sits a fixed fraction of the journey behind the last, and
          // the whole train advances together. Wrapping with a modulo is what
          // makes the supply of photos look endless from twenty-four of them.
          const p = (i / cards.length + state.t) % 1;

          const angle = p * TURNS * Math.PI * 2 + state.spin;
          const out = 1 - p;
          const r = out * radius;

          // Fade in at the rim and out at the middle, so a photo is never
          // visible at the instant it jumps from the centre back to the edge.
          const edge = Math.min(1, p / 0.12);
          const core = Math.min(1, (1 - p) / 0.18);

          gsap.set(card, {
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            rotation: (angle * 180) / Math.PI + 90,
            scale: 0.18 + 0.82 * out,
            opacity: edge * core,
            filter: `brightness(${0.45 + 0.55 * out})`,
            zIndex: Math.round(out * 100),
          });
        });
      };

      place();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Two loops rather than one. The drift alone reads as photos on a fixed
      // track; the slow counter-turn under it stops the track being findable.
      gsap.to(state, {
        t: 1,
        duration: DRIFT,
        ease: "none",
        repeat: -1,
        onUpdate: place,
      });
      gsap.to(state, {
        spin: Math.PI * 2,
        duration: SPIN,
        ease: "none",
        repeat: -1,
        onUpdate: place,
      });
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative flex aspect-square w-full max-w-[min(90%,26rem)] items-center justify-center overflow-hidden"
    >
      {TILES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          data-vortex-item
          className="absolute size-[17%] rounded-lg object-cover will-change-transform"
        />
      ))}
    </div>
  );
};

export default PhotoSpiralVortex;
