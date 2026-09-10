/**
 * Photos scattered over a sphere by the golden angle, tumbling on two axes at once.
 */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/image-animations/photo-${n}.jpg`);

/** The sphere's radius, as a fraction of the frame. */
const SPREAD = 0.35;
/** How far the whole cluster sits back from the eye, relative to the radius. */
const DEPTH = 1.2;
/**
 * Two turns on two axes, at periods that do not divide into each other — so the
 * cluster never returns to the same pose on any interval you could notice, and
 * it reads as tumbling rather than as a loop.
 */
const TURN_Y = 8.8;
const TURN_X = 12;

/**
 * Points spread evenly over a sphere.
 *
 * The golden angle is what makes them even: step around the vertical axis by
 * π(3−√5) each time and no two points ever line up into the seams a naive
 * lat/long grid leaves at the poles.
 */
function spherePoints(count: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const lat = Math.acos(1 - (2 * i) / (count - 1 || 1)) - Math.PI / 2;
    const lon = (i * golden) % (Math.PI * 2);
    return {
      x: Math.cos(lat) * Math.cos(lon),
      y: Math.sin(lat),
      z: Math.cos(lat) * Math.sin(lon),
    };
  });
}

const PhotoSphereDrift = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const view = scope.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-sphere-item]");
      if (!view || cards.length < 2) return;

      const points = spherePoints(cards.length);
      const state = { progress: 0, angleY: 0, angleX: 0 };

      const place = () => {
        const radius = SPREAD * view.clientWidth * state.progress;
        const back = DEPTH * SPREAD * view.clientWidth * state.progress;
        const cosY = Math.cos(state.angleY);
        const sinY = Math.sin(state.angleY);
        const cosX = Math.cos(state.angleX);
        const sinX = Math.sin(state.angleX);

        cards.forEach((card, i) => {
          const p = points[i];
          // Yaw first, then pitch — the same order every frame, or the two
          // rotations would swap places and the cluster would wobble.
          const x = cosY * p.x + sinY * p.z;
          const z = -sinY * p.x + cosY * p.z;
          gsap.set(card, {
            x: x * radius,
            y: -(cosX * p.y - sinX * z) * radius,
            z: (sinX * p.y + cosX * z) * radius - back,
          });
        });
      };

      place();

      const tl = gsap.timeline();
      tl.to(state, {
        progress: 1,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: place,
      });
      tl.to(
        state,
        { angleY: Math.PI * 2, duration: TURN_Y, ease: "none", repeat: -1, onUpdate: place },
        0,
      );
      tl.to(
        state,
        { angleX: Math.PI * 2, duration: TURN_X, ease: "none", repeat: -1, onUpdate: place },
        0,
      );

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.pause();
        state.progress = 1;
        place();
      }
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      // The perspective has to live on the frame rather than on each card, or
      // every card gets its own vanishing point and the sphere reads flat.
      className="relative aspect-square w-full max-w-[min(90%,26rem)]"
      style={{ perspective: "40rem", transformStyle: "preserve-3d" }}
    >
      {PHOTOS.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          data-sphere-item
          className="absolute top-1/2 left-1/2 size-[26%] -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover will-change-transform [backface-visibility:hidden]"
        />
      ))}
    </div>
  );
};

export default PhotoSphereDrift;
