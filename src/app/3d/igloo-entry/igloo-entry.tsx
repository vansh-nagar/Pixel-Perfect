"use client";

/**
 * igloo.inc's closing section: a foggy round room where 150k particles crawl over a 3D shape
 * (penguin / X / Medium) and a carousel switches between the social links. Rebuilt 1:1 from
 * the site's shipped code, volumes, geometry and font. See ./scene.ts for how it works.
 *
 * LOCAL STUDY COPY. Assets live in the gitignored `public/_study/igloo/`. Never commit them
 * or promote this into the registry.
 *
 * Controls (as on the site): click the left/right half to switch links, ←/→ keys, click the
 * bracket to open the link. Moving the pointer pushes the particles through a fluid sim.
 *
 * PORT: the global WebGL UI (IGLOO logo, sound toggle) isn't part of this scene and isn't
 * included; the page scroll into the room is replaced by a 2.5s arrival when it comes into view.
 */

import { useEffect, useRef, useState } from "react";
import { createIglooEntry, type IglooEntry as Entry } from "./scene";

export default function IglooEntry() {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = container.current;
    const cv = canvas.current;
    if (!el || !cv) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let entry: Entry | null = null;
    let disposed = false;
    let visible = false;
    let frame = 0;
    let last = 0;

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const delta = last ? now - last : 1000 / 60;
      last = now;
      if (!entry) return;
      entry.render(delta);
      cv.style.cursor = entry.cursor();
    };
    const start = () => {
      if (frame || !entry) return;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) entry?.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);

    const onPointerMove = (e: PointerEvent) => entry?.setPointer(e.clientX, e.clientY, el.getBoundingClientRect());
    window.addEventListener("pointermove", onPointerMove);

    let down: { x: number; y: number } | null = null;
    const onPointerDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onPointerUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) entry?.click(e.clientX, e.clientY, el.getBoundingClientRect());
      down = null;
    };
    cv.addEventListener("pointerdown", onPointerDown);
    cv.addEventListener("pointerup", onPointerUp);

    const onKey = (e: KeyboardEvent) => {
      if (visible) entry?.key(e.key);
    };
    window.addEventListener("keydown", onKey);

    const observer = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
        if (e.intersectionRatio >= 0.4) entry?.arrive();
      },
      { threshold: [0, 0.4] },
    );

    createIglooEntry(cv, { reducedMotion })
      .then((created) => {
        if (disposed) {
          created.dispose();
          return;
        }
        entry = created;
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
      window.removeEventListener("keydown", onKey);
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointerup", onPointerUp);
      entry?.dispose();
    };
  }, []);

  return (
    <div ref={container} className="relative h-screen w-full overflow-hidden bg-[#9aa0ad]">
      <canvas ref={canvas} className="absolute inset-0 block size-full" />
      {error && (
        <p className="absolute inset-x-0 bottom-6 text-center font-mono text-xs text-white/80">Igloo room failed to load: {error}</p>
      )}
    </div>
  );
}
