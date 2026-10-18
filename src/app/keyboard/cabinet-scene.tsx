"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LABEL, LAYERS } from "./art/cabinet-svg";
import { Figure, IllArt, hullPath, isTypingTarget, useActiveSection } from "./ill-art";

gsap.registerPlugin(useGSAP);

const IDLE_MS = 5000;
const P = (x: number, y: number, z: number): [number, number] => [200 + x - y, 190 + (x + y) / 2 - z]; // generator origin

type Drawer = { id: string; x0: number; x1: number; z0: number; z1: number; d: number; pull: number; s: number; v: number; target: number; trays: SVGGElement[]; clip: SVGPathElement };

// A flat-file cabinet. Each drawer is drawn twice: one copy clipped to its opening (seen through the hole),
// one clipped to the box that has left the cabinet. One spring per drawer moves both copies and rebuilds
// the outside clip every frame.
export function CabinetScene() {
  const root = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const introDone = useRef(false);
  const lastUser = useRef(0);
  const api = useRef<{ open: (i: number) => void } | null>(null);
  const [label, setLabel] = useState("—");
  const active = useActiveSection(section, () => intro.current?.play());

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { autoAlpha: 1 });
        introDone.current = true;
        return;
      }
      gsap.set(el, { autoAlpha: 0 });
      intro.current = gsap
        .timeline({
          paused: true,
          onComplete: () => {
            gsap.set(el, { clearProps: "transform,opacity" });
            introDone.current = true;
          },
        })
        .fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, 0)
        // a peek: the top three drawers slide out and back in, one after another
        .call(() => api.current?.open(2), [], 0.7)
        .call(() => api.current?.open(1), [], 1.2)
        .call(() => api.current?.open(0), [], 1.7)
        .call(() => api.current?.open(-1), [], 2.3);
    },
    { scope: root },
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const drawers: Drawer[] = [...el.querySelectorAll<SVGGElement>("g[data-slot][data-x0]")]
      .map((g) => {
        const n = (k: string) => Number(g.dataset[k]);
        return {
          id: g.dataset.slot!,
          x0: n("x0"), x1: n("x1"), z0: n("z0"), z1: n("z1"), d: n("d"), pull: n("pull"),
          s: 0, v: 0, target: 0,
          trays: [...el.querySelectorAll<SVGGElement>(`.tray[data-tray="${g.dataset.slot}"]`)],
          clip: el.querySelector<SVGPathElement>(`#cabinet-out-${g.dataset.slot} path`)!,
        };
      })
      .sort((a, b) => b.z0 - a.z0); // top drawer first, for ↑ ↓

    const apply = (dr: Drawer) => {
      const t = `translate(${(-dr.s).toFixed(2)}px,${(dr.s / 2).toFixed(2)}px)`;
      dr.trays.forEach((t2) => (t2.style.transform = t));
      if (dr.s < 0.3) return dr.clip.setAttribute("d", "M0 0 Z");
      const pts: [number, number][] = [];
      for (const x of [dr.x0 - 1, dr.x1 + 1]) for (const y of [dr.d, dr.d + dr.s]) for (const z of [dr.z0 - 1, dr.z1 + 1]) pts.push(P(x, y, z));
      dr.clip.setAttribute("d", hullPath(pts));
    };
    let raf = 0, last = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
      last = now;
      let moving = false;
      for (const dr of drawers) {
        if (reduce) (dr.s = dr.target), (dr.v = 0);
        else (dr.v += (170 * (dr.target - dr.s) - 22 * dr.v) * dt), (dr.s += dr.v * dt); // stiffness 170, damping 22
        if (Math.abs(dr.target - dr.s) > 0.05 || Math.abs(dr.v) > 0.05) moving = true;
        else (dr.s = dr.target), (dr.v = 0);
        apply(dr);
      }
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) (last = performance.now()), (raf = requestAnimationFrame(tick));
    };
    let current = -1;
    const open = (i: number) => {
      current = i;
      drawers.forEach((dr, j) => {
        dr.target = j === i ? dr.pull : 0;
        dr.trays.forEach((t) => t.classList.toggle("on", j === i));
      });
      setLabel(i < 0 ? "—" : drawers[i].id.replace("-", " "));
      kick();
    };
    api.current = { open };

    const hits = [...el.querySelectorAll<SVGPathElement>(".hit[data-slot]")];
    const enter = (e: Event) => {
      if (!introDone.current) return;
      lastUser.current = performance.now();
      open(drawers.findIndex((d) => d.id === (e.currentTarget as SVGPathElement).dataset.slot));
    };
    const leave = () => introDone.current && open(-1);
    hits.forEach((h) => h.addEventListener("pointerenter", enter));
    el.addEventListener("pointerleave", leave);
    const onKeyDown = (e: KeyboardEvent) => {
      if (!active.current || !introDone.current || isTypingTarget(e.target)) return;
      if (e.key === "ArrowDown") open(Math.min(drawers.length - 1, current + 1));
      else if (e.key === "ArrowUp") open(Math.max(0, current - 1));
      else if (e.key === "Escape") open(-1);
      else return;
      lastUser.current = performance.now();
      e.preventDefault();
    };
    addEventListener("keydown", onKeyDown);

    // Idle ghost: opens the drawers one at a time, top to bottom, then closes.
    let alive = true;
    let timer = 0;
    const sleep = (ms: number) => new Promise<void>((r) => (timer = window.setTimeout(r, ms)));
    const idle = () => performance.now() - lastUser.current > IDLE_MS;
    (async () => {
      while (alive) {
        await sleep(1500);
        if (!alive || reduce || !introDone.current || !active.current || !idle()) continue;
        for (let i = 0; i < drawers.length && alive && idle(); i++) {
          open(i);
          await sleep(900);
        }
        if (alive && idle()) open(-1);
        await sleep(3000);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      hits.forEach((h) => h.removeEventListener("pointerenter", enter));
      el.removeEventListener("pointerleave", leave);
      removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  return (
    <Figure
      sectionRef={section}
      fig="Fig 3.4"
      title="Flat file · 6 drawers"
      footer={
        <>
          <span>Hover a drawer or press ↑ ↓</span>
          <span className="normal-case tracking-normal text-[#d0d6e0]">{label}</span>
        </>
      }
    >
      <IllArt hostRef={root} label={LABEL} layers={LAYERS} className="w-[min(92vw,80vh,860px)]" />
    </Figure>
  );
}
