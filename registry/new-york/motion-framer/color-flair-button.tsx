/**
 * A pill button with a directional color flair: stacked concentric circles bloom from
 * the cursor's entry point (GSAP staggered scale), trail it with per-circle lag, and
 * peel back inner→outer on exit.
 */
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

// Different radii → concentric color rings (biggest behind, smallest on top).
const FLAIRS = [
  { color: "#A5A6F6", size: "210%" }, // purple
  { color: "#7BD88F", size: "158%" }, // green
  { color: "#FFD36E", size: "112%" }, // yellow
  { color: "#FF9BB3", size: "70%" }, // coral
];

const ColorFlairButton = () => {
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const button = buttonRef.current;
      if (!button) return;

      const flairs = Array.from(
        button.querySelectorAll<HTMLElement>(".flair"),
      );

      // Center every circle on its (x, y) point and start hidden.
      gsap.set(flairs, { xPercent: -50, yPercent: -50, scale: 0 });

      // One follow-tween per circle, each with a different lag → they trail apart.
      const move = flairs.map((f, i) => {
        const duration = 0.65 - i * 0.12; // 0.65 → 0.29 across the stack
        return {
          x: gsap.quickTo(f, "x", { duration, ease: "power3" }),
          y: gsap.quickTo(f, "y", { duration, ease: "power3" }),
          xSet: gsap.quickSetter(f, "x", "px"),
          ySet: gsap.quickSetter(f, "y", "px"),
        };
      });

      const getXY = (e: MouseEvent) => {
        const { left, top } = button.getBoundingClientRect();
        return { x: e.clientX - left, y: e.clientY - top };
      };

      const onEnter = (e: MouseEvent) => {
        const { x, y } = getXY(e);
        move.forEach((m) => {
          m.xSet(x); // teleport every circle to the entry point...
          m.ySet(y);
        });
        // ...then bloom them open (outer → inner) with an overlapping stagger.
        gsap.to(flairs, {
          scale: 1,
          duration: 0.4,
          ease: "power3.out",
          stagger: 0.08,
          overwrite: "auto",
        });
      };

      const onMove = (e: MouseEvent) => {
        const { x, y } = getXY(e);
        move.forEach((m) => {
          m.x(x);
          m.y(y);
        });
      };

      const onLeave = (e: MouseEvent) => {
        const { x, y } = getXY(e);
        move.forEach((m) => {
          m.x(x);
          m.y(y);
        });
        // Shrink innermost (top) first, then outward → peels the layers back.
        gsap.to(flairs, {
          scale: 0,
          duration: 0.35,
          ease: "power3.out",
          stagger: { each: 0.07, from: "end" },
          overwrite: "auto",
        });
      };

      button.addEventListener("mouseenter", onEnter);
      button.addEventListener("mousemove", onMove);
      button.addEventListener("mouseleave", onLeave);

      return () => {
        button.removeEventListener("mouseenter", onEnter);
        button.removeEventListener("mousemove", onMove);
        button.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: buttonRef },
  );

  return (
    <div className="grid place-items-center p-6">
      <a
        ref={buttonRef}
        href="#"
        className="relative inline-flex items-center overflow-hidden rounded-full border border-black px-8 py-4 text-lg font-medium text-black"
      >
        {/* Concentric color circles — each scales 0 → 1 from the cursor point, staggered. */}
        {FLAIRS.map((f) => (
          <span
            key={f.color}
            className="flair pointer-events-none absolute top-0 left-0 aspect-square rounded-full"
            style={{ width: f.size, backgroundColor: f.color }}
          />
        ))}
        <span className="relative z-10">Visit the forum</span>
      </a>
    </div>
  );
};

export default ColorFlairButton;
