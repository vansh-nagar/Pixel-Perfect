"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ColorKey =
  | "cyan"
  | "magenta"
  | "yellow"
  | "green"
  | "orange"
  | "blue"
  | "red"
  | "purple"
  | "white"
  | "teal"
  | "pink"
  | "lime";

type AnimationKey =
  | "wave-lr"
  | "wave-rl"
  | "wave-tb"
  | "wave-bt"
  | "spiral-cw"
  | "corners-first"
  | "center-out"
  | "diagonal-tl"
  | "snake"
  | "cross"
  | "checkerboard"
  | "rain"
  | "pinwheel"
  | "orbit"
  | "converge"
  | "zigzag"
  | "aurora"
  | "ember"
  | "prism"
  | "neon-cross"
  | "tide"
  | "sunset"
  | "toxic"
  | "frost";

type AnimationConfig = {
  delays: number[];
  duration: number;
  colors?: ColorKey[];
};

const ANIMATIONS: Record<AnimationKey, AnimationConfig> = {
  "wave-lr": { delays: [0, 120, 240, 0, 120, 240, 0, 120, 240], duration: 200 },
  "wave-rl": { delays: [240, 120, 0, 240, 120, 0, 240, 120, 0], duration: 200 },
  "wave-tb": { delays: [0, 0, 0, 120, 120, 120, 240, 240, 240], duration: 200 },
  "wave-bt": { delays: [240, 240, 240, 120, 120, 120, 0, 0, 0], duration: 200 },
  "spiral-cw": {
    delays: [0, 80, 160, 560, 640, 240, 480, 400, 320],
    duration: 180,
  },
  "corners-first": {
    delays: [0, 200, 0, 200, 400, 200, 0, 200, 0],
    duration: 200,
  },
  "center-out": {
    delays: [240, 120, 240, 120, 0, 120, 240, 120, 240],
    duration: 200,
  },
  "diagonal-tl": {
    delays: [0, 100, 200, 100, 200, 300, 200, 300, 400],
    duration: 180,
  },
  snake: { delays: [0, 80, 160, 400, 320, 240, 480, 560, 640], duration: 160 },
  cross: { delays: [300, 0, 300, 0, 0, 0, 300, 0, 300], duration: 250 },
  checkerboard: {
    delays: [0, 250, 0, 250, 0, 250, 0, 250, 0],
    duration: 220,
  },
  rain: { delays: [0, 180, 60, 120, 300, 240, 360, 80, 420], duration: 170 },
  pinwheel: {
    delays: [0, 160, 480, 320, 640, 160, 480, 320, 0],
    duration: 150,
  },
  orbit: { delays: [0, 80, 160, 480, 640, 240, 400, 320, 560], duration: 120 },
  converge: {
    delays: [0, 160, 80, 240, 320, 240, 80, 160, 0],
    duration: 260,
  },
  zigzag: { delays: [0, 160, 320, 400, 240, 80, 480, 560, 640], duration: 140 },
  aurora: {
    delays: [0, 100, 200, 100, 200, 300, 200, 300, 400],
    duration: 220,
    colors: [
      "cyan",
      "cyan",
      "teal",
      "teal",
      "blue",
      "blue",
      "purple",
      "purple",
      "magenta",
    ],
  },
  ember: {
    delays: [0, 80, 160, 560, 640, 240, 480, 400, 320],
    duration: 180,
    colors: [
      "yellow",
      "orange",
      "orange",
      "orange",
      "red",
      "red",
      "red",
      "magenta",
      "magenta",
    ],
  },
  prism: {
    delays: [0, 80, 160, 240, 320, 400, 480, 560, 640],
    duration: 160,
    colors: [
      "red",
      "orange",
      "yellow",
      "green",
      "cyan",
      "blue",
      "purple",
      "magenta",
      "pink",
    ],
  },
  "neon-cross": {
    delays: [300, 0, 300, 0, 0, 0, 300, 0, 300],
    duration: 250,
    colors: [
      "magenta",
      "cyan",
      "magenta",
      "cyan",
      "white",
      "cyan",
      "magenta",
      "cyan",
      "magenta",
    ],
  },
  tide: {
    delays: [0, 0, 0, 120, 120, 120, 240, 240, 240],
    duration: 200,
    colors: [
      "teal",
      "cyan",
      "teal",
      "blue",
      "teal",
      "blue",
      "purple",
      "blue",
      "purple",
    ],
  },
  sunset: {
    delays: [240, 240, 240, 120, 120, 120, 0, 0, 0],
    duration: 200,
    colors: [
      "purple",
      "blue",
      "purple",
      "magenta",
      "red",
      "magenta",
      "orange",
      "yellow",
      "orange",
    ],
  },
  toxic: {
    delays: [0, 200, 0, 200, 400, 200, 0, 200, 0],
    duration: 200,
    colors: [
      "lime",
      "green",
      "lime",
      "green",
      "yellow",
      "green",
      "lime",
      "green",
      "lime",
    ],
  },
  frost: {
    delays: [240, 120, 240, 120, 0, 120, 240, 120, 240],
    duration: 200,
    colors: [
      "blue",
      "cyan",
      "blue",
      "cyan",
      "white",
      "cyan",
      "blue",
      "cyan",
      "blue",
    ],
  },
};

const COLOR_VARS: Record<ColorKey, { off: string; on: string; glow: string }> =
  {
    cyan: {
      off: "oklch(40% 0.08 195 / 0.4)",
      on: "oklch(90% 0.2 195)",
      glow: "oklch(80% 0.25 195 / 0.9)",
    },
    magenta: {
      off: "oklch(40% 0.08 330 / 0.4)",
      on: "oklch(85% 0.25 330)",
      glow: "oklch(75% 0.3 330 / 0.9)",
    },
    yellow: {
      off: "oklch(50% 0.08 90 / 0.4)",
      on: "oklch(95% 0.2 90)",
      glow: "oklch(90% 0.25 90 / 0.9)",
    },
    green: {
      off: "oklch(40% 0.08 145 / 0.4)",
      on: "oklch(90% 0.25 145)",
      glow: "oklch(80% 0.3 145 / 0.9)",
    },
    orange: {
      off: "oklch(45% 0.08 50 / 0.4)",
      on: "oklch(85% 0.22 50)",
      glow: "oklch(75% 0.28 50 / 0.9)",
    },
    blue: {
      off: "oklch(40% 0.08 260 / 0.4)",
      on: "oklch(80% 0.22 260)",
      glow: "oklch(70% 0.28 260 / 0.9)",
    },
    red: {
      off: "oklch(40% 0.08 25 / 0.4)",
      on: "oklch(70% 0.25 25)",
      glow: "oklch(60% 0.3 25 / 0.9)",
    },
    purple: {
      off: "oklch(40% 0.08 300 / 0.4)",
      on: "oklch(75% 0.22 300)",
      glow: "oklch(65% 0.28 300 / 0.9)",
    },
    white: {
      off: "oklch(50% 0 0 / 0.3)",
      on: "oklch(98% 0 0)",
      glow: "oklch(95% 0 0 / 0.8)",
    },
    teal: {
      off: "oklch(40% 0.08 175 / 0.4)",
      on: "oklch(82% 0.18 175)",
      glow: "oklch(72% 0.24 175 / 0.9)",
    },
    pink: {
      off: "oklch(45% 0.08 350 / 0.4)",
      on: "oklch(80% 0.2 350)",
      glow: "oklch(70% 0.26 350 / 0.9)",
    },
    lime: {
      off: "oklch(45% 0.08 120 / 0.4)",
      on: "oklch(88% 0.22 120)",
      glow: "oklch(80% 0.28 120 / 0.9)",
    },
  };

type PixelGridProps = {
  animation?: AnimationKey;
  color?: ColorKey;
  autoplay?: boolean;
  animateInView?: boolean;
  bloom?: boolean;
  bloomAmount?: number;
  cellSize?: number;
  cellGap?: number;
  borderRadius?: number;
};

export const PixelGrid = ({
  animation = "wave-lr",
  color = "cyan",
  autoplay = true,
  animateInView = true,
  bloom = false,
  bloomAmount = 4,
  cellSize = 10,
  cellGap = 2,
  borderRadius = 2,
}: PixelGridProps) => {
  const config = ANIMATIONS[animation];
  const [cellStates, setCellStates] = useState<boolean[]>(() =>
    Array(9).fill(false),
  );
  const [inView, setInView] = useState(!animateInView);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const cycleTimerRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const gridSize = cellSize * 3 + cellGap * 2;

  const getCellColors = useMemo(() => {
    return (idx: number) => {
      const key = config.colors?.[idx] ?? color;
      return COLOR_VARS[key];
    };
  }, [config.colors, color]);

  useEffect(() => {
    if (!animateInView) {
      setInView(true);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setInView(true);
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animateInView]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
      if (cycleTimerRef.current !== null) {
        window.clearTimeout(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
    };

    if (!autoplay || !inView) {
      runningRef.current = false;
      clearTimers();
      return;
    }

    runningRef.current = true;

    const getMaxDelay = () => Math.max(...config.delays);

    const fadeIn = (callback: () => void) => {
      const newStates = Array(9).fill(false);
      startTransition(() => setCellStates(newStates));
      config.delays.forEach((delay, idx) => {
        const timer = window.setTimeout(() => {
          startTransition(() => {
            setCellStates((prev) => {
              const next = [...prev];
              next[idx] = true;
              return next;
            });
          });
        }, delay);
        timersRef.current.push(timer);
      });
      const holdTime = getMaxDelay() + config.duration;
      cycleTimerRef.current = window.setTimeout(callback, holdTime);
    };

    const fadeOut = (callback: () => void) => {
      config.delays.forEach((delay, idx) => {
        const timer = window.setTimeout(() => {
          startTransition(() => {
            setCellStates((prev) => {
              const next = [...prev];
              next[idx] = false;
              return next;
            });
          });
        }, delay);
        timersRef.current.push(timer);
      });
      const endTime = getMaxDelay() + config.duration + 50;
      cycleTimerRef.current = window.setTimeout(callback, endTime);
    };

    const cycle = () => {
      if (!runningRef.current) return;
      fadeIn(() => {
        if (!runningRef.current) return;
        fadeOut(() => {
          if (!runningRef.current) return;
          cycle();
        });
      });
    };

    cycle();

    return () => {
      runningRef.current = false;
      clearTimers();
    };
  }, [autoplay, inView, config]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: gridSize,
          height: gridSize,
          display: "grid",
          gridTemplateColumns: `repeat(3, ${cellSize}px)`,
          gridTemplateRows: `repeat(3, ${cellSize}px)`,
          gap: cellGap,
          filter: bloom
            ? `blur(${bloomAmount}px) brightness(1.5)`
            : "none",
        }}
      >
        {Array.from({ length: 9 }).map((_, idx) => {
          const colors = getCellColors(idx);
          const on = cellStates[idx];
          return (
            <div
              key={idx}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius,
                backgroundColor: on ? colors.on : colors.off,
                boxShadow: on
                  ? `0 0 ${cellSize}px ${colors.glow}, 0 0 ${cellSize * 2}px ${colors.glow}`
                  : "none",
                transition:
                  "background-color 300ms ease-out, box-shadow 300ms ease-out",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PixelGrid;
