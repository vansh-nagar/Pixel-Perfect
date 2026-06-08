"use client";

/**
 * Gooey text hover morph — faithful GSAP ports of the three Codrops
 * "Gooey Text Hover Effect" demos. https://github.com/codrops/GooeyTextHoverEffect
 *
 * Two SVG <text> elements are stacked in a <g>; one fades out while the other
 * fades in, and an animated feGaussianBlur (fed through a gooey feColorMatrix
 * alpha threshold + feComposite atop) makes the glyphs melt together and reform
 * — the classic "goo" morph. The blur ramps 0 → peak → 0 across the crossfade,
 * and the filter is detached at rest so the text stays crisp.
 *
 * Variants (timing + translation taken verbatim from each demo):
 *   - morph   → pure gooey crossfade, slow (demo 1)
 *   - slide-x → gooey crossfade with a horizontal slide (demo 2)
 *   - slide-y → gooey crossfade with a vertical drop (demo 3)
 *
 * In this showcase the morph runs on a continuous loop and also responds to
 * hover (enter → forward, leave → reverse), matching the original interaction.
 */

import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type Variant = "morph" | "slide-x" | "slide-y";

const VARIANTS: Record<
  Variant,
  {
    matrix: string;
    stdPeak: number;
    blurHalf: number;
    fade: number;
    slide: { axis: "x" | "y"; amount: number; ease: string } | null;
    textA: string;
    textB: string;
  }
> = {
  morph: {
    matrix: "1 0 0 0 0  0 1 0 0 0  1 0 1 0 0  0 0 0 15 -8",
    stdPeak: 1,
    blurHalf: 0.8,
    fade: 1.6,
    slide: null,
    textA: "PIXEL",
    textB: "PERFECT",
  },
  "slide-x": {
    matrix: "1 0 0 0 0  0 1 0 0 0  1 0 1 0 0  0 0 0 16 -7",
    stdPeak: 1.5,
    blurHalf: 0.5,
    fade: 1,
    slide: { axis: "x", amount: 8, ease: "power2.inOut" },
    textA: "GIVE A",
    textB: "STAR ★",
  },
  "slide-y": {
    matrix: "1 0 0 0 0  0 1 0 0 0  1 0 1 0 0  0 0 0 18 -8",
    stdPeak: 1,
    blurHalf: 0.4,
    fade: 0.8,
    slide: { axis: "y", amount: -5, ease: "power1.inOut" },
    textA: "HOVER ME",
    textB: "★ STAR ★",
  },
};

const HOLD_MS = 900; // pause between loop morphs

interface GooeyTextProps {
  variant: Variant;
  textA?: string;
  textB?: string;
  className?: string;
}

export function GooeyText({ variant, textA, textB, className }: GooeyTextProps) {
  const cfg = VARIANTS[variant];
  const a = textA ?? cfg.textA;
  const b = textB ?? cfg.textB;

  // SVG filter ids must be document-unique; useId keeps multiple mounts apart.
  const filterId = `goo-${useId().replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const t1Ref = useRef<SVGTextElement>(null);
  const t2Ref = useRef<SVGTextElement>(null);
  const feRef = useRef<SVGFEGaussianBlurElement>(null);

  useGSAP(
    () => {
      const g = gRef.current;
      const t1 = t1Ref.current;
      const t2 = t2Ref.current;
      const fe = feRef.current;
      const host = containerRef.current;
      if (!g || !t1 || !t2 || !fe || !host) return;

      const prim = { stdDeviation: 0 };
      const applyFilter = () => {
        g.style.filter = `url(#${filterId})`;
      };
      const clearFilter = () => {
        g.style.filter = "none";
      };

      const tl = gsap.timeline({
        paused: true,
        onComplete: clearFilter,
        onReverseComplete: clearFilter,
        onUpdate: () =>
          fe.setAttribute("stdDeviation", String(prim.stdDeviation)),
      });

      tl.to(
        prim,
        {
          duration: cfg.blurHalf,
          ease: "none",
          startAt: { stdDeviation: 0 },
          stdDeviation: cfg.stdPeak,
        },
        0
      )
        .to(prim, { duration: cfg.blurHalf, ease: "none", stdDeviation: 0 })
        .to(t1, { duration: cfg.fade, ease: "none", opacity: 0 }, 0)
        .to(t2, { duration: cfg.fade, ease: "none", opacity: 1 }, 0);

      if (cfg.slide) {
        const ax = cfg.slide.axis;
        tl.to(
          t1,
          { duration: cfg.fade, ease: cfg.slide.ease, [ax]: cfg.slide.amount },
          0
        ).to(
          t2,
          {
            duration: cfg.fade,
            ease: cfg.slide.ease,
            startAt: { [ax]: -cfg.slide.amount },
            [ax]: 0,
          },
          0
        );
      }

      const playForward = () => {
        applyFilter();
        tl.play();
      };
      const playBack = () => {
        applyFilter();
        tl.reverse();
      };

      const onEnter = () => playForward();
      const onLeave = () => playBack();
      host.addEventListener("mouseenter", onEnter);
      host.addEventListener("mouseleave", onLeave);

      // Continuous loop: alternate forward/back morph with a hold between.
      let forward = true;
      const timers: number[] = [];
      const step = () => {
        if (forward) playForward();
        else playBack();
        forward = !forward;
        timers.push(window.setTimeout(step, cfg.fade * 1000 + HOLD_MS));
      };
      timers.push(window.setTimeout(step, HOLD_MS));

      return () => {
        timers.forEach((t) => clearTimeout(t));
        host.removeEventListener("mouseenter", onEnter);
        host.removeEventListener("mouseleave", onLeave);
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [variant, a, b, filterId] }
  );

  const textStyle: React.CSSProperties = {
    fill: "currentColor",
    fontWeight: 700,
    fontSize: "16px",
    fontFamily: "inherit",
    transformBox: "view-box",
    transformOrigin: "50% 50%",
  };

  return (
    <div ref={containerRef} className={`cursor-pointer ${className ?? ""}`}>
      <svg
        viewBox="0 0 140 28"
        preserveAspectRatio="xMidYMid meet"
        width={350}
        height={70}
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur
              ref={feRef}
              in="SourceGraphic"
              stdDeviation="0"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values={cfg.matrix}
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        <g ref={gRef}>
          <text
            ref={t1Ref}
            x="70"
            y="14"
            textAnchor="middle"
            dominantBaseline="central"
            style={textStyle}
          >
            {a}
          </text>
          <text
            ref={t2Ref}
            x="70"
            y="14"
            textAnchor="middle"
            dominantBaseline="central"
            opacity={0}
            style={textStyle}
          >
            {b}
          </text>
        </g>
      </svg>
    </div>
  );
}

export function GooeyMorph(props: Omit<GooeyTextProps, "variant">) {
  return <GooeyText variant="morph" {...props} />;
}

export function GooeySlideX(props: Omit<GooeyTextProps, "variant">) {
  return <GooeyText variant="slide-x" {...props} />;
}

export function GooeySlideY(props: Omit<GooeyTextProps, "variant">) {
  return <GooeyText variant="slide-y" {...props} />;
}

export default GooeyText;
