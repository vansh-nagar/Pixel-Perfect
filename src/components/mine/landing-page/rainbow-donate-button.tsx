"use client";

import { useState } from "react";
import RainbowGlowingButton, {
  type RainbowColors,
} from "registry/new-york/buttons/rainbow-glowing-button";

const DONATE_URL =
  "https://buy.polar.sh/polar_cl_f2wnG1ytyvuNI3PIlhnvmlIm3Z7IKK25YZeqR49IQbB";

const DEFAULT_COLORS: RainbowColors = [
  "#fe0002",
  "#fe7902",
  "#fffe03",
  "#13dd17",
  "#0088ff",
  "#cf04f5",
];

const RainbowDonateButton = () => {
  const [colors, setColors] = useState<RainbowColors>(DEFAULT_COLORS);
  const [autoCycle, setAutoCycle] = useState(true);
  const [cycleMs, setCycleMs] = useState(500);

  const updateColor = (index: number, value: string) =>
    setColors((prev) => {
      const next = [...prev] as RainbowColors;
      next[index] = value;
      return next;
    });

  const reset = () => {
    setColors(DEFAULT_COLORS);
    setAutoCycle(true);
    setCycleMs(500);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <RainbowGlowingButton
        colors={colors}
        autoCycle={autoCycle}
        cycleMs={cycleMs}
        transitionMs={cycleMs}
        onClick={() => {
          window.location.href = DONATE_URL;
        }}
      >
        Donate Now
      </RainbowGlowingButton>

      <div className="mt-8 w-full max-w-xs rounded-xl border border-muted bg-background/40 p-4 text-left backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
            Customize glow
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 transition-colors hover:text-foreground"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {colors.map((color, index) => (
            <label
              key={index}
              className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-muted"
              style={{ background: color }}
              title={`Glow color ${index + 1}`}
            >
              <input
                type="color"
                value={color}
                onChange={(event) => updateColor(index, event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={`Glow color ${index + 1}`}
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={autoCycle}
              onChange={(event) => setAutoCycle(event.target.checked)}
              className="accent-foreground"
            />
            Auto cycle
          </label>
          <label className="flex flex-1 items-center justify-end gap-2">
            <span className={autoCycle ? "" : "opacity-40"}>Speed</span>
            <input
              type="range"
              min={120}
              max={1000}
              step={20}
              value={1120 - cycleMs}
              onChange={(event) => setCycleMs(1120 - Number(event.target.value))}
              disabled={!autoCycle}
              className="w-24 accent-foreground disabled:opacity-40"
              aria-label="Glow cycle speed"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default RainbowDonateButton;
