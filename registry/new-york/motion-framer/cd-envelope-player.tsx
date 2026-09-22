"use client";

/**
 * A CD slides out of a paper sleeve and spins up into a now-playing card — grooved disc, moving sheen and a play/pause that eases the spin in and out.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

const DISC = 108; // disc diameter, px
const SLIDE_X = 180; // how far right the disc travels to clear the sleeve

const TRACK = { title: "Slow Exposure", artist: "Marisa Vale", duration: 222 };
const START_AT = 72; // seconds — so the progress bar reads as mid-track

// Disc material. Literal colours on purpose: this is a physical object, not UI chrome.
// The conic sweep is the specular sheen — two bright lobes 180° apart — and it
// rotates with the disc, which is what makes the spin readable.
const SHEEN =
  "conic-gradient(from 180deg, #121212 0%, #121212 8.8%, #272727 10.2%, #3b3b3b 11.6%, #505050 13%, #646464 14.4%, #4f4f4f 18.2%, #3b3b3b 22%, #262626 31%, #121212 40%, #121212 59.5%, #272727 61.3%, #3b3b3b 63.1%, #505050 64.8%, #646464 66.6%, #4f4f4f 68.7%, #393939 70.8%, #262626 81%, #121212 91.1%, #121212 100%)";

// Micro-grooves: a tight ring pitch for the pressing, a much fainter wide one for
// the banding, then an edge vignette so the rim stays darker than the centre.
const GROOVES =
  "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.075) 0px, rgba(0,0,0,0.32) 0.9px, rgba(255,255,255,0.075) 1.8px), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.025) 0px, rgba(0,0,0,0.055) 9px, rgba(255,255,255,0.025) 18px), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.3) 100%)";

// Static highlight — it does not rotate, so the light stays put while the disc turns.
const SPECULAR =
  "radial-gradient(58% 44% at 30% 20%, rgba(255,255,255,0.2), rgba(255,255,255,0) 72%), radial-gradient(44% 34% at 72% 84%, rgba(255,255,255,0.09), rgba(255,255,255,0) 72%)";

// The rim ring is constant; only the cast shadow grows as the disc leaves the sleeve.
const SLEEVED_SHADOW = "0 0 0 2px #62615e, 0 0px 0px 0px rgba(0,0,0,0)";
const LIFTED_SHADOW = "0 0 0 2px #62615e, 0 14px 22px -10px rgba(0,0,0,0.55)";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const EQ_IDLE = [5, 10, 7];

function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {EQ_IDLE.map((idle, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-foreground"
          style={{ height: idle }}
          animate={active ? { height: [4, 11, 6, 12, 4] } : { height: idle }}
          transition={
            active
              ? { duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.16 }
              : { duration: 0.25 }
          }
        />
      ))}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  primary,
  reduce,
  children,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  reduce: boolean | null;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", visualDuration: 0.25, bounce: 0.5 }}
      className={
        primary
          ? "grid size-9 place-items-center rounded-full bg-foreground text-background"
          : "grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {children}
    </motion.button>
  );
}

const CdEnvelopePlayer = () => {
  const reduce = useReducedMotion();
  const gradientId = useId();
  const mouthId = useId();

  const [out, setOut] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(START_AT);

  const rotate = useMotionValue(0);
  const progress = useMotionValue(START_AT / TRACK.duration);
  const speed = useRef(0); // current angular velocity, deg/s
  const position = useRef(START_AT); // playhead, seconds

  const spinning = out && playing;

  // Pull the disc out of the sleeve shortly after mount. Under reduced motion it
  // is simply already out, and already playing, so the card still reads.
  useEffect(() => {
    const id = window.setTimeout(
      () => {
        setOut(true);
        if (reduce) setPlaying(true);
      },
      reduce ? 0 : 550,
    );
    return () => window.clearTimeout(id);
  }, [reduce]);

  useAnimationFrame((_time, delta) => {
    if (reduce) return;
    const dt = Math.min(delta, 64) / 1000;

    // Exponential approach to the target speed: the disc winds up instead of
    // snapping to full rpm, and coasts back down when paused.
    const target = spinning ? 168 : 0;
    speed.current +=
      (target - speed.current) * (1 - Math.exp(-dt * (spinning ? 1.8 : 2.6)));
    rotate.set((rotate.get() + speed.current * dt) % 360);

    if (spinning) {
      position.current = (position.current + dt) % TRACK.duration;
      progress.set(position.current / TRACK.duration);
      const whole = Math.floor(position.current);
      setElapsed((prev) => (prev === whole ? prev : whole));
    }
  });

  const seek = (seconds: number) => {
    const next = ((seconds % TRACK.duration) + TRACK.duration) % TRACK.duration;
    position.current = next;
    progress.set(next / TRACK.duration);
    setElapsed(Math.floor(next));
  };

  const slide = reduce
    ? { duration: 0 }
    : {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      };

  return (
    <div className="flex w-[312px] max-w-full flex-col items-center gap-4 select-none">
      <div className="relative h-[152px] w-[312px]">
        {/* Sleeve, back sheet — the inside of the envelope, seen through the mouth. */}
        <svg
          viewBox="0 0 190 126"
          className="absolute left-0 top-[13px] h-[126px] w-[190px]"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={mouthId}
              x1="140"
              y1="0"
              x2="189"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor="var(--foreground)"
                stopOpacity="0.34"
              />
              <stop
                offset="100%"
                stopColor="var(--foreground)"
                stopOpacity="0.1"
              />
            </linearGradient>
          </defs>
          <rect
            x="0.75"
            y="0.75"
            width="188.5"
            height="124.5"
            rx="9"
            className="fill-muted stroke-border"
            strokeWidth="1.5"
          />
          {/* The mouth: darkest at the crease, opening out to the right. */}
          <path d="M140 63 L189 4 L189 122 Z" fill={`url(#${mouthId})`} />
        </svg>

        {/* The disc. Sits above the back sheet and below the front panel, so it
            reads as sitting inside the sleeve until it slides clear. */}
        <motion.div
          className="absolute left-[16px] top-[22px] rounded-full"
          style={{ width: DISC, height: DISC }}
          initial={{ x: 0, boxShadow: SLEEVED_SHADOW }}
          animate={{
            x: out ? SLIDE_X : 0,
            // The cast shadow only exists once the disc is out of the paper.
            boxShadow: out ? LIFTED_SHADOW : SLEEVED_SHADOW,
          }}
          transition={slide}
          onAnimationComplete={() => out && setPlaying(true)}
        >
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{ rotate, background: SHEEN }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: GROOVES }}
            />
            {/* Hub: dark collar, pale centre, spindle hole. */}
            <div
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: DISC * 0.39,
                height: DISC * 0.39,
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, #2b2718 0%, #211e15 72%)",
                boxShadow: "inset 0 0 7px rgba(0,0,0,0.65)",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: DISC * 0.222,
                height: DISC * 0.222,
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle at 50% 32%, #d2d5ad 0%, #bcc092 46%, #949166 100%)",
                boxShadow:
                  "inset 0 0 0 1px rgba(0,0,0,0.14), inset 0 0 4px rgba(94,94,94,0.55)",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: DISC * 0.072,
                height: DISC * 0.072,
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle at 50% 30%, #171c16 0%, #2d2d2d 62%, #b9b9b9 100%)",
                boxShadow: "0 0 0 1px rgba(214,214,214,0.85)",
              }}
            />
          </motion.div>

          {/* Fixed sheen and rim — deliberately outside the rotating layer. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: SPECULAR,
              border: "3px solid #373535",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 -9px 18px rgba(0,0,0,0.45)",
            }}
          />
        </motion.div>

        {/* Sleeve, front panel — its right edge is the open flap, a V pointing
            back into the envelope, so the disc leaves to the right. */}
        <svg
          viewBox="0 0 190 126"
          className="pointer-events-none absolute left-0 top-[13px] h-[126px] w-[190px]"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--background)"
                stopOpacity="0.8"
              />
              <stop
                offset="52%"
                stopColor="var(--background)"
                stopOpacity="0.1"
              />
              <stop
                offset="100%"
                stopColor="var(--foreground)"
                stopOpacity="0.07"
              />
            </linearGradient>
          </defs>
          <g>
            <path
              d="M9.75 0.75 L180.25 0.75 A9 9 0 0 1 189.25 9.75 L140 63 L189.25 116.25 A9 9 0 0 1 180.25 125.25 L9.75 125.25 A9 9 0 0 1 0.75 116.25 L0.75 9.75 A9 9 0 0 1 9.75 0.75 Z"
              className="fill-muted stroke-border"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9.75 0.75 L180.25 0.75 A9 9 0 0 1 189.25 9.75 L140 63 L189.25 116.25 A9 9 0 0 1 180.25 125.25 L9.75 125.25 A9 9 0 0 1 0.75 116.25 L0.75 9.75 A9 9 0 0 1 9.75 0.75 Z"
              fill={`url(#${gradientId})`}
            />
            {/* Paper seam across the panel. */}
            <path
              d="M0.75 100 L114 100"
              className="stroke-border"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>

      <div className="w-full rounded-xl border border-border bg-background p-3.5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Equalizer active={spinning && !reduce} />
              <span className="text-[11px] text-muted-foreground">
                {playing ? "Listening now" : "Paused"}
              </span>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-foreground">
              {TRACK.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {TRACK.artist}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <IconButton
              label="Restart track"
              reduce={reduce}
              onClick={() => seek(0)}
            >
              <SkipBack className="size-3.5" fill="currentColor" strokeWidth={0} />
            </IconButton>
            <IconButton
              label={playing ? "Pause" : "Play"}
              reduce={reduce}
              primary
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? (
                <Pause className="size-4" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play
                  className="size-4 translate-x-px"
                  fill="currentColor"
                  strokeWidth={0}
                />
              )}
            </IconButton>
            <IconButton
              label="Skip forward 30 seconds"
              reduce={reduce}
              onClick={() => seek(position.current + 30)}
            >
              <SkipForward
                className="size-3.5"
                fill="currentColor"
                strokeWidth={0}
              />
            </IconButton>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/15">
            <motion.div
              className="h-full w-full origin-left rounded-full bg-foreground"
              style={{ scaleX: progress }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(TRACK.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CdEnvelopePlayer;
