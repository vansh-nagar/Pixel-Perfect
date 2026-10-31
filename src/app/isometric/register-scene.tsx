"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LABEL, LAYERS } from "./art/register-svg";
import DATA from "./art/register-data.json";
import { paperPaths, printRow, type PaperCfg, type PrintedRow } from "./art/register-paper";
import { Figure, IllArt, finishIntro, hullPath, liveKit, skipIntro, useScene } from "./ill-art";

gsap.registerPlugin(useGSAP);

const IDLE_MS = 5000;
const PAPER = DATA.paper as PaperCfg;
const LMAX = (PAPER.curve.length - 1) * PAPER.step;
const ROW_W = PAPER.x1 - PAPER.x0;
const ROW = 4.5;

export function RegisterScene() {
  const scene = useScene({ playOnView: true });
  const { rootRef, sectionRef, introRef } = scene;
  const printIntro = useRef<(() => void) | null>(null);

  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el || skipIntro(el, scene)) return;
      const keys = gsap.utils
        .toArray<SVGGElement>(".key", el)
        .sort((a, b) => Number(a.dataset.cx) - Number(b.dataset.cx));
      const top = el.querySelector<HTMLElement>('[data-layer="top"]');
      gsap.set(el, { autoAlpha: 0 });
      introRef.current = gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" }, onComplete: () => finishIntro(scene, keys, [el, top]) })
        .fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
        .from(top, { y: -10, opacity: 0, duration: 0.7 }, 0.3)
        .fromTo(keys, { visibility: "hidden" }, { visibility: "visible", duration: 0.01, stagger: { amount: 0.7 } }, 0.4)
        .from(keys, { y: -14, duration: 0.5, ease: "back.out(1.7)", stagger: { amount: 0.7 } }, 0.4)
        .call(() => printIntro.current?.(), [], 1.4);
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const kit = liveKit(el, scene, IDLE_MS);
    const $ = <T extends Element>(s: string) => el.querySelector<T>(s)!;
    const items = [...el.querySelectorAll<SVGGElement>('.key[data-role="item"]')];

    const fill = $(".receipt-fill"), edge = $(".receipt-edge"), ink = $(".receipt-ink");
    let L = DATA.paperL;
    let lines: PrintedRow[] = DATA.lines.map((l) => ({ ...l }));
    let row = lines.length;
    const drawPaper = () => {
      const p = paperPaths(PAPER, L, lines);
      fill.setAttribute("d", p.fill);
      edge.setAttribute("d", p.edge);
      ink.setAttribute("d", p.ink);
    };
    let queue = Promise.resolve();
    const feed = (amount: number, segs?: number[][], dur = 200) => {
      queue = queue.then(
        () =>
          new Promise<void>((done) => {
            if (segs) lines.unshift({ d: 0, segs });
            const start = performance.now();
            let last = 0;
            const step = (now: number) => {
              const k = kit.reduce || !dur ? 1 : Math.min(1, (now - start) / dur);
              const e = 1 - (1 - k) ** 3;
              const dd = (e - last) * amount;
              last = e;
              L = Math.min(LMAX, L + dd);
              lines.forEach((l) => (l.d += dd));
              lines = lines.filter((l) => l.d < LMAX);
              drawPaper();
              if (k < 1) requestAnimationFrame(step);
              else done();
            };
            requestAnimationFrame(step);
          }),
      );
    };
    const clearPaper = () => {
      L = 0;
      lines = [];
      drawPaper();
    };
    const tear = () => {
      queue = queue.then(clearPaper);
      feed(8);
    };

    const dr = DATA.drawer;
    const tray = $<SVGGElement>('[data-layer="drawer"] .tray'), clip = $(".out-clip");
    const P = (x: number, y: number, z: number): [number, number] => [PAPER.ox + x - y, PAPER.oy + (x + y) / 2 - z];
    let s = dr.pull, v = 0, target = dr.pull, raf = 0;
    const setPull = (x: number) => {
      const k = x - dr.pull;
      tray.setAttribute("transform", `translate(${(-k).toFixed(2)} ${(k / 2).toFixed(2)})`);
      const pts: [number, number][] = [];
      for (const X of [dr.x0, dr.x1]) for (const Y of [dr.front, dr.front + Math.max(0, x) + 2]) for (const Z of [dr.z0, dr.z1]) pts.push(P(X, Y, Z));
      clip.setAttribute("d", hullPath(pts));
    };
    const toggleDrawer = () => {
      target = target ? 0 : dr.pull;
      cancelAnimationFrame(raf);
      if (kit.reduce) return setPull((s = target));
      let t0 = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - t0) / 1000);
        t0 = now;
        v += (170 * (target - s) - 22 * v) * dt;
        s += v * dt;
        if (target === 0 && s < 0) {
          s = 0;
          v = -v * 0.3;
        }
        const moving = Math.abs(v) > 0.05 || Math.abs(target - s) > 0.05;
        if (!moving) s = target;
        setPull(s);
        if (moving) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const actions: Record<string, () => void> = {
      item: () => feed(ROW, printRow(row++, ROW_W)),
      feed: () => feed(9),
      clear: tear,
      total: () => {
        feed(ROW, [[3, ROW_W - 3]]);
        feed(ROW, [[3, 9], [15, ROW_W - 3]]);
        feed(6);
        toggleDrawer();
      },
    };
    const act = (k: SVGGElement, ms?: number) => {
      kit.press(k, ms);
      actions[k.dataset.role!]();
    };

    if (!kit.reduce) {
      clearPaper();
      s = target = 0;
      setPull(0);
    }
    printIntro.current = () => {
      clearPaper();
      DATA.lines.slice().reverse().forEach((ln) => feed(ROW, ln.segs, 70));
      feed(DATA.paperL - DATA.lines.length * ROW, undefined, 300);
      kit.later(toggleDrawer, kit.reduce ? 0 : 1500);
    };

    kit.on(el, "click", (e) => {
      const k = (e.target as Element).closest<SVGGElement>(".key");
      if (!scene.introDoneRef.current || !k) return;
      kit.touch();
      actions[k.dataset.role!]();
    });
    kit.onKey("keydown", (e) => {
      let k: SVGGElement | null = null;
      if (/^[0-9]$/.test(e.key)) k = items[(Number(e.key) * 7) % items.length];
      else if (e.key === "Enter") k = $<SVGGElement>("#key-total");
      else if (e.key === " ") k = $<SVGGElement>("#key-feed");
      else if (e.key === "Backspace" || e.key === "Escape") k = $<SVGGElement>("#key-clear");
      if (!k) return;
      e.preventDefault();
      kit.touch();
      act(k);
    });

    kit.ghost(async () => {
      if (L > LMAX - 20) {
        act($<SVGGElement>("#key-clear"));
        await kit.sleep(900);
      }
      for (const i of [3, 11, 6]) {
        if (!kit.idle()) break;
        act(items[i]);
        await kit.sleep(420);
      }
      if (kit.idle()) act($<SVGGElement>("#key-total"), 180);
      await kit.sleep(4000);
    });

    return () => {
      kit.dispose();
      cancelAnimationFrame(raf);
    };
  }, [rootRef, scene]);

  return (
    <Figure sectionRef={sectionRef}>
      <IllArt hostRef={rootRef} label={LABEL} layers={LAYERS} className="w-[min(92vw,74vh,720px)] [&_.key]:cursor-pointer" />
    </Figure>
  );
}
