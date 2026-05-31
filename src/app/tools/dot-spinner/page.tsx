"use client";

import Link from "next/link";
import { useState } from "react";
import DotSpinnerMatrix, {
  SPINNER_VARIANTS,
  type SpinnerVariantKey,
} from "@/components/mine/do-not-share/dot-spinner-matrix";
import { COLORS, colorSwatch } from "../colors";

const PER_PAGE = 6;

const Page = () => {
  const [spinnerVariant, setSpinnerVariant] =
    useState<SpinnerVariantKey>("perimeter-cw");
  const [spinnerColor, setSpinnerColor] =
    useState<(typeof COLORS)[number]>("cyan");
  const [spinnerSize, setSpinnerSize] = useState(5);
  const [spinnerSpeed, setSpinnerSpeed] = useState(80);
  const [spinnerTrail, setSpinnerTrail] = useState(4);
  const [variantsPage, setVariantsPage] = useState(0);

  const variantsPageCount = Math.ceil(SPINNER_VARIANTS.length / PER_PAGE);
  const visibleVariants = SPINNER_VARIANTS.slice(
    variantsPage * PER_PAGE,
    (variantsPage + 1) * PER_PAGE,
  );

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <nav className="mb-8 flex items-center gap-2 text-xs">
          <Link
            href="/tools"
            className="rounded-md border border-white/5 px-4 py-1.5 font-medium text-neutral-400 transition-colors hover:border-white/10 hover:text-neutral-200"
          >
            ← Tools
          </Link>
          <Link
            href="/tools/pixel-grid"
            className="rounded-md border border-white/5 px-4 py-1.5 font-medium text-neutral-400 transition-colors hover:border-white/10 hover:text-neutral-200"
          >
            Pixel Grid
          </Link>
          <span className="rounded-md border border-white/40 bg-white/10 px-4 py-1.5 font-medium">
            Dot Spinner Matrix
          </span>
        </nav>

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
      </div>
    </div>
  );
};

export default Page;
