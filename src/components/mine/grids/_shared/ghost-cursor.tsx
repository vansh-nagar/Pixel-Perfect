"use client";

import { useEffect, useRef, type RefObject } from "react";

const IDLE_MS = 1500; // how long after real mouse movement before the ghosts return
const EASE = 0.12; // how quickly a ghost catches up to its path (per frame)

const CURSOR_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))"><path d="M4 2.5 19.5 11 12.6 12.6 9.4 19.6Z" fill="black" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

/**
 * Fake cursors for demo grids. While the visitor isn't moving their own mouse, every
 * visible `[data-card]` gets its own cursor looping a figure-eight inside it. Each one
 * dispatches synthetic pointermove/mousemove events on its card; they bubble to window,
 * where the followers listen, and each follower ignores untrusted events aimed at a
 * different card — so all cards animate at once without fighting over one pointer.
 */
export function GhostCursor({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>;
}) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = layerRef.current;
    if (!layer) return;

    let frame = 0;
    let lastReal = -Infinity;
    const ghosts = new Map<
      HTMLElement,
      { x: number; y: number; phase: number; el: HTMLDivElement }
    >();

    const onRealMove = (e: PointerEvent) => {
      if (e.isTrusted) lastReal = performance.now();
    };
    window.addEventListener("pointermove", onRealMove, { passive: true });

    const hideAll = () => {
      for (const g of ghosts.values()) g.el.style.opacity = "0";
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const root = containerRef.current;
      if (!root || now - lastReal < IDLE_MS || document.hidden) {
        hideAll();
        return;
      }

      const vh = window.innerHeight;
      const seen = new Set<HTMLElement>();
      root.querySelectorAll<HTMLElement>("[data-card]").forEach((card, i) => {
        const r = card.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return; // off screen: leave it idle
        seen.add(card);

        let g = ghosts.get(card);
        if (!g) {
          const el = document.createElement("div");
          el.innerHTML = CURSOR_SVG;
          el.style.cssText =
            "position:fixed;left:0;top:0;opacity:0;transition:opacity .3s";
          layer.appendChild(el);
          g = {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            phase: i * 1.7, // stagger so cards don't move in lockstep
            el,
          };
          ghosts.set(card, g);
        }

        // Figure-eight around the card centre.
        const t = now / 1000 + g.phase;
        const tx = r.left + r.width / 2 + Math.sin(t * 1.3) * r.width * 0.3;
        const ty = r.top + r.height / 2 + Math.sin(t * 2.1) * r.height * 0.22;
        g.x += (tx - g.x) * EASE;
        g.y += (ty - g.y) * EASE;

        const init = { clientX: g.x, clientY: g.y, bubbles: true };
        card.dispatchEvent(
          new PointerEvent("pointermove", { ...init, pointerType: "mouse" }),
        );
        card.dispatchEvent(new MouseEvent("mousemove", init));
        g.el.style.transform = `translate3d(${g.x}px, ${g.y}px, 0)`;
        g.el.style.opacity = "1";
      });

      for (const [card, g] of ghosts) {
        if (!seen.has(card)) g.el.style.opacity = "0";
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onRealMove);
      for (const g of ghosts.values()) g.el.remove();
    };
  }, [containerRef]);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}

export default GhostCursor;
