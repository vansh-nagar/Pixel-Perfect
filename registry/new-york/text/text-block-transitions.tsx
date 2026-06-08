"use client";

/**
 * Codrops "Text Block Transitions" — faithful ports of all 12 demos from
 * https://github.com/codrops/TextBlockTransitions (article: "Inspiration for
 * Text Block Transitions", 2023).
 *
 * The source demos transition between two stacked paragraphs on click: an
 * *outgoing* text animates out while the *incoming* text animates in, with
 * overlapping GSAP timelines. Text is split with Splitting.js into
 * `.word` > `.char` spans (demos 6 & 7 add a `.word-wrap` mask span per word).
 *
 * This component reproduces that two-layer crossfade model with GSAP, but
 * **auto-loops on a timer** instead of a click trigger to match the showcase
 * grid's autoplay convention. Every timeline (durations, eases, transform
 * origins, `stagger {each, from}`, position labels, `gsap.utils.random` ranges,
 * per-word sub-timelines and their random/computed offsets) is a near 1:1
 * transcription of the corresponding `js/demoN/index.js`.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type Anim = gsap.core.Tween | gsap.core.Timeline;

type Split = {
  /** All `.word` elements, in document order (codrops `splittingOutput[i].words`). */
  words: HTMLElement[];
  /** `.char` elements grouped per word (codrops `chars[i][wordIndex]`). */
  chars: HTMLElement[][];
};

/** Everything a single switch (out + in) needs, mirroring the codrops closure. */
type Ctx = {
  curWords: HTMLElement[];
  upWords: HTMLElement[];
  curChars: HTMLElement[][];
  upChars: HTMLElement[][];
  curLayer: HTMLElement;
  upLayer: HTMLElement;
  /** Toggle a layer's "current" state (codrops `.content__text--current`). */
  setCurrent: (layer: HTMLElement, on: boolean) => void;
  /** Register an animation so the React cleanup can kill it. */
  track: (a: Anim) => void;
  /** The whole-timeline onComplete: advance the pointer + schedule the next loop. */
  finish: () => void;
};

export type BlockTransition = {
  display_name: string;
  description: string;
  /** Whether each word's text is wrapped in an `overflow:hidden` mask span. */
  wrap?: boolean;
  /** Where to set CSS `perspective` so 3D rotations read with depth. */
  perspectiveScope?: "word" | "layer";
  perspective?: number;
  /** Set `transform-style: preserve-3d` on words (needed for nested 3D chars). */
  preserve3dWords?: boolean;
  /** Build + start the GSAP timeline for one out→in switch. */
  run: (ctx: Ctx) => void;
};

/* ------------------------------------------------------------------ */
/* The 12 transitions — faithful ports of js/demo1…demo12/index.js     */
/* ------------------------------------------------------------------ */

export const BLOCK_TRANSITIONS: Record<string, BlockTransition> = {
  // Demo 1 — words fade out; new words rise with a center-split tilt.
  "center-rise": {
    display_name: "Center Rise & Tilt",
    description:
      "Words fade out; the new line rises from below, tilting from a center split.",
    run: ({ curWords, upWords, curLayer, upLayer, setCurrent, track, finish }) => {
      const total = upWords.length;
      const tl = gsap.timeline({
        defaults: { duration: 0.05, ease: "expo" },
        onComplete: finish,
      });
      track(tl);
      tl.to(curWords, {
        opacity: 0,
        onComplete: () => setCurrent(curLayer, false),
      }).fromTo(
        upWords,
        {
          willChange: "transform, opacity",
          transformOrigin: (pos: number) =>
            pos <= total / 2 ? "100% 100%" : "0% 100%",
          opacity: 0,
          yPercent: 30,
          rotation: (pos: number) => (pos <= total / 2 ? -3 : 3),
        },
        {
          duration: 0.8,
          onStart: () => setCurrent(upLayer, true),
          opacity: 1,
          yPercent: 0,
          rotation: 0,
          stagger: { each: 0.02, from: "center" },
        },
        0
      );
    },
  },

  // Demo 2 — plain random per-word fade.
  "random-fade": {
    display_name: "Random Fade",
    description: "Old words blink out; new words fade in one by one at random.",
    run: ({ curWords, upWords, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({
        defaults: { duration: 0.05, ease: "expo" },
        onComplete: finish,
      });
      track(tl);
      tl.to(curWords, {
        duration: 0.01,
        opacity: 0,
        onComplete: () => setCurrent(curLayer, false),
      }).fromTo(
        upWords,
        { opacity: 0 },
        {
          onStart: () => setCurrent(upLayer, true),
          opacity: 1,
          stagger: { each: 0.009, from: "random" },
        }
      );
    },
  },

  // Demo 3 — letters flip out/in around the Y axis, words offset randomly.
  "letter-flip-y": {
    display_name: "3D Letter Flip",
    description:
      "Letters flip away on the Y axis and new letters flip back in, word by word.",
    perspectiveScope: "word",
    perspective: 1000,
    run: ({ curWords, upWords, curChars, upChars, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({ onComplete: finish });
      track(tl);
      curWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          curChars[wi],
          { willChange: "transform", rotationY: 0 },
          {
            duration: 0.6,
            ease: "expo",
            opacity: 0,
            rotationY: 90,
            stagger: { each: 0.04, from: "end" },
          }
        );
        tl.add(wt, Math.random() * 0.5);
      });
      tl.add(() => setCurrent(curLayer, false));
      tl.add(() => setCurrent(upLayer, true), ">-=.8").addLabel("previous", ">");
      upWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          upChars[wi],
          { willChange: "transform", opacity: 0, rotationY: 90 },
          {
            duration: 0.6,
            ease: "expo",
            opacity: 1,
            rotationY: 0,
            stagger: { each: 0.04, from: "end" },
          }
        );
        tl.add(wt, `previous+=${Math.random() * 0.5}`);
      });
    },
  },

  // Demo 4 — letters collapse to nothing from the edges, new letters pop in.
  "scale-pop": {
    display_name: "Scale Collapse & Pop",
    description:
      "Letters shrink away from the edges; new letters pop in slightly oversized.",
    run: ({ curWords, upWords, curChars, upChars, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({ onComplete: finish });
      track(tl);
      curWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          curChars[wi],
          { willChange: "transform, opacity", scale: 1 },
          {
            duration: 0.2,
            ease: "power1.in",
            opacity: 0,
            scale: 0,
            stagger: { each: 0.03, from: "edges" },
          }
        );
        tl.add(wt, Math.random() * 0.5);
      });
      tl.add(() => {
        setCurrent(curLayer, false);
        setCurrent(upLayer, true);
      }).addLabel("previous", ">");
      upWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          upChars[wi],
          { willChange: "transform, opacity", opacity: 0, scale: 1.7 },
          {
            duration: 0.5,
            ease: "power3",
            opacity: 1,
            scale: 1,
            stagger: { each: 0.015, from: "edges" },
          }
        );
        tl.add(wt, `previous+=${Math.random() * 0.5}`);
      });
    },
  },

  // Demo 5 — letters squash to a flat line and grow back (vertical blinds).
  "vertical-blinds": {
    display_name: "Vertical Blinds",
    description:
      "Letters collapse vertically to a line and the next line grows back up.",
    run: ({ curWords, upWords, curChars, upChars, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({ onComplete: finish });
      track(tl);
      curWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          curChars[wi],
          { willChange: "transform", transformOrigin: "50% 0%", scaleY: 1 },
          {
            duration: 0.3,
            ease: "sine.in",
            scaleY: 0,
            stagger: { each: 0.02, from: "start" },
          }
        );
        tl.add(wt, wi * 0.015);
      });
      tl.add(() => setCurrent(curLayer, false));
      tl.add(() => setCurrent(upLayer, true), ">-=0.6").addLabel("previous", ">");
      upWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          upChars[wi],
          { willChange: "transform", transformOrigin: "50% 100%", scaleY: 0 },
          {
            duration: 0.3,
            ease: "power4",
            scaleY: 1,
            stagger: { each: 0.015, from: "start" },
          }
        );
        tl.add(wt, `previous+=${wi * 0.015}`);
      });
    },
  },

  // Demo 6 — words slide up out of a mask; new words slide up into it.
  "slide-up-mask": {
    display_name: "Slide-Up Mask",
    description:
      "Words slide up out of a clipping mask while the new words slide up into it.",
    wrap: true,
    run: ({ curWords, upWords, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({
        defaults: { duration: 0.05, ease: "expo" },
        onComplete: finish,
      });
      track(tl);
      tl.fromTo(
        curWords,
        { willChange: "transform", transformOrigin: "100% 50%", yPercent: 0, rotation: 0 },
        {
          duration: 0.15,
          ease: "power1.in",
          yPercent: -125,
          rotation: 3,
          stagger: { each: 0.02, from: "start" },
          onComplete: () => setCurrent(curLayer, false),
        }
      ).fromTo(
        upWords,
        { willChange: "transform", transformOrigin: "0% 50%", yPercent: 125, rotation: -3 },
        {
          onStart: () => setCurrent(upLayer, true),
          duration: 0.6,
          ease: "back",
          yPercent: 0,
          rotation: 0,
          stagger: { each: 0.02, from: "start" },
        },
        ">-=0.6"
      );
    },
  },

  // Demo 7 — words and their masks slide in opposite directions (panel push).
  "push-panel": {
    display_name: "Push Panel",
    description:
      "Words and their masks slide opposite ways, pushing the line off and on.",
    wrap: true,
    run: ({ curWords, upWords, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({
        defaults: { duration: 0.05, ease: "expo" },
        onComplete: finish,
      });
      track(tl);
      tl.fromTo(
        curWords,
        { xPercent: 0 },
        {
          duration: 0.15,
          ease: "power1.in",
          xPercent: -100,
          stagger: { each: 0.01, from: "start" },
          onComplete: () => setCurrent(curLayer, false),
        }
      )
        .fromTo(
          curWords.map((w) => w.parentNode as HTMLElement),
          { xPercent: 0 },
          {
            duration: 0.15,
            ease: "power1.in",
            xPercent: 100,
            stagger: { each: 0.01, from: "start" },
            onComplete: () => setCurrent(curLayer, false),
          },
          0
        )
        .addLabel("currentPanel", ">-=0.2")
        .fromTo(
          upWords,
          { xPercent: 100 },
          {
            onStart: () => setCurrent(upLayer, true),
            duration: 0.6,
            ease: "expo",
            xPercent: 0,
            stagger: { each: 0.01, from: "start" },
          },
          "currentPanel"
        )
        .fromTo(
          upWords.map((w) => w.parentNode as HTMLElement),
          { xPercent: -100 },
          {
            onStart: () => setCurrent(upLayer, true),
            duration: 0.6,
            ease: "expo",
            xPercent: 0,
            stagger: { each: 0.01, from: "start" },
          },
          "currentPanel"
        );
    },
  },

  // Demo 8 — words squash flat, new words bounce back with an elastic ease.
  "elastic-squash": {
    display_name: "Elastic Squash",
    description:
      "Words squash to a line and the new words spring back with an elastic bounce.",
    run: ({ curWords, upWords, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({
        defaults: { duration: 0.05, ease: "expo" },
        onComplete: finish,
      });
      track(tl);
      tl.fromTo(
        curWords,
        { willChange: "transform", scaleY: 1 },
        {
          duration: 0.5,
          ease: "back.in(3)",
          scaleY: 0,
          stagger: { each: 0.03, from: "start" },
          onComplete: () => setCurrent(curLayer, false),
        },
        0
      ).fromTo(
        upWords,
        { willChange: "transform", scaleY: 0 },
        {
          onStart: () => setCurrent(upLayer, true),
          duration: 0.7,
          ease: "elastic.out(0.7)",
          scaleY: 1,
          stagger: { each: 0.025, from: "start" },
        },
        ">-=0.65"
      );
    },
  },

  // Demo 9 — words scatter into 3D depth at random and fly back from the front.
  "z-scatter": {
    display_name: "3D Z-Scatter",
    description:
      "Words scatter randomly into depth; the new words fly forward into place.",
    perspectiveScope: "layer",
    perspective: 1000,
    run: ({ curWords, upWords, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({
        defaults: { duration: 0.05, ease: "expo" },
        onComplete: finish,
      });
      track(tl);
      tl.fromTo(
        curWords,
        {
          willChange: "transform, opacity",
          opacity: 1,
          rotationX: 0,
          rotationY: 0,
          xPercent: 0,
          yPercent: 0,
          z: 0,
        },
        {
          duration: 0.5,
          ease: "power1.in",
          z: () => gsap.utils.random(-700, -400),
          opacity: 0,
          xPercent: () => gsap.utils.random(-50, 50),
          yPercent: () => gsap.utils.random(-10, 10),
          rotationX: () => gsap.utils.random(-90, 90),
          stagger: { each: 0.006, from: "random" },
          onComplete: () => setCurrent(curLayer, false),
        },
        0
      ).fromTo(
        upWords,
        {
          willChange: "transform, opacity",
          z: () => gsap.utils.random(400, 700),
          opacity: 0,
          xPercent: () => gsap.utils.random(-50, 50),
          yPercent: () => gsap.utils.random(-10, 10),
          rotationX: () => gsap.utils.random(-90, 90),
        },
        {
          onStart: () => setCurrent(upLayer, true),
          duration: 0.8,
          ease: "expo",
          opacity: 1,
          rotationX: 0,
          rotationY: 0,
          xPercent: 0,
          yPercent: 0,
          z: 0,
          stagger: { each: 0.006, from: "random" },
        },
        ">-=0.45"
      );
    },
  },

  // Demo 10 — letters drift apart at random and the next set converges in.
  "drift-scatter": {
    display_name: "Random Drift Scatter",
    description:
      "Letters drift out in random directions; new letters converge from random offsets.",
    run: ({ curWords, upWords, curChars, upChars, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({ onComplete: finish });
      track(tl);
      curWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          curChars[wi],
          { willChange: "transform", transformOrigin: "50% 0%", opacity: 1, xPercent: 0, yPercent: 0 },
          {
            duration: 0.3,
            ease: "power4",
            opacity: 0,
            xPercent: () => gsap.utils.random(-50, 50),
            yPercent: () => gsap.utils.random(-50, 50),
            stagger: { each: 0.03, from: "random" },
          }
        );
        tl.add(wt, Math.random() * 0.3);
      });
      tl.add(() => setCurrent(curLayer, false));
      tl.add(() => setCurrent(upLayer, true), ">-=0.6").addLabel("previous", ">");
      upWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          upChars[wi],
          {
            willChange: "transform",
            transformOrigin: "50% 100%",
            opacity: 0,
            xPercent: () => gsap.utils.random(-50, 50),
            yPercent: () => gsap.utils.random(-50, 50),
          },
          {
            duration: 0.4,
            ease: "power4",
            opacity: 1,
            xPercent: 0,
            yPercent: 0,
            stagger: { each: 0.02, from: "random" },
          }
        );
        tl.add(wt, `previous+=${Math.random() * 0.3}`);
      });
    },
  },

  // Demo 11 — words flip down/up around the X axis from their bottom edge.
  "flap-x": {
    display_name: "3D Flap",
    description:
      "Words flip down around their bottom edge as the new words flip up into view.",
    perspectiveScope: "layer",
    perspective: 800,
    run: ({ curWords, upWords, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({
        defaults: { duration: 0.05, ease: "expo" },
        onComplete: finish,
      });
      track(tl);
      tl.fromTo(
        curWords,
        {
          willChange: "transform, opacity",
          transformOrigin: "50% 100%",
          opacity: 1,
          rotationX: 0,
          rotationY: 0,
          xPercent: 0,
          yPercent: 0,
          z: 0,
        },
        {
          duration: 0.2,
          ease: "power1.in",
          opacity: 0,
          rotationX: -90,
          stagger: { each: 0.015, from: "start" },
          onComplete: () => setCurrent(curLayer, false),
        },
        0
      ).fromTo(
        upWords,
        { willChange: "transform, opacity", transformOrigin: "50% 100%", opacity: 0, rotationX: 90 },
        {
          onStart: () => setCurrent(upLayer, true),
          duration: 0.7,
          ease: "expo",
          opacity: 1,
          rotationX: 0,
          stagger: { each: 0.015, from: "start" },
        },
        ">-=0.4"
      );
    },
  },

  // Demo 12 — letters swing open like doors on the Y axis, with depth.
  "door-swing": {
    display_name: "3D Door Swing",
    description:
      "Letters swing open like doors on the Y axis and the new letters swing shut.",
    perspectiveScope: "layer",
    perspective: 1000,
    preserve3dWords: true,
    run: ({ curWords, upWords, curChars, upChars, curLayer, upLayer, setCurrent, track, finish }) => {
      const tl = gsap.timeline({ onComplete: finish });
      track(tl);
      curWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          curChars[wi],
          { willChange: "transform", transformOrigin: "0% 50%", opacity: 1, rotationY: 0, z: 0 },
          {
            duration: 0.3,
            ease: "sine.in",
            opacity: 0,
            rotationY: -45,
            z: 30,
            stagger: { each: 0.05, from: "end" },
          }
        );
        tl.add(wt, (curWords.length - (wi - 1)) * 0.02);
      });
      tl.add(() => setCurrent(curLayer, false));
      tl.add(() => setCurrent(upLayer, true), ">-=0.6").addLabel("previous", ">");
      upWords.forEach((_, wi) => {
        const wt = gsap.timeline().fromTo(
          upChars[wi],
          { willChange: "transform", transformOrigin: "0% 50%", opacity: 0, rotationY: 90, z: -60 },
          {
            duration: 0.6,
            ease: "back.out(4)",
            opacity: 1,
            rotationY: 0,
            z: 0,
            stagger: { each: 0.05, from: "start" },
          }
        );
        tl.add(wt, `previous+=${(upWords.length - (wi - 1)) * 0.02}`);
      });
    },
  },
};

/** Display order of the 12 transitions (matches codrops demo1…demo12). */
export const BLOCK_TRANSITION_ORDER: string[] = [
  "center-rise",
  "random-fade",
  "letter-flip-y",
  "scale-pop",
  "vertical-blinds",
  "slide-up-mask",
  "push-panel",
  "elastic-squash",
  "z-scatter",
  "drift-scatter",
  "flap-x",
  "door-swing",
];

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

/** Two short phrases the effect alternates between (echoing the codrops copy). */
const DEFAULT_SAMPLES: [string, string] = [
  "Whispers on the wind",
  "Secrets yet untold",
];

/** Pause (ms) the finished phrase is held before the next transition starts. */
const HOLD_MS = 1500;

const LAYER_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "nowrap",
};

/** Build the `.word` > `.char` DOM for one phrase (codrops Splitting.js shape). */
function splitText(layer: HTMLElement, phrase: string, wrap: boolean): Split {
  layer.textContent = "";
  const words: HTMLElement[] = [];
  const chars: HTMLElement[][] = [];
  const tokens = phrase.split(/\s+/).filter(Boolean);

  tokens.forEach((token, wi) => {
    const word = document.createElement("span");
    word.style.display = "inline-block";
    word.style.position = "relative";
    word.style.whiteSpace = "nowrap";

    const wordChars: HTMLElement[] = [];
    for (const ch of Array.from(token)) {
      const c = document.createElement("span");
      c.style.display = "inline-block";
      c.style.position = "relative";
      c.textContent = ch;
      word.appendChild(c);
      wordChars.push(c);
    }

    const spacing = wi < tokens.length - 1 ? "0.28em" : "0";
    if (wrap) {
      // Mask wrapper for demos 6 & 7 — the word's parentNode (used by demo 7).
      const mask = document.createElement("span");
      mask.style.display = "inline-block";
      mask.style.position = "relative";
      mask.style.overflow = "hidden";
      mask.style.verticalAlign = "top";
      mask.style.marginRight = spacing;
      mask.appendChild(word);
      layer.appendChild(mask);
    } else {
      word.style.marginRight = spacing;
      layer.appendChild(word);
    }

    words.push(word);
    chars.push(wordChars);
  });

  return { words, chars };
}

/** Apply the one-time 3D setup (perspective / preserve-3d) for a layer. */
function applyDepth(def: BlockTransition, layer: HTMLElement, split: Split) {
  if (def.perspectiveScope === "layer" && def.perspective)
    gsap.set(layer, { perspective: def.perspective });
  if (def.perspectiveScope === "word" && def.perspective)
    split.words.forEach((w) => gsap.set(w, { perspective: def.perspective }));
  if (def.preserve3dWords)
    split.words.forEach((w) => gsap.set(w, { transformStyle: "preserve-3d" }));
}

interface TextBlockTransitionProps {
  /** One of `BLOCK_TRANSITION_ORDER`. */
  variant: string;
  /** The two phrases to alternate between. */
  samples?: [string, string];
  className?: string;
}

export function TextBlockTransition({
  variant,
  samples = DEFAULT_SAMPLES,
  className,
}: TextBlockTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layer0Ref = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const def = BLOCK_TRANSITIONS[variant];
      const layer0 = layer0Ref.current;
      const layer1 = layer1Ref.current;
      if (!def || !layer0 || !layer1) return;

      const timers: number[] = [];
      let active: Anim[] = [];
      const track = (a: Anim) => {
        active.push(a);
      };
      const setCurrent = (layer: HTMLElement, on: boolean) => {
        layer.style.opacity = on ? "1" : "0";
        layer.style.pointerEvents = on ? "auto" : "none";
      };

      const split0 = splitText(layer0, samples[0], !!def.wrap);
      const split1 = splitText(layer1, samples[1], !!def.wrap);
      const splits = [split0, split1];
      const layers = [layer0, layer1];
      applyDepth(def, layer0, split0);
      applyDepth(def, layer1, split1);

      setCurrent(layer0, true);
      setCurrent(layer1, false);

      let currentPos = 0;
      let isAnimating = false;

      const scheduleNext = () => {
        timers.push(window.setTimeout(switchTexts, HOLD_MS));
      };

      function switchTexts() {
        if (isAnimating) return;
        active = active.filter((a) => a.isActive());
        isAnimating = true;
        const upPos = currentPos ? 0 : 1;
        def.run({
          curWords: splits[currentPos].words,
          upWords: splits[upPos].words,
          curChars: splits[currentPos].chars,
          upChars: splits[upPos].chars,
          curLayer: layers[currentPos],
          upLayer: layers[upPos],
          setCurrent,
          track,
          finish: () => {
            currentPos = upPos;
            isAnimating = false;
            scheduleNext();
          },
        });
      }

      scheduleNext();

      return () => {
        timers.forEach((t) => clearTimeout(t));
        active.forEach((a) => a.kill());
        layer0.textContent = "";
        layer1.textContent = "";
      };
    },
    { scope: containerRef, dependencies: [variant] }
  );

  const sizer = samples[0].length >= samples[1].length ? samples[0] : samples[1];

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}
    >
      {/* Invisible sizer so the absolutely-positioned layers have a box. */}
      <span aria-hidden style={{ visibility: "hidden" }}>
        {sizer}
      </span>
      <div ref={layer0Ref} style={LAYER_STYLE} />
      <div ref={layer1Ref} style={LAYER_STYLE} />
    </div>
  );
}

export default TextBlockTransition;
