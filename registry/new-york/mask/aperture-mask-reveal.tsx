"use client";

/**
 * A camera-aperture mask reveal — six shutter blades twist open around the center, dilating a hexagonal iris cut from an inline SVG mask.
 */

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const CX = 320;
const CY = 180;
const PIVOT_R = 400; // blade pivots sit on a circle just outside the frame
const BLADE_SIZE = 820;
const MAX_OPEN = 72; // deg — 400·sin(72°) clears the frame corners
const MAX_SPIN = 33; // the whole assembly twists as it opens

const BLADES = Array.from({ length: 6 }, (_, i) => {
  const theta = (i * Math.PI) / 3;
  return {
    px: +(CX + PIVOT_R * Math.cos(theta)).toFixed(2),
    py: +(CY + PIVOT_R * Math.sin(theta)).toFixed(2),
    base: i * 60 + 180, // blade edge points from its pivot through the center
  };
});

const ApertureMaskReveal = () => {
  const bladeRefs = useRef<(SVGGElement | null)[]>([]);
  const assemblyRef = useRef<SVGGElement>(null);
  const imageRef = useRef<SVGImageElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const maskId = `aperture-${useId().replace(/:/g, "")}`;

  const reveal = () => {
    const image = imageRef.current;
    if (!image) return;

    const state = { open: 0, spin: 0 };
    const apply = () => {
      assemblyRef.current?.setAttribute(
        "transform",
        `rotate(${state.spin} ${CX} ${CY})`,
      );
      BLADES.forEach((b, i) => {
        bladeRefs.current[i]?.setAttribute(
          "transform",
          `translate(${b.px} ${b.py}) rotate(${b.base + state.open})`,
        );
      });
    };

    tlRef.current?.kill();
    const tl = gsap.timeline({ onUpdate: apply });
    tlRef.current = tl;
    tl.to(state, {
      open: MAX_OPEN,
      spin: MAX_SPIN,
      duration: 1.5,
      ease: "power3.inOut",
    });
    tl.fromTo(
      image,
      { scale: 1.35, transformOrigin: "50% 50%", filter: "blur(14px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.5, ease: "power3.inOut" },
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
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        aria-hidden
      >
        <defs>
          <mask id={maskId}>
            <rect width="640" height="360" fill="#fff" />
            <g ref={assemblyRef}>
              {BLADES.map((b, i) => (
                <g
                  key={i}
                  ref={(el) => {
                    bladeRefs.current[i] = el;
                  }}
                  transform={`translate(${b.px} ${b.py}) rotate(${b.base})`}
                >
                  <rect width={BLADE_SIZE} height={BLADE_SIZE} fill="#000" />
                </g>
              ))}
            </g>
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

export default ApertureMaskReveal;
