"use client";

import { useState } from "react";
import PixelGrid from "@/components/mine/do-not-share/pixel-grid";
import DotSpinnerMatrix, {
  SPINNER_VARIANTS,
  type SpinnerVariantKey,
} from "@/components/mine/do-not-share/dot-spinner-matrix";

const ANIMATIONS = [
  "wave-lr",
  "wave-rl",
  "wave-tb",
  "wave-bt",
  "spiral-cw",
  "corners-first",
  "center-out",
  "diagonal-tl",
  "snake",
  "cross",
  "checkerboard",
  "rain",
  "pinwheel",
  "orbit",
  "converge",
  "zigzag",
  "aurora",
  "ember",
  "prism",
  "neon-cross",
  "tide",
  "sunset",
  "toxic",
  "frost",
] as const;

const COLORS = [
  "cyan",
  "magenta",
  "yellow",
  "green",
  "orange",
  "blue",
  "red",
  "purple",
  "white",
  "teal",
  "pink",
  "lime",
] as const;

type Animation = (typeof ANIMATIONS)[number];
type Color = (typeof COLORS)[number];
type Tool = "pixel-grid" | "dot-spinner";

const Page = () => {
  const [tool, setTool] = useState<Tool>("pixel-grid");
  const [animation, setAnimation] = useState<Animation>("wave-lr");
  const [color, setColor] = useState<Color>("cyan");
  const [bloom, setBloom] = useState(false);
  const [spinnerVariant, setSpinnerVariant] =
    useState<SpinnerVariantKey>("perimeter-cw");
  const [spinnerColor, setSpinnerColor] = useState<Color>("cyan");
  const [spinnerSize, setSpinnerSize] = useState(5);
  const [spinnerSpeed, setSpinnerSpeed] = useState(80);
  const [spinnerTrail, setSpinnerTrail] = useState(4);
  const [presetsPage, setPresetsPage] = useState(0);
  const [variantsPage, setVariantsPage] = useState(0);

  const PER_PAGE = 6;
  const presetsPageCount = Math.ceil(ANIMATIONS.length / PER_PAGE);
  const variantsPageCount = Math.ceil(SPINNER_VARIANTS.length / PER_PAGE);
  const visiblePresets = ANIMATIONS.slice(
    presetsPage * PER_PAGE,
    (presetsPage + 1) * PER_PAGE,
  );
  const visibleVariants = SPINNER_VARIANTS.slice(
    variantsPage * PER_PAGE,
    (variantsPage + 1) * PER_PAGE,
  );

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 inline-flex rounded-lg border border-white/10 bg-neutral-950 p-1">
          {(["pixel-grid", "dot-spinner"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                tool === t
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {t === "pixel-grid" ? "Pixel Grid" : "Dot Spinner Matrix"}
            </button>
          ))}
        </div>

        {tool === "pixel-grid" && (
          <>
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Pixel Grid</h1>
          <p className="mt-2 text-sm text-neutral-400">
            A faithful recreation of the Framer PixelGrid-3 component. 24
            animation presets, 12 colors, optional bloom.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_320px]">
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-white/5 bg-neutral-950">
            <div className="h-[320px] w-[320px]">
              <PixelGrid
                animation={animation}
                color={color}
                bloom={bloom}
                cellSize={88}
                cellGap={14}
                borderRadius={16}
              />
            </div>
          </div>

          <aside className="space-y-6">
            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Animation
              </h2>
              <div className="grid grid-cols-3 gap-1.5">
                {ANIMATIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnimation(a)}
                    className={`rounded-md border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                      animation === a
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/5 bg-neutral-950 text-neutral-400 hover:border-white/10 hover:text-neutral-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Color
              </h2>
              <div className="grid grid-cols-6 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    title={c}
                    className={`aspect-square rounded-md border transition-transform ${
                      color === c
                        ? "border-white/60 scale-105"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    style={{ backgroundColor: colorSwatch(c) }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Options
              </h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={bloom}
                  onChange={(e) => setBloom(e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                Bloom
              </label>
            </div>
          </aside>
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500">
              All presets
            </h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <button
                onClick={() => setPresetsPage((p) => Math.max(0, p - 1))}
                disabled={presetsPage === 0}
                className="rounded-md border border-white/10 px-2 py-1 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Prev
              </button>
              <span className="tabular-nums">
                {presetsPage + 1} / {presetsPageCount}
              </span>
              <button
                onClick={() =>
                  setPresetsPage((p) => Math.min(presetsPageCount - 1, p + 1))
                }
                disabled={presetsPage >= presetsPageCount - 1}
                className="rounded-md border border-white/10 px-2 py-1 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visiblePresets.map((a) => (
              <button
                key={a}
                onClick={() => setAnimation(a)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-neutral-950 p-4 transition-colors hover:border-white/15"
              >
                <div className="h-[80px] w-[80px]">
                  <PixelGrid
                    animation={a}
                    color={color}
                    cellSize={20}
                    cellGap={4}
                    borderRadius={4}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300">
                  {a}
                </span>
              </button>
            ))}
          </div>
        </section>

          </>
        )}

        {tool === "dot-spinner" && (
          <>
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">
            Dot Spinner Matrix
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            A grid of dots with a traveling spinner. {SPINNER_VARIANTS.length}{" "}
            variants covering perimeter orbits, concentric rings, radial sweeps,
            diagonal waves, spirals, scanlines, matrix rain, and more.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_320px]">
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-white/5 bg-neutral-950">
            <DotSpinnerMatrix
              variant={spinnerVariant}
              color={spinnerColor}
              size={spinnerSize}
              dotSize={28}
              gap={16}
              speed={spinnerSpeed}
              trail={spinnerTrail}
            />
          </div>

          <aside className="space-y-6">
            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Variant
              </h2>
              <div className="grid max-h-[280px] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                {SPINNER_VARIANTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSpinnerVariant(v)}
                    className={`rounded-md border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                      spinnerVariant === v
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/5 bg-neutral-950 text-neutral-400 hover:border-white/10 hover:text-neutral-200"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Color
              </h2>
              <div className="grid grid-cols-6 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSpinnerColor(c)}
                    title={c}
                    className={`aspect-square rounded-md border transition-transform ${
                      spinnerColor === c
                        ? "border-white/60 scale-105"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    style={{ backgroundColor: colorSwatch(c) }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Grid size: {spinnerSize}×{spinnerSize}
              </h2>
              <input
                type="range"
                min={3}
                max={9}
                step={2}
                value={spinnerSize}
                onChange={(e) => setSpinnerSize(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Speed: {spinnerSpeed}ms
              </h2>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={spinnerSpeed}
                onChange={(e) => setSpinnerSpeed(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            <div>
              <h2 className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
                Trail: {spinnerTrail}
              </h2>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={spinnerTrail}
                onChange={(e) => setSpinnerTrail(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>
          </aside>
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500">
              All variants
            </h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <button
                onClick={() => setVariantsPage((p) => Math.max(0, p - 1))}
                disabled={variantsPage === 0}
                className="rounded-md border border-white/10 px-2 py-1 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Prev
              </button>
              <span className="tabular-nums">
                {variantsPage + 1} / {variantsPageCount}
              </span>
              <button
                onClick={() =>
                  setVariantsPage((p) => Math.min(variantsPageCount - 1, p + 1))
                }
                disabled={variantsPage >= variantsPageCount - 1}
                className="rounded-md border border-white/10 px-2 py-1 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visibleVariants.map((v) => (
              <button
                key={v}
                onClick={() => setSpinnerVariant(v)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-neutral-950 p-4 transition-colors hover:border-white/15"
              >
                <DotSpinnerMatrix
                  variant={v}
                  color={spinnerColor}
                  size={5}
                  dotSize={10}
                  gap={4}
                  speed={spinnerSpeed}
                  trail={spinnerTrail}
                />
                <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300">
                  {v}
                </span>
              </button>
            ))}
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
};

const colorSwatch = (c: Color): string => {
  const map: Record<Color, string> = {
    cyan: "oklch(80% 0.25 195)",
    magenta: "oklch(75% 0.3 330)",
    yellow: "oklch(90% 0.25 90)",
    green: "oklch(80% 0.3 145)",
    orange: "oklch(75% 0.28 50)",
    blue: "oklch(70% 0.28 260)",
    red: "oklch(60% 0.3 25)",
    purple: "oklch(65% 0.28 300)",
    white: "oklch(95% 0 0)",
    teal: "oklch(72% 0.24 175)",
    pink: "oklch(70% 0.26 350)",
    lime: "oklch(80% 0.28 120)",
  };
  return map[c];
};

export default Page;
