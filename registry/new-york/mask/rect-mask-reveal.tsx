"use client";

/**
 * A rectangular mask reveal — the image stays fixed while a clip-path inset rectangle grows from the center, keeping the video aspect ratio, to uncover the whole frame.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const RectMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  const reveal = () => {
    if (!imgRef.current) return;
    gsap.fromTo(
      imgRef.current,
      {
        clipPath: "inset(50% 50% 50% 50% round 12px)",
        scale: 1.4,
        filter: "blur(16px)",
      },
      {
        clipPath: "inset(0% 0% 0% 0% round 12px)",
        scale: 1,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power4.inOut",
      },
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
          clipPath: "inset(50% 50% 50% 50% round 12px)",
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default RectMaskReveal;
