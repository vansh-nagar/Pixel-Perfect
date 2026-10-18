"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LABEL, LAYERS } from "./art/car-svg";
import { carRig } from "./art/car-rig";
import { Figure, IllArt, finishIntro, liveKit, skipIntro, useScene } from "./ill-art";

gsap.registerPlugin(useGSAP);

const IDLE_MS = 5000;
const VIEW_W = 380; // viewBox width: converts world-z hops to layer pixels

// A toy punk car. Hovering it gives a small hydraulic hop; a click drops the beat (the chassis bounces, the
// speakers pump, the sign blinks, the lamps flash); dragging sideways rolls the wheels. The sprung layers move
// as whole layers (compositor-only) while the wheel layers stay planted.
export function CarScene() {
  const scene = useScene({ playOnView: true });
  const { rootRef, sectionRef, introRef } = scene;

  // ── Intro: the stage rises, then the body drops onto its wheels and settles, then the roof rack lands.
  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el || skipIntro(el, scene)) return;
      const body = gsap.utils.toArray<HTMLElement>('[data-layer="body"], [data-layer="front"]', el);
      const roof = el.querySelector<HTMLElement>('[data-layer="roof"]');
      gsap.set(el, { autoAlpha: 0 });
      introRef.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: () => finishIntro(scene, [], [el, ...body, roof]) })
        .fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
        .fromTo(body, { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, 0.45)
        .from(body, { y: -40, duration: 0.8, ease: "back.out(2.2)" }, 0.45)
        .fromTo(roof, { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, 0.8)
        .from(roof, { y: -70, duration: 0.75, ease: "back.out(1.8)" }, 0.8);
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const kit = liveKit(el, scene, IDLE_MS);
    const sprung = [...el.querySelectorAll<HTMLElement>("[data-sprung]")];
    const car = carRig(el, {
      reduce: kit.reduce,
      moveChassis: (h) => {
        const px = (h * el.clientWidth) / VIEW_W;
        sprung.forEach((l) => (l.style.transform = h ? `translate3d(0, ${(-px).toFixed(2)}px, 0)` : ""));
      },
    });
    const ready = () => scene.introDoneRef.current;
    const drop = () => car.drop(8);

    // hover: a small hop each time the pointer arrives on the car
    let over = false;
    kit.on(el, "pointermove", (e) => {
      const now = !!(e.target as Element).closest("[data-part]");
      if (now && !over && ready()) {
        kit.touch();
        car.hop(55);
      }
      over = now;
    });
    kit.on(el, "pointerleave", () => (over = false));

    // drag sideways rolls the wheels; a click without a drag drops the beat
    let down: { x: number; moved: number } | null = null;
    kit.on(el, "pointerdown", (e) => {
      if (!ready() || !(e.target as Element).closest("[data-part]")) return;
      kit.touch();
      down = { x: e.clientX, moved: 0 };
      el.setPointerCapture(e.pointerId);
    });
    kit.on(el, "pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      down.x = e.clientX;
      down.moved += Math.abs(dx);
      car.roll(-dx * 2.2); // dragging left drives forward: the nose points down-left
    });
    const up = () => {
      if (down && down.moved < 4) drop();
      down = null;
    };
    kit.on(el, "pointerup", up);
    kit.on(el, "pointercancel", up);

    kit.onKey("keydown", (e) => {
      kit.touch();
      if (e.key === " ") {
        e.preventDefault();
        car.hop(110);
      } else if (e.key === "Enter") drop();
      else if (e.key === "ArrowLeft") car.roll(90);
      else if (e.key === "ArrowRight") car.roll(-90);
    });

    // idle ghost: drop the beat, then roll the wheels a little
    kit.ghost(async () => {
      const ms = drop();
      await kit.sleep(ms + 300);
      if (kit.idle()) car.roll(160);
      await kit.sleep(4000);
    });

    return () => {
      car.dispose();
      kit.dispose();
    };
  }, [rootRef, scene]);

  return (
    <Figure sectionRef={sectionRef}>
      <IllArt
        hostRef={rootRef}
        label={LABEL}
        layers={LAYERS}
        className="w-[min(92vw,110vh,980px)] cursor-grab touch-pan-y active:cursor-grabbing"
      />
    </Figure>
  );
}
