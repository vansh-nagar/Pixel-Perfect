"use client";

/**
 * A pinwheel mask reveal — N wedges sweep open around the center like a windmill (or a camera shutter), cut from an animated repeating-conic-gradient mask, until the full frame shows.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";
const BLADES = 6;
const WEDGE = 360 / BLADES;

// every wedge opens by `open` degrees at once; `rot` spins the whole pinwheel.
const pinwheelMask = (open: number, rot: number) =>
  `repeating-conic-gradient(from ${rot}deg at 50% 50%, #000 0deg, #000 ${open}deg, transparent ${open}deg, transparent ${WEDGE}deg)`;

const PinwheelMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;

    const state = { open: 0, rot: -40 };
    const apply = () => {
      const mask = pinwheelMask(state.open, state.rot);
      img.style.maskImage = mask;
      img.style.webkitMaskImage = mask;
    };
    apply();

    const tl = gsap.timeline();
    tl.to(state, {
      open: WEDGE,
      rot: 0,
      duration: 1.2,
      ease: "power3.inOut",
      onUpdate: apply,
    });
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power3.inOut" },
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
          maskImage: pinwheelMask(0, -40),
          WebkitMaskImage: pinwheelMask(0, -40),
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default PinwheelMaskReveal;
