"use client";

/**
 * A sonar mask reveal — concentric rings cut from a repeating-radial-gradient CSS mask thicken outward from the center, filling the gaps between them, until the whole frame is uncovered.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";
const RINGS = 9;

const ringMask = (open: number, ring: number) =>
  `repeating-radial-gradient(circle at 50% 50%, #000 0 ${open}px, transparent ${open}px ${ring}px)`;

const SonarMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  // each ring's opaque part grows from 0 to the full ring spacing, so the gaps
  // between the rings fill in and the image resolves from the center outward.
  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;

    const state = { p: 0 };
    const apply = () => {
      // ring spacing spans the half-diagonal so the rings reach every corner.
      const reach = Math.hypot(img.clientWidth, img.clientHeight) / 2;
      const ring = reach / RINGS;
      const open = ring * state.p;
      const mask = ringMask(open, ring);
      img.style.maskImage = mask;
      img.style.webkitMaskImage = mask;
    };
    apply();

    const tl = gsap.timeline();
    tl.to(state, { p: 1, duration: 1.2, ease: "power2.inOut", onUpdate: apply });
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.inOut" },
      "<",
    );
  };

  useEffect(() => {
    reveal();
  }, []);

  return (
    <button
      onClick={reveal}
      className="relative aspect-video w-[40rem] max-w-[92%] cursor-pointer overflow-hidden rounded-xl"
      aria-label="Replay reveal"
    >
      <img
        ref={imgRef}
        src={SRC}
        alt="reveal"
        className="size-full object-cover"
        style={{
          maskImage:
            "repeating-radial-gradient(circle at 50% 50%, #000 0 0px, transparent 0px 24px)",
          WebkitMaskImage:
            "repeating-radial-gradient(circle at 50% 50%, #000 0 0px, transparent 0px 24px)",
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default SonarMaskReveal;
