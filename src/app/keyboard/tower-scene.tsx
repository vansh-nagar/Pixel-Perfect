"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LABEL, LAYERS } from "./art/tower-svg";
import { Figure, IllArt, finishIntro, liveKit, skipIntro, useScene } from "./ill-art";

gsap.registerPlugin(useGSAP);

const IDLE_MS = 5000;
const LIFT = 14, STEP = 0.05;

export function TowerScene() {
  const scene = useScene({ playOnView: true });
  const { rootRef, sectionRef, introRef } = scene;

  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el || skipIntro(el, scene)) return;
      const floors = gsap.utils.toArray<SVGGElement>(".floor", el);
      gsap.set(el, { autoAlpha: 0 });
      introRef.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: () => finishIntro(scene, floors, [el]) })
        .fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
        .fromTo(floors, { visibility: "hidden" }, { visibility: "visible", duration: 0.01, stagger: 0.16 }, 0.4)
        .from(floors, { y: -26, duration: 0.6, ease: "back.out(1.6)", stagger: 0.16 }, 0.4);
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const kit = liveKit(el, scene, IDLE_MS);
    const floors = [...el.querySelectorAll<SVGGElement>(".floor")];
    const svgs = [...el.querySelectorAll<SVGSVGElement>("svg")];

    let cur = -1;
    const lift = (i: number) => {
      if (i === cur) return;
      cur = i;
      floors.forEach((f, j) => {
        f.style.transitionDelay = `${i >= 0 ? Math.max(0, j - i - 1) * STEP : 0}s`;
        f.style.transform = i >= 0 && j > i ? `translateY(${-LIFT}px)` : "";
        f.classList.toggle("dim", i >= 0 && j !== i);
      });
    };
    el.querySelectorAll<SVGPathElement>(".hit").forEach((h) =>
      kit.on(h, "pointerenter", () => {
        if (!scene.introDoneRef.current) return;
        kit.touch();
        lift(Number(h.dataset.i));
      }),
    );
    kit.on(el, "pointerleave", () => lift(-1));
    kit.on(el, "click", () => {
      kit.touch();
      svgs.forEach((s) => s.classList.toggle("night"));
    });

    kit.ghost(async () => {
      for (const i of [0, 1, 2]) {
        if (!kit.idle()) break;
        lift(i);
        await kit.sleep(1100);
      }
      lift(-1);
      await kit.sleep(3000);
    });

    return kit.dispose;
  }, [rootRef, scene]);

  return (
    <Figure sectionRef={sectionRef}>
      <IllArt hostRef={rootRef} label={LABEL} layers={LAYERS} className="w-[min(92vw,84vh,820px)]" />
    </Figure>
  );
}
