"use client";

/**
 * Slides live on the faces of a 3D prism that rotates to advance, dipping back in scale mid-turn like it needs room to swing. Drag to spin it freely with snap, or let it auto-rotate; faces are reassigned on the fly so any number of slides fits on four faces.
 */

import { useEffect, useRef, useState } from "react";

const SLIDES = [
  { seed: "cube-01", title: "Terminal City" },
  { seed: "cube-02", title: "Salt Flats" },
  { seed: "cube-03", title: "Wavelength" },
  { seed: "cube-04", title: "Night Market" },
  { seed: "cube-05", title: "Overcast" },
  { seed: "cube-06", title: "Redshift" },
];

const C = {
  persp: 1600, // CSS perspective distance (px)
  w: 440, // face width (px) — also the prism depth
  h: 300, // face height (px)
  dip: 0.35, // how hard the prism shrinks mid-rotation
};

const imageUrl = (seed: string) => `https://picsum.photos/seed/${seed}/900/620`;

const CubeCarousel = () => {
  const scaleRef = useRef<HTMLDivElement>(null);
  const prismRef = useRef<HTMLDivElement>(null);
  const rot = useRef(0);
  const target = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let idle = 0;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging && ++idle > 230) {
        // ~3.8s of stillness → quarter turn to the next face
        target.current = (Math.round(target.current / 90) + 1) * 90;
        idle = 0;
      }
      rot.current += (target.current - rot.current) * 0.085;

      const prism = prismRef.current;
      const scaler = scaleRef.current;
      if (prism && scaler) {
        prism.style.transform = `translateZ(${-C.w / 2}px) rotateY(${-rot.current}deg)`;
        // shrink at the halfway point of a turn, full size when settled
        const frac = Math.abs(rot.current / 90 - Math.round(rot.current / 90));
        scaler.style.transform = `scale(${1 - Math.min(0.5, frac) * C.dip})`;
      }
      setStep((s) => {
        const sr = Math.round(rot.current / 90);
        return sr === s ? s : sr;
      });
    };
    tick();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      target.current -= dx * 0.28; // px → degrees, unbounded either way
      idle = 0;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      target.current = Math.round(target.current / 90) * 90; // settle on a face
      idle = 0;
    };

    const scene = prismRef.current?.closest("[data-cube]");
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

  // Four physical faces cycle through N slides: face f shows the slide for the
  // nearest rotation step k with k ≡ f (mod 4), so neighbours are always ready.
  const slideForFace = (f: number) => {
    const k = f + 4 * Math.round((step - f) / 4);
    return SLIDES[((k % SLIDES.length) + SLIDES.length) % SLIDES.length];
  };

  return (
    <div
      data-cube
      className="relative flex h-[80vh] w-full cursor-grab select-none items-center justify-center overflow-hidden active:cursor-grabbing"
      style={{ perspective: `${C.persp}px` }}
    >
      <div ref={scaleRef} style={{ willChange: "transform" }}>
        <div
          ref={prismRef}
          className="relative"
          style={{
            width: C.w,
            height: C.h,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {[0, 1, 2, 3].map((f) => {
            const slide = slideForFace(f);
            return (
              <div
                key={f}
                className="absolute inset-0 overflow-hidden rounded-lg bg-neutral-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/20"
                style={{
                  transform: `rotateY(${f * 90}deg) translateZ(${C.w / 2}px)`,
                  backfaceVisibility: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(slide.seed)}
                  alt={slide.title}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
                <p className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium uppercase tracking-[0.25em] text-white/90">
                  {slide.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* warm the cache so face reassignment never flashes */}
      <div className="hidden">
        {SLIDES.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.seed} src={imageUrl(s.seed)} alt="" aria-hidden />
        ))}
      </div>
    </div>
  );
};

export default CubeCarousel;
