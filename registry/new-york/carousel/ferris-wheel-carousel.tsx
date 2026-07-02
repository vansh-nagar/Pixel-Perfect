"use client";

/**
 * Gondola cards hang from a slowly turning ferris wheel — they stay upright as the wheel rotates and swing like pendulums when it speeds up or brakes. Drag anywhere to spin it with momentum; it settles back into a lazy drift.
 */

import { useEffect, useRef } from "react";

const CARDS = [
  { seed: "wheel-01", title: "Arcade" },
  { seed: "wheel-02", title: "Boardwalk" },
  { seed: "wheel-03", title: "Funhouse" },
  { seed: "wheel-04", title: "Midway" },
  { seed: "wheel-05", title: "Carny" },
  { seed: "wheel-06", title: "Big Top" },
  { seed: "wheel-07", title: "Tilt-a-Whirl" },
  { seed: "wheel-08", title: "Last Ride" },
];

const C = {
  r: 185, // wheel radius (px)
  cw: 110, // card width (px)
  ch: 132, // card height (px)
  strut: 20, // hanger between rim and card (px)
  drift: 0.0018, // idle spin (rad/frame)
  maxSwing: 16, // pendulum tilt cap (deg)
};

const FerrisWheelCarousel = () => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spokesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const N = CARDS.length;

    let rot = 0;
    let vel = 0;
    let prevRot = 0;
    let swing = 0;
    let dragging = false;
    let lastX = 0;

    const layout = () => {
      // pendulum: tilt chases the wheel's actual per-frame rotation
      const d = rot - prevRot;
      prevRot = rot;
      const swingTarget = Math.max(
        -C.maxSwing,
        Math.min(C.maxSwing, -d * (180 / Math.PI) * 3),
      );
      swing += (swingTarget - swing) * 0.06;

      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const a = rot + (i / N) * Math.PI * 2;
        const x = Math.sin(a) * C.r;
        const y = -Math.cos(a) * C.r;
        const wobble = 0.8 + (i % 3) * 0.15; // gondolas don't swing in lockstep
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${swing * wobble}deg)`;
      }
      if (spokesRef.current)
        spokesRef.current.style.transform = `rotate(${rot}rad)`;
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging) {
        rot += vel + C.drift;
        vel *= 0.95; // momentum decays back to the idle drift
      }
      layout();
    };
    tick();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      vel = 0;
      lastX = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      const dRot = dx * 0.004;
      rot += dRot;
      vel = dRot; // released velocity = last frame's spin
    };
    const onUp = () => {
      dragging = false;
    };

    const scene = spokesRef.current?.closest("[data-ferris]");
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

  return (
    <div
      data-ferris
      className="relative flex h-[80vh] w-full cursor-grab select-none items-center justify-center overflow-hidden active:cursor-grabbing"
    >
      <div className="relative">
        {/* rim + spokes rotate; the dashed rim makes the spin readable */}
        <div
          ref={spokesRef}
          className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-border"
          style={{
            width: C.r * 2,
            height: C.r * 2,
            marginLeft: -C.r,
            marginTop: -C.r,
            willChange: "transform",
          }}
        >
          {CARDS.map((card, i) => (
            <div
              key={card.seed}
              className="absolute left-1/2 top-1/2 w-px origin-top bg-border"
              style={{
                height: C.r,
                transform: `rotate(${(i / CARDS.length) * 360 + 180}deg)`,
              }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background" />
        </div>

        {/* gondolas stay upright and swing about their attach point */}
        {CARDS.map((card, i) => (
          <div
            key={card.seed}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-1/2"
            style={{
              width: C.cw,
              marginLeft: -C.cw / 2,
              transformOrigin: "50% 0px",
              willChange: "transform",
            }}
          >
            <div
              className="mx-auto w-px bg-border"
              style={{ height: C.strut }}
            />
            <div
              className="relative overflow-hidden rounded-lg bg-neutral-900 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.4)] ring-1 ring-white/20"
              style={{ width: C.cw, height: C.ch }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${card.seed}/260/320`}
                alt={card.title}
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
              <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[9px] font-medium uppercase tracking-widest text-white/90">
                {card.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FerrisWheelCarousel;
