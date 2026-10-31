"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LABEL, LAYERS } from "./art/turntable-svg";
import { ARM, LIFT, ORIGIN, PHI, RECORD, arm } from "./art/turntable-arm.mjs";
import { turntableRig } from "./art/turntable-rig.mjs";
import * as motion from "./art/motion.mjs";
import { Figure, FooterButton, IllArt, finishIntro, liveKit, skipIntro, useScene } from "./ill-art";

gsap.registerPlugin(useGSAP);

const IDLE_MS = 5000;
void ARM;

type Rig = ReturnType<typeof turntableRig>;

// A compact turntable. A click plays it: the arm cues up, swings onto the lead-in, cues down and the record spins
// up (the label's print turns with it); another click spins it down and sends the arm back to its rest post.
// Dragging on the record scratches it. While playing, the arm tracks inward and returns by itself at the run-out.
export function TurntableScene() {
  const scene = useScene({ playOnView: true });
  const { rootRef, sectionRef, introRef } = scene;
  const rigRef = useRef<Rig | null>(null);
  const [playing, setPlaying] = useState(false);

  // ── Intro: the stage rises, the record drops onto the platter, then the tonearm settles onto the record.
  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el || skipIntro(el, scene)) return;
      const record = el.querySelector<HTMLElement>('[data-layer="record"]');
      const armLayer = el.querySelector<HTMLElement>('[data-layer="arm"]');
      gsap.set(el, { autoAlpha: 0 });
      introRef.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: () => finishIntro(scene, [], [el, record, armLayer]) })
        .fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
        .fromTo(record, { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, 0.4)
        .from(record, { y: -36, duration: 0.8, ease: "back.out(1.6)" }, 0.4)
        .fromTo(armLayer, { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, 0.75)
        .from(armLayer, { y: -14, duration: 0.7, ease: "back.out(1.4)" }, 0.75);
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const kit = liveKit(el, scene, IDLE_MS);
    const tt = turntableRig(el, { arm, PHI, LIFT, RECORD, ORIGIN, motion, onState: (on: boolean) => setPlaying(on) });
    rigRef.current = tt;
    const ready = () => scene.introDoneRef.current;

    // a press on the record grabs it; a press that doesn't move (anywhere on the deck) plays or stops
    let down: { x: number; y: number; moved: number; onRecord: boolean } | null = null;
    kit.on(el, "pointerdown", (e) => {
      if (!ready() || !(e.target as Element).closest("[data-part]")) return;
      kit.touch();
      const p = tt.probe(e.clientX, e.clientY);
      down = { x: e.clientX, y: e.clientY, moved: 0, onRecord: p.on };
      if (p.on) {
        tt.grab(p.angle);
        el.setPointerCapture(e.pointerId);
      }
    });
    kit.on(el, "pointermove", (e) => {
      if (!down) return;
      down.moved += Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down.x = e.clientX;
      down.y = e.clientY;
      if (down.onRecord) tt.drag(tt.probe(e.clientX, e.clientY).angle);
    });
    const up = () => {
      if (!down) return;
      if (down.onRecord) tt.release();
      if (down.moved < 4) tt.toggle();
      down = null;
    };
    kit.on(el, "pointerup", up);
    kit.on(el, "pointercancel", up);

    kit.onKey("keydown", (e) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      kit.touch();
      tt.toggle();
    });

    // idle ghost: play a little, then stop, then wait a full idle period
    kit.ghost(async () => {
      tt.play();
      await kit.sleep(8000);
      if (kit.idle()) tt.stop();
      kit.touch();
    });

    return () => {
      tt.dispose();
      rigRef.current = null;
      kit.dispose();
    };
  }, [rootRef, scene]);

  return (
    <Figure
      sectionRef={sectionRef}
      footer={<FooterButton onClick={() => { scene.lastUserRef.current = performance.now(); rigRef.current?.toggle(); }}>{playing ? "Stop" : "Play"}</FooterButton>}
    >
      <IllArt hostRef={rootRef} label={LABEL} layers={LAYERS} className="w-[min(92vw,120vh,960px)] cursor-pointer touch-pan-y" />
    </Figure>
  );
}
