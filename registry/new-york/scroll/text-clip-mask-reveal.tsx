"use client";

/**
 * A scroll-driven text-clip mask reveal — a video is clipped to the shape of a word, and as you scroll the text-shaped mask scales up until it opens out and uncovers the full frame.
 */

import { useEffect, useRef } from "react";

function findScroller(el: HTMLElement): HTMLElement | undefined {
  let node = el.parentElement;
  while (node) {
    if (node.hasAttribute("data-lenis-prevent")) return node;
    const oy = getComputedStyle(node).overflowY;
    if (
      (oy === "auto" || oy === "scroll") &&
      node.scrollHeight > node.clientHeight
    )
      return node;
    node = node.parentElement;
  }
  return undefined;
}

const maskUrl = (text: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="220" viewBox="0 0 900 220">` +
      `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ` +
      `font-family="Arial Black, Arial Narrow, sans-serif" font-weight="900" ` +
      `font-size="200" letter-spacing="-8">${text}</text></svg>`,
  );

type TextClipMaskRevealProps = {
  text?: string;
  src?: string;
};

const TextClipMaskReveal = ({
  text = "REVEAL",
  src = "/globe.mp4",
}: TextClipMaskRevealProps) => {
  const container = useRef<HTMLDivElement>(null);
  const stickyMask = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = container.current;
    const mask = stickyMask.current;
    if (!root || !mask) return;

    const scroller = findScroller(root);

    const initialMaskSize = 0.8; // 80% of the frame at rest
    const targetMaskSize = 30; // grows ~30x by the end of the runway
    const easing = 0.15; // lerp factor — trails the scroll for a smooth feel
    let eased = 0;
    let raf = 0;

    const rawProgress = () => {
      const rect = root.getBoundingClientRect();
      const viewport = scroller?.clientHeight ?? window.innerHeight;
      const top = scroller ? rect.top - scroller.getBoundingClientRect().top : rect.top;
      const distance = rect.height - viewport;
      if (distance <= 0) return 0;
      return Math.min(1, Math.max(0, -top / distance));
    };

    const animate = () => {
      eased += (rawProgress() - eased) * easing;
      const size = (initialMaskSize + targetMaskSize * eased) * 100;
      mask.style.webkitMaskSize = `${size}%`;
      mask.style.maskSize = `${size}%`;
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={container} className="relative h-[300vh] w-full">
      <div
        ref={stickyMask}
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-background"
        style={{
          maskImage: `url("${maskUrl(text)}")`,
          WebkitMaskImage: `url("${maskUrl(text)}")`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "80%",
          WebkitMaskSize: "80%",
        }}
      >
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default TextClipMaskReveal;
