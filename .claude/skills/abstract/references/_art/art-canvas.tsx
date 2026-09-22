"use client";

import { useEffect, useRef } from "react";
import type { SceneFactory } from "./scene";

/** Frame shown instead of the loop when the viewer prefers reduced motion. */
const STILL_TIME = 2;

/**
 * Runs one Scene on a canvas: sizes it for the device pixel ratio, repaints on
 * resize, and only animates while the tile is on screen and the tab is visible.
 */
export function ArtCanvas({ scene, name, className = "" }: { scene: SceneFactory; name?: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const art = scene();
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const paint = () => {
      if (!width || !height) return;
      ctx.fillStyle = art.background;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      art.draw(ctx, reducedMotion.matches ? STILL_TIME : elapsed);
      ctx.restore();
    };
    const tick = (now: number) => {
      // Cap the step so a backgrounded tab doesn't jump the loop forward.
      elapsed += Math.min((now - previous) / 1000, 0.1);
      previous = now;
      paint();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      paint();
      if (visible && !document.hidden && !reducedMotion.matches) {
        previous = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      art.resize(width, height);
      paint();
    };

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(host);
    resize();
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    viewObserver.observe(host);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    // Glyphs are drawn with the page font; repaint once it has loaded.
    document.fonts?.ready.then(paint);

    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [scene]);

  return (
    // `data-scene` lets screenshot scripts target a single tile.
    <div ref={hostRef} data-scene={name} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
    </div>
  );
}
