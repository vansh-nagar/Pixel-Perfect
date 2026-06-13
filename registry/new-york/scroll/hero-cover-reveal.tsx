"use client";

/**
 * A scroll-driven hero cover reveal — the hero pins in place while the next section slides up and covers it, scrubbed by GSAP ScrollTrigger.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Walk up to the nearest scrolling ancestor so the effect works both against
// the window and inside a nested scroll pane (e.g. the showcase grid).
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

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: r,
          scroller: scroller ?? undefined,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          ...(scroller ? { pinType: "transform" } : {}),
        },
      });

      // next section rises from below to fully cover the hero
      tl.fromTo(nx, { yPercent: 100 }, { yPercent: 0 }, 0);
      // hero eases back behind it — slight zoom-out, blur and dim
      tl.fromTo(
        hr,
        { scale: 1, filter: "blur(0px) brightness(1)" },
        { scale: 0.92, filter: "blur(4px) brightness(0.5)" },
        0,
      );

      // element scrollers aren't tracked by ST's window resize listener
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
      {/* pinned stage — sticks at the top of the scroller while the spacer scrolls */}
      <div className="sticky top-0 h-[calc(100vh-11rem)] overflow-hidden">
        {/* hero (stays put behind) */}
        <div
          ref={hero}
          className="absolute inset-0 grid place-items-center bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 text-white will-change-transform"
        >
          <div className="text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.35em] text-white/70">
              Scroll down
            </p>
            <h1 className="text-[22vw] font-black leading-none tracking-tighter md:text-[12rem]">
              FLOW
            </h1>
          </div>
        </div>

        {/* next section (slides up to cover the hero) */}
        <div
          ref={next}
          className="absolute inset-0 grid translate-y-full place-items-center bg-neutral-950 text-white will-change-transform"
        >
          <div className="max-w-xl px-6 text-center">
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              The next section
            </h2>
            <p className="mt-4 text-base text-white/60">
              slides up and covers the hero as you keep scrolling.
            </p>
          </div>
        </div>
      </div>

      {/* spacer — gives the scrub its scroll distance while the stage is pinned */}
      <div aria-hidden className="h-[120vh]" />
    </div>
  );
};

export default HeroCoverReveal;
