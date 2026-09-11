/**
 * Graphic images orbit through a coordinated tilted ring, then rotate forward and expand to cover the viewport.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export interface OrbitImage {
  src: string;
  alt: string;
}

export interface OrbitToFullscreenProps {
  images?: OrbitImage[];
  className?: string;
  /** Seconds for the selected image to expand. */
  duration?: number;
  autoRotate?: boolean;
}

const DEFAULT_IMAGES: OrbitImage[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  src: `/image-animations/photo-${n}.jpg`,
  alt: `Photo ${n}`,
}));
const TAU = Math.PI * 2;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export default function OrbitToFullscreen({ images = DEFAULT_IMAGES, className = "", duration = 0.8, autoRotate = true }: OrbitToFullscreenProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalStageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const actions = useRef<{ open: (index: number) => void; close: () => void; step: (direction: number) => void }>({ open: () => {}, close: () => {}, step: () => {} });
  const [selected, setSelected] = useState(0);
  const items = images.length ? images : DEFAULT_IMAGES;
  const activeItem = items[selected % items.length];

  useEffect(() => {
    const stage = stageRef.current;
    const dialog = dialogRef.current;
    const modalStage = modalStageRef.current;
    if (!stage || !dialog || !modalStage) return;
    const cards = [...stage.querySelectorAll<HTMLElement>("[data-orbit-card]")];
    const modalCards = [...modalStage.querySelectorAll<HTMLElement>("[data-orbit-image]")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const animationDuration = Number.isFinite(duration) ? Math.max(0.1, duration) : 0.8;
    const state = { angle: 0, expand: 0, lift: 0 };
    let active = 0;
    let busy = false;
    let visible = true;
    let origin = stage.getBoundingClientRect();
    let timeline: gsap.core.Timeline | null = null;
    let returnFocus: HTMLElement | null = null;
    let previousOverflow = "";

    const paint = (elements: HTMLElement[], width: number, height: number, offsetX = 0, offsetY = 0, expansion = 0) => {
      // One rigid, tilted ring: depth comes from perspective, never independent
      // per-card size pulses or double-frequency vertical motion.
      const radius = Math.min(width * 0.34, height * 0.62);
      const tilt = -32 * Math.PI / 180;
      const roll = -9 * Math.PI / 180;
      const cardWidth = Math.min(width * 0.32, height * 0.59);
      elements.forEach((card, index) => {
        const angle = state.angle + index * TAU / items.length;
        const rx = Math.sin(angle) * radius;
        const rz = Math.cos(angle) * radius;
        const ry = -rz * Math.sin(tilt);
        const x = rx * Math.cos(roll) - ry * Math.sin(roll);
        const y = rx * Math.sin(roll) + ry * Math.cos(roll);
        const z = rz * Math.cos(tilt) - radius;
        const progress = index === active ? expansion : 0;
        const w = mix(cardWidth, width, progress);
        const h = mix(cardWidth * 0.75, height, progress);
        gsap.set(card, {
          x: offsetX + width / 2 + x * (1 - progress) - w / 2,
          y: offsetY + height / 2 + y * (1 - progress) - h / 2,
          z: z * (1 - progress),
          borderRadius: 16 * (1 - progress),
          width: w,
          height: h,
          rotationX: -32 * (1 - progress),
          rotationY: [18, -22, 14, -18, 24, -12][index % 6] * (1 - progress),
          rotationZ: -9 * (1 - progress),
          opacity: index === active ? 1 : 1 - expansion,
          force3D: true,
        });
      });
    };
    const draw = () => {
      stage.style.perspective = `${stage.clientWidth * 2}px`;
      modalStage.style.perspectiveOrigin = `${mix(origin.left + origin.width / 2, dialog.clientWidth / 2, state.lift)}px ${mix(origin.top + origin.height / 2, dialog.clientHeight / 2, state.lift)}px`;
      modalStage.style.perspective = `${mix(stage.clientWidth, dialog.clientWidth, state.lift) * 2}px`;
      paint(cards, stage.clientWidth, stage.clientHeight);
      if (!dialog.open) return;
      paint(modalCards, mix(origin.width, dialog.clientWidth, state.lift), mix(origin.height, dialog.clientHeight, state.lift), mix(origin.left, 0, state.lift), mix(origin.top, 0, state.lift), state.expand);
      dialog.style.backgroundColor = `color-mix(in oklab, var(--background) ${state.lift * 100}%, transparent)`;
      if (controlsRef.current) controlsRef.current.style.opacity = String(state.lift);
    };
    const seconds = (value: number) => reduced.matches ? 0 : value;
    const finishClose = () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      busy = false;
      returnFocus?.focus({ preventScroll: true });
    };
    const open = (index: number) => {
      if (busy || dialog.open) return;
      active = index;
      setSelected(index);
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      origin = stage.getBoundingClientRect();
      state.expand = 0;
      state.lift = 0;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
      draw();
      busy = true;
      // Pick the nearest equivalent turn, avoiding a long spin on wraparound.
      const target = -index * TAU / items.length;
      const turn = target + Math.round((state.angle - target) / TAU) * TAU;
      timeline?.kill();
      timeline = gsap.timeline({ onUpdate: draw, onComplete: () => { busy = false; } })
        .to(state, { lift: 1, duration: seconds(0.9), ease: "power3.inOut" }, 0)
        .to(state, { angle: turn, duration: seconds(1.1), ease: "power3.inOut" }, 0)
        .to(state, { expand: 1, duration: seconds(animationDuration), ease: "power2.out" }, seconds(0.85));
    };
    const close = () => {
      if (!dialog.open) return;
      timeline?.kill();
      busy = true;
      origin = stage.getBoundingClientRect();
      timeline = gsap.timeline({ onUpdate: draw, onComplete: finishClose })
        .to(state, { expand: 0, duration: seconds(animationDuration), ease: "power2.out" })
        .to(state, { lift: 0, duration: seconds(0.9), ease: "power3.inOut" }, seconds(animationDuration * 0.8));
    };
    const step = (direction: number) => {
      if (busy) return;
      if (!dialog.open) {
        const index = (active + direction + items.length) % items.length;
        open(index);
        return;
      }
      busy = true;
      const index = (active + direction + items.length) % items.length;
      const turn = state.angle - direction * TAU / items.length;
      timeline?.kill();
      timeline = gsap.timeline({ onUpdate: draw, onComplete: () => { busy = false; } })
        .to(state, { expand: 0, duration: seconds(0.65), ease: "power3.inOut" })
        .call(() => { active = index; setSelected(index); })
        .to(state, { angle: turn, duration: seconds(1.05), ease: "power3.inOut" }, "-=0.15")
        .to(state, { expand: 1, duration: seconds(animationDuration), ease: "power2.out" });
    };
    actions.current = { open, close, step };
    const tick = (_time: number, delta: number) => {
      if (!visible || document.hidden || dialog.open || reduced.matches || !autoRotate) return;
      state.angle += Math.min(delta, 50) / 1000 * 0.18;
      draw();
    };
    const onMotion = () => { if (reduced.matches) timeline?.progress(1); draw(); };
    const observer = new ResizeObserver(draw);
    observer.observe(stage);
    observer.observe(dialog);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    intersection.observe(stage);
    reduced.addEventListener("change", onMotion);
    gsap.ticker.add(tick);
    draw();
    return () => {
      timeline?.kill();
      gsap.ticker.remove(tick);
      observer.disconnect();
      intersection.disconnect();
      reduced.removeEventListener("change", onMotion);
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = previousOverflow;
      }
      actions.current = { open: () => {}, close: () => {}, step: () => {} };
    };
  }, [items, duration, autoRotate]);

  return (
    <div className={`relative aspect-square w-full max-w-[min(90%,26rem)] text-foreground ${className}`}>
      <div ref={stageRef} className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]" aria-label="Orbit image gallery">
        {items.map((item, index) => (
          <button key={`${item.src}-${index}`} data-orbit-card type="button" onClick={() => actions.current.open(index)} aria-label={`Expand ${item.alt} fullscreen`} className="pointer-events-auto absolute left-0 top-0 overflow-hidden border-0 p-0 outline-offset-4 focus-visible:outline-2 focus-visible:outline-foreground">
            {/* Native images support the library photos and user-provided image URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" draggable={false} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <dialog ref={dialogRef} aria-label={`${activeItem.alt} fullscreen viewer`} onCancel={(event) => { event.preventDefault(); actions.current.close(); }} onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); event.stopPropagation(); actions.current.step(event.key === "ArrowRight" ? 1 : -1); }
      }} className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent">
        <div ref={modalStageRef} className="absolute inset-0 [transform-style:preserve-3d]" aria-hidden="true">
          {items.map((item, index) => (
            <div key={`${item.src}-${index}`} data-orbit-image className="absolute left-0 top-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt="" draggable={false} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <div ref={controlsRef} className="absolute inset-0 z-[200] pointer-events-none">
          <button type="button" onClick={() => actions.current.close()} className="pointer-events-auto absolute right-5 top-5 rounded-md border border-border bg-background/85 px-5 py-3 text-sm text-foreground backdrop-blur-md">Close <span aria-hidden="true">×</span></button>
          <div className="absolute bottom-6 left-5 rounded-md border border-border bg-background/85 px-4 py-3 text-xs text-foreground backdrop-blur-md" aria-live="polite">{String(selected + 1).padStart(2, "0")} / {activeItem.alt}</div>
          <div className="pointer-events-auto absolute bottom-6 right-5 flex gap-2">
            <button type="button" onClick={() => actions.current.step(-1)} aria-label="Previous image" className="h-11 w-11 rounded-md border border-border bg-background/85 text-foreground backdrop-blur-md">←</button>
            <button type="button" onClick={() => actions.current.step(1)} aria-label="Next image" className="h-11 w-11 rounded-md border border-border bg-background/85 text-foreground backdrop-blur-md">→</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
