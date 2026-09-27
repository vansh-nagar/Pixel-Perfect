/**
 * A 1-bit retro sunset: a banded sun over a scrolling perspective grid, rendered in two colours with a Bayer ordered dither.
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface BayerSunsetBackgroundProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Lit-pixel colour. */
  color?: string;
  backgroundColor?: string;
  /** Size of one dither pixel in px. */
  pixelSize?: number;
  speed?: number;
  paused?: boolean;
}

// 4×4 Bayer matrix: each pixel gets its own threshold, so smooth tones
// become an even crosshatch of on/off pixels.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const fract = (v: number) => v - Math.floor(v);

export default function BayerSunsetBackground({
  children, className = "", style, color = "#ff7a3d", backgroundColor = "#1a0f3d",
  pixelSize = 4, speed = 1, paused = false,
}: BayerSunsetBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const buffer = document.createElement("canvas");
    const bufferCtx = buffer.getContext("2d");
    if (!ctx || !bufferCtx) return;
    const cell = Number.isFinite(pixelSize) ? Math.max(2, Math.round(pixelSize)) : 4;
    const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    // Resolve any CSS colour to RGB by painting it once.
    bufferCtx.fillStyle = color;
    bufferCtx.fillRect(0, 0, 1, 1);
    const [red, green, blue] = bufferCtx.getImageData(0, 0, 1, 1).data;

    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let image: ImageData | null = null;
    let frame = 0;
    let frameNumber = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;

    const tone = (x: number, y: number, t: number) => {
      const horizon = rows * 0.64;
      const sunX = columns * 0.5;
      const sunY = rows * 0.42;
      const radius = Math.min(columns, rows) * 0.27;
      if (y < horizon) {
        const sky = Math.pow(y / horizon, 2.2) * 0.5;
        const d = Math.hypot(x - sunX, y - sunY);
        if (d >= radius) return sky + 0.4 * Math.exp(-(d - radius) / (radius * 0.45));
        // Slats cut the lower half of the sun, thickening toward the horizon.
        const s = (y - sunY) / radius;
        if (s > -0.1 && fract(s * 5 - t * 0.5) < (s + 0.1) * 0.5) return sky;
        return 1;
      }
      const depth = (y - horizon) / (rows - horizon);
      const z = 1 / (depth + 0.04);
      // Lines crowd together near the horizon; fading them there avoids aliasing mush.
      const fade = Math.min(1, Math.max(0, depth - 0.06) * 2.6);
      const across = fract(((x - sunX) / columns) * 9 * z);
      const line = fract(z * 0.6 + t * 1.1) < 0.1 || across < 0.07 || across > 0.93;
      let v = depth * 0.12 + (line ? 0.9 * fade : 0);
      // The sun's reflection, rippling on the floor.
      const reflect = Math.abs(x - sunX) / radius;
      if (reflect < 1) v += 0.35 * (1 - reflect) * (1 - depth) * (0.5 + 0.5 * Math.sin(y * 1.3 - t * 4));
      return v;
    };

    const draw = () => {
      if (!image) return;
      const data = image.data;
      const t = elapsed;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const threshold = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
          const i = (y * columns + x) * 4;
          data[i] = red;
          data[i + 1] = green;
          data[i + 2] = blue;
          data[i + 3] = tone(x, y, t) > threshold ? 255 : 0;
        }
      }
      bufferCtx.putImageData(image, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buffer, 0, 0, columns * cell, rows * cell);
    };
    const tick = (now: number) => {
      elapsed += Math.min((now - previous) / 1000, 0.1) * rate;
      previous = now;
      // Every other frame: cheaper, and the stepped motion suits the pixel look.
      if (++frameNumber % 2 === 0) draw();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches) elapsed = 0;
      draw();
      if (!paused && rate > 0 && visible && !document.hidden && !reducedMotion.matches) {
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
      columns = Math.max(1, Math.ceil(width / cell));
      rows = Math.max(1, Math.ceil(height / cell));
      buffer.width = columns;
      buffer.height = rows;
      image = bufferCtx.createImageData(columns, rows);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    intersection.observe(host);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [color, pixelSize, speed, paused]);

  return (
    <div ref={hostRef} className={`relative isolate h-full w-full overflow-hidden ${className}`} style={{ backgroundColor, ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}
