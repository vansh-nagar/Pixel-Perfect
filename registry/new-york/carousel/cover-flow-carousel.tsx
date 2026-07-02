"use client";

/**
 * A classic cover-flow carousel: the centre cover faces you while the side covers angle inward with depth and a floor reflection. Drag to scrub with snap, click a side cover to bring it front, or let it auto-advance.
 */

import { useEffect, useRef } from "react";

const COVERS = [
  { seed: "flow-01", title: "Midnight Drive" },
  { seed: "flow-02", title: "Glasshouse" },
  { seed: "flow-03", title: "Low Tide" },
  { seed: "flow-04", title: "Neon Fields" },
  { seed: "flow-05", title: "Palerose" },
  { seed: "flow-06", title: "Static Bloom" },
  { seed: "flow-07", title: "Vantablack" },
  { seed: "flow-08", title: "Golden Hour" },
  { seed: "flow-09", title: "Undertow" },
  { seed: "flow-10", title: "Northern Line" },
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
        {COVERS.map((cover, i) => (
          <div
            key={cover.seed}
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
            <div className="overflow-hidden rounded-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${cover.seed}/500/500`}
                alt={cover.title}
                draggable={false}
                style={{ width: C.cw, height: C.ch }}
                className="object-cover"
              />
            </div>
            {/* floor reflection — a flipped copy fading out under the cover */}
            <div
              className="mt-1 overflow-hidden rounded-md opacity-40"
              style={{
                transform: "scaleY(-1)",
                maskImage:
                  "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)",
                WebkitMaskImage:
                  "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${cover.seed}/500/500`}
                alt=""
                aria-hidden
                draggable={false}
                style={{ width: C.cw, height: C.ch }}
                className="object-cover"
              />
            </div>
            <p className="pointer-events-none absolute -bottom-2 left-0 right-0 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {cover.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoverFlowCarousel;
