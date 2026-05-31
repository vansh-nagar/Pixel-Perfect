"use client";

import Link from "next/link";
import { useState } from "react";
import PixelGrid from "@/components/mine/do-not-share/pixel-grid";
import { COLORS, colorSwatch } from "../colors";

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

type Animation = (typeof ANIMATIONS)[number];

const PER_PAGE = 6;

const Page = () => {
  const [animation, setAnimation] = useState<Animation>("wave-lr");
  const [color, setColor] = useState<(typeof COLORS)[number]>("cyan");
  const [bloom, setBloom] = useState(false);
  const [presetsPage, setPresetsPage] = useState(0);

  const presetsPageCount = Math.ceil(ANIMATIONS.length / PER_PAGE);
  const visiblePresets = ANIMATIONS.slice(
    presetsPage * PER_PAGE,
    (presetsPage + 1) * PER_PAGE,
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
          <span className="rounded-md border border-white/40 bg-white/10 px-4 py-1.5 font-medium">
            Pixel Grid
          </span>
          <Link
            href="/tools/dot-spinner"
            className="rounded-md border border-white/5 px-4 py-1.5 font-medium text-neutral-400 transition-colors hover:border-white/10 hover:text-neutral-200"
          >
            Dot Spinner Matrix
          </Link>
        </nav>

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
      </div>
    </div>
  );
};

export default Page;
