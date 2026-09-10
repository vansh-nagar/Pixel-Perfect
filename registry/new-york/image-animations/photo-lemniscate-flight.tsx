/**
 * Photos flying a figure-eight through real depth, swapping which lobe is in front.
 */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/image-animations/photo-${n}.jpg`);

/** How wide and tall the eight is drawn, as a fraction of the frame. */
const REACH = 0.32;
/** How deep the two lobes sit apart. The whole trick is in this number. */
const DEPTH = 0.55;
/** One full circuit, in seconds. */
const LAP = 11;
/** Perspective, in px. Sets how hard the near lobe blows up as it passes. */
const PERSPECTIVE = 640;

const PhotoLemniscateFlight = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const view = scope.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-eight-item]");
      if (!view || !cards.length) return;

      const state = { t: 0 };

      const place = () => {
        const w = view.clientWidth;
        const reach = REACH * w;
        const depth = DEPTH * w;

        cards.forEach((card, i) => {
          // Every card rides the same curve, just further along it.
          const t = state.t + (i * Math.PI * 2) / cards.length;

          // A Gerono lemniscate: sin for the sweep, sin(2t) for the crossing.
          // The half on y is what closes the loop into a figure eight instead
          // of an ellipse — it completes two cycles for every one of x.
          const x = reach * Math.sin(t);
          const y = (reach / 2) * Math.sin(2 * t);
          // cos on z puts one lobe of the eight behind the other, so the paths
          // cross in the picture but never collide in space.
          const z = depth * Math.cos(t);

          const near = (z / depth + 1) / 2;

          gsap.set(card, {
            x,
            y,
            // No scale here on purpose — the perspective on the frame already
            // does it, and doing both would double-count the depth.
            z,
            filter: `blur(${gsap.utils.interpolate(3.5, 0, near)}px) brightness(${gsap.utils.interpolate(0.5, 1, near)})`,
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
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative aspect-square w-full max-w-[min(90%,26rem)]"
      style={{ perspective: `${PERSPECTIVE}px`, transformStyle: "preserve-3d" }}
    >
      {PHOTOS.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          data-eight-item
          className="absolute top-1/2 left-1/2 size-[24%] -translate-x-1/2 -translate-y-1/2 rounded-xl object-cover will-change-transform [backface-visibility:hidden]"
        />
      ))}
    </div>
  );
};

export default PhotoLemniscateFlight;
