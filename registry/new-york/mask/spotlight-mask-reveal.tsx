"use client";

/**
 * A spotlight mask reveal — the image stays dark except for a soft circle that follows your cursor like a flashlight; click to flood the whole frame with light (and click again to dim back to the spotlight).
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

// a soft radial mask: opaque core fading to transparent at `r`.
const spot = (x: number, y: number, r: number) =>
  `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 0px, #000 ${r * 0.6}px, transparent ${r}px)`;

const SpotlightMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);
  const state = useRef({ x: 0, y: 0, r: 0 });
  const flooded = useRef(false);

  const apply = () => {
    const img = imgRef.current;
    if (!img) return;
    const { x, y, r } = state.current;
    const mask = spot(x, y, r);
    img.style.maskImage = mask;
    img.style.webkitMaskImage = mask;
  };

  // resting spotlight radius ~28% of the smaller side
  const spotRadius = () => {
    const img = imgRef.current;
    if (!img) return 140;
    return Math.min(img.clientWidth, img.clientHeight) * 0.28;
  };

  // full-frame radius: reach the farthest corner from the current point.
  const floodRadius = (x: number, y: number) => {
    const img = imgRef.current;
    if (!img) return 1200;
    const w = img.clientWidth;
    const h = img.clientHeight;
    return (
      Math.max(
        Math.hypot(x, y),
        Math.hypot(w - x, y),
        Math.hypot(x, h - y),
        Math.hypot(w - x, h - y),
      ) * 1.4
    );
  };

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (flooded.current) return; // lights are on — don't chase the cursor
    const rect = e.currentTarget.getBoundingClientRect();
    state.current.x = e.clientX - rect.left;
    state.current.y = e.clientY - rect.top;
    apply();
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    state.current.x = x;
    state.current.y = y;
    flooded.current = !flooded.current;
    gsap.to(state.current, {
      r: flooded.current ? floodRadius(x, y) : spotRadius(),
      duration: 0.9,
      ease: "power3.inOut",
      onUpdate: apply,
    });
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    state.current = { x: img.clientWidth / 2, y: img.clientHeight / 2, r: 0 };
    apply();
    // intro: the spotlight blooms in at the center
    gsap.to(state.current, {
      r: spotRadius(),
      duration: 0.8,
      ease: "power2.out",
      onUpdate: apply,
    });
  }, []);

  return (
    <button
      onClick={onClick}
      onMouseMove={onMove}
      className="relative aspect-video w-[40rem] max-w-[92%] cursor-pointer overflow-hidden rounded-xl bg-black"
      aria-label="Move to aim the spotlight, click to flood the frame"
    >
      <img
        ref={imgRef}
        src={SRC}
        alt="reveal"
        className="size-full object-cover"
        style={{
          maskImage: "radial-gradient(circle 0px at 50% 50%, #000 0, transparent 0)",
          WebkitMaskImage:
            "radial-gradient(circle 0px at 50% 50%, #000 0, transparent 0)",
        }}
      />
    </button>
  );
};

export default SpotlightMaskReveal;
