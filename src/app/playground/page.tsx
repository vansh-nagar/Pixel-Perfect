"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
  type HTMLMotionProps,
} from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Charge Button — hold to confirm                                     */
/* ------------------------------------------------------------------ */

/**
 * A hold-to-confirm charge button — a lime fill sweeps across while held,
 * springs back with an elastic drain on early release, and pops into a
 * confirmed state at 100%.
 */

interface ChargeButtonProps extends HTMLMotionProps<"button"> {
  label?: string;
  confirmedLabel?: string;
  holdMs?: number;
  onConfirm?: () => void;
}

const swapMotion = {
  initial: { y: 12, opacity: 0, filter: "blur(3px)" },
  animate: { y: 0, opacity: 1, filter: "blur(0px)" },
  exit: { y: -12, opacity: 0, filter: "blur(3px)" },
  transition: { duration: 0.16 },
};

const ChargeButton = React.forwardRef<HTMLButtonElement, ChargeButtonProps>(
  (
    {
      className,
      style,
      type,
      label = "Hold to confirm",
      confirmedLabel = "Confirmed",
      holdMs = 1100,
      onConfirm,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [state, setState] = useState<"idle" | "charging" | "charged">("idle");
    const progress = useMotionValue(0);
    const animRef = useRef<AnimationPlaybackControls | null>(null);
    const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fill is a pill-shaped clip growing left → right; spring overshoot below 0 is clamped here.
    const clip = useTransform(progress, (v) => {
      const p = Math.min(Math.max(v, 0), 1);
      return `inset(0 ${(1 - p) * 100}% 0 0 round 9999px)`;
    });

    // Raised rim material + a lime glow that scales with charge.
    const boxShadow = useTransform(progress, (v) => {
      const p = Math.min(Math.max(v, 0), 1);
      return [
        "0 1px 2px rgba(0,0,0,0.6)",
        "0 8px 20px -8px rgba(0,0,0,0.7)",
        "0 18px 40px -16px rgba(0,0,0,0.55)",
        "inset 0 1px 0 rgba(255,255,255,0.16)",
        "inset 0 -1px 1px rgba(0,0,0,0.6)",
        `0 0 ${28 * p}px ${6 * p}px rgba(163,230,53,${0.35 * p})`,
        `0 0 ${70 * p}px ${14 * p}px rgba(163,230,53,${0.15 * p})`,
      ].join(", ");
    });

    const complete = () => {
      setState("charged");
      onConfirm?.();
      resetRef.current = setTimeout(() => {
        setState("idle");
        animRef.current = animate(progress, 0, {
          type: "spring",
          stiffness: 170,
          damping: 26,
        });
      }, 1500);
    };

    const startCharge = () => {
      if (disabled || state === "charged") return;
      setState("charging");
      animRef.current?.stop();
      // Resume from wherever a previous drain left off — interruptible.
      const remaining = ((1 - progress.get()) * holdMs) / 1000;
      animRef.current = animate(progress, 1, {
        duration: Math.max(remaining, 0.05),
        ease: [0.3, 0, 0.7, 1],
      });
      animRef.current.finished.then(() => {
        if (progress.get() > 0.995) complete();
      });
    };

    const release = () => {
      if (state !== "charging") return;
      if (progress.get() > 0.995) return; // completion handler owns it now
      animRef.current?.stop();
      setState("idle");
      animRef.current = animate(progress, 0, {
        type: "spring",
        stiffness: 340,
        damping: 17,
        mass: 0.8,
      });
    };

    useEffect(
      () => () => {
        animRef.current?.stop();
        if (resetRef.current) clearTimeout(resetRef.current);
      },
      [],
    );

    const labelSwap = (charged: boolean) => (
      <AnimatePresence mode="wait" initial={false}>
        {charged ? (
          <motion.span
            key="charged"
            className="flex items-center gap-1.5"
            {...swapMotion}
          >
            <Check className="size-4" strokeWidth={3} />
            {confirmedLabel}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            className="flex items-center gap-1.5"
            {...swapMotion}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    );

    return (
      <motion.button
        ref={ref}
        type={type ?? "button"}
        disabled={disabled}
        onPointerDown={(e) => {
          startCharge();
          onPointerDown?.(e);
        }}
        onPointerUp={(e) => {
          release();
          onPointerUp?.(e);
        }}
        onPointerLeave={(e) => {
          release();
          onPointerLeave?.(e);
        }}
        onPointerCancel={(e) => {
          release();
          onPointerCancel?.(e);
        }}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) startCharge();
          onKeyDown?.(e);
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") release();
          onKeyUp?.(e);
        }}
        animate={
          state === "charging"
            ? { scale: 0.97 }
            : state === "charged"
              ? { scale: [0.97, 1.05, 1] }
              : { scale: 1 }
        }
        transition={
          state === "charged"
            ? { duration: 0.5, times: [0, 0.35, 1], ease: "easeOut" }
            : state === "charging"
              ? { duration: 0.2, ease: "easeOut" }
              : { type: "spring", stiffness: 320, damping: 20 }
        }
        className={cn(
          "relative cursor-pointer rounded-full p-1 text-sm font-semibold tracking-wide text-zinc-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-lime-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        style={{
          background: "linear-gradient(180deg, #3b3b44, #1a1a1f)",
          boxShadow,
          touchAction: "none",
          ...style,
        }}
        {...props}
      >
        {/* Recessed track — the liquid fills a groove, not the whole face */}
        <span
          className="relative block overflow-hidden rounded-full px-6 py-2.5"
          style={{
            background: "linear-gradient(180deg, #0c0c0f, #19191d)",
            boxShadow:
              "inset 0 2px 5px rgba(0,0,0,0.85), inset 0 1px 2px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <span
            className="relative z-1 flex items-center justify-center whitespace-nowrap"
            style={{ textShadow: "0 1px 1px rgba(0,0,0,0.6)" }}
          >
            {labelSwap(state === "charged")}
          </span>
          {/* Duplicate face clipped to the fill — text inverts exactly at the liquid edge */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-2 grid place-items-center whitespace-nowrap text-black"
            style={{
              clipPath: clip,
              background:
                "linear-gradient(180deg, #e9ff8a 0%, #b5f04a 55%, #8fd42a 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 8px rgba(0,0,0,0.18)",
            }}
          >
            {labelSwap(state === "charged")}
          </motion.span>
        </span>
      </motion.button>
    );
  },
);

ChargeButton.displayName = "ChargeButton";

/* ------------------------------------------------------------------ */
/* Slot Button — the label spins like slot-machine reels on hover      */
/* ------------------------------------------------------------------ */

/**
 * A slot-machine button — every character of the label rolls vertically
 * through random glyphs and lands back in place, staggered left to right,
 * on each hover.
 */

const SLOT_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";

const randomGlyph = () =>
  SLOT_GLYPHS[Math.floor(Math.random() * SLOT_GLYPHS.length)];

const SlotChar = ({
  char,
  strip,
  spin,
  index,
}: {
  char: string;
  strip: string[];
  spin: number;
  index: number;
}) => {
  if (char === " ") return <span className="inline-block w-[1ch]" />;

  return (
    <span className="inline-block h-[1.25em] overflow-hidden align-bottom">
      <motion.span
        key={spin}
        className="flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: `${-(strip.length - 1) * 1.25}em` }}
        transition={{
          duration: 0.5,
          delay: index * 0.04,
          ease: [0.2, 0.85, 0.25, 1],
        }}
      >
        {strip.map((glyph, gi) => (
          <span
            key={gi}
            className="flex h-[1.25em] items-center justify-center"
          >
            {glyph}
          </span>
        ))}
      </motion.span>
    </span>
  );
};

interface SlotButtonProps extends HTMLMotionProps<"button"> {
  label?: string;
}

const SlotButton = React.forwardRef<HTMLButtonElement, SlotButtonProps>(
  (
    { className, style, type, label = "Try your luck", onHoverStart, ...props },
    ref,
  ) => {
    const [roll, setRoll] = useState<{ spin: number; strips: string[][] }>({
      spin: 0,
      strips: [],
    });

    return (
      <motion.button
        ref={ref}
        type={type ?? "button"}
        onHoverStart={(event, info) => {
          // Glyphs are rolled here, in the event, so render stays pure.
          const strips = label
            .split("")
            .map((char) =>
              char === " "
                ? [char]
                : [char, randomGlyph(), randomGlyph(), randomGlyph(), char],
            );
          setRoll((r) => ({ spin: r.spin + 1, strips }));
          onHoverStart?.(event, info);
        }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "relative cursor-pointer rounded-xl px-6 py-3.5 font-mono text-sm font-semibold tracking-[0.15em] text-amber-200 uppercase select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          className,
        )}
        style={{
          background: "linear-gradient(180deg, #2c2416, #191308)",
          boxShadow: [
            "0 1px 2px rgba(0,0,0,0.5)",
            "0 8px 20px -8px rgba(0,0,0,0.6)",
            "0 0 0 1px rgba(251,191,36,0.16)",
            "inset 0 1px 0 rgba(251,191,36,0.12)",
            "inset 0 -2px 6px rgba(0,0,0,0.5)",
          ].join(", "),
          textShadow: "0 1px 1px rgba(0,0,0,0.6)",
          ...style,
        }}
        {...props}
      >
        <span className="flex whitespace-nowrap">
          {label.split("").map((char, i) => (
            <SlotChar
              key={i}
              char={char}
              strip={roll.strips[i] ?? [char]}
              spin={roll.spin}
              index={i}
            />
          ))}
        </span>
      </motion.button>
    );
  },
);

SlotButton.displayName = "SlotButton";

/* ------------------------------------------------------------------ */
/* Sticker Button — the corner peels up on hover, further on press     */
/* ------------------------------------------------------------------ */

/**
 * A die-cut sticker button — the top-right corner curls up on hover and
 * peels further while pressed, revealing the paper backing, with the
 * flap's shadow falling on the sticker face.
 */

interface StickerButtonProps extends HTMLMotionProps<"button"> {
  label?: string;
}

const REST_PEEL = 10;
const HOVER_PEEL = 22;
const PRESS_PEEL = 40;

const StickerButton = React.forwardRef<HTMLButtonElement, StickerButtonProps>(
  (
    {
      className,
      style,
      type,
      label = "Peel me",
      onHoverStart,
      onHoverEnd,
      onTapStart,
      onTap,
      onTapCancel,
      ...props
    },
    ref,
  ) => {
    const [hovering, setHovering] = useState(false);
    const peel = useSpring(REST_PEEL, { stiffness: 320, damping: 24 });

    const faceClip = useTransform(
      peel,
      (p) =>
        `polygon(0 0, calc(100% - ${p}px) 0, 100% ${p}px, 100% 100%, 0 100%)`,
    );
    const foldSize = useTransform(peel, (p) => `${Math.max(p, 0)}px`);
    const foldOpacity = useTransform(peel, (p) => (p > 0.5 ? 1 : 0));

    return (
      <motion.button
        ref={ref}
        type={type ?? "button"}
        onHoverStart={(event, info) => {
          setHovering(true);
          peel.set(HOVER_PEEL);
          onHoverStart?.(event, info);
        }}
        onHoverEnd={(event, info) => {
          setHovering(false);
          peel.set(REST_PEEL);
          onHoverEnd?.(event, info);
        }}
        onTapStart={(event, info) => {
          peel.set(PRESS_PEEL);
          onTapStart?.(event, info);
        }}
        onTap={(event, info) => {
          peel.set(hovering ? HOVER_PEEL : REST_PEEL);
          onTap?.(event, info);
        }}
        onTapCancel={(event, info) => {
          peel.set(hovering ? HOVER_PEEL : REST_PEEL);
          onTapCancel?.(event, info);
        }}
        initial={false}
        animate={{ rotate: hovering ? 0 : -3 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-pink-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          className,
        )}
        style={{
          boxShadow:
            "0 10px 24px -10px rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.35)",
          borderRadius: 16,
          ...style,
        }}
        {...props}
      >
        {/* Sticker face — the corner is cut away as the flap lifts */}
        <motion.span
          className="relative flex items-center justify-center rounded-2xl border-3 border-white px-7 py-3.5 text-sm font-bold tracking-wide whitespace-nowrap text-white"
          style={{
            clipPath: faceClip,
            background:
              "radial-gradient(120% 140% at 20% 0%, #ffb35c 0%, #ff7a45 45%, #ff4d6d 100%)",
            textShadow: "0 1px 1px rgba(0,0,0,0.25)",
          }}
        >
          {/* Gloss sheen — clipped with the face so it folds away with the corner */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background:
                "linear-gradient(115deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 35%, transparent 60%)",
            }}
          />
          <span className="relative">{label}</span>
        </motion.span>
        {/* Folded-back corner: parent carries the drop-shadow so it survives the clip */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute top-0 right-0"
          style={{
            width: foldSize,
            height: foldSize,
            opacity: foldOpacity,
            filter: "drop-shadow(-4px 5px 4px rgba(0,0,0,0.35))",
          }}
        >
          <span
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0 0, 100% 100%, 0 100%)",
              background:
                "linear-gradient(225deg, #ffffff 10%, #e6e6e6 55%, #c4c4c4 100%)",
            }}
          />
        </motion.span>
      </motion.button>
    );
  },
);

StickerButton.displayName = "StickerButton";

/* ------------------------------------------------------------------ */
/* Compass Button — the needle always points at your cursor            */
/* ------------------------------------------------------------------ */

/**
 * A compass button — a springy needle in a recessed well tracks the cursor
 * anywhere on the page; clicking sends it on a full 360° spin.
 */

const CompassButton = ({
  label = "True north",
  className,
  style,
  onClick,
  type,
  ...props
}: { label?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const target = useRef(0);
  const rotate = useSpring(0, { stiffness: 140, damping: 9, mass: 0.5 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = btnRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const deg =
        (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
      // Unwrap so the spring always takes the short way around, never a 350° detour.
      const delta = ((deg - (target.current % 360) + 540) % 360) - 180;
      target.current += delta;
      rotate.set(target.current);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [rotate]);

  return (
    <button
      ref={btnRef}
      type={type ?? "button"}
      onClick={(e) => {
        target.current += 360;
        rotate.set(target.current);
        onClick?.(e);
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-full py-3 pr-7 pl-4 text-sm font-semibold tracking-wide text-zinc-300 transition-transform duration-150 select-none outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-red-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className,
      )}
      style={{
        background: "linear-gradient(180deg, #2a2a30, #151518)",
        boxShadow: [
          "0 1px 2px rgba(0,0,0,0.55)",
          "0 6px 16px -6px rgba(0,0,0,0.6)",
          "0 0 0 1px rgba(255,255,255,0.06)",
          "inset 0 1px 0 rgba(255,255,255,0.09)",
          "inset 0 -2px 6px rgba(0,0,0,0.5)",
        ].join(", "),
        ...style,
      }}
      {...props}
    >
      <span
        className="grid size-7 place-items-center rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, #3a3a42, #17171b 70%)",
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <motion.svg viewBox="0 0 24 24" className="size-4" style={{ rotate }}>
          <polygon points="12,3 15,12 9,12" fill="#f87171" />
          <polygon points="12,21 15,12 9,12" fill="#e4e4e7" />
          <circle cx="12" cy="12" r="1.6" fill="#71717a" />
        </motion.svg>
      </span>
      <span style={{ textShadow: "0 1px 1px rgba(0,0,0,0.6)" }}>{label}</span>
    </button>
  );
};

/* ------------------------------------------------------------------ */

const Page = () => {
  const demos = [
    { hint: "hold it", node: <ChargeButton /> },
    { hint: "hover it", node: <SlotButton /> },
    { hint: "hover, then press", node: <StickerButton /> },
    { hint: "move the cursor · click to spin", node: <CompassButton /> },
  ];

  return (
    <div className="grid min-h-screen place-items-center bg-black">
      <div className="grid grid-cols-1 gap-x-24 gap-y-16 sm:grid-cols-2">
        {demos.map(({ hint, node }) => (
          <div key={hint} className="flex flex-col items-center gap-4">
            {node}
            <span className="text-xs text-zinc-600">{hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
