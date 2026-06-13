"use client";

/**
 * Ring Carousel 3D — image cards arranged around a circle in real 3D space
 * (rotateY + translateZ on a perspective stage). The ring drifts on its own,
 * spins when you drag, and carries momentum that bleeds back to the idle
 * drift; cards brighten as they swing to the front and dim toward the back.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

const IMAGES = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1454372182658-c712e4c5a1db?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1475924156734-496f6dac6e3d?q=80&w=600&auto=format&fit=crop",
];

const CARD_W = 260; // px
const CARD_H = 180; // px
const OVERLAP = 0.8; // <1 pulls the radius in so neighbours overlap on the arc
const TILT = -5; // degrees of camera tilt on the ring
const AUTO = 0.1; // idle drift, degrees per frame

const RingCarousel3D = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Even angular step; radius pulled in by OVERLAP so the cards crowd the
  // front arc and overlap, instead of sitting spaced out around the ring.
  const step = 360 / IMAGES.length;
  const radius = Math.round(
    (CARD_W / 2 / Math.tan(Math.PI / IMAGES.length)) * OVERLAP,
  );

  useGSAP(
    () => {
      const ring = ringRef.current;
      const stage = stageRef.current;
      if (!ring || !stage) return;

      const cards = Array.from(ring.children) as HTMLElement[];

      let rotation = 0;
      let velocity = 0; // extra deg/frame from a drag, decays to 0
      let dragging = false;
      let lastX = 0;

      const tick = () => {
        if (!dragging) {
          rotation += AUTO + velocity;
          velocity *= 0.94;
          if (Math.abs(velocity) < 0.001) velocity = 0;
        }
        gsap.set(ring, { rotationX: TILT, rotationY: rotation });

        // Brightness/opacity by how much each card faces the camera.
        cards.forEach((card, i) => {
          const facing = Math.cos(((rotation + i * step) * Math.PI) / 180);
          const t = (facing + 1) / 2; // 0 (back) → 1 (front)
          card.style.filter = `brightness(${0.45 + 0.55 * t})`;
          card.style.opacity = `${0.35 + 0.65 * t}`;
          card.style.zIndex = `${Math.round(t * 100)}`;
        });
      };
      gsap.ticker.add(tick);

      const onDown = (e: PointerEvent) => {
        dragging = true;
        velocity = 0;
        lastX = e.clientX;
        stage.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        rotation += dx * 0.3;
        velocity = dx * 0.3; // hand off as momentum on release
      };
      const onUp = (e: PointerEvent) => {
        dragging = false;
        stage.releasePointerCapture(e.pointerId);
      };

      stage.addEventListener("pointerdown", onDown);
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerup", onUp);
      stage.addEventListener("pointercancel", onUp);

      return () => {
        gsap.ticker.remove(tick);
        stage.removeEventListener("pointerdown", onDown);
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerup", onUp);
        stage.removeEventListener("pointercancel", onUp);
      };
    },
    { scope: stageRef },
  );

  return (
    <div className="flex h-[80vh] w-full items-center justify-center overflow-hidden">
      <div
        ref={stageRef}
        className="relative w-full cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ perspective: "1300px", height: CARD_H + 80 }}
      >
        <div
          ref={ringRef}
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            width: CARD_W,
            height: CARD_H,
            marginLeft: -CARD_W / 2,
            marginTop: -CARD_H / 2,
          }}
        >
          {IMAGES.map((src, i) => (
            <div
              key={src}
              className="absolute inset-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
              style={{
                transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RingCarousel3D;
