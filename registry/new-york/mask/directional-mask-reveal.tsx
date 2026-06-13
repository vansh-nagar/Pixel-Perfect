"use client";

/**
 * A directional mask reveal — the image wipes in from a chosen edge (top, bottom, left, or right) via an animated clip-path inset.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

export type WipeDirection = "top" | "bottom" | "left" | "right";

// inset(top right bottom left): the hidden start per direction. The named edge
// is where the reveal grows FROM, so the opposite inset starts at 100%.
const HIDDEN: Record<WipeDirection, string> = {
  bottom: "inset(100% 0% 0% 0%)", // grows upward from the bottom
  top: "inset(0% 0% 100% 0%)", // grows downward from the top
  left: "inset(0% 100% 0% 0%)", // grows rightward from the left
  right: "inset(0% 0% 0% 100%)", // grows leftward from the right
};
const SHOWN = "inset(0% 0% 0% 0%)";

const DirectionalMaskReveal = ({
  direction = "bottom",
}: {
  direction?: WipeDirection;
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const reveal = () => {
    if (!imgRef.current) return;
    gsap.fromTo(
      imgRef.current,
      { clipPath: HIDDEN[direction] },
      { clipPath: SHOWN, duration: 1, ease: "power4.inOut" },
    );
  };

  // replay whenever the direction changes (and on mount)
  useEffect(() => {
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  return (
    <button
      onClick={reveal}
      className="relative aspect-video w-[40rem] max-w-[92%] cursor-pointer overflow-hidden"
      aria-label="Replay reveal"
    >
      <img
        ref={imgRef}
        src={SRC}
        alt="reveal"
        className="size-full object-cover"
        style={{ clipPath: HIDDEN[direction] }}
      />
    </button>
  );
};

export default DirectionalMaskReveal;
