"use client";

/**
 * Cards orbit an ellipse in faux-3D — swinging to the front they scale up, sharpen and stack forward; passing behind they shrink, dim and blur. Drag to spin with momentum; it drifts on its own when idle.
 */

import { useEffect, useRef } from "react";

const CARDS = [
  { seed: "orbit-01", title: "Meridian" },
  { seed: "orbit-02", title: "Sable" },
  { seed: "orbit-03", title: "Juniper" },
  { seed: "orbit-04", title: "Cobalt" },
  { seed: "orbit-05", title: "Marrow" },
  { seed: "orbit-06", title: "Fenn" },
  { seed: "orbit-07", title: "Isohel" },
  { seed: "orbit-08", title: "Vesper" },
];

const C = {
  rx: 330, // ellipse half-width (px)
  ry: 78, // ellipse half-height (px)
  cw: 190, // card width (px)
  ch: 250, // card height (px)
  drift: 0.0026, // idle spin (rad/frame)
};

const OrbitCarousel = () => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const N = CARDS.length;

    let rot = 0;
    let vel = 0;
    let dragging = false;
    let lastX = 0;

    const layout = () => {
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const theta = (i / N) * Math.PI * 2 + rot;
        const x = Math.sin(theta) * C.rx;
        const d = Math.cos(theta); // 1 = front of the orbit, -1 = back
        const y = d * C.ry;
        const near = (d + 1) / 2;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${0.5 + near * 0.6})`;
        el.style.zIndex = String(Math.round(near * 200));
        el.style.opacity = String(0.35 + near * 0.65);
        el.style.filter = `blur(${(1 - near) * 2}px) brightness(${0.65 + near * 0.35})`;
      }
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
      const dRot = dx * 0.0045;
      rot += dRot;
      vel = dRot; // released velocity = last frame's spin
    };
    const onUp = () => {
      dragging = false;
    };

    const scene = cardRefs.current[0]?.closest("[data-orbit]");
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
      data-orbit
      className="relative flex h-[80vh] w-full cursor-grab select-none items-center justify-center overflow-hidden active:cursor-grabbing"
    >
      <div className="relative">
        {CARDS.map((card, i) => (
          <div
            key={card.seed}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute overflow-hidden rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] ring-1 ring-white/25"
            style={{
              width: C.cw,
              height: C.ch,
              marginLeft: -C.cw / 2,
              marginTop: -C.ch / 2,
              willChange: "transform, opacity, filter",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://picsum.photos/seed/${card.seed}/400/520`}
              alt={card.title}
              draggable={false}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
            <p className="pointer-events-none absolute bottom-3 left-4 text-[11px] font-medium uppercase tracking-widest text-white/90">
              {card.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrbitCarousel;
