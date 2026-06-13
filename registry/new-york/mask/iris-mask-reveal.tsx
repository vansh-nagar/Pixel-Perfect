"use client";

/**
 * A camera-iris mask reveal — a circular clip-path opens from wherever you click and expands until it reaches the farthest corner, uncovering the full frame.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const IrisMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);

  // grow a circle from (x, y) out to the farthest corner so the whole frame ends
  // up revealed. defaults to the center when triggered without a pointer event.
  const reveal = (x?: number, y?: number) => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    const cx = x ?? w / 2;
    const cy = y ?? h / 2;
    // farthest of the four corners from the click point
    const maxR = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(w - cx, cy),
      Math.hypot(cx, h - cy),
      Math.hypot(w - cx, h - cy),
    );

    const state = { r: 0 };
    const apply = () => {
      img.style.clipPath = `circle(${state.r}px at ${cx}px ${cy}px)`;
    };
    apply();

    const tl = gsap.timeline();
    tl.to(state, { r: maxR, duration: 1.1, ease: "power3.inOut", onUpdate: apply });
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.inOut" },
      "<",
    );
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    reveal(e.clientX - rect.left, e.clientY - rect.top);
  };

  useEffect(() => {
    reveal();
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative aspect-video w-[40rem] max-w-[92%] cursor-pointer overflow-hidden rounded-xl"
      aria-label="Replay reveal from the cursor"
    >
      <img
        ref={imgRef}
        src={SRC}
        alt="reveal"
        className="size-full object-cover"
        style={{
          clipPath: "circle(0px at 50% 50%)",
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default IrisMaskReveal;
