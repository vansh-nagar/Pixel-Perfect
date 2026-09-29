"use client";

/**
 * One face: a coloured circle with two glyph eyes that follow the cursor on a
 * spring and can play a CSS keyframe animation. Port of openai.com's
 * agent-animation component (DevDay 2026 recap). A face is plain data
 * (`FaceSpec`), so the six originals and the custom faces share this component.
 */

import { memo, useEffect, useId, useRef, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { EyeSvg, type EyeGlyph } from "./face-glyphs";
import styles from "./devday-agent.module.css";

export const AGENT_MODES = [
  "thinking",
  "designing",
  "building",
  "iterating",
  "testing",
  "shipping",
] as const;
export type AgentMode = (typeof AGENT_MODES)[number];

export type AgentAnimation =
  // from openai.com
  | "look-around"
  | "nod"
  | "hop"
  | "wiggle"
  | "spin"
  | "spin-in-out"
  | "roll-in-out"
  // study additions (custom faces)
  | "heartbeat"
  | "dizzy"
  | "sleepy"
  | "cry";

export type Glyph = {
  character: string;
  width?: number;
  height?: number;
  x: number;
  y: number;
  rotation?: number;
  flip?: boolean;
};

export type EyeSpec = Glyph & { character: EyeGlyph };

/** Everything that makes one face: colours, eyes, and optional accessories. */
export type FaceSpec = {
  color: string;
  eyeColor: string;
  /**
   * Eye glyphs and the "bespoke" pose (x, y, rotation inside the 100px circle)
   * they move to while an animation plays. At rest the eyes sit centred,
   * 50.0855px apart, 22.5px from the top.
   */
  eyes: [EyeSpec, EyeSpec];
  /** Punctuation "accessories" around the face (hidden unless showExtras). */
  expressions: Glyph[];
  /** Colour of the drop in the "cry" animation. */
  tearColor?: string;
};

const EMPTY: Glyph = { character: "", x: 50, y: 25 };

export const AGENT_STATES: Record<AgentMode, FaceSpec> = {
  thinking: {
    color: "#262626",
    eyeColor: "#ffffff",
    eyes: [
      { character: "^", width: 28.4086, x: -3.985, y: 2.6269, rotation: 10.01 },
      { character: "^", width: 28.4086, x: 45.6563, y: 11.3889, rotation: 10.01 },
    ],
    expressions: [{ character: "?", width: 23, x: -36, y: -7 }, EMPTY, EMPTY],
  },
  designing: {
    color: "#924ff7",
    eyeColor: "#000000",
    eyes: [
      { character: "o", width: 29.0994, x: 35.8738, y: 29.6908, rotation: 16.51 },
      { character: "o", width: 29.0994, x: 83.9074, y: 43.9281, rotation: 16.51 },
    ],
    expressions: [{ character: "!", width: 13, x: -34, y: -4 }, EMPTY, EMPTY],
  },
  building: {
    color: "#00ab44",
    eyeColor: "#000000",
    eyes: [
      { character: "+", width: 29.7902, x: 34.8731, y: 17.6424 },
      { character: "+", width: 29.7902, x: 84.6635, y: 17.6424 },
    ],
    expressions: [{ character: "</>", width: 66, x: 78, y: -29 }, EMPTY, EMPTY],
  },
  iterating: {
    color: "#006aff",
    eyeColor: "#000000",
    eyes: [
      { character: ">", width: 27.7178, x: 11.3444, y: 52.3339 },
      { character: "<", width: 27.7178, x: 61.5623, y: 52.3339 },
    ],
    expressions: [
      { character: ",", width: 12, x: -15, y: -16, flip: true },
      EMPTY,
      { character: ",", width: 12, x: 62, y: 69 },
    ],
  },
  testing: {
    color: "#f26d00",
    eyeColor: "#000000",
    eyes: [
      { character: "–", width: 28.4086, x: 29.2964, y: -26.7604, rotation: 39.28 },
      { character: "–", width: 28.4086, x: 67.9286, y: 4.8372, rotation: 39.28 },
    ],
    expressions: [{ character: "=3", width: 54, x: 93, y: 53 }, EMPTY, EMPTY],
  },
  shipping: {
    color: "#dfdfdf",
    eyeColor: "#000000",
    eyes: [
      { character: "*", width: 20.8098, x: 41.0758, y: 30.3835, rotation: -18.27 },
      { character: "*", width: 20.8098, x: 88.8167, y: 14.6224, rotation: -18.27 },
    ],
    expressions: [{ character: "<3", width: 50, x: 89, y: -14 }, EMPTY, EMPTY],
  },
};

/** Seconds per animation at speed 1. */
export const AGENT_DURATIONS: Record<AgentAnimation, number> = {
  "look-around": 3.6,
  nod: 2,
  hop: 2.2,
  wiggle: 2.2,
  spin: 2.8,
  "spin-in-out": 3.2,
  "roll-in-out": 3.25,
  // Study additions: same duration family as the originals.
  heartbeat: 2.2,
  dizzy: 2.8,
  sleepy: 3.6,
  cry: 3.2,
};

/**
 * Eye positions. "cursor" = the resting pose: both eyes centred on the face,
 * 50.0855px apart, 22.5px from the top. "bespoke" = the face's own pose.
 */
function getAgentEyes(face: FaceSpec, positioning: "cursor" | "bespoke") {
  return face.eyes.map((eye, index) => ({
    ...eye,
    height: 55,
    ...(positioning === "cursor"
      ? {
          x: 50 + ((index === 0 ? -1 : 1) * 50.0855) / 2 - (eye.width ?? 28) / 2,
          y: 22.5,
          rotation: 0,
        }
      : {}),
  }));
}

const Circle = memo(function Circle({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 size-full"
      viewBox="0 0 100 100"
    >
      <circle cx="50" cy="50" r="50" fill={color} />
    </svg>
  );
});

/** Optional timing overrides for the in/out animations (seconds). */
export type AgentTimeline = {
  duration?: number;
  scale: {
    start?: number;
    peak?: number;
    end?: number;
    small?: number;
    large?: number;
    enter?: number[];
    exit?: number[];
  };
  rollIn: { start?: number; end?: number; easing?: number[] };
  rollOut: { start?: number; end?: number; easing?: number[] };
  gazeIn: { start?: number; end?: number; easing?: number[] };
  gaze: { start?: number; end?: number; easing?: number[] };
  accessoriesIn: { start?: number; end?: number };
  accessoriesOut: { start?: number; end?: number };
};

type ResolvedTimeline = ReturnType<typeof resolveTimeline>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const finite = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? (value as number) : fallback;
const bezier = (value: number[] | undefined, fallback: number[]) =>
  fallback.map((f, i) => clamp(finite(value?.[i], f), 0, 1));

/** Clamps every stop so the generated keyframes are always well ordered. */
function resolveTimeline(t: AgentTimeline) {
  const duration = clamp(finite(t.duration, AGENT_DURATIONS["roll-in-out"]), 0.5, 10);
  const scaleStart = clamp(finite(t.scale.start, 0), 0, duration - 0.1);
  const scaleEnd = clamp(finite(t.scale.end, duration), scaleStart + 0.1, duration);
  const scalePeak = clamp(finite(t.scale.peak, duration / 2), scaleStart + 0.05, scaleEnd - 0.05);
  const rollInStart = clamp(finite(t.rollIn.start, 0), 0, duration - 0.1);
  const rollInEnd = clamp(finite(t.rollIn.end, duration / 2), rollInStart + 0.05, duration - 0.05);
  const rollOutStart = clamp(finite(t.rollOut.start, rollInEnd), rollInEnd, duration - 0.05);
  const gazeInStart = clamp(finite(t.gazeIn.start, 0), 0, duration - 0.1);
  const gazeInEnd = clamp(finite(t.gazeIn.end, duration / 2), gazeInStart + 0.05, duration - 0.05);
  const gazeStart = clamp(finite(t.gaze.start, gazeInEnd), gazeInEnd, duration - 0.05);
  const gazeEnd = clamp(finite(t.gaze.end, gazeStart + 0.05), gazeStart + 0.05, duration);
  const accInStart = clamp(finite(t.accessoriesIn.start, 0.18 * duration), 0, duration - 0.1);
  const accInEnd = clamp(finite(t.accessoriesIn.end, 0.42 * duration), accInStart + 0.05, duration - 0.05);
  const accOutStart = clamp(finite(t.accessoriesOut.start, 0.8 * duration), accInEnd, duration - 0.05);
  const small = clamp(finite(t.scale.small, 0.22), 0.05, 0.9);
  return {
    duration,
    scale: {
      start: scaleStart,
      peak: scalePeak,
      end: scaleEnd,
      small,
      large: clamp(finite(t.scale.large, 1.12), small + 0.1, 1.6),
      enter: bezier(t.scale.enter, [0.5, 1, 0.5, 1]),
      exit: bezier(t.scale.exit, [0.5, 0, 0.5, 0]),
    },
    rollIn: { start: rollInStart, end: rollInEnd, easing: bezier(t.rollIn.easing, [0.5, 1, 0.5, 1]) },
    rollOut: {
      start: rollOutStart,
      end: clamp(finite(t.rollOut.end, duration), rollOutStart + 0.05, duration),
      easing: bezier(t.rollOut.easing, [0.33, 0, 0.67, 0.33]),
    },
    gazeIn: { start: gazeInStart, end: gazeInEnd, easing: bezier(t.gazeIn.easing, [0.5, 1, 0.5, 1]) },
    gaze: { start: gazeStart, end: gazeEnd, easing: bezier(t.gaze.easing, [0.45, 0, 0.55, 1]) },
    accessoriesIn: { start: accInStart, end: accInEnd },
    accessoriesOut: {
      start: accOutStart,
      end: clamp(finite(t.accessoriesOut.end, 0.94 * duration), accOutStart + 0.05, duration),
    },
  };
}

/** The built-in roll-in/out timing (3.25s), as authored on openai.com. */
function defaultRollTimeline(duration: number): AgentTimeline {
  return {
    duration,
    scale: {
      start: 0,
      peak: 1.625,
      end: 3.25,
      small: 0.22,
      large: 1.12,
      enter: [0.2925636574074074, 0.9343100189035917, 0.5390914351851852, 1],
      exit: [0.5, 0, 0.8095486111111111, 0.20652173913043478],
    },
    rollIn: { start: 0, end: 1.0458342837591241, easing: [0.5, 1, 0.5, 1] },
    rollOut: { start: 2.6000000000000005, end: 3.25, easing: [0.33, 0, 0.67, 0.33] },
    gazeIn: { start: 0, end: 1.1653740875912408, easing: [0.5, 1, 0.5, 1] },
    gaze: { start: 1.1653740875912408, end: 2.3400000000000003, easing: [0.45, 0, 0.55, 1] },
    accessoriesIn: { start: 0.38326499771898004, end: 0.6730128022354006 },
    accessoriesOut: { start: 2.605374657846716, end: 2.8839839473083937 },
  };
}

/** Keyframes for a custom in/out timeline, named `${id}-scale`, `${id}-eyes`, ... */
function timelineKeyframes(id: string, timeline: AgentTimeline) {
  const { duration, scale, rollIn, rollOut, gazeIn, gaze } = resolveTimeline(timeline);
  const ease = (b: number[]) => `cubic-bezier(${b.join(",")})`;
  const block = (name: string, stops: [number, string][]) => {
    const merged = new Map<number, string>();
    for (const [time, css] of stops) merged.set(time, `${merged.get(time) ?? ""}${css}`);
    return `@keyframes ${id}-${name}{${[...merged]
      .sort(([a], [b]) => a - b)
      .map(([time, css]) => `${Number(((time / duration) * 100).toFixed(5))}%{${css}}`)
      .join("")}}`;
  };
  return [
    block("scale", [
      [0, `transform:scale(${scale.small});`],
      [scale.start, `transform:scale(${scale.small});animation-timing-function:${ease(scale.enter)};`],
      [scale.peak, `transform:scale(${scale.large});animation-timing-function:${ease(scale.exit)};`],
      [scale.end, `transform:scale(${scale.small});`],
      [duration, `transform:scale(${scale.small});`],
    ]),
    block("visibility", [
      [0, "visibility:hidden;"],
      [scale.start + Math.min(0.02 * duration, (scale.peak - scale.start) / 4), "visibility:visible;"],
      [scale.end - Math.min(0.02 * duration, (scale.end - scale.peak) / 4), "visibility:hidden;"],
      [duration, "visibility:hidden;"],
    ]),
    block("eyes", [
      [0, "transform:translateY(0);"],
      [rollIn.start, `transform:translateY(0);animation-timing-function:${ease(rollIn.easing)};`],
      [rollIn.end, "transform:translateY(-100px);"],
      [rollOut.start, `transform:translateY(-100px);animation-timing-function:${ease(rollOut.easing)};`],
      [rollOut.end, "transform:translateY(-200px);"],
      [duration, "transform:translateY(-200px);"],
    ]),
    block("gaze", [
      [0, "transform:translate(0,38px);"],
      [gazeIn.start, `transform:translate(0,38px);animation-timing-function:${ease(gazeIn.easing)};`],
      [gazeIn.end, "transform:translate(6px,8px);"],
      [gaze.start, `transform:translate(6px,8px);animation-timing-function:${ease(gaze.easing)};`],
      [gaze.end, "transform:translate(-6px,4px);"],
      [duration, "transform:translate(-6px,4px);"],
    ]),
    block("spin", [
      [0, "transform:rotate(-180deg);"],
      [scale.start, "transform:rotate(-180deg);animation-timing-function:cubic-bezier(.25,.7,.5,.8);"],
      [scale.peak, "transform:rotate(0deg);animation-timing-function:cubic-bezier(.5,.2,.75,.3);"],
      [scale.end, "transform:rotate(180deg);"],
      [duration, "transform:rotate(180deg);"],
    ]),
  ].join("\n");
}

/**
 * Accessory characters ("</>", "=3", ...) fade in one by one, left to right,
 * and out in reverse. Each character gets a step-end opacity keyframe.
 */
function accessoryKeyframes(id: string, timeline: ResolvedTimeline, count: number) {
  const { duration, accessoriesIn, accessoriesOut } = timeline;
  const pct = (time: number) => Number(((time / duration) * 100).toFixed(5));
  return Array.from({ length: count }, (_, index) => {
    const f = count === 1 ? 0.5 : index / (count - 1);
    const on = accessoriesIn.start + (accessoriesIn.end - accessoriesIn.start) * f;
    const off = accessoriesOut.start + (accessoriesOut.end - accessoriesOut.start) * (1 - f);
    return `@keyframes ${id}-accessory-${index}{0%{opacity:0}${pct(on)}%{opacity:1}${pct(off)}%{opacity:0}100%{opacity:0}}`;
  }).join("\n");
}

function GlyphSpan({
  glyph,
  restingGlyph,
  accessoryAnimation,
  characterOffset = 0,
}: {
  glyph: Glyph;
  restingGlyph?: Glyph;
  accessoryAnimation?: string;
  characterOffset?: number;
}) {
  const rest = restingGlyph;
  return (
    <span
      className={rest ? `${styles.glyph} ${styles.eyePose}` : styles.glyph}
      data-agent-eye={rest ? "true" : undefined}
      style={
        {
          left: rest ? 0 : glyph.x,
          top: rest ? 0 : glyph.y,
          width: glyph.width ?? 28,
          height: glyph.height ?? 54,
          rotate: !rest && glyph.rotation ? `${glyph.rotation}deg` : undefined,
          transform: glyph.flip ? "scaleX(-1)" : undefined,
          ...(rest
            ? {
                "--agent-eye-rest": `translate(${rest.x}px, ${rest.y}px) rotate(0deg)`,
                "--agent-eye-core": `translate(${glyph.x}px, ${glyph.y}px) rotate(${glyph.rotation ?? 0}deg)`,
              }
            : {}),
        } as CSSProperties
      }
    >
      {rest ? (
        <EyeSvg character={glyph.character as EyeGlyph} width={glyph.width ?? 28} />
      ) : accessoryAnimation ? (
        <span>
          {Array.from(glyph.character, (char, index) => (
            <span
              key={index}
              className={styles.accessoryCharacter}
              style={
                {
                  "--agent-accessory-animation": `${accessoryAnimation}-accessory-${characterOffset + index}`,
                } as CSSProperties
              }
            >
              {char}
            </span>
          ))}
        </span>
      ) : (
        glyph.character
      )}
    </span>
  );
}

/** Spring the eyes use to chase the cursor. */
const GAZE_SPRING = { stiffness: 140, damping: 24, mass: 0.55 };

/**
 * Cursor gaze. The target is 20% of the pointer's offset from the face
 * centre (90,82 in the 190x166 canvas), clamped to a 12px radius. Two springs
 * chase the target; the rendered transform re-clamps to 12px and tilts the
 * eyes up to 6deg in the direction of horizontal travel.
 */
function useCursorGaze(enabled: boolean, track: boolean, headTilt: number) {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, GAZE_SPRING);
  const y = useSpring(targetY, GAZE_SPRING);
  const transform = useTransform(() => {
    const gx = x.get();
    const gy = y.get();
    const k = Math.min(1, 12 / (Math.hypot(gx, gy) || 1));
    return `translate(${gx * k}px, ${gy * k}px) rotate(${((gx * k) / 12) * 6}deg)`;
  });

  useEffect(() => {
    let raf = 0;
    if (!enabled) {
      pointer.current = null;
      targetX.jump(0);
      targetY.jump(0);
      x.jump(0);
      y.jump(0);
      return;
    }
    const update = () => {
      raf = 0;
      const p = pointer.current;
      const rect = ref.current?.getBoundingClientRect();
      if (!track || !p || !rect?.width) {
        targetX.set(0);
        targetY.set(0);
        return;
      }
      const s = rect.width / 190;
      const dx = ((p.x - rect.left - 90 * s) * 0.2) / s;
      const dy = ((p.y - rect.top - 82 * s) * 0.2) / s;
      const k = Math.min(1, 12 / (Math.hypot(dx, dy) || 1));
      const tilt = ((Number.isFinite(headTilt) ? headTilt : 0) * Math.PI) / 180;
      targetX.set((dx * Math.cos(tilt) + dy * Math.sin(tilt)) * k);
      targetY.set((-dx * Math.sin(tilt) + dy * Math.cos(tilt)) * k);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.current = { x: event.clientX, y: event.clientY };
      schedule();
    };
    update();
    const resizeObserver = new ResizeObserver(schedule);
    if (ref.current) resizeObserver.observe(ref.current);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, track, headTilt, targetX, targetY, x, y]);

  return { ref, transform };
}

export type DevdayAgentProps = {
  /** Label written to data-mode; also picks a built-in face when `face` is omitted. */
  mode?: string;
  face?: FaceSpec;
  animation?: AgentAnimation;
  animationEnabled?: boolean;
  mouseControl?: boolean;
  playing?: boolean;
  loop?: boolean;
  showExtras?: boolean;
  speed?: number;
  replayKey?: number;
  size?: number;
  headTilt?: number;
  timeline?: AgentTimeline;
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
};

export function DevdayAgent({
  mode = "thinking",
  face,
  animation = "look-around",
  animationEnabled = false,
  mouseControl = true,
  playing = true,
  loop = false,
  showExtras = true,
  speed = 1,
  replayKey = 0,
  size = 100,
  headTilt = 0,
  timeline,
  onComplete,
  className,
  style,
}: DevdayAgentProps) {
  const state = face ?? AGENT_STATES[mode as AgentMode] ?? AGENT_STATES.thinking;
  const bespokeEyes = getAgentEyes(state, "bespoke");
  const restingEyes = getAgentEyes(state, "cursor");
  const scale = size / 100;
  // While an animation plays the gaze target is pinned to the centre.
  const { ref, transform } = useCursorGaze(mouseControl, !animationEnabled, headTilt);
  const rate = Number.isFinite(speed) && speed > 0 ? speed : 1;
  const id = `agent-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const inOut = animation === "roll-in-out" || animation === "spin-in-out";
  const custom = timeline && inOut ? resolveTimeline(timeline) : undefined;
  // Accessory keyframes exist only for roll-in-out (custom or built-in timing).
  const rollTiming =
    animation === "roll-in-out"
      ? (custom ?? resolveTimeline(defaultRollTimeline(AGENT_DURATIONS["roll-in-out"])))
      : undefined;
  const accessoryCount = state.expressions.reduce(
    (sum, glyph) => sum + Array.from(glyph.character).length,
    0,
  );
  const duration = custom?.duration ?? AGENT_DURATIONS[animation];
  const eyeCopies = animationEnabled && animation === "roll-in-out" ? [0, 1] : [0];

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || loop) return;
    onComplete?.();
  };

  return (
    <div
      className={className ? `${styles.agent} ${className}` : styles.agent}
      ref={ref}
      data-agent-animation={animationEnabled ? animation : undefined}
      data-mouse-control={mouseControl || undefined}
      data-custom-timeline={custom ? "true" : undefined}
      data-mode={mode}
      data-eye-positioning={animationEnabled ? "animated" : "cursor"}
      data-playing={playing}
      role="img"
      style={{ width: 190 * scale, height: 166 * scale, ...style }}
    >
      {(custom || rollTiming) && (
        <style>
          {[
            custom && timeline ? timelineKeyframes(id, timeline) : "",
            rollTiming ? accessoryKeyframes(id, rollTiming, accessoryCount) : "",
          ].join("\n")}
        </style>
      )}
      <div className={styles.canvas} style={{ transform: `scale(${scale})` }}>
        {/* Keyed so every new animation remounts the tree and restarts the CSS keyframes. */}
        <div
          key={`${mode}:${animation}:${animationEnabled}:${rate}:${loop}:${replayKey}`}
          aria-hidden="true"
          className={styles.presence}
          style={
            {
              "--agent-duration": `${duration / rate}s`,
              "--agent-iterations": loop ? "infinite" : 1,
              "--agent-play-state": playing ? "running" : "paused",
              ...(custom
                ? {
                    "--agent-in-out-scale": `${id}-scale`,
                    "--agent-in-out-visibility": `${id}-visibility`,
                    "--agent-in-out-spin": `${id}-spin`,
                    "--agent-roll-eyes": `${id}-eyes`,
                    "--agent-roll-gaze": `${id}-gaze`,
                  }
                : {}),
            } as CSSProperties
          }
        >
          <div
            className={
              animationEnabled ? `${styles.actor} ${styles[animation]}` : styles.actor
            }
            onAnimationEnd={handleAnimationEnd}
          >
            <div
              className={styles.head}
              style={{
                rotate:
                  Number.isFinite(headTilt) && headTilt !== 0 ? `${headTilt}deg` : undefined,
              }}
              onAnimationEnd={handleAnimationEnd}
            >
              <div className={styles.circle} style={{ color: state.eyeColor }}>
                <Circle color={state.color} />
                <div className={styles.gaze}>
                  <motion.div className={styles.cursorGaze} style={{ transform }}>
                    <div className={styles.eyes}>
                      {eyeCopies.map((copy) => (
                        <div
                          key={copy}
                          className={styles.eyeCopy}
                          style={{ translate: `0 ${100 * copy}px` }}
                        >
                          {bespokeEyes.map((eye, index) => (
                            <GlyphSpan key={index} glyph={eye} restingGlyph={restingEyes[index]} />
                          ))}
                        </div>
                      ))}
                      {animationEnabled && animation === "cry" && (
                        <span
                          className={styles.tear}
                          style={{
                            left: restingEyes[0].x + (restingEyes[0].width ?? 28) / 2 - 4,
                            color: state.tearColor ?? "#7cc8ff",
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
            <div
              className={styles.expressions}
              style={{
                color: state.eyeColor === "#ffffff" ? "#ffffff" : state.color,
                visibility: showExtras ? undefined : "hidden",
              }}
            >
              {state.expressions.map((glyph, index) =>
                glyph.character ? (
                  <GlyphSpan
                    key={index}
                    glyph={{ ...glyph, x: glyph.x + 40, y: glyph.y + 32 }}
                    accessoryAnimation={animationEnabled && rollTiming ? id : undefined}
                    characterOffset={state.expressions
                      .slice(0, index)
                      .reduce((sum, g) => sum + Array.from(g.character).length, 0)}
                  />
                ) : null,
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
