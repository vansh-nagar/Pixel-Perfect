"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LABEL, LAYERS } from "./art/computer-svg";
import { ORIGIN, PIVOT, YAW, head } from "./art/computer-head.mjs";
import { Figure, IllArt, finishIntro, hullPath, liveKit, skipIntro, useScene } from "./ill-art";

gsap.registerPlugin(useGSAP);

const IDLE_MS = 5000;
const REST_YAW = -0.3;
const [OX, OY] = ORIGIN;
const P = (x: number, y: number, z: number): [number, number] => [OX + x - y, OY + (x + y) / 2 - z];
const desk = (x: number, y: number) => { const a = x - OX, b = 2 * (y - OY); return [(a + b) / 2, (b - a) / 2]; };

export function ComputerScene() {
  const scene = useScene({ playOnView: true });
  const { rootRef, sectionRef, introRef } = scene;

  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el || skipIntro(el, scene)) return;
      const headLayer = el.querySelector<HTMLElement>('[data-layer="head"]');
      gsap.set(el, { autoAlpha: 0 });
      introRef.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: () => finishIntro(scene, [], [el, headLayer]) })
        .fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
        .from(headLayer, { y: -18, opacity: 0, duration: 0.8, ease: "back.out(1.4)" }, 0.35);
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const kit = liveKit(el, scene, IDLE_MS);
    const $ = <T extends Element>(s: string) => el.querySelector<T>(s)!;
    const toBox = (cx: number, cy: number) => {
      const svg = $<SVGSVGElement>("svg"), pt = svg.createSVGPoint();
      pt.x = cx;
      pt.y = cy;
      return pt.matrixTransform(svg.getScreenCTM()!.inverse());
    };

    const headG = $<SVGGElement>("#head"), decal = $<SVGGElement>(".eyes-decal"), eyes = $<SVGGElement>(".eyes");
    const els: Record<string, Element> = Object.fromEntries([...headG.querySelectorAll<SVGElement>("[data-k]")].map((e) => [e.dataset.k!, e]));
    let yaw = REST_YAW, yv = 0, yt = REST_YAW, raf = 0;
    const drawHead = () => {
      const h = head(yaw);
      for (const k in h.paths) els[k]?.setAttribute("d", h.paths[k as keyof typeof h.paths]);
      decal.setAttribute("transform", h.decal);
    };
    const turnTo = (t: number) => {
      yt = Math.max(YAW[0], Math.min(YAW[1], t));
      if (kit.reduce) { yaw = yt; drawHead(); return; }
      if (raf) return;
      let t0 = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - t0) / 1000);
        t0 = now;
        yv += (100 * (yt - yaw) - 18 * yv) * dt;
        yaw += yv * dt;
        const moving = Math.abs(yv) > 0.002 || Math.abs(yt - yaw) > 0.002;
        if (!moving) yaw = yt;
        drawHead();
        raf = moving ? requestAnimationFrame(tick) : 0;
      };
      raf = requestAnimationFrame(tick);
    };
    const C = P(PIVOT[0] + 24, PIVOT[1], 49);
    const look = (x: number, y: number) => {
      const dx = x - C[0], dy = y - C[1], d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 60);
      eyes.style.transform = `translate(${((dx / d) * k * 5).toFixed(2)}px,${((dy / d) * k * 5).toFixed(2)}px)`;
      const [wx, wy] = desk(x, y);
      turnTo(Math.atan2(wy - PIVOT[1], wx - PIVOT[0]));
    };
    const rest = () => { eyes.style.transform = ""; turnTo(REST_YAW); };
    const headSvg = headG.ownerSVGElement!;
    const blink = () => { headSvg.classList.add("blink"); kit.later(() => headSvg.classList.remove("blink"), 110); };
    const blinkLoop = () => kit.later(() => { if (!kit.reduce) blink(); blinkLoop(); }, 2600 + Math.random() * 2600);
    blinkLoop();

    const mouse = $<SVGGElement>("#mouse");
    let onMouse = false;
    kit.on(el, "pointermove", (e) => {
      if (!scene.introDoneRef.current || onMouse) return;
      kit.touch();
      const p = toBox(e.clientX, e.clientY);
      look(p.x, p.y);
    });
    kit.on(el, "pointerleave", rest);
    kit.on(mouse, "pointerenter", () => { onMouse = true; mouse.classList.add("down", "on"); look(+mouse.dataset.cx!, +mouse.dataset.cy!); });
    kit.on(mouse, "pointerleave", () => { onMouse = false; mouse.classList.remove("down", "on"); });

    const fl = $<SVGGElement>("#floppy"), disk = fl.querySelector(".disk")!, clip = fl.querySelector(".floppy-clip")!;
    const D = Object.fromEntries(["y0", "y1", "z0", "z1", "face"].map((k) => [k, Number(fl.dataset[k])]));
    const OUT = 11;
    let s = 0, v = 0, target = 0, fraf = 0;
    const setEject = (x: number) => {
      disk.setAttribute("transform", `translate(${x.toFixed(2)} ${(x / 2).toFixed(2)})`);
      if (x < 0.2) return clip.setAttribute("d", "M0 0 Z");
      const pts: [number, number][] = [];
      for (const X of [D.face, D.face + x + 1]) for (const Y of [D.y0, D.y1]) for (const Z of [D.z0, D.z1]) pts.push(P(X, Y, Z));
      clip.setAttribute("d", hullPath(pts));
    };
    const eject = () => {
      target = target ? 0 : OUT;
      cancelAnimationFrame(fraf);
      if (kit.reduce) { s = target; setEject(s); return; }
      let t0 = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - t0) / 1000);
        t0 = now;
        v += (170 * (target - s) - 22 * v) * dt;
        s = Math.max(0, s + v * dt);
        const moving = Math.abs(v) > 0.03 || Math.abs(target - s) > 0.03;
        if (!moving) s = target;
        setEject(s);
        if (moving) fraf = requestAnimationFrame(tick);
      };
      fraf = requestAnimationFrame(tick);
    };
    kit.on($("#case"), "click", () => {
      if (!scene.introDoneRef.current) return;
      kit.touch();
      eject();
      const [x, y] = P(D.face + 6, (D.y0 + D.y1) / 2, D.z1);
      look(x, y);
    });

    const spots = [P(66, -34, 18), [+mouse.dataset.cx!, +mouse.dataset.cy!], [C[0] + 40, C[1] + 20], C];
    let si = 0;
    kit.ghost(async () => {
      const [x, y] = spots[si++ % spots.length];
      look(x, y);
      await kit.sleep(1600);
    });

    return () => {
      kit.dispose();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(fraf);
    };
  }, [rootRef, scene]);

  return (
    <Figure sectionRef={sectionRef}>
      <IllArt hostRef={rootRef} label={LABEL} layers={LAYERS} className="w-[min(92vw,80vh,820px)] [&_#case]:cursor-pointer [&_#mouse]:cursor-pointer" />
    </Figure>
  );
}
