"use client";

/**
 * A star-shaped mask reveal — a sparkle clip-path pops in with a slight rotate, then scales up to uncover the full image.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC =
  "https://i.pinimg.com/originals/2b/31/77/2b317781b17b706d9ee18a62a1d703ae.gif";

const STAR_PATH =
  "M7.71519 0.738646C7.93701 -0.246165 9.34033 -0.246182 9.56216 0.738628C10.3456 4.21619 13.0612 6.9319 16.5388 7.71526C17.5236 7.93711 17.5236 9.34048 16.5388 9.56233C13.0612 10.3457 10.3456 13.0613 9.56216 16.5389C9.34033 17.5237 7.93701 17.5237 7.71519 16.5389C6.93176 13.0613 4.21616 10.3457 0.738557 9.56233C-0.246299 9.34048 -0.246299 7.93711 0.738557 7.71526C4.21599 6.9319 6.93176 4.21619 7.71519 0.738646Z";
const STAR_CENTER = 9; // the path's own center in its 18x18 box

const STAR_NUMS = STAR_PATH.match(/-?\d*\.?\d+/g)!.map(Number);

const starClip = (s: number, rotation: number, cx: number, cy: number) => {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const out: number[] = [];
  for (let k = 0; k < STAR_NUMS.length; k += 2) {
    const dx = (STAR_NUMS[k] - STAR_CENTER) * s;
    const dy = (STAR_NUMS[k + 1] - STAR_CENTER) * s;
    out.push(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
  }
  let j = 0;
  const d = STAR_PATH.replace(/-?\d*\.?\d+/g, () => out[j++].toFixed(2));
  return `path("${d}")`;
};

const StarMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;
    const cx = img.clientWidth / 2;
    const cy = img.clientHeight / 2;
    const maxScale = (Math.hypot(cx, cy) / 4.5) * 1.15;
    const restScale = (img.clientWidth * 0.07) / STAR_CENTER;

    const state = { s: 0, r: 15 };
    const apply = () => {
      img.style.clipPath = starClip(state.s, state.r, cx, cy);
    };

    const tl = gsap.timeline();
    tl.fromTo(
      state,
      { s: 0, r: 15 },
      { s: restScale, r: 0, duration: 0.5, ease: "back.out(1.7)", onUpdate: apply },
    );
    tl.to(state, {
      s: maxScale,
      duration: 1,
      ease: "power4.inOut",
      onUpdate: apply,
    });
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px) brightness(0)" },
      {
        scale: 1,
        filter: "blur(0px) brightness(1)",
        duration: 1,
        ease: "power4.inOut",
      },
      "<", // start together with the reveal phase
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

export default StarMaskReveal;
