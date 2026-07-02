"use client";

/**
 * A liquid-wave mask reveal — the image fills from the bottom like rising water, with a living sine-wave crest cut from an inline SVG mask.
 */

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const W = 640;
const H = 360;
const STEP = 16;

const wavePath = (level: number, t: number) => {
  const base = H * (1 - level);
  // crest is biggest mid-rise and flattens out as the fill completes
  const amp = 20 * Math.sin(Math.PI * Math.min(Math.max(level, 0), 1));
  let d = "";
  for (let x = 0; x <= W; x += STEP) {
    const y =
      base +
      amp *
        (0.7 * Math.sin(x * 0.014 + t * 2.3) +
          0.3 * Math.sin(x * 0.032 - t * 3.6));
    d += `${x === 0 ? "M" : "L"} ${x} ${y.toFixed(1)} `;
  }
  return `${d}L ${W} ${H} L 0 ${H} Z`;
};

const WaveMaskReveal = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const imageRef = useRef<SVGImageElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const maskId = `wave-${useId().replace(/:/g, "")}`;

  const reveal = () => {
    const image = imageRef.current;
    if (!image) return;

    const state = { level: 0, t: 0 };
    const apply = () => {
      pathRef.current?.setAttribute("d", wavePath(state.level, state.t));
    };

    tlRef.current?.kill();
    const tl = gsap.timeline({ onUpdate: apply });
    tlRef.current = tl;
    tl.to(state, { level: 1.05, duration: 2, ease: "power2.inOut" }, 0);
    tl.to(state, { t: 7, duration: 2, ease: "none" }, 0);
    tl.fromTo(
      image,
      { scale: 1.3, transformOrigin: "50% 50%", filter: "blur(12px)" },
      { scale: 1, filter: "blur(0px)", duration: 2, ease: "power2.inOut" },
      0,
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
            <path ref={pathRef} d={wavePath(0, 0)} fill="#fff" />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <image
            ref={imageRef}
            href={SRC}
            width="640"
            height="360"
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      </svg>
    </button>
  );
};

export default WaveMaskReveal;
