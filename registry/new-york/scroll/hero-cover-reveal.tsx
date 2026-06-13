"use client";

/**
 * A scroll-driven hero cover reveal — the hero pins in place (sticky) while the next section scrolls up and covers it, with a GSAP-scrubbed recede on the hero.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function findScroller(el: HTMLElement): Element | undefined {
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

const STAGE_H = "h-[calc(100vh-11rem)]";

const HeroCoverReveal = () => {
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const r = root.current;
      const hr = hero.current;
      const nx = next.current;
      if (!r || !hr || !nx) return;

      const scroller = findScroller(r);

      gsap.fromTo(
        hr,
        { scale: 1, rotation: 0, yPercent: 0, filter: "blur(0px) brightness(1)" },
        {
          scale: 0.92,
          rotation: 6,
          yPercent: 20,
          transformOrigin: "center bottom",
          filter: "blur(4px) brightness(0.5)",
          ease: "none",
          scrollTrigger: {
            trigger: nx,
            scroller: scroller ?? undefined,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        },
      );

      const ro =
        scroller instanceof Element
          ? new ResizeObserver(() => ScrollTrigger.refresh())
          : null;
      if (ro && scroller) ro.observe(scroller);
      return () => ro?.disconnect();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative w-full">
      <div
        ref={hero}
        className={`sticky top-0 ${STAGE_H} overflow-hidden bg-indigo-600 will-change-transform`}
      />
      <div ref={next} className={`relative z-10 h-[150vh] bg-neutral-950`} />
    </div>
  );
};

export default HeroCoverReveal;
