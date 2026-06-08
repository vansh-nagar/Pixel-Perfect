"use client";

/**
 * Scroll-driven typography engine — renders a heading and plays one of 29 GSAP
 * ScrollTrigger effects as it scrolls through the viewport (ported from Codrops'
 * On-Scroll Typography Animations). Works against the window scroller or a nested
 * overflow container, auto-detected at mount.
 */

import { createElement, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/src/SplitText";
import ScrollTrigger from "gsap/src/ScrollTrigger";
import { EFFECTS, type FxId } from "./effects";

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

/** Coalesce refreshes from many instances mounting/resizing in the same tick. */
let refreshTimer = 0;
function scheduleRefresh() {
  if (typeof window === "undefined") return;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 60);
}

/** Nearest scrollable ancestor (or a Lenis-prevented pane); `undefined` = window. */
function findScroller(el: HTMLElement): Element | undefined {
  let node = el.parentElement;
  while (node) {
    if (node.hasAttribute("data-lenis-prevent")) return node;
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight)
      return node;
    node = node.parentElement;
  }
  return undefined;
}

export interface ScrollTypographyProps {
  /** Which of the 29 effects to play (`"fx1"`..`"fx29"`). */
  effect: FxId;
  /** Heading text; `\n` starts a new centered line. */
  text: string;
  className?: string;
  /** Heading tag — defaults to `h2`. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Override the auto-detected scroll container. */
  scroller?: Element | null;
  /** Show ScrollTrigger markers. */
  debug?: boolean;
}

export function ScrollTypography({
  effect,
  text,
  className,
  as = "h2",
  scroller,
  debug = false,
}: ScrollTypographyProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLHeadingElement>(null);
  const lines = text.split("\n");

  useGSAP(
    () => {
      const root = rootRef.current;
      const stage = stageRef.current;
      if (!root || !stage) return;

      // Respect reduced-motion: leave the heading as plain, readable text.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const split = new SplitText(root, {
        type: "words,chars",
        wordsClass: "st-word",
        charsClass: "st-char",
      });
      const chars = split.chars as HTMLElement[];
      const words = split.words as HTMLElement[];

      const resolved = scroller ?? findScroller(root);

      const makeST = (cfg: Record<string, unknown>) => ({
        ...cfg,
        ...(resolved ? { scroller: resolved, pinType: "transform" } : {}),
        ...(debug ? { markers: true } : {}),
      });

      EFFECTS[effect]({
        root,
        stage,
        chars,
        words,
        scroller: resolved ?? undefined,
        makeST,
      });

      scheduleRefresh();
      // Re-measure once webfonts settle (SplitText positions shift on swap-in).
      document.fonts?.ready.then(scheduleRefresh);

      // Element scrollers aren't tracked by ST's window resize listener.
      let resizeTimer = 0;
      const ro = new ResizeObserver(() => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(scheduleRefresh, 120);
      });
      if (resolved instanceof Element) ro.observe(resolved);

      return () => {
        window.clearTimeout(resizeTimer);
        ro.disconnect();
        split.revert();
      };
    },
    { scope: stageRef, dependencies: [effect, text, scroller] }
  );

  return (
    <div ref={stageRef} style={{ width: "100%", textAlign: "center" }}>
      {createElement(
        as as any,
        {
          ref: rootRef,
          className,
          style: {
            display: "grid",
            width: "100%",
            justifyItems: "center",
            gap: "0.1em",
            lineHeight: 0.85,
            margin: 0,
          } as React.CSSProperties,
        },
        lines.map((line, i) => (
          <span key={i} style={{ display: "block", whiteSpace: "pre-wrap" }}>
            {line}
          </span>
        ))
      )}
    </div>
  );
}

export default ScrollTypography;
