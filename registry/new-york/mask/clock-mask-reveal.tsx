"use client";

/**
 * A radial clock-sweep mask reveal — a conic-gradient CSS mask sweeps a wedge around the center like a clock hand, uncovering the image angle by angle until the full frame shows.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

// build the conic mask for a given sweep angle (degrees), clockwise from the top.
const conicMask = (a: number) =>
  `conic-gradient(from -90deg at 50% 50%, #000 0deg, #000 ${a}deg, transparent ${a}deg, transparent 360deg)`;

const ClockMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;

    const state = { a: 0 };
    const apply = () => {
      const mask = conicMask(state.a);
      img.style.maskImage = mask;
      img.style.webkitMaskImage = mask;
    };
    apply();

    const tl = gsap.timeline();
    tl.to(state, { a: 360, duration: 1.2, ease: "power2.inOut", onUpdate: apply });
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
          maskImage: conicMask(0),
          WebkitMaskImage: conicMask(0),
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default ClockMaskReveal;
