"use client";

/**
 * A brush-stroke mask reveal — the image is painted in along a thick snaking brush stroke, using an inline SVG mask whose stroked path animates its stroke-dashoffset from hidden to fully drawn.
 */

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

// a connected boustrophedon (snake) stroke; a thick round stroke sweeping these
// three rows covers the whole 640×360 frame as it is drawn.
const STROKE = "M -60 60 H 700 V 180 H -60 V 300 H 700";

const BrushMaskReveal = () => {
  const pathRef = useRef<SVGPathElement>(null);
  // useId can contain ":" which breaks url(#...) references — strip it.
  const maskId = `brush-${useId().replace(/:/g, "")}`;

  const reveal = () => {
    if (!pathRef.current) return;
    gsap.fromTo(
      pathRef.current,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" },
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
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        aria-hidden
      >
        <defs>
          <mask id={maskId}>
            <path
              ref={pathRef}
              d={STROKE}
              fill="none"
              stroke="#fff"
              strokeWidth={130}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
            />
          </mask>
        </defs>
        <image
          href={SRC}
          width="640"
          height="360"
          preserveAspectRatio="xMidYMid slice"
          mask={`url(#${maskId})`}
        />
      </svg>
    </button>
  );
};

export default BrushMaskReveal;
