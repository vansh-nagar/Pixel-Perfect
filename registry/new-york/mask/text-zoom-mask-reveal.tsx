"use client";

/**
 * A text-zoom mask reveal — the image shows through the giant word "PIXEL", which then dives through the X until the whole frame is uncovered.
 */

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const WORD = "PIXEL";
const ZOOM_CHAR = 2; // dive through the "X"
const CX = 320;
const CY = 180;

const TextZoomMaskReveal = () => {
  const groupRef = useRef<SVGGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const imageRef = useRef<SVGImageElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const maskId = `text-zoom-${useId().replace(/:/g, "")}`;

  const reveal = () => {
    const group = groupRef.current;
    const image = imageRef.current;
    if (!group || !image) return;

    // zoom into the middle of the X so the frame ends up inside a glyph
    let ox = CX;
    let oy = CY;
    try {
      const ext = textRef.current?.getExtentOfChar(ZOOM_CHAR);
      if (ext && ext.width > 0) {
        ox = ext.x + ext.width / 2;
        oy = ext.y + ext.height / 2;
      }
    } catch {
      // keep the frame center as fallback
    }

    const state = { s: 0 };
    const apply = () => {
      group.setAttribute(
        "transform",
        `translate(${ox} ${oy}) scale(${state.s}) translate(${-ox} ${-oy})`,
      );
    };

    tlRef.current?.kill();
    const tl = gsap.timeline({ onUpdate: apply });
    tlRef.current = tl;
    tl.to(state, { s: 1, duration: 0.55, ease: "back.out(1.6)" });
    tl.to(state, { s: 64, duration: 1.15, ease: "power3.in" }, "+=0.2");
    tl.fromTo(
      image,
      { scale: 1.45, transformOrigin: "50% 50%", filter: "blur(14px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.15, ease: "power2.inOut" },
      "<", // resolve the image during the dive
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
            <g
              ref={groupRef}
              transform={`translate(${CX} ${CY}) scale(0) translate(${-CX} ${-CY})`}
            >
              <text
                ref={textRef}
                x={CX}
                y={CY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={118}
                fontWeight={900}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                letterSpacing="-0.02em"
                fill="#fff"
              >
                {WORD}
              </text>
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

export default TextZoomMaskReveal;
