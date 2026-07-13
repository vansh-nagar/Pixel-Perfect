/**
 * A compact player pill that springs open on hover — the corners morph, the album art grows into place, and the full controls resolve out of blur.
 */
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";

// SwiftUI response/dampingFraction → Motion visualDuration/bounce (bounce ≈ 1 − dampingFraction).
const SPRING = { type: "spring", visualDuration: 0.38, bounce: 0.18 } as const; // shared / slide
const SPRING_OPEN = { type: "spring", visualDuration: 0.42, bounce: 0.24 } as const; // bounce out
const SPRING_CLOSE = { type: "spring", visualDuration: 0.45, bounce: 0 } as const; // settle in

const ART = "linear-gradient(135deg, #FF6B6B 0%, #8E7BFF 52%, #2D9CFF 100%)";

function Equalizer({ playing, reduce }: { playing: boolean; reduce: boolean | null }) {
  return (
    <div className="flex h-[18px] items-center gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-white/80"
          style={{ height: 6 }}
          animate={playing && !reduce ? { height: [6, 16, 8, 18, 6] } : { height: 7 }}
          transition={
            playing && !reduce
              ? { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.13 }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  primary,
  reduce,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  reduce: boolean | null;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { scale: 1.12 }}
      whileTap={reduce ? undefined : { scale: 0.88 }}
      transition={{ type: "spring", visualDuration: 0.3, bounce: 0.55 }}
      className={`grid place-items-center rounded-full outline-none focus-visible:outline-none ${
        primary ? "size-[46px] bg-white text-[#111]" : "size-9 text-white/85"
      }`}
    >
      {children}
    </motion.button>
  );
}

/**
 * Hover-driven expanding player — the notch / Dynamic-Island move: a compact pill
 * springs open into a full player, its corners morph, the album art grows into
 * place, and the expanded content resolves out of blur. Asymmetric springs give a
 * bounce on open and a critically-damped settle on close.
 */
const HoverExpandPlayer = () => {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(true);

  const morph = reduce ? { duration: 0.2 } : open ? SPRING_OPEN : SPRING_CLOSE;

  const containerVariants = {
    closed: {
      width: 230,
      height: 60,
      borderRadius: 30,
      boxShadow: "0px 10px 24px rgba(0,0,0,0.16)",
    },
    open: {
      width: 340,
      height: 200,
      borderRadius: 34,
      boxShadow: "0px 30px 60px rgba(0,0,0,0.30)",
    },
  };

  // The album art is one element that springs between its small and large box —
  // the matchedGeometryEffect analog.
  const artVariants = {
    closed: { top: 10, left: 10, width: 40, height: 40, borderRadius: 20 },
    open: { top: 20, left: 20, width: 76, height: 76, borderRadius: 20 },
  };

  const reveal = {
    closed: { opacity: 0, filter: "blur(10px)", y: reduce ? 0 : 6 },
    open: { opacity: 1, filter: "blur(0px)", y: 0 },
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <motion.div
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        initial={false}
        animate={open ? "open" : "closed"}
        variants={containerVariants}
        transition={morph}
        className="relative cursor-pointer overflow-hidden text-white"
        style={{ background: "linear-gradient(180deg, #171717 0%, #0A0A0A 100%)" }}
      >
        {/* Album art — morphs size + position between the two states */}
        <motion.div
          variants={artVariants}
          transition={morph}
          className="absolute"
          style={{ background: ART, boxShadow: "0 6px 16px rgba(0,0,0,0.4)" }}
        />

        {/* Compact content — visible while closed, dissolves away on open */}
        <motion.div
          variants={{
            closed: { opacity: 1, filter: "blur(0px)" },
            open: { opacity: 0, filter: "blur(8px)" },
          }}
          transition={SPRING}
          className="pointer-events-none absolute inset-y-0 left-[60px] right-4 flex items-center justify-between"
        >
          <span className="text-[14px] font-medium tracking-[-0.2px]">Fluid Motion</span>
          <Equalizer playing={playing && !open} reduce={reduce} />
        </motion.div>

        {/* Expanded content — resolves out of blur, staggered */}
        <motion.div
          variants={{
            closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
            open: { transition: { delayChildren: 0.06, staggerChildren: 0.05 } },
          }}
          className="absolute inset-0"
          style={{ pointerEvents: open ? "auto" : "none" }}
        >
          <motion.div variants={reveal} transition={SPRING} className="absolute left-[112px] top-[26px]">
            <div className="text-[17px] font-semibold tracking-[-0.3px]">Fluid Motion</div>
            <div className="text-[13px] font-medium text-white/50">Interlude · 2:41</div>
          </motion.div>

          <motion.div variants={reveal} transition={SPRING} className="absolute inset-x-5 top-[116px]">
            <div className="relative h-[5px] w-full rounded-full bg-white/15">
              <div className="absolute inset-y-0 left-0 w-[42%] rounded-full bg-white" />
              <div className="absolute left-[42%] top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-medium tabular-nums text-white/40">
              <span>1:08</span>
              <span>-1:33</span>
            </div>
          </motion.div>

          <motion.div
            variants={reveal}
            transition={SPRING}
            className="absolute inset-x-0 bottom-[16px] flex items-center justify-center gap-6"
          >
            <ControlButton reduce={reduce}>
              <SkipBack className="size-5" fill="currentColor" strokeWidth={0} />
            </ControlButton>
            <ControlButton reduce={reduce} onClick={() => setPlaying((p) => !p)} primary>
              {playing ? (
                <Pause className="size-6" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play className="size-6 translate-x-px" fill="currentColor" strokeWidth={0} />
              )}
            </ControlButton>
            <ControlButton reduce={reduce}>
              <SkipForward className="size-5" fill="currentColor" strokeWidth={0} />
            </ControlButton>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HoverExpandPlayer;
