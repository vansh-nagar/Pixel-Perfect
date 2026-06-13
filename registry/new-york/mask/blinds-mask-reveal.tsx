"use client";

/**
 * A venetian-blinds mask reveal — the image is hidden behind N slats cut from a repeating-linear-gradient CSS mask, then every slat opens at once to uncover the whole frame.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";
const SLATS = 8;

export type SlatOrientation = "vertical" | "horizontal";

const BlindsMaskReveal = ({
  orientation = "vertical",
}: {
  orientation?: SlatOrientation;
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  // each slat is a band of `size / SLATS`; `open` (the opaque part of the band)
  // grows from 0 to the full band, so all slats open in unison. vertical slats
  // run along the width (90deg); horizontal along the height (0deg).
  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;
    const horizontal = orientation === "horizontal";
    const deg = horizontal ? "0deg" : "90deg";

    const state = { p: 0 };
    const apply = () => {
      const size = horizontal ? img.clientHeight : img.clientWidth;
      const band = size / SLATS;
      const open = band * state.p;
      const mask = `repeating-linear-gradient(${deg}, #000 0 ${open}px, transparent ${open}px ${band}px)`;
      img.style.maskImage = mask;
      img.style.webkitMaskImage = mask;
    };
    apply();

    const tl = gsap.timeline();
    tl.to(state, { p: 1, duration: 1.1, ease: "power3.inOut", onUpdate: apply });
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.inOut" },
      "<",
    );
  };

  useEffect(() => {
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

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
            "repeating-linear-gradient(90deg, #000 0 0px, transparent 0px 1px)",
          WebkitMaskImage:
            "repeating-linear-gradient(90deg, #000 0 0px, transparent 0px 1px)",
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default BlindsMaskReveal;
