"use client";

/**
 * A keyhole mask reveal — a keyhole clip-path pops in with a slight tilt, then the view zooms through it until the image fills the frame.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const KEYHOLE_PATH =
  "M 9 2.5 C 11.37 2.5 13.3 4.43 13.3 6.8 C 13.3 8.44 12.42 9.85 11.2 10.49 L 12.62 15.43 C 12.77 15.96 12.37 16.5 11.81 16.5 L 6.19 16.5 C 5.63 16.5 5.23 15.96 5.38 15.43 L 6.8 10.49 C 5.58 9.85 4.7 8.44 4.7 6.8 C 4.7 4.43 6.63 2.5 9 2.5 Z";
const KEYHOLE_CX = 9;
const KEYHOLE_CY = 9.5;
const KEYHOLE_HEIGHT = 14; // the path spans y 2.5 → 16.5
const WAIST = 2.4; // closest outline point to the center — the circle/stem junction

const KEYHOLE_NUMS = KEYHOLE_PATH.match(/-?\d*\.?\d+/g)!.map(Number);

const keyholeClip = (s: number, rotation: number, cx: number, cy: number) => {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const out: number[] = [];
  for (let k = 0; k < KEYHOLE_NUMS.length; k += 2) {
    const dx = (KEYHOLE_NUMS[k] - KEYHOLE_CX) * s;
    const dy = (KEYHOLE_NUMS[k + 1] - KEYHOLE_CY) * s;
    out.push(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
  }
  let j = 0;
  const d = KEYHOLE_PATH.replace(/-?\d*\.?\d+/g, () => out[j++].toFixed(2));
  return `path("${d}")`;
};

const KeyholeMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;
    const cx = img.clientWidth / 2;
    const cy = img.clientHeight / 2;
    const maxScale = (Math.hypot(cx, cy) / WAIST) * 1.12;
    const restScale = (img.clientHeight * 0.42) / KEYHOLE_HEIGHT;

    const state = { s: 0, r: -14 };
    const apply = () => {
      img.style.clipPath = keyholeClip(state.s, state.r, cx, cy);
    };

    const tl = gsap.timeline();
    tl.fromTo(
      state,
      { s: 0, r: -14 },
      {
        s: restScale,
        r: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
        onUpdate: apply,
      },
    );
    tl.to(state, {
      s: maxScale,
      duration: 1.05,
      ease: "power4.in",
      onUpdate: apply,
    });
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px) brightness(0)" },
      {
        scale: 1,
        filter: "blur(0px) brightness(1)",
        duration: 1.05,
        ease: "power4.inOut",
      },
      "<", // resolve the image while zooming through the keyhole
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
          clipPath: "polygon(50% 50%, 50% 50%, 50% 50%)",
          transform: "scale(1.4)",
          filter: "blur(16px) brightness(0)",
        }}
      />
    </button>
  );
};

export default KeyholeMaskReveal;
