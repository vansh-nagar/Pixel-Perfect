/**
 * Photos threading a trefoil knot, weaving through their own trail as it turns.
 */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/image-animations/photo-${n}.jpg`);

/**
 * How many photos ride the knot.
 *
 * More than the ring or the sphere carry on purpose: a knot is only legible if
 * enough of the path is occupied to see it cross itself. Stepped through the
 * six photos by five — coprime with six — so neighbours are never the same shot.
 */
const COUNT = 12;
const TILES = Array.from(
  { length: COUNT },
  (_, i) => PHOTOS[(i * 5) % PHOTOS.length],
);

/**
 * The knot, as (p, q) — how many times the path winds the main ring against how
 * many times it winds through the hole. 2 and 3 is the trefoil, the simplest
 * knot that is actually knotted; 1 of either would untie into a plain circle.
 */
const P = 2;
const Q = 3;

/** The main ring, and the smaller loop wound around it, as fractions of the frame. */
const MAJOR = 0.25;
const MINOR = 0.11;
/** Depth is exaggerated well past the minor radius — a true torus is too flat to read. */
const DEPTH = 0.5;

/** One full circuit of the knot. */
const LAP = 14;
/** The whole knot turning under that, on a period that does not divide into it. */
const SPIN = 22;
/** Perspective, in px. Sets how hard a photo blows up as it passes the front. */
const PERSPECTIVE = 640;

const PhotoTrefoilWeave = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const view = scope.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-knot-item]");
      if (!view || !cards.length) return;

      const state = { t: 0, spin: 0 };

      const place = () => {
        const w = view.clientWidth;
        const major = MAJOR * w;
        const minor = MINOR * w;
        const depth = DEPTH * w;
        const cosS = Math.cos(state.spin);
        const sinS = Math.sin(state.spin);

        cards.forEach((card, i) => {
          // Every photo rides the same curve, spaced a fixed way along it.
          const t = state.t + (i * Math.PI * 2) / cards.length;

          // The knot. The ring's radius is itself pulsing on q — that wobble is
          // what lifts the path off a flat circle and lets it pass through its
          // own middle instead of merely orbiting.
          const ring = major + minor * Math.cos(Q * t);
          const x0 = ring * Math.cos(P * t);
          const z0 = depth * Math.sin(Q * t);

          // Turn the whole knot about the vertical axis, so the crossings drift
          // rather than always resolving at the same two points on screen.
          const x = x0 * cosS + z0 * sinS;
          const z = -x0 * sinS + z0 * cosS;
          // 0 at the far side of the knot, 1 at the near side.
          const near = (z / depth + 1) / 2;

          gsap.set(card, {
            x,
            y: ring * Math.sin(P * t),
            // Real z under the frame's perspective, so size comes from depth
            // rather than from a scale tween fighting it.
            z,
            filter: `blur(${gsap.utils.interpolate(3.5, 0, near)}px) brightness(${gsap.utils.interpolate(0.48, 1, near)})`,
            zIndex: Math.round(near * 1000),
          });
        });
      };

      place();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.to(state, {
        t: Math.PI * 2,
        duration: LAP,
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
      className="relative aspect-square w-full max-w-[min(90%,26rem)]"
      style={{ perspective: `${PERSPECTIVE}px`, transformStyle: "preserve-3d" }}
    >
      {TILES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          data-knot-item
          className="absolute top-1/2 left-1/2 size-[22%] -translate-x-1/2 -translate-y-1/2 rounded-xl object-cover will-change-transform [backface-visibility:hidden]"
        />
      ))}
    </div>
  );
};

export default PhotoTrefoilWeave;
