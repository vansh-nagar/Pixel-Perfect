"use client";

/**
 * Layout-aware custom renderers from the `animate-text` catalog that cannot be
 * expressed as a plain generic stagger:
 *
 *   - SharedSlideText  → `shared-slide-opacity-stage` (short-slide-right)
 *   - KineticCenterText → `kinetic-center-build`
 *   - KineticStackText  → `kinetic-top-build` (short-slide-down)
 *
 * Timings below are the website-scaled values (source × 0.72) taken from each
 * effect's `showcase.timing` block. Kinetic build x/y values are raw renderer
 * pixels and are intentionally NOT scaled by the vertical-travel multiplier.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toEase } from "./engine";

type Anim = gsap.core.Tween | gsap.core.Timeline;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type WordState = { x: number; y: number; scale: number; blur: number; opacity: number };

function writeWord(el: HTMLElement, s: WordState) {
  el.style.transform = `translate(-50%, -50%) translate3d(${s.x}px, ${s.y}px, 0) scale(${s.scale})`;
  el.style.filter = `blur(${s.blur}px)`;
  el.style.opacity = String(s.opacity);
}

function createAbsWord(word: string) {
  const el = document.createElement("span");
  el.textContent = word;
  el.style.position = "absolute";
  el.style.left = "50%";
  el.style.top = "50%";
  el.style.whiteSpace = "pre";
  el.style.opacity = "0";
  el.style.willChange = "transform, opacity, filter";
  el.style.transform = "translate(-50%, -50%)";
  el.style.backfaceVisibility = "hidden";
  return el;
}

type KeyFrame = { offset: number } & WordState;

/* ------------------------------------------------------------------ */
/* short-slide-right — shared-slide-opacity-stage                      */
/* ------------------------------------------------------------------ */

const SLIDE_SAMPLES = ["Move with intent.", "Words glide across.", "Build the rhythm."];

export function SharedSlideText({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const title = titleRef.current;
      if (!title) return;

      let cancelled = false;
      const timers: number[] = [];
      const active: Anim[] = [];
      const enterEase = toEase("cubic-bezier(0.2, 0.8, 0.2, 1)");
      const exitEase = toEase("cubic-bezier(0.4, 0, 0.2, 1)");

      const sleep = (ms: number) =>
        new Promise<void>((resolve) => {
          const t = window.setTimeout(resolve, ms);
          timers.push(t);
        });
      const tween = (target: gsap.TweenTarget, vars: gsap.TweenVars) =>
        new Promise<void>((resolve) => {
          const tw = gsap.to(target, { ...vars, onComplete: () => resolve() });
          active.push(tw);
        });

      const build = (text: string) => {
        title.textContent = "";
        const words: HTMLSpanElement[] = [];
        for (const part of text.match(/(\S+|\s+)/g) ?? [text]) {
          const span = document.createElement("span");
          span.textContent = part;
          span.style.display = "inline-block";
          span.style.whiteSpace = "pre";
          title.appendChild(span);
          if (/\S/.test(part)) words.push(span);
        }
        return words;
      };

      const enter = async (words: HTMLSpanElement[]) => {
        gsap.set(title, { x: -24, filter: "blur(1.2px)", opacity: 1 });
        gsap.set(words, { opacity: 0 });
        const wordTw = gsap.to(words, {
          opacity: 1,
          duration: 0.151,
          ease: enterEase,
          stagger: { each: 0.066, from: "start" },
        });
        active.push(wordTw);
        // The phrase-level slide is the longer move; await it.
        await tween(title, { x: 0, filter: "blur(0px)", duration: 0.374, ease: enterEase });
      };

      (async () => {
        await sleep(Math.random() * 400);
        if (cancelled) return;
        let i = 0;
        await enter(build(SLIDE_SAMPLES[0]));
        active.length = 0;
        while (!cancelled) {
          await sleep(550);
          if (cancelled) break;
          await tween(title, { x: 12, filter: "blur(1px)", opacity: 0, duration: 0.23, ease: exitEase });
          active.length = 0;
          if (cancelled) break;
          i = (i + 1) % SLIDE_SAMPLES.length;
          await enter(build(SLIDE_SAMPLES[i]));
          active.length = 0;
          if (cancelled) break;
          await sleep(320);
        }
      })();

      return () => {
        cancelled = true;
        timers.forEach((t) => clearTimeout(t));
        active.forEach((a) => a.kill());
        if (titleRef.current) titleRef.current.textContent = "";
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={{ overflow: "hidden" }}>
      <span ref={titleRef} style={{ display: "inline-block", willChange: "transform, opacity, filter" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* kinetic-center-build — horizontal word build                       */
/* ------------------------------------------------------------------ */

const CENTER_PHRASES = [
  ["Words", "push", "left"],
  ["Type", "locks", "center"],
  ["Build", "the", "line"],
];
const CENTER = {
  firstSec: 0.245,
  pushSec: 0.31,
  exitSec: 0.187,
  holdMs: 706,
  gapMs: 158,
  offset: 88,
  wordGap: 10,
  firstY: 6,
  entryScale: 0.992,
  entryBlur: 3.5,
  reflowBlur: 0.8,
  exitY: -6,
  exitBlur: 2.5,
};

export function KineticCenterText({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const host = hostRef.current;
      if (!host) return;

      let cancelled = false;
      const timers: number[] = [];
      const active: Anim[] = [];
      const enterEase = toEase("cubic-bezier(0.2, 0.8, 0.2, 1)");
      const exitEase = toEase("cubic-bezier(0.4, 0, 0.2, 1)");

      const sleep = (ms: number) =>
        new Promise<void>((resolve) => {
          const t = window.setTimeout(resolve, ms);
          timers.push(t);
        });

      const run = (
        state: WordState,
        el: HTMLElement,
        frames: KeyFrame[],
        totalSec: number,
        ease: gsap.EaseFunction | string
      ) => {
        const write = () => writeWord(el, state);
        Object.assign(state, frames[0]);
        write();
        const tl = gsap.timeline();
        for (let k = 1; k < frames.length; k++) {
          const dur = (frames[k].offset - frames[k - 1].offset) * totalSec;
          tl.to(state, {
            x: frames[k].x,
            y: frames[k].y,
            scale: frames[k].scale,
            blur: frames[k].blur,
            opacity: frames[k].opacity,
            duration: dur,
            ease,
            onUpdate: write,
          });
        }
        active.push(tl);
        return new Promise<void>((resolve) => tl.eventCallback("onComplete", resolve));
      };

      type Item = { el: HTMLElement; state: WordState; pos: number };

      const buildPhrase = async (words: string[]) => {
        host.textContent = "";
        const items: Item[] = [];

        for (let k = 0; k < words.length; k++) {
          const el = createAbsWord(words[k]);
          host.appendChild(el);

          const widths = items.map((it) => it.el.offsetWidth);
          widths.push(el.offsetWidth);
          const count = widths.length;
          const total = widths.reduce((a, b) => a + b, 0) + CENTER.wordGap * (count - 1);
          let cursor = -total / 2;
          const positions = widths.map((w) => {
            const p = cursor + w / 2;
            cursor += w + CENTER.wordGap;
            return p;
          });

          const item: Item = { el, state: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 }, pos: 0 };
          items.push(item);

          if (k === 0) {
            item.pos = positions[0];
            await run(
              item.state,
              el,
              [
                { offset: 0, x: 0, y: CENTER.firstY, scale: CENTER.entryScale, blur: CENTER.entryBlur, opacity: 0 },
                { offset: 0.58, x: 0, y: CENTER.firstY * 0.35, scale: 0.998, blur: CENTER.entryBlur * 0.45, opacity: 0.78 },
                { offset: 1, x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
              ],
              CENTER.firstSec,
              enterEase
            );
          } else {
            const moves: Promise<void>[] = [];
            for (let j = 0; j < items.length - 1; j++) {
              const cur = items[j].pos;
              const next = positions[j];
              items[j].pos = next;
              moves.push(
                run(
                  items[j].state,
                  items[j].el,
                  [
                    { offset: 0, x: cur, y: 0, scale: 1, blur: 0, opacity: 1 },
                    { offset: 0.52, x: mix(cur, next, 0.58), y: 0, scale: 1, blur: CENTER.reflowBlur, opacity: 1 },
                    { offset: 1, x: next, y: 0, scale: 1, blur: 0, opacity: 1 },
                  ],
                  CENTER.pushSec,
                  enterEase
                )
              );
            }
            const target = positions[positions.length - 1];
            item.pos = target;
            moves.push(
              run(
                item.state,
                el,
                [
                  { offset: 0, x: target + CENTER.offset, y: 0, scale: CENTER.entryScale, blur: CENTER.entryBlur, opacity: 0 },
                  { offset: 0.6, x: mix(target + CENTER.offset, target, 0.72), y: 0, scale: 0.998, blur: CENTER.entryBlur * 0.38, opacity: 0.84 },
                  { offset: 1, x: target, y: 0, scale: 1, blur: 0, opacity: 1 },
                ],
                CENTER.pushSec,
                enterEase
              )
            );
            await Promise.all(moves);
          }

          // Snap to exact final poses to avoid accumulated drift.
          items.forEach((it, idx) => {
            it.pos = positions[idx];
            it.state = { x: positions[idx], y: 0, scale: 1, blur: 0, opacity: 1 };
            writeWord(it.el, it.state);
          });
          active.length = 0;
          if (cancelled) return items;
        }
        return items;
      };

      const exitPhrase = async (items: Item[]) => {
        const exits = items.map((it) =>
          run(
            it.state,
            it.el,
            [
              { offset: 0, x: it.pos, y: 0, scale: 1, blur: 0, opacity: 1 },
              { offset: 0.52, x: it.pos, y: CENTER.exitY * 0.45, scale: 1, blur: CENTER.exitBlur * 0.55, opacity: 0.62 },
              { offset: 1, x: it.pos, y: CENTER.exitY, scale: 1, blur: CENTER.exitBlur, opacity: 0 },
            ],
            CENTER.exitSec,
            exitEase
          )
        );
        await Promise.all(exits);
        active.length = 0;
      };

      (async () => {
        await sleep(Math.random() * 400);
        if (cancelled) return;
        let i = 0;
        while (!cancelled) {
          const items = await buildPhrase(CENTER_PHRASES[i]);
          if (cancelled) break;
          await sleep(CENTER.holdMs);
          if (cancelled) break;
          await exitPhrase(items);
          if (cancelled) break;
          host.textContent = "";
          await sleep(CENTER.gapMs);
          i = (i + 1) % CENTER_PHRASES.length;
        }
      })();

      return () => {
        cancelled = true;
        timers.forEach((t) => clearTimeout(t));
        active.forEach((a) => a.kill());
        if (hostRef.current) hostRef.current.textContent = "";
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", height: "3.5rem" }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* short-slide-down — kinetic-top-build (vertical word stack)          */
/* ------------------------------------------------------------------ */

const STACK_PHRASES = [
  ["Drop", "into", "place"],
  ["Words", "settle", "lower"],
  ["Build", "from", "above"],
];
const STACK = {
  firstSec: 0.259,
  pushSec: 0.36,
  exitSec: 0.23,
  holdMs: 792,
  gapMs: 130,
  offset: -28,
  lineGap: 12,
  firstY: -14,
  entryScale: 0.992,
  entryBlur: 2.4,
  reflowBlur: 0.7,
  exitY: 10,
  exitBlur: 1.2,
};

export function KineticStackText({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const host = hostRef.current;
      if (!host) return;

      let cancelled = false;
      const timers: number[] = [];
      const active: Anim[] = [];
      const enterEase = toEase("cubic-bezier(0.2, 0.8, 0.2, 1)");
      const exitEase = toEase("cubic-bezier(0.4, 0, 0.2, 1)");

      const sleep = (ms: number) =>
        new Promise<void>((resolve) => {
          const t = window.setTimeout(resolve, ms);
          timers.push(t);
        });

      const run = (
        state: WordState,
        el: HTMLElement,
        frames: KeyFrame[],
        totalSec: number,
        ease: gsap.EaseFunction | string
      ) => {
        const write = () => writeWord(el, state);
        Object.assign(state, frames[0]);
        write();
        const tl = gsap.timeline();
        for (let k = 1; k < frames.length; k++) {
          const dur = (frames[k].offset - frames[k - 1].offset) * totalSec;
          tl.to(state, {
            x: frames[k].x,
            y: frames[k].y,
            scale: frames[k].scale,
            blur: frames[k].blur,
            opacity: frames[k].opacity,
            duration: dur,
            ease,
            onUpdate: write,
          });
        }
        active.push(tl);
        return new Promise<void>((resolve) => tl.eventCallback("onComplete", resolve));
      };

      type Item = { el: HTMLElement; state: WordState; pos: number };

      const buildPhrase = async (words: string[]) => {
        host.textContent = "";
        const items: Item[] = [];

        for (let k = 0; k < words.length; k++) {
          const el = createAbsWord(words[k]);
          el.style.display = "block";
          host.appendChild(el);

          const heights = items.map((it) => it.el.offsetHeight);
          heights.push(el.offsetHeight);
          const count = heights.length;
          const total = heights.reduce((a, b) => a + b, 0) + STACK.lineGap * (count - 1);
          let cursor = -total / 2;
          const positions = heights.map((h) => {
            const p = cursor + h / 2;
            cursor += h + STACK.lineGap;
            return p;
          });

          const item: Item = { el, state: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 }, pos: 0 };
          items.push(item);

          if (k === 0) {
            item.pos = positions[0];
            await run(
              item.state,
              el,
              [
                { offset: 0, x: 0, y: STACK.firstY, scale: STACK.entryScale, blur: STACK.entryBlur, opacity: 0 },
                { offset: 0.58, x: 0, y: STACK.firstY * 0.35, scale: 0.998, blur: STACK.entryBlur * 0.45, opacity: 0.78 },
                { offset: 1, x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
              ],
              STACK.firstSec,
              enterEase
            );
          } else {
            const moves: Promise<void>[] = [];
            for (let j = 0; j < items.length - 1; j++) {
              const cur = items[j].pos;
              const next = positions[j];
              items[j].pos = next;
              moves.push(
                run(
                  items[j].state,
                  items[j].el,
                  [
                    { offset: 0, x: 0, y: cur, scale: 1, blur: 0, opacity: 1 },
                    { offset: 0.52, x: 0, y: mix(cur, next, 0.58), scale: 1, blur: STACK.reflowBlur, opacity: 1 },
                    { offset: 1, x: 0, y: next, scale: 1, blur: 0, opacity: 1 },
                  ],
                  STACK.pushSec,
                  enterEase
                )
              );
            }
            const target = positions[positions.length - 1];
            item.pos = target;
            moves.push(
              run(
                item.state,
                el,
                [
                  { offset: 0, x: 0, y: target + STACK.offset, scale: STACK.entryScale, blur: STACK.entryBlur, opacity: 0 },
                  { offset: 0.6, x: 0, y: mix(target + STACK.offset, target, 0.72), scale: 0.998, blur: STACK.entryBlur * 0.38, opacity: 0.84 },
                  { offset: 1, x: 0, y: target, scale: 1, blur: 0, opacity: 1 },
                ],
                STACK.pushSec,
                enterEase
              )
            );
            await Promise.all(moves);
          }

          items.forEach((it, idx) => {
            it.pos = positions[idx];
            it.state = { x: 0, y: positions[idx], scale: 1, blur: 0, opacity: 1 };
            writeWord(it.el, it.state);
          });
          active.length = 0;
          if (cancelled) return items;
        }
        return items;
      };

      const exitPhrase = async (items: Item[]) => {
        const exits = items.map((it) =>
          run(
            it.state,
            it.el,
            [
              { offset: 0, x: 0, y: it.pos, scale: 1, blur: 0, opacity: 1 },
              { offset: 0.52, x: 0, y: it.pos + STACK.exitY * 0.45, scale: 1, blur: STACK.exitBlur * 0.55, opacity: 0.62 },
              { offset: 1, x: 0, y: it.pos + STACK.exitY, scale: 1, blur: STACK.exitBlur, opacity: 0 },
            ],
            STACK.exitSec,
            exitEase
          )
        );
        await Promise.all(exits);
        active.length = 0;
      };

      (async () => {
        await sleep(Math.random() * 400);
        if (cancelled) return;
        let i = 0;
        while (!cancelled) {
          const items = await buildPhrase(STACK_PHRASES[i]);
          if (cancelled) break;
          await sleep(STACK.holdMs);
          if (cancelled) break;
          await exitPhrase(items);
          if (cancelled) break;
          host.textContent = "";
          await sleep(STACK.gapMs);
          i = (i + 1) % STACK_PHRASES.length;
        }
      })();

      return () => {
        cancelled = true;
        timers.forEach((t) => clearTimeout(t));
        active.forEach((a) => a.kill());
        if (hostRef.current) hostRef.current.textContent = "";
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", height: "7rem" }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
