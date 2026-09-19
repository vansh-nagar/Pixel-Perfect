"use client";

/**
 * A tall row of flat colour cards fanned along a flat diagonal (no depth recede); each card is angled about Y. It auto-slides, loops infinitely with no seam, and can be dragged to scrub.
 */

import { useEffect, useRef } from "react";

// Flat, high-contrast swatches: a solid fill, one hard-edged motif, and a text colour that reads on it.
const SWATCHES = [
  { bg: "#ff5f1f", ink: "#151515", motif: "conic-gradient(at 62.5% 37.5%, #f6a8f2 25%, transparent 0) 0 0 / 32px 32px" },
  { bg: "#2d4bff", ink: "#ffffff", motif: "linear-gradient(90deg, #9dbbff 2px, transparent 0) 0 0 / 44px 44px, linear-gradient(#9dbbff 2px, transparent 0) 0 0 / 44px 44px" },
  { bg: "#f6a8f2", ink: "#151515", motif: "repeating-radial-gradient(circle at 30% 70%, #ff5f1f 0 12px, transparent 12px 34px)" },
  { bg: "#ffb000", ink: "#151515", motif: "repeating-linear-gradient(45deg, #151515 0 9px, transparent 9px 30px)" },
  { bg: "#6b3ce6", ink: "#ffffff", motif: "radial-gradient(circle, #ffb000 0 7px, transparent 7.5px) 0 0 / 36px 36px" },
  { bg: "#9dbbff", ink: "#151515", motif: "repeating-linear-gradient(0deg, #2d4bff 0 6px, transparent 6px 22px)" },
];

const CARDS = [
  { title: "Axee Muned" },
  { title: "Solace" },
  { title: "The Leading Web3 Marketing" },
  { title: "Nocturne" },
  { title: "Halo Studio" },
  { title: "Drift" },
  { title: "Monolith" },
  { title: "Aurora Labs" },
  { title: "Pulse" },
  { title: "Verdant" },
  { title: "Ember" },
  { title: "Cascade" },
];

const C = {
  persp: 600, // CSS perspective distance (px)
  ox: 0, // perspective-origin X (% — vanishing point)
  oy: 8, // perspective-origin Y (%)
  sx: 219, // → right  per card
  sy: 20, //  ↑ up     per card
  sz: 0, // ← back   per card
  ry: -17, // card angle about Y (deck fan)
  rz: 0, // jaunty tilt
  posX: 0, // deck anchor X (% of container)
  posY: 100, // deck anchor Y (%)
  cw: 368, // card width (px)
  ch: 460, // card height (px)
};

const FannedDeckCarousel = () => {
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scroll = useRef(0);
  const target = useRef(0);

  useEffect(() => {
    const N = CARDS.length;
    const AUTO = 0.006; // gentle auto-slide (cards/frame) when not dragging
    const WLO = -1.5;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const layout = () => {
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        let p = i - scroll.current;
        p = ((((p - WLO) % N) + N) % N) + WLO;
        const scale = 1 - Math.max(0, p) * 0.012;
        const opacity =
          p < 0
            ? Math.max(0, 1 + p / 0.6)
            : Math.max(0, 1 - Math.max(0, p - 7) * 0.5);
        el.style.transform = `translate3d(${p * C.sx}px, ${-p * C.sy}px, ${-p * C.sz}px) rotateY(${C.ry}deg) rotateZ(${C.rz}deg) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(Math.round(10000 - p * 100));
      }
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging) target.current += AUTO; // keep sliding forever
      scroll.current += (target.current - scroll.current) * 0.09;
      layout();
    };
    tick();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const delta = (dx - dy) * 0.004; // up-right drag → forward
      target.current -= delta; // unbounded — the deck wraps infinitely
    };
    const onUp = () => {
      dragging = false;
    };

    const scene = railRef.current?.parentElement;
    scene?.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      scene?.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className="relative h-[80vh] w-full select-none overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          perspective: `${C.persp}px`,
          perspectiveOrigin: `${C.ox}% ${C.oy}%`,
        }}
      >
        <div
          ref={railRef}
          className="absolute"
          style={{
            left: `${C.posX}%`,
            top: `${C.posY}%`,
            transformStyle: "preserve-3d",
          }}
        >
          {CARDS.map((card, i) => {
            const swatch = SWATCHES[i % SWATCHES.length];
            return (
              <div
                key={card.title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute overflow-hidden rounded-xl ring-1 ring-white/40"
                style={{
                  width: C.cw,
                  height: C.ch,
                  marginLeft: -C.cw / 2,
                  marginTop: -C.ch / 2,
                  willChange: "transform, opacity",
                  backfaceVisibility: "hidden",
                  background: `${swatch.motif}, ${swatch.bg}`,
                  color: swatch.ink,
                }}
              >
                <p
                  className="pointer-events-none absolute bottom-2 left-2 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-widest"
                  style={{ backgroundColor: swatch.bg }}
                >
                  {card.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FannedDeckCarousel;
