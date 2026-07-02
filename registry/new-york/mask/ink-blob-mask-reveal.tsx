"use client";

/**
 * An ink-blob mask reveal — a drop splats in the middle, then spreads outward as an organic wobbling blob clip-path until it floods the frame.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const POINTS = 14;

// deterministic pseudo-random so every point wobbles differently
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const WOBBLE = Array.from({ length: POINTS }, (_, i) => ({
  speed: 2.2 + hash(i) * 2.4,
  offset: hash(i + 40) * Math.PI * 2,
  amp: 0.14 + hash(i + 80) * 0.12,
}));

const blobClip = (
  r: number,
  wob: number,
  t: number,
  cx: number,
  cy: number,
) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    const w = WOBBLE[i];
    const rad =
      r *
      (1 +
        wob *
          (w.amp * Math.sin(t * w.speed + w.offset) +
            0.07 * Math.sin(t * 1.3 + w.offset * 2.5)));
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  // smooth closed curve: quadratics through the midpoints
  const mid = (p: [number, number], q: [number, number]) =>
    [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
  const [sx, sy] = mid(pts[POINTS - 1], pts[0]);
  let d = `M ${sx.toFixed(1)} ${sy.toFixed(1)}`;
  for (let i = 0; i < POINTS; i++) {
    const p = pts[i];
    const [mx, my] = mid(p, pts[(i + 1) % POINTS]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return `path("${d} Z")`;
};

const InkBlobMaskReveal = () => {
  const imgRef = useRef<HTMLImageElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;
    const cx = img.clientWidth / 2;
    const cy = img.clientHeight / 2;
    const dropR = img.clientHeight * 0.17;
    const maxR = Math.hypot(cx, cy) * 1.12;

    const state = { r: 0, wob: 1, t: 0 };
    const apply = () => {
      img.style.clipPath = blobClip(state.r, state.wob, state.t, cx, cy);
    };

    tlRef.current?.kill();
    const tl = gsap.timeline({ onUpdate: apply });
    tlRef.current = tl;
    tl.to(state, { t: 7, duration: 1.75, ease: "none" }, 0);
    tl.to(state, { r: dropR, duration: 0.4, ease: "back.out(2.4)" }, 0);
    tl.to(state, { r: maxR, duration: 1.35, ease: "power3.inOut" }, 0.4);
    // let the wobble settle so the blob fully floods the corners
    tl.to(state, { wob: 0, duration: 0.4, ease: "power2.out" }, 1.35);
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.35, ease: "power3.inOut" },
      0.4,
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
          clipPath: "circle(0px at 50% 50%)",
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default InkBlobMaskReveal;
