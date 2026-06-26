"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpDown,
  Captions,
  Pause,
  Play,
  Plus,
  ScanBarcode,
  Search,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import PixelDistortion from "@/components/pixel-perfect/shaders/pixel-distortion";

const buttonClass =
  "rounded-full border-2 border-[#040404] bg-[#272727] outline-none focus:outline-none focus-visible:outline-none " +
  "shadow-[inset_0px_-4px_4px_rgba(0,0,0,0.39),inset_0px_4px_4px_rgba(85,85,85,0.69)] " +
  "active:bg-[#232323] " +
  "active:shadow-[inset_0px_-4px_4px_rgba(0,0,0,0.39),inset_0px_6px_13.2px_#090909]";

const SPRING_MORPH = { type: "spring", duration: 0.5, bounce: 0.14 } as const;
const SPRING_DRAWER = { type: "spring", duration: 0.6, bounce: 0.16 } as const;
const SPRING_POP = { type: "spring", duration: 0.5, bounce: 0.36 } as const;

function barHeight(n: number) {
  const v = Math.abs(
    Math.sin(n * 0.7) * 0.5 + Math.sin(n * 1.9) * 0.3 + Math.sin(n * 0.31) * 0.2,
  );
  return Math.round(6 + v * 62);
}

const BAR_COUNT = 40;
const BAR_STEP = 6;
const SPEED = 70;
const MIC_GAIN = 2.4;
const INITIAL = Array.from({ length: BAR_COUNT }, () => 0);

function RollingDigit({ char }: { char: string }) {
  if (char === ":") return <span className="px-px">:</span>;
  return (
    <span className="relative inline-block h-[32px] w-[0.62em] overflow-hidden text-center align-top">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={char}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 block"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const stickerVariants = {
  closed: { opacity: 0, scale: 0.4 },
  open: { opacity: 1, scale: 1 },
};

function Sticker({
  className,
  rotate = 0,
  badge = true,
  onClick,
  children,
}: {
  className?: string;
  rotate?: number;
  badge?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      onClick={onClick}
      className={`absolute ${className} ${onClick ? "cursor-pointer" : ""}`}
      style={{ rotate }}
      variants={stickerVariants}
      transition={SPRING_POP}
    >
      <div className="relative text-[#0c0c0c]">
        {children}
        {badge && (
          <span className="absolute -bottom-1.5 -right-1.5 grid size-[23px] place-items-center rounded-full bg-[#0c0c0c]">
            <Plus className="size-[14px] text-white" strokeWidth={3.5} />
          </span>
        )}
      </div>
    </motion.div>
  );
}

function RingGlyph() {
  return (
    <svg
      width="44"
      height="45"
      viewBox="0 0 56 57"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#close_shadow)">
        <circle cx="28" cy="28" r="26" fill="white" />
      </g>
      <path
        d="M28 50C40.1503 50 50 40.1503 50 28C50 15.8497 40.1503 6 28 6C15.8497 6 6 15.8497 6 28C6 40.1503 15.8497 50 28 50Z"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.6667 28H37.3333"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 18.6667V37.3334"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <filter
          id="close_shadow"
          x="0.7"
          y="1.7"
          width="54.6"
          height="54.6"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="0.65" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

function QuickAddSheet({
  open,
  setOpen,
  onMic,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onMic: () => void;
}) {
  const [labels, setLabels] = useState(false);

  return (
    <div className="relative flex h-[372px] w-[409px] items-end">
      <motion.div
        className="relative w-full overflow-hidden"
        initial={false}
        animate={open ? "open" : "closed"}
        variants={{
          closed: {
            height: 64,
            borderRadius: 32,
            backgroundColor: "#FFFFFF",
            boxShadow: "0px 10px 30px rgba(0,0,0,0.10)",
          },
          open: {
            height: 372,
            borderRadius: 40,
            backgroundColor: "#F1F1F1",
            boxShadow: "0px 24px 48px rgba(0,0,0,0.14)",
          },
        }}
        transition={SPRING_MORPH}
      >

        <motion.div
          className="pointer-events-none absolute inset-0"
          variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundImage:
              "radial-gradient(#E5E5E5 1.3px, transparent 1.3px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "12px 12px",
          }}
        />

        <motion.div
          className="absolute inset-0"
          variants={{
            open: {
              transition: { staggerChildren: 0.06, delayChildren: 0.12 },
            },
            closed: {
              transition: { staggerChildren: 0.04, staggerDirection: -1 },
            },
          }}
        >
          <Sticker className="left-[52px] top-[40px]" rotate={-8} badge={false}>
            <span className="relative block size-[54px]">
              <ScanBarcode
                className="absolute left-0 top-0 size-[54px] text-white"
                strokeWidth={4}
              />
              <ScanBarcode
                className="absolute left-0 top-0 size-[54px] text-[#0c0c0c]"
                strokeWidth={1.5}
              />
            </span>
          </Sticker>
          <Sticker
            className="right-[54px] top-[70px]"
            rotate={9}
            onClick={onMic}
          >
            <svg
              width="46"
              height="55"
              viewBox="0 0 20 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 11C15 13.7614 12.7614 16 10 16C7.23858 16 5 13.7614 5 11V7C5 4.23858 7.23858 2 10 2"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 11C18 15.4183 14.4183 19 10 19M10 19C5.58172 19 2 15.4183 2 11M10 19V22"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.3327 4.64612C13.5394 4.49594 14.4959 3.53944 14.6461 2.33267C14.6689 2.14999 14.8159 2 15 2C15.1841 2 15.3311 2.14999 15.3539 2.33267C15.5041 3.53944 16.4606 4.49594 17.6673 4.64612C17.85 4.66885 18 4.81591 18 5C18 5.1841 17.85 5.33115 17.6673 5.35388C16.4606 5.50406 15.5041 6.46056 15.3539 7.66733C15.3311 7.85001 15.1841 8 15 8C14.8159 8 14.6689 7.85001 14.6461 7.66733C14.4959 6.46056 13.5394 5.50406 12.3327 5.35388C12.15 5.33115 12 5.1841 12 5C12 4.81591 12.15 4.66885 12.3327 4.64612Z"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 11C15 13.7614 12.7614 16 10 16C7.23858 16 5 13.7614 5 11V7C5 4.23858 7.23858 2 10 2"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 11C18 15.4183 14.4183 19 10 19M10 19C5.58172 19 2 15.4183 2 11M10 19V22"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.3327 4.64612C13.5394 4.49594 14.4959 3.53944 14.6461 2.33267C14.6689 2.14999 14.8159 2 15 2C15.1841 2 15.3311 2.14999 15.3539 2.33267C15.5041 3.53944 16.4606 4.49594 17.6673 4.64612C17.85 4.66885 18 4.81591 18 5C18 5.1841 17.85 5.33115 17.6673 5.35388C16.4606 5.50406 15.5041 6.46056 15.3539 7.66733C15.3311 7.85001 15.1841 8 15 8C14.8159 8 14.6689 7.85001 14.6461 7.66733C14.4959 6.46056 13.5394 5.50406 12.3327 5.35388C12.15 5.33115 12 5.1841 12 5C12 4.81591 12.15 4.66885 12.3327 4.64612Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Sticker>
          <Sticker className="left-[164px] top-[112px]" rotate={-3}>
            <svg
              width="58"
              height="58"
              viewBox="0 0 23 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 15.5L6.96967 11.0303C7.30923 10.6908 7.76978 10.5 8.25 10.5C8.73022 10.5 9.19077 10.6908 9.5303 11.0303L13.5 15M13.5 15L15 16.5M13.5 15L15.4697 13.0303C15.8092 12.6908 16.2698 12.5 16.75 12.5C17.2302 12.5 17.6908 12.6908 18.0303 13.0303L20.5 15.5"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 7.5C15.2761 7.5 15.5 7.27614 15.5 7C15.5 6.72386 15.2761 6.5 15 6.5M15 7.5C14.7239 7.5 14.5 7.27614 14.5 7C14.5 6.72386 14.7239 6.5 15 6.5M15 7.5V6.5"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.19797 19.2472C2 17.8446 2 15.7297 2 11.5C2 7.27027 2 5.1554 3.19797 3.75276C3.36808 3.55358 3.55358 3.36808 3.75276 3.19797C5.1554 2 7.27027 2 11.5 2C15.7297 2 17.8446 2 19.2472 3.19797C19.4464 3.36808 19.6319 3.55358 19.802 3.75276C21 5.1554 21 7.27027 21 11.5C21 15.7297 21 17.8446 19.802 19.2472C19.6319 19.4464 19.4464 19.6319 19.2472 19.802C17.8446 21 15.7297 21 11.5 21C7.27027 21 5.1554 21 3.75276 19.802C3.55358 19.6319 3.36808 19.4464 3.19797 19.2472Z"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 15.5L6.96967 11.0303C7.30923 10.6908 7.76978 10.5 8.25 10.5C8.73022 10.5 9.19077 10.6908 9.5303 11.0303L13.5 15M13.5 15L15 16.5M13.5 15L15.4697 13.0303C15.8092 12.6908 16.2698 12.5 16.75 12.5C17.2302 12.5 17.6908 12.6908 18.0303 13.0303L20.5 15.5"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 7.5C15.2761 7.5 15.5 7.27614 15.5 7C15.5 6.72386 15.2761 6.5 15 6.5M15 7.5C14.7239 7.5 14.5 7.27614 14.5 7C14.5 6.72386 14.7239 6.5 15 6.5M15 7.5V6.5"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.19797 19.2472C2 17.8446 2 15.7297 2 11.5C2 7.27027 2 5.1554 3.19797 3.75276C3.36808 3.55358 3.55358 3.36808 3.75276 3.19797C5.1554 2 7.27027 2 11.5 2C15.7297 2 17.8446 2 19.2472 3.19797C19.4464 3.36808 19.6319 3.55358 19.802 3.75276C21 5.1554 21 7.27027 21 11.5C21 15.7297 21 17.8446 19.802 19.2472C19.6319 19.4464 19.4464 19.6319 19.2472 19.802C17.8446 21 15.7297 21 11.5 21C7.27027 21 5.1554 21 3.75276 19.802C3.55358 19.6319 3.36808 19.4464 3.19797 19.2472Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Sticker>
          <Sticker className="left-[66px] top-[196px]" rotate={-6}>
            <span className="relative block size-[56px]">
              <Captions
                className="absolute left-0 top-0 size-[56px] text-white"
                strokeWidth={4}
              />
              <Captions
                className="absolute left-0 top-0 size-[56px] text-[#0c0c0c]"
                strokeWidth={1.5}
              />
            </span>
          </Sticker>
          <Sticker className="right-[92px] top-[206px]" rotate={7}>
            <svg
              width="54"
              height="54"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="4" />
              <path
                d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="8" r="4" stroke="black" strokeWidth="1.5" />
              <path
                d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Sticker>
        </motion.div>

        <motion.div
          className="absolute inset-x-0 bottom-0 flex h-[64px] cursor-text items-center gap-3 pl-6 pr-[68px]"
          variants={{
            closed: { opacity: 1, transition: { duration: 0.2, delay: 0.12 } },
            open: { opacity: 0, transition: { duration: 0.12 } },
          }}
          style={{ pointerEvents: open ? "none" : "auto" }}
        >
          <Search
            className="size-[22px] shrink-0 text-[#9b9b9b]"
            strokeWidth={2.4}
          />
          <span className="flex-1 text-[18px] tracking-[-0.2px] text-[#9b9b9b]">
            I need…
          </span>
          <ArrowUpDown
            className="size-[22px] shrink-0 text-[#3a3a3a]"
            strokeWidth={2.4}
          />
        </motion.div>

        <motion.button
          type="button"
          onClick={() => setLabels((v) => !v)}
          className="absolute bottom-[14px] left-[16px] flex items-center gap-2.5 rounded-full bg-white py-2 pl-4 pr-3 outline-none focus-visible:outline-none"
          variants={{
            closed: { opacity: 0, y: 8, transition: { duration: 0.12 } },
            open: {
              opacity: 1,
              y: 0,
              transition: { ...SPRING_POP, delay: 0.18 },
            },
          }}
          style={{ pointerEvents: open ? "auto" : "none" }}
        >
          <span className="text-[14px] font-normal tracking-[-0.2px] text-[#2a2a2a]">
            Show labels
          </span>
          <span
            className={`relative h-[18px] w-[31px] rounded-full transition-colors ${
              labels ? "bg-[#34c759]" : "bg-[#DBDBDB]"
            }`}
          >
            <span
              className={`absolute top-[2px] size-[14px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-all ${
                labels ? "left-[15px]" : "left-[2px]"
              }`}
            />
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute bottom-[10px] right-[14px] block outline-none focus-visible:outline-none"
          variants={{ closed: { rotate: 0 }, open: { rotate: 45 } }}
          transition={SPRING_POP}
        >
          <RingGlyph />
        </motion.button>
      </motion.div>
    </div>
  );
}

const Page = () => {
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const heights = useRef<number[]>([...INITIAL]);
  const xRef = useRef(0);
  const seq = useRef(BAR_COUNT);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  // Live microphone capture: drives the waveform from real input amplitude.
  // Falls back to the synthetic waveform if the mic is denied/unavailable.
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        ctx = new AudioContext();
        await ctx.resume();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analyserRef.current = analyser;
        audioDataRef.current = new Uint8Array(analyser.fftSize);
      } catch {
        // mic unavailable/denied — loop keeps using the synthetic waveform
      }
    })();
    return () => {
      cancelled = true;
      analyserRef.current = null;
      audioDataRef.current = null;
      if (stream) stream.getTracks().forEach((tr) => tr.stop());
      if (ctx) ctx.close();
    };
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (t: number) => {
      if (last === null) last = t;
      xRef.current -= (SPEED * (t - last)) / 1000;
      last = t;
      while (xRef.current <= -BAR_STEP) {
        xRef.current += BAR_STEP;
        const h = heights.current;
        for (let i = 0; i < BAR_COUNT - 1; i++) h[i] = h[i + 1];
        const analyser = analyserRef.current;
        const data = audioDataRef.current;
        if (analyser && data) {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (let i = 0; i < data.length; i++) {
            const v = Math.abs(data[i] - 128) / 128;
            if (v > peak) peak = v;
          }
          h[BAR_COUNT - 1] = Math.round(6 + Math.min(1, peak * MIC_GAIN) * 62);
        } else {
          h[BAR_COUNT - 1] = barHeight(seq.current++);
        }
        for (let i = 0; i < BAR_COUNT; i++) {
          const s = spanRefs.current[i];
          if (s) s.style.height = `${h[i]}px`;
        }
      }
      if (rowRef.current) {
        rowRef.current.style.transform = `translate3d(${xRef.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const mm = String(Math.floor(seconds / 60) % 100).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const time = `${mm}:${ss}`;

  // Stop: halt recording and clear the waveform/timer back to empty, but keep
  // the recorder open (the square button).
  const stop = () => {
    setPlaying(false);
    setSeconds(0);
    xRef.current = 0;
    seq.current = BAR_COUNT;
    heights.current = [...INITIAL];
    heights.current.forEach((h, i) => {
      const s = spanRefs.current[i];
      if (s) s.style.height = `${h}px`;
    });
    if (rowRef.current) rowRef.current.style.transform = "translate3d(0,0,0)";
  };

  // Delete: stop, then dismiss the recorder (the trash button).
  const reset = () => {
    stop();
    setRecording(false);
  };

  const barEls = useMemo(
    () =>
      INITIAL.map((h, i) => (
        <span
          key={i}
          ref={(el) => {
            spanRefs.current[i] = el;
          }}
          className="w-[3px] shrink-0 rounded-full bg-white"
          style={{ height: h }}
        />
      )),
    [],
  );

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-white">

      <PixelDistortion
        image="/hello-cvo.svg"
        className="absolute inset-0 z-0 h-full w-full"
        grid={20}
        strength={0.02}
        relax={0.94}
        force={42}
      />

      <div className="relative z-10 h-[372px] w-[409px]">

        <QuickAddSheet
          open={open}
          setOpen={setOpen}
          onMic={() => setRecording(true)}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[446px] justify-center overflow-hidden">
          <motion.div
            initial={false}
            animate={{ y: recording ? 0 : "120%" }}
            transition={SPRING_DRAWER}
            style={{ pointerEvents: recording ? "auto" : "none" }}
            className="relative flex h-[446px] w-[409px] flex-col rounded-[40px] will-change-transform"
          >
          <div
            className="absolute inset-0 rounded-[40px]"
            style={{
              background: "linear-gradient(180deg, #313131 0%, #202020 100%)",
            }}
          />

        <div
          className="absolute left-[11px] top-[10px] h-[303px] w-[386px] overflow-hidden rounded-[29px] border-2 border-[#0e0e0e]"
          style={{
            background: "linear-gradient(180deg, #2F2F2F 0%, #181818 100%)",
            boxShadow:
              "0px 2px 1.6px #2E2E2E, inset 0px 4px 4px rgba(0, 0, 0, 0.25), inset -22px 3px 25.9px rgba(0, 0, 0, 0.17), inset 21px -26px 20.1px rgba(0, 0, 0, 0.17), inset 0px 6px 35.3px #181818",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">

            <div className="relative h-[150px] w-full">

              <div className="absolute bottom-0 left-0 top-0 right-[50%] overflow-hidden">

                <div
                  ref={rowRef}
                  className="absolute right-0 top-0 flex h-full items-center gap-[3px] will-change-transform"
                >
                  {barEls}
                </div>
              </div>

              <div className="pointer-events-none absolute left-[50%] right-0 top-1/2 flex h-[3px] -translate-y-1/2 items-center overflow-hidden">
                <motion.div
                  className="flex shrink-0 items-center gap-[5px]"
                  animate={{ x: playing ? [0, -8] : 0 }}
                  transition={
                    playing
                      ? { duration: 8 / SPEED, repeat: Infinity, ease: "linear" }
                      : { duration: 0 }
                  }
                >
                  {Array.from({ length: 40 }).map((_, i) => (
                    <span
                      key={i}
                      className="size-[3px] shrink-0 rounded-full bg-[#4a4a4a]"
                    />
                  ))}
                </motion.div>
              </div>

              <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-[145px] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <span className="size-[9px] rounded-full bg-[#2D68FE]" />
                <span className="w-[3px] flex-1 bg-[#2D68FE]" />
                <span className="size-[9px] rounded-full bg-[#2D68FE]" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="flex text-[24px] font-semibold leading-[32px] tracking-[-0.48px] text-white tabular-nums">
                {time.split("").map((c, i) => (
                  <RollingDigit key={i} char={c} />
                ))}
              </div>
              <div className="flex items-center justify-center gap-[3px] text-[12px] font-medium tracking-[-0.24px] text-[#606060]">
                New Audio from you
                <span
                  className="size-5 shrink-0 rounded-full border border-black/40 bg-cover bg-center"
                  style={{ backgroundImage: "url(/pfp.png)" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-[335px] flex -translate-x-1/2 items-center gap-[31px]">

          <button
            type="button"
            onClick={stop}
            className={`grid size-[67px] place-items-center ${buttonClass}`}
          >
            <span className="size-[17px] rounded-[3px] bg-white" />
          </button>

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={`relative grid size-[87px] place-items-center ${buttonClass}`}
          >
            <span className="flex -translate-y-1 items-center gap-0.5 text-white">
              <Play className="size-6" fill="currentColor" strokeWidth={0} />
              <Pause className="size-6" fill="currentColor" strokeWidth={0} />
            </span>

            <span className="absolute bottom-[15px] flex size-3 items-center justify-center">
              {playing ? (
                <span className="size-1.5 rounded-full bg-[#ff3b30] shadow-[0_0_4px_1px_rgba(255,59,48,0.5)]" />
              ) : (
                <span className="size-1.5 rounded-full bg-[#4E4E4E] shadow-[inset_0px_0.5px_0.8px_rgba(0,0,0,0.64),inset_0px_-0.5px_0px_#808080]" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={reset}
            className={`grid size-[67px] place-items-center ${buttonClass}`}
          >
            <Trash2 className="size-6 text-[#D1D1D1]" strokeWidth={2} />
          </button>
        </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Page;
