"use client";

/**
 * igloo.inc's hero (the shattered ice igloo on a snowfield), rebuilt 1:1 from the site's
 * shipped code and original geometry/textures. See ./scene.ts for how the original works.
 *
 * LOCAL STUDY COPY. Assets live in the gitignored `public/_study/igloo/`. Never commit them
 * or promote this into the registry.
 *
 * PORT: the WebGL UI layer (logo, menu, sound toggle) and the scroll-driven transitions
 * after the hero are not included; the scene is frozen at its hero scroll position.
 */

import { useEffect, useRef, useState } from "react";
import { createIglooHero, type IglooHero as Hero } from "./scene";

export default function IglooHero() {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = container.current;
    const cv = canvas.current;
    if (!el || !cv) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hero: Hero | null = null;
    let disposed = false;
    let visible = false;
    let frame = 0;
    let last = 0;

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const delta = last ? now - last : 1000 / 60;
      last = now;
      hero?.render(delta);
    };
    const start = () => {
      if (frame || !hero) return;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) hero?.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      hero?.setPointer(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    };
    window.addEventListener("pointermove", onPointerMove);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
        if (entry.intersectionRatio >= 0.4) hero?.playIntro();
      },
      { threshold: [0, 0.4] },
    );

    createIglooHero(cv, { reducedMotion })
      .then((h) => {
        if (disposed) {
          h.dispose();
          return;
        }
        hero = h;
        resize();
        observer.observe(el);
        if (visible) start();
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!disposed) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      hero?.dispose();
    };
  }, []);

  return (
    <div ref={container} className="relative h-screen w-full overflow-hidden bg-[#8b909d]">
      <canvas ref={canvas} className="absolute inset-0 block size-full" />
      {error && (
        <p className="absolute inset-x-0 bottom-6 text-center font-mono text-xs text-white/80">Igloo failed to load: {error}</p>
      )}
    </div>
  );
}
