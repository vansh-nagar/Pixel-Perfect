"use client";

/**
 * A center-split mask reveal — the image is clipped to a closed seam at the middle, then the clip-path opens outward (left/right for "horizontal", top/bottom for "vertical") to split it apart and uncover the whole frame.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

export type SplitAxis = "horizontal" | "vertical";

const HIDDEN: Record<SplitAxis, string> = {
  horizontal: "inset(0% 50% 0% 50% round 12px)",
  vertical: "inset(50% 0% 50% 0% round 12px)",
};
const SHOWN = "inset(0% 0% 0% 0% round 12px)";

const CenterSplitReveal = ({
  axis = "horizontal",
}: {
  axis?: SplitAxis;
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const reveal = () => {
    if (!imgRef.current) return;
    gsap.fromTo(
      imgRef.current,
      {
        clipPath: HIDDEN[axis],
        scale: 1.4,
        filter: "blur(16px)",
      },
      {
        clipPath: SHOWN,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power4.inOut",
      },
    );
  };

  useEffect(() => {
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis]);

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
          clipPath: HIDDEN[axis],
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default CenterSplitReveal;
