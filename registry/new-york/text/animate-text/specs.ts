/**
 * Generic-stagger specs ported verbatim from the `animate-text` catalog.
 *
 * enter/exit frames, target split, micro-delay and stagger mode are taken
 * directly from the catalog effect recipes. Shared runtime values follow the
 * website-default preset: speed 0.72, hold 550ms, gap 320ms, vertical travel
 * 0.58, initial delay 0–400ms.
 */

import type { AnimateTextSpec, Frame, Phase, StaggerFrom, Target } from "./engine";

type SpecInput = {
  id: string;
  display_name: string;
  description: string;
  target: Target;
  enter: Phase;
  exit: Phase;
  micro_delay_ms: number;
  default_stagger_from?: StaggerFrom;
  samples: string[];
};

const RUNTIME = {
  hold_ms: 550,
  gap_ms: 320,
  speed_multiplier: 0.72,
  y_travel_multiplier: 0.58,
  initial_delay_max_ms: 400,
};

function spec(input: SpecInput): AnimateTextSpec {
  return {
    default_stagger_from: "start",
    ...RUNTIME,
    ...input,
  };
}

const f = (frame: Frame) => frame;
const phase = (
  duration_ms: number,
  stagger_ms: number,
  easing: string,
  from: Frame,
  to: Frame
): Phase => ({ duration_ms, stagger_ms, easing, from, to });

export const ANIMATE_TEXT_SPECS: Record<string, AnimateTextSpec> = {
  "soft-blur-in": spec({
    id: "soft-blur-in",
    display_name: "Soft Blur",
    description:
      "Per-character fade-in with a gentle blur and upward motion. Apple's signature hero-title reveal.",
    target: "per-character",
    enter: phase(900, 25, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 16, blur_px: 12 }), f({ opacity: 1, y_px: 0, blur_px: 0 })),
    exit: phase(600, 15, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, blur_px: 0 }), f({ opacity: 0, y_px: -16, blur_px: 12 })),
    micro_delay_ms: 0,
    samples: ["Think different.", "Built to flow.", "Motion with intent."],
  }),

  "per-character-rise": spec({
    id: "per-character-rise",
    display_name: "Per-Character Rise",
    description:
      "Letters slide up from below with no blur — crisp, deliberate, kinetic. Apple's clean tvOS-style reveal.",
    target: "per-character",
    enter: phase(700, 24, "cubic-bezier(0.2, 0.8, 0.2, 1)", f({ opacity: 0, y_px: 32 }), f({ opacity: 1, y_px: 0 })),
    exit: phase(420, 14, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, y_px: 0 }), f({ opacity: 0, y_px: -24 })),
    micro_delay_ms: 0,
    samples: ["One more thing.", "Fast and fluid.", "Sharp by design."],
  }),

  "per-word-crossfade": spec({
    id: "per-word-crossfade",
    display_name: "Per-Word Crossfade",
    description:
      "Words gently fade into place one after another, with a short vertical drift for a calm keynote rhythm.",
    target: "per-word",
    enter: phase(700, 70, "cubic-bezier(0.16, 1, 0.3, 1)", f({ opacity: 0, y_px: 8 }), f({ opacity: 1, y_px: 0 })),
    exit: phase(500, 40, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, y_px: 0 }), f({ opacity: 0, y_px: -6 })),
    micro_delay_ms: 70,
    samples: ["Beautifully simple.", "Designed for focus.", "Built for people."],
  }),

  "spring-scale-in": spec({
    id: "spring-scale-in",
    display_name: "Spring Scale In",
    description:
      "Words pop in with a soft overshoot scale, like a physical spring settling into place.",
    target: "per-word",
    enter: phase(360, 95, "cubic-bezier(0.34, 1.56, 0.64, 1)", f({ opacity: 0, scale: 0.7 }), f({ opacity: 1, scale: 1 })),
    exit: phase(200, 80, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, scale: 1 }), f({ opacity: 0, scale: 0.8 })),
    micro_delay_ms: 35,
    samples: ["Fast. Crisp. Fluid.", "Pop into place.", "Smooth by default."],
  }),

  "mask-reveal-up": spec({
    id: "mask-reveal-up",
    display_name: "Mask Reveal Up",
    description: "Lines reveal upward with a soft masked feel and compact stagger.",
    target: "per-line",
    enter: phase(760, 90, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 30, blur_px: 6 }), f({ opacity: 1, y_px: 0, blur_px: 0 })),
    exit: phase(520, 70, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, blur_px: 0 }), f({ opacity: 0, y_px: -22, blur_px: 6 })),
    micro_delay_ms: 35,
    samples: [
      "Designed to move.\nBuilt to focus.",
      "Quiet motion.\nStrong hierarchy.",
      "Premium feel.\nEvery frame.",
    ],
  }),

  "line-by-line-slide": spec({
    id: "line-by-line-slide",
    display_name: "Line-by-Line Slide",
    description:
      "Each line enters from the left with a staggered slide and exits to the right for a flowing paragraph reveal.",
    target: "per-line",
    enter: phase(900, 120, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, x_px: -48 }), f({ opacity: 1, x_px: 0 })),
    exit: phase(600, 80, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, x_px: 0 }), f({ opacity: 0, x_px: 48 })),
    micro_delay_ms: 20,
    samples: [
      "Think different.\nDo more.",
      "Built for speed.\nMade to last.",
      "Clear ideas.\nClean motion.",
    ],
  }),

  typewriter: spec({
    id: "typewriter",
    display_name: "Typewriter",
    description: "Per-character stepped reveal with a minimal editorial typing rhythm.",
    target: "per-character",
    enter: phase(240, 46, "steps(1, end)", f({ opacity: 0, y_px: 0 }), f({ opacity: 1, y_px: 0 })),
    exit: phase(260, 10, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, y_px: 0 }), f({ opacity: 0, y_px: -4 })),
    micro_delay_ms: 85,
    samples: ["Precision in motion.", "Write. Pause. Continue."],
  }),

  "micro-scale-fade": spec({
    id: "micro-scale-fade",
    display_name: "Micro Scale Fade",
    description: "A calm, tiny scale pop used as subtle premium polish for labels and headings.",
    target: "whole",
    enter: phase(600, 0, "cubic-bezier(0.32, 0.72, 0, 1)", f({ opacity: 0, scale: 0.96 }), f({ opacity: 1, scale: 1 })),
    exit: phase(400, 0, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, scale: 1 }), f({ opacity: 0, scale: 0.96 })),
    micro_delay_ms: 20,
    samples: ["Welcome to motion.", "Small details matter.", "Quietly premium."],
  }),

  "shimmer-sweep": spec({
    id: "shimmer-sweep",
    display_name: "Shimmer Sweep",
    description: "A subtle sweep across a clean headline, blending in while gliding from left to center.",
    target: "whole",
    enter: phase(850, 0, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, x_px: -22, blur_px: 8 }), f({ opacity: 1, x_px: 0, blur_px: 0 })),
    exit: phase(650, 0, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, x_px: 0, blur_px: 0 }), f({ opacity: 0, x_px: 22, blur_px: 8 })),
    micro_delay_ms: 36,
    samples: ["Shiny details.", "Glide with intent.", "Soft and precise."],
  }),

  "fade-through": spec({
    id: "fade-through",
    display_name: "Fade Through",
    description: "A Material-style content transition: old fades out, new fades in with a soft delay.",
    target: "whole",
    enter: phase(420, 0, "cubic-bezier(0.2, 0, 0, 1)", f({ opacity: 0, y_px: 6, scale: 0.99, blur_px: 2 }), f({ opacity: 1, y_px: 0, scale: 1, blur_px: 0 })),
    exit: phase(260, 0, "cubic-bezier(0.4, 0, 1, 1)", f({ opacity: 1, y_px: 0, scale: 1, blur_px: 0 }), f({ opacity: 0, y_px: -4, scale: 1, blur_px: 0 })),
    micro_delay_ms: 60,
    samples: ["Calm transitions.", "Fade through content.", "Focus shifts smoothly."],
  }),

  "shared-axis-y": spec({
    id: "shared-axis-y",
    display_name: "Word Cut Staircase",
    description: "Per-word hard-cut transition with staircase timing for sharp editorial swaps.",
    target: "per-word",
    enter: phase(180, 78, "steps(1, end)", f({ opacity: 0, y_px: 0, scale: 1 }), f({ opacity: 1, y_px: 0, scale: 1 })),
    exit: phase(140, 78, "steps(1, end)", f({ opacity: 1, y_px: 0, scale: 1 }), f({ opacity: 0, y_px: 0, scale: 1 })),
    micro_delay_ms: 28,
    samples: ["Layered navigation.", "Hierarchy made clear.", "Depth with restraint."],
  }),

  "shared-axis-z": spec({
    id: "shared-axis-z",
    display_name: "Shared Axis Z",
    description: "Scale-based shared-axis transition for focus shifts and context depth.",
    target: "whole",
    enter: phase(520, 0, "cubic-bezier(0.2, 0, 0, 1)", f({ opacity: 0, scale: 0.9, blur_px: 2 }), f({ opacity: 1, scale: 1, blur_px: 0 })),
    exit: phase(360, 0, "cubic-bezier(0.4, 0, 1, 1)", f({ opacity: 1, scale: 1, blur_px: 0 }), f({ opacity: 0, scale: 1.06, blur_px: 1 })),
    micro_delay_ms: 20,
    samples: ["Zooming between states.", "Elevate and settle.", "Scale with purpose."],
  }),

  "blur-out-up": spec({
    id: "blur-out-up",
    display_name: "Blur Out Up",
    description: "Words arrive clean and depart upward with increasing blur for airy exits.",
    target: "per-word",
    enter: phase(560, 28, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 10, blur_px: 6 }), f({ opacity: 1, y_px: 0, blur_px: 0 })),
    exit: phase(480, 24, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, blur_px: 0 }), f({ opacity: 0, y_px: -14, blur_px: 8 })),
    micro_delay_ms: 35,
    samples: ["Clear in, airy out.", "Lightweight typography.", "Exit with grace."],
  }),

  "scale-down-fade": spec({
    id: "scale-down-fade",
    display_name: "Scale Down Fade",
    description: "Subtle premium settle-in with a restrained scale-down fade on exit.",
    target: "whole",
    enter: phase(520, 0, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 8, scale: 1.04 }), f({ opacity: 1, y_px: 0, scale: 1 })),
    exit: phase(380, 0, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, scale: 1 }), f({ opacity: 0, y_px: -8, scale: 0.94 })),
    micro_delay_ms: 20,
    samples: ["Quietly refined.", "Polished transitions.", "A soft close."],
  }),

  "focus-blur-resolve": spec({
    id: "focus-blur-resolve",
    display_name: "Focus Blur Resolve",
    description: "A premium focus pull from heavy blur to crisp text, then a soft blur-out exit.",
    target: "whole",
    enter: phase(760, 0, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 14, blur_px: 14, scale: 1.01 }), f({ opacity: 1, y_px: 0, blur_px: 0, scale: 1 })),
    exit: phase(520, 0, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, blur_px: 0, scale: 1 }), f({ opacity: 0, y_px: -10, blur_px: 10, scale: 1 })),
    micro_delay_ms: 35,
    samples: ["Focus resolves clearly.", "Detail emerges.", "Then softly recedes."],
  }),

  "bottom-up-letters": spec({
    id: "bottom-up-letters",
    display_name: "Bottom-Up Letters",
    description: "Letters rise from below in a pronounced staircase, one symbol at a time, with zero blur.",
    target: "per-character",
    enter: phase(400, 88, "cubic-bezier(0.18, 1, 0.32, 1)", f({ opacity: 0, y_px: 46 }), f({ opacity: 1, y_px: 0 })),
    exit: phase(280, 28, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, y_px: 0 }), f({ opacity: 0, y_px: -14 })),
    micro_delay_ms: 35,
    samples: ["Shift", "Stage", "Letter"],
  }),

  "top-down-letters": spec({
    id: "top-down-letters",
    display_name: "Top-Down Letters",
    description: "Letters descend from above in a pronounced staircase, one symbol at a time, with zero blur.",
    target: "per-character",
    enter: phase(400, 88, "cubic-bezier(0.18, 1, 0.32, 1)", f({ opacity: 0, y_px: -46 }), f({ opacity: 1, y_px: 0 })),
    exit: phase(280, 28, "cubic-bezier(0.7, 0, 0.84, 0)", f({ opacity: 1, y_px: 0 }), f({ opacity: 0, y_px: 14 })),
    micro_delay_ms: 35,
    samples: ["Signal", "Header", "Vector"],
  }),

  // --- Additional bundled specs (hidden on the website) ---

  "depth-parallax-words": spec({
    id: "depth-parallax-words",
    display_name: "Depth Parallax Words",
    description: "Per-word depth motion with scale and vertical drift for layered readability.",
    target: "per-word",
    enter: phase(700, 70, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 18, scale: 0.92, blur_px: 3 }), f({ opacity: 1, y_px: 0, scale: 1, blur_px: 0 })),
    exit: phase(500, 45, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, scale: 1, blur_px: 0 }), f({ opacity: 0, y_px: -10, scale: 1.05, blur_px: 2 })),
    micro_delay_ms: 35,
    samples: ["Layers in motion.", "Depth and drift.", "Read with rhythm."],
  }),

  "shared-axis-x": spec({
    id: "shared-axis-x",
    display_name: "Shared Axis X",
    description: "Horizontal shared-axis transition for sibling destinations with continuity.",
    target: "whole",
    enter: phase(500, 0, "cubic-bezier(0.2, 0, 0, 1)", f({ opacity: 0, x_px: 24, scale: 0.98 }), f({ opacity: 1, x_px: 0, scale: 1 })),
    exit: phase(360, 0, "cubic-bezier(0.4, 0, 1, 1)", f({ opacity: 1, x_px: 0, scale: 1 }), f({ opacity: 0, x_px: -20, scale: 0.98 })),
    micro_delay_ms: 20,
    samples: ["Slide across.", "Sibling views.", "Move sideways."],
  }),

  "stagger-from-center": spec({
    id: "stagger-from-center",
    display_name: "Stagger from Center",
    description: "Characters reveal from the center outward to emphasize the keyword core.",
    target: "per-character",
    default_stagger_from: "center",
    enter: phase(620, 22, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 12, blur_px: 3 }), f({ opacity: 1, y_px: 0, blur_px: 0 })),
    exit: phase(420, 16, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, blur_px: 0 }), f({ opacity: 0, y_px: -8, blur_px: 3 })),
    micro_delay_ms: 28,
    samples: ["From the center.", "Core outward.", "Keyword first."],
  }),

  "stagger-from-edges": spec({
    id: "stagger-from-edges",
    display_name: "Stagger from Edges",
    description: "Characters start from both edges and converge toward the center.",
    target: "per-character",
    default_stagger_from: "edges",
    enter: phase(620, 22, "cubic-bezier(0.22, 1, 0.36, 1)", f({ opacity: 0, y_px: 12, blur_px: 3 }), f({ opacity: 1, y_px: 0, blur_px: 0 })),
    exit: phase(420, 16, "cubic-bezier(0.64, 0, 0.78, 0)", f({ opacity: 1, y_px: 0, blur_px: 0 }), f({ opacity: 0, y_px: -8, blur_px: 3 })),
    micro_delay_ms: 28,
    samples: ["Edges inward.", "Meet at center.", "Converge clean."],
  }),
};

/** Catalog order — visible effects first, then hidden bundled specs. */
export const ANIMATE_TEXT_ORDER: string[] = [
  "soft-blur-in",
  "per-character-rise",
  "per-word-crossfade",
  "spring-scale-in",
  "mask-reveal-up",
  "line-by-line-slide",
  "typewriter",
  "micro-scale-fade",
  "shimmer-sweep",
  "fade-through",
  "shared-axis-y",
  "shared-axis-z",
  "blur-out-up",
  "scale-down-fade",
  "focus-blur-resolve",
  "bottom-up-letters",
  "top-down-letters",
  "depth-parallax-words",
  "shared-axis-x",
  "stagger-from-center",
  "stagger-from-edges",
];
