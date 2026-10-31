"use client";

/**
 * Glass control panel for the light funnel: palette swatches, scrubbable sliders,
 * randomise and reset. H hides it.
 */

import { ArrowReloadHorizontalIcon, ShuffleIcon, SlidersHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { GROUPS, matchesPreset, PALETTES, PRESETS, type Control, type Settings } from "./settings";

const toCss = ([r, g, b]: [number, number, number]) =>
  `rgb(${Math.round(Math.min(1, r) * 255)} ${Math.round(Math.min(1, g) * 255)} ${Math.round(Math.min(1, b) * 255)})`;

const HUE_TRACK = "linear-gradient(90deg, #ff5a3c, #ffc23c, #6dff7a, #3cd6ff, #6b5cff, #ff4fd8, #ff5a3c)";

function Scrubber({ control, value, onChange }: { control: Control; value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { min, max, step } = control;
  const t = (value - min) / (max - min);
  const zero = min < 0 ? -min / (max - min) : 0;

  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)));
  const fromPointer = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    set(min + ((e.clientX - r.left) / r.width) * (max - min));
  };
  const onKey = (e: KeyboardEvent) => {
    const big = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") set(value + step * big);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") set(value - step * big);
    else return;
    e.preventDefault();
  };
  const hue = control.key === "hue";

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={control.label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && fromPointer(e)}
      className="group relative h-[26px] cursor-ew-resize overflow-hidden rounded-[6px] bg-white/[0.04] outline-none focus-visible:ring-1 focus-visible:ring-[#f0643c]/70"
    >
      {hue ? (
        <div className="absolute inset-0 opacity-30" style={{ background: HUE_TRACK }} />
      ) : (
        <div
          className="absolute inset-y-0 bg-white/[0.09] transition-colors group-hover:bg-white/[0.12]"
          style={{ left: `${Math.min(zero, t) * 100}%`, width: `${Math.abs(t - zero) * 100}%` }}
        />
      )}
      <div className="absolute inset-y-1.5 w-px bg-[#f0643c]" style={{ left: `calc(${t * 100}% - ${t}px)` }} />
      <div className="pointer-events-none relative flex h-full items-center justify-between px-2.5 text-[12px]">
        <span className="text-white/55">{control.label}</span>
        <span className="tabular-nums text-white/90">{control.format ? control.format(value) : value.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function ControlPanel({
  settings,
  onChange,
  onRandomize,
  onReset,
  open,
  onToggle,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onRandomize: () => void;
  onReset: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  const button =
    "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[6px] bg-white/[0.05] text-[12px] text-white/75 transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/[0.09] hover:text-white active:scale-[0.97]";

  return (
    <div
      data-panel
      className="absolute top-1/2 left-4 z-40 w-[260px] -translate-y-1/2 select-none max-md:top-auto max-md:left-3 max-md:bottom-16 max-md:w-[calc(100%-24px)] max-md:translate-y-0"
    >
      <div
        className={`overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#0d0b0a]/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-[opacity,translate,filter] duration-300 ease-out ${
          open ? "translate-x-0 opacity-100 blur-0" : "pointer-events-none -translate-x-4 opacity-0 blur-sm"
        }`}
      >
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
          <span className="text-[13px] font-medium text-white/90">Light funnel</span>
          <span className="text-[11px] tabular-nums text-white/35">H to hide</span>
        </div>

        <div className="max-h-[calc(100dvh-150px)] overflow-y-auto px-3.5 pb-3.5 [scrollbar-width:none]">
          <section className="pb-2.5">
            <div className="mb-2 text-[12px] text-white/40">Presets</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const active = matchesPreset(settings, p.settings);
                return (
                  <button
                    key={p.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(p.settings)}
                    className={`h-7 rounded-[6px] px-2.5 text-[12px] transition-[background-color,color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] ${
                      active
                        ? "bg-white/[0.08] text-white shadow-[0_0_0_1.5px_#f0643c]"
                        : "bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border-t border-white/[0.06] py-2.5">
            <div className="mb-2 flex items-baseline justify-between text-[12px]">
              <span className="text-white/40">Palette</span>
              <span className="text-white/80">{PALETTES[settings.palette].name}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {PALETTES.map((p, i) => {
                const active = i === settings.palette;
                return (
                  <button
                    key={p.name}
                    type="button"
                    aria-label={p.name}
                    aria-pressed={active}
                    onClick={() => onChange({ palette: i })}
                    className={`aspect-square rounded-[6px] p-[3px] transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.94] ${
                      active ? "shadow-[0_0_0_1.5px_#f0643c]" : "shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)]"
                    }`}
                  >
                    <span
                      className="block size-full rounded-[4px]"
                      style={{ background: `linear-gradient(135deg, ${[0, 1, 2, 3, 4].map((k) => toCss(p.colors[k])).join(", ")})` }}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          {GROUPS.map((group) => (
            <section key={group.title} className="border-t border-white/[0.06] py-2.5">
              <div className="mb-2 text-[12px] text-white/40">{group.title}</div>
              <div className="flex flex-col gap-[3px]">
                {group.controls.map((c) => (
                  <Scrubber key={c.key} control={c} value={settings[c.key]} onChange={(v) => onChange({ [c.key]: v })} />
                ))}
              </div>
            </section>
          ))}

          <div className="mt-1 flex gap-1.5">
            <button type="button" onClick={onRandomize} className={button}>
              <HugeiconsIcon icon={ShuffleIcon} size={14} strokeWidth={1.75} />
              Randomise
            </button>
            <button type="button" onClick={onReset} className={button}>
              <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} strokeWidth={1.75} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {!open && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Show controls"
          className="absolute top-1/2 left-0 grid size-9 -translate-y-1/2 place-items-center rounded-[6px] border border-white/[0.08] bg-[#0d0b0a]/60 text-white/70 backdrop-blur-xl transition-colors hover:text-white"
        >
          <HugeiconsIcon icon={SlidersHorizontalIcon} size={16} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
