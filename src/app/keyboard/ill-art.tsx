"use client";

import { memo, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import gsap from "gsap";

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable);

export const IllArt = memo(function IllArt({
  hostRef,
  label,
  layers,
  className,
}: {
  hostRef: RefObject<HTMLDivElement | null>;
  label: string;
  layers: string;
  className: string;
}) {
  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      style={{ visibility: "hidden" }}
      className={[
        "relative place-self-center normal-case tracking-normal will-change-transform",
        "[&_.ill-layer]:pointer-events-none [&_.ill-layer]:absolute [&_.ill-layer]:inset-0 [&_.ill-layer]:will-change-transform",
        "[&_.ill-layer:first-child]:relative [&_svg]:block [&_svg]:h-auto [&_svg]:w-full",
        "[&_[data-live]_svg>*]:pointer-events-auto",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: layers }}
    />
  );
});

export function Figure({ sectionRef, children, footer }: { sectionRef: RefObject<HTMLElement | null>; children: ReactNode; footer?: ReactNode }) {
  return (
    <section
      ref={sectionRef}
      className="grid min-h-screen grid-rows-[1fr_auto] px-6 pt-20 pb-6 font-mono text-xs tracking-[0.12em] text-[#62666d] uppercase"
    >
      {children}
      <footer className="flex min-h-4 items-end justify-end">{footer}</footer>
    </section>
  );
}

export function FooterButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="uppercase transition-colors hover:text-[#d0d6e0]">
      {children}
    </button>
  );
}

export function useScene({ playOnView }: { playOnView: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const introDone = useRef(false);
  const lastUser = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let entered = false;
    const io = new IntersectionObserver(
      ([e]) => {
        active.current = e.intersectionRatio >= 0.5 || (e.isIntersecting && e.intersectionRect.height >= innerHeight * 0.5);
        if (playOnView && !entered && e.isIntersecting && e.intersectionRatio >= 0.25) {
          entered = true;
          intro.current?.play();
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playOnView]);

  return useMemo(() => ({ rootRef: root, sectionRef: section, introRef: intro, introDoneRef: introDone, lastUserRef: lastUser, activeRef: active }), []);
}
export type Scene = ReturnType<typeof useScene>;

export function skipIntro(el: HTMLElement, scene: Scene) {
  if (!prefersReducedMotion()) return false;
  gsap.set(el, { autoAlpha: 1 });
  scene.introDoneRef.current = true;
  return true;
}

export function finishIntro(scene: Scene, parts: SVGElement[], wholes: (HTMLElement | null)[]) {
  parts.forEach((p) => p.removeAttribute("transform"));
  gsap.set(parts, { clearProps: "transform,visibility" });
  gsap.set(wholes.filter(Boolean), { clearProps: "transform,opacity" });
  scene.introDoneRef.current = true;
  scene.lastUserRef.current = performance.now();
}

export function liveKit(el: HTMLElement, scene: Scene, idleMs: number) {
  const reduce = prefersReducedMotion();
  const timers = new Set<number>();
  const cleanups: (() => void)[] = [];
  let alive = true;

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const sleep = (ms: number) => new Promise<void>((r) => later(r, ms));
  const touch = () => (scene.lastUserRef.current = performance.now());
  const idle = () => alive && performance.now() - scene.lastUserRef.current > idleMs;
  const press = (k: Element, ms = 120) => {
    k.classList.add("down");
    later(() => k.classList.remove("down"), ms);
  };
  const on = <K extends keyof WindowEventMap>(target: EventTarget, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
    target.addEventListener(type, fn as EventListener, opts);
    cleanups.push(() => target.removeEventListener(type, fn as EventListener));
  };

  on(el, "pointerover", (e) => {
    const k = (e.target as Element).closest(".key");
    if (!scene.introDoneRef.current || !k) return;
    k.classList.add("down");
    touch();
  });
  on(el, "pointerout", (e) => {
    const k = (e.target as Element).closest(".key");
    if (k && !k.contains(e.relatedTarget as Node | null)) k.classList.remove("down");
  });

  const onKey = (type: "keydown" | "keyup", fn: (e: KeyboardEvent) => void) =>
    on(window, type, (e) => {
      if (scene.activeRef.current && scene.introDoneRef.current && !isTypingTarget(e.target)) fn(e);
    });

  const ghost = (run: () => Promise<void>) => {
    (async () => {
      while (alive) {
        await sleep(1500);
        if (!reduce && scene.introDoneRef.current && scene.activeRef.current && idle()) await run();
      }
    })();
  };

  const dispose = () => {
    alive = false;
    timers.forEach(clearTimeout);
    cleanups.forEach((f) => f());
  };

  return { reduce, later, sleep, touch, idle, press, on, onKey, ghost, dispose };
}

export function hullPath(points: [number, number][]) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  const up: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo.at(-2)!, lo.at(-1)!, q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of p.reverse()) {
    while (up.length >= 2 && cross(up.at(-2)!, up.at(-1)!, q) <= 0) up.pop();
    up.push(q);
  }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1));
  return "M" + hull.map((q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join(" L") + " Z";
}
