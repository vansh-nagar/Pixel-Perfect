"use client";

/**
 * A classic cover-flow carousel: the centre cover faces you while the side covers angle inward with depth and a floor reflection. Drag to scrub with snap, click a side cover to bring it front, or let it auto-advance.
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

const COVERS = [
  { title: "Midnight Drive" },
  { title: "Glasshouse" },
  { title: "Low Tide" },
  { title: "Neon Fields" },
  { title: "Palerose" },
  { title: "Static Bloom" },
  { title: "Vantablack" },
  { title: "Golden Hour" },
  { title: "Undertow" },
  { title: "Northern Line" },
];

const C = {
  persp: 1100, // CSS perspective distance (px)
  cw: 250, // cover width (px)
  ch: 250, // cover height (px)
  gap: 118, // → right per step
  push: 105, // extra shove away from the centre cover
  rot: 55, // side-cover angle about Y (deg)
  depth: 150, // how far the centre cover pops forward (px)
  fall: 60, // how far each further step recedes (px)
};

const CoverFlowCarousel = () => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef(0);
  const target = useRef(0);
  const moved = useRef(0);

  useEffect(() => {
    const N = COVERS.length;

    let dragging = false;
    let lastX = 0;
    let idle = 0;

    const wrap = (p: number) => {
      p = ((p % N) + N) % N;
      return p > N / 2 ? p - N : p;
    };

    const layout = () => {
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const p = wrap(i - pos.current);
        const side = Math.max(-1, Math.min(1, p));
        const x = p * C.gap + side * C.push;
        const z =
          (1 - Math.min(1, Math.abs(p))) * C.depth - Math.abs(p) * C.fall;
        el.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${-side * C.rot}deg)`;
        el.style.zIndex = String(200 - Math.round(Math.abs(p) * 10));
        el.style.opacity = String(Math.abs(p) > 3.6 ? 0 : 1);
      }
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging && ++idle > 210) {
        // ~3.5s of stillness → advance one cover
        target.current = Math.round(target.current) + 1;
        idle = 0;
      }
      pos.current += (target.current - pos.current) * 0.09;
      layout();
    };
    tick();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved.current = 0;
      lastX = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved.current += Math.abs(dx);
      target.current -= dx * 0.006;
      idle = 0;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      target.current = Math.round(target.current); // snap to a cover
      idle = 0;
    };

    const scene = cardRefs.current[0]?.closest("[data-coverflow]");
    scene?.addEventListener("pointerdown", onDown as EventListener);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      scene?.removeEventListener("pointerdown", onDown as EventListener);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const bringToFront = (i: number) => {
    if (moved.current > 6) return; // it was a drag, not a click
    const N = COVERS.length;
    let p = ((i - pos.current) % N) + (i - pos.current < 0 ? N : 0);
    if (p > N / 2) p -= N;
    target.current = Math.round(pos.current + p);
  };

  return (
    <div
      data-coverflow
      className="relative flex h-[80vh] w-full cursor-grab select-none items-center justify-center overflow-hidden active:cursor-grabbing"
      style={{ perspective: `${C.persp}px` }}
    >
      <div
        className="relative -mt-10"
        style={{ transformStyle: "preserve-3d" }}
      >
        {COVERS.map((cover, i) => {
          const swatch = SWATCHES[i % SWATCHES.length];
          const fill = `${swatch.motif}, ${swatch.bg}`;
          return (
            <div
              key={cover.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              onClick={() => bringToFront(i)}
              className="absolute"
              style={{
                width: C.cw,
                height: C.ch * 1.55,
                marginLeft: -C.cw / 2,
                marginTop: -C.ch / 2,
                willChange: "transform, opacity",
              }}
            >
              <div
                className="rounded-md ring-1 ring-white/20"
                style={{ width: C.cw, height: C.ch, background: fill }}
              />
              {/* floor reflection — a flipped copy fading out under the cover */}
              <div
                className="mt-1 rounded-md opacity-40"
                style={{
                  width: C.cw,
                  height: C.ch,
                  background: fill,
                  transform: "scaleY(-1)",
                  maskImage:
                    "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)",
                }}
              />
              <p className="pointer-events-none absolute -bottom-2 left-0 right-0 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {cover.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoverFlowCarousel;
