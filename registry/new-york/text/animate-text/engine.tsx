"use client";

/**
 * Generic-stagger text animation engine.
 *
 * Faithful reproduction of the `generic-stagger` renderer from the
 * `animate-text` catalog. A spec declares an enter phase, an exit phase, a
 * split target and runtime timing; this component loops:
 *
 *   initial-delay → enter → hold → exit → micro-delay → (next phrase) → enter → gap → ...
 *
 * Timing is scaled by `speed_multiplier` and vertical travel by
 * `y_travel_multiplier`, matching the website runtime. Easing curves are
 * converted to GSAP eases (cubic-bezier → CustomEase, steps → SteppedEase).
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

export type StaggerFrom = "start" | "center" | "edges" | "random" | "end";
export type Target = "whole" | "per-character" | "per-word" | "per-line";

export type Frame = {
  opacity?: number;
  x_px?: number;
  y_px?: number;
  scale?: number;
  blur_px?: number;
};

export type Phase = {
  duration_ms: number;
  stagger_ms: number;
  easing: string;
  from: Frame;
  to: Frame;
};

export type AnimateTextSpec = {
  id: string;
  display_name: string;
  description: string;
  target: Target;
  enter: Phase;
  exit: Phase;
  hold_ms: number;
  gap_ms: number;
  micro_delay_ms: number;
  speed_multiplier: number;
  y_travel_multiplier: number;
  initial_delay_max_ms: number;
  default_stagger_from: StaggerFrom;
  samples: string[];
};

const easeCache = new Map<string, gsap.EaseFunction | string>();

export function toEase(easing: string): gsap.EaseFunction | string {
  if (easeCache.has(easing)) return easeCache.get(easing)!;

  let resolved: gsap.EaseFunction | string = "power2.out";
  if (easing.startsWith("steps")) {
    const m = easing.match(/steps\(\s*(\d+)/);
    resolved = `steps(${m ? m[1] : 1})`;
  } else if (easing.startsWith("cubic-bezier")) {
    const m = easing.match(/cubic-bezier\(([^)]+)\)/);
    if (m) {
      const [x1, y1, x2, y2] = m[1].split(",").map((n) => parseFloat(n.trim()));
      const id = `atxt_${[x1, y1, x2, y2].join("_")}`.replace(/[^a-z0-9_]/gi, "");
      resolved = CustomEase.create(id, `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);
    }
  } else if (easing === "linear" || easing === "none") {
    resolved = "none";
  }

  easeCache.set(easing, resolved);
  return resolved;
}

type SplitPart = { text: string; animated: boolean; block: boolean };

function splitUnits(text: string, target: Target): SplitPart[] {
  if (target === "whole") return [{ text, animated: true, block: false }];
  if (target === "per-line")
    return text
      .split("\n")
      .map((line) => ({ text: line, animated: true, block: true }));
  if (target === "per-word") {
    const parts = text.match(/(\S+|\s+)/g) ?? [text];
    return parts.map((p) => ({ text: p, animated: /\S/.test(p), block: false }));
  }
  return Array.from(text).map((ch) => ({
    text: ch,
    animated: true,
    block: false,
  }));
}

function renderUnits(
  stage: HTMLElement,
  text: string,
  target: Target
): HTMLSpanElement[] {
  stage.textContent = "";
  const units: HTMLSpanElement[] = [];
  for (const part of splitUnits(text, target)) {
    const span = document.createElement("span");
    span.textContent = part.text;
    span.style.display = part.block ? "block" : "inline-block";
    span.style.whiteSpace = "pre";
    span.style.willChange = "transform, opacity, filter";
    span.style.transformOrigin = "50% 55%";
    span.style.backfaceVisibility = "hidden";
    stage.appendChild(span);
    if (part.animated) units.push(span);
  }
  return units;
}

function frameVars(
  frame: Frame,
  yTravel: number,
  useBlur: boolean
): gsap.TweenVars {
  const vars: gsap.TweenVars = {
    x: frame.x_px ?? 0,
    y: (frame.y_px ?? 0) * yTravel,
    scale: frame.scale ?? 1,
  };
  if (frame.opacity != null) vars.opacity = frame.opacity;
  if (useBlur) vars.filter = `blur(${frame.blur_px ?? 0}px)`;
  return vars;
}

interface AnimateTextProps {
  spec: AnimateTextSpec;
  staggerFrom?: StaggerFrom;
  className?: string;
}

export function AnimateText({ spec, staggerFrom, className }: AnimateTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const from = staggerFrom ?? spec.default_stagger_from;

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      let cancelled = false;
      const timers: number[] = [];
      let active: (gsap.core.Tween | gsap.core.Timeline)[] = [];
      const sp = spec.speed_multiplier;
      const yt = spec.y_travel_multiplier;

      const sleep = (ms: number) =>
        new Promise<void>((resolve) => {
          const t = window.setTimeout(resolve, ms);
          timers.push(t);
        });

      const runPhase = (units: HTMLSpanElement[], phase: Phase) => {
        const useBlur = phase.from.blur_px != null || phase.to.blur_px != null;
        gsap.set(units, frameVars(phase.from, yt, useBlur));
        return new Promise<void>((resolve) => {
          if (!units.length) {
            resolve();
            return;
          }
          const tw = gsap.to(units, {
            ...frameVars(phase.to, yt, useBlur),
            duration: (phase.duration_ms * sp) / 1000,
            ease: toEase(phase.easing),
            stagger: { each: (phase.stagger_ms * sp) / 1000, from },
            onComplete: resolve,
          });
          active = [tw];
        });
      };

      (async () => {
        await sleep(Math.random() * spec.initial_delay_max_ms);
        if (cancelled) return;

        let i = 0;
        let units = renderUnits(stage, spec.samples[0], spec.target);
        await runPhase(units, spec.enter);

        while (!cancelled) {
          await sleep(spec.hold_ms);
          if (cancelled) break;
          await runPhase(units, spec.exit);
          if (cancelled) break;
          await sleep(spec.micro_delay_ms);
          if (cancelled) break;
          i = (i + 1) % spec.samples.length;
          units = renderUnits(stage, spec.samples[i], spec.target);
          await runPhase(units, spec.enter);
          if (cancelled) break;
          await sleep(spec.gap_ms);
        }
      })();

      return () => {
        cancelled = true;
        timers.forEach((t) => clearTimeout(t));
        active.forEach((t) => t.kill());
        if (stageRef.current) stageRef.current.textContent = "";
      };
    },
    { scope: containerRef, dependencies: [spec.id, from] }
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ perspective: 900, textAlign: "center" }}
    >
      <div ref={stageRef} style={{ display: "inline-block" }} />
    </div>
  );
}

export default AnimateText;
