"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Glass } from "./Glass";
import { GlassButton } from "./GlassButton";
import { generateLensMap, type GeneratedMap } from "./lib/displacement";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

// The article's default values for the interactive demo.
const DEFAULTS = {
  width: 120,
  height: 80,
  borderRadius: 64,
  scale: 0.151,
  depth: 5,
  curvature: 0.5,
  splay: 1.0,
  chroma: 1.0,
  blur: 5.0,
  glow: 0.1,
  edgeHighlight: 0.33,
  specular: 0.35,
  specularAngle: 45,
  specularBlur: 6,
};

type State = typeof DEFAULTS;

// Controls that reshape the displacement map (regenerate) vs. those that only
// retune the filter / CSS passes (no regen — these stay cheap to drag).
const MAP_KEYS = [
  "width",
  "height",
  "borderRadius",
  "scale",
  "depth",
  "curvature",
  "splay",
] as const;

type Control = {
  key: keyof State;
  label: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
};

const CONTROLS: Control[] = [
  { key: "width", label: "Width", min: 40, max: 300, step: 1, decimals: 0 },
  { key: "height", label: "Height", min: 40, max: 300, step: 1, decimals: 0 },
  { key: "borderRadius", label: "BorderRadius", min: 0, max: 150, step: 1, decimals: 0 },
  { key: "scale", label: "Scale", min: 0, max: 0.5, step: 0.001, decimals: 3 },
  { key: "depth", label: "Depth", min: 1, max: 40, step: 0.5, decimals: 1 },
  { key: "curvature", label: "Curvature", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "splay", label: "Splay", min: 0, max: 3, step: 0.01, decimals: 2 },
  { key: "chroma", label: "Chroma", min: 0, max: 3, step: 0.01, decimals: 2 },
  { key: "blur", label: "Blur", min: 0, max: 16, step: 0.1, decimals: 1 },
  { key: "glow", label: "Glow", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "edgeHighlight", label: "Edge Highlight", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "specular", label: "Specular", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "specularAngle", label: "Specular Angle", min: 0, max: 360, step: 1, decimals: 0 },
  { key: "specularBlur", label: "Specular Blur", min: 0, max: 30, step: 0.5, decimals: 1 },
];

// The two columns fill row by row: Width | Height, BorderRadius | Scale, …
const LEFT_CONTROLS = CONTROLS.filter((_, i) => i % 2 === 0);
const RIGHT_CONTROLS = CONTROLS.filter((_, i) => i % 2 === 1);

const PANEL = 330; // square preview size, px
const MAP_BG = "#8b8b8f"; // neutral grey so the map's colours read cleanly

// Tint the shared Slider violet without forking the component: reach its inner
// range / thumb slots via arbitrary variants.
const SLIDER_CLS =
  "flex-1 min-w-0 [&_[data-slot=slider-range]]:bg-violet-500 [&_[data-slot=slider-thumb]]:border-violet-500/70";

// Small stable string hash → a selector-safe numeric token for the filter ID.
function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export default function GlassPage() {
  const [s, setS] = useState<State>(DEFAULTS);

  // The lens floats over the content; drag it around. Position is its centre.
  const [center, setCenter] = useState({ x: PANEL / 2, y: PANEL / 2 });
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const set = useCallback(
    (key: keyof State, value: number) => setS((p) => ({ ...p, [key]: value })),
    []
  );

  // Rebuild the map only when the shape changes — never on a plain move — so
  // dragging stays cheap. Derived during render (no effect, no cascading state).
  const mapSignature = MAP_KEYS.map((k) => s[k]).join("|");
  const map = useMemo<GeneratedMap | null>(() => {
    if (typeof window === "undefined") return null; // skip on the server
    return generateLensMap({
      width: s.width,
      height: s.height,
      borderRadius: s.borderRadius,
      scale: s.scale,
      depth: s.depth,
      curvature: s.curvature,
      splay: s.splay,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapSignature]);

  // Safari caches filter output by filter ID, so a fresh ID per shape change
  // forces it to read the new map. Hashing the signature gives a new, stable,
  // selector-safe token exactly when (and only when) the map changes.
  const version = useMemo(() => hashString(mapSignature), [mapSignature]);

  // Keep the lens inside the stage even as the lens grows — clamp at render time
  // rather than writing back to state from an effect.
  const clampCenter = useCallback(
    (cx: number, cy: number) => ({
      x: Math.max(s.width / 2, Math.min(PANEL - s.width / 2, cx)),
      y: Math.max(s.height / 2, Math.min(PANEL - s.height / 2, cy)),
    }),
    [s.width, s.height]
  );
  const pos = useMemo(
    () => clampCenter(center.x, center.y),
    [center, clampCenter]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      dx: e.clientX - rect.left - pos.x,
      dy: e.clientY - rect.top - pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left - dragRef.current.dx;
    const cy = e.clientY - rect.top - dragRef.current.dy;
    setCenter(clampCenter(cx, cy));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).style.cursor = "grab";
  };

  // Scale the map preview up to fill its panel while keeping the lens aspect.
  const mapPreview = useMemo(() => {
    const fit = Math.min((PANEL - 48) / s.width, (PANEL - 48) / s.height);
    return { w: s.width * fit, h: s.height * fit };
  }, [s.width, s.height]);

  const renderRow = (c: Control) => (
    <ControlRow
      key={c.key}
      label={c.label}
      value={s[c.key]}
      min={c.min}
      max={c.max}
      step={c.step}
      decimals={c.decimals}
      onChange={(v) => set(c.key, v)}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex justify-center px-6 py-12">
        <div className="w-max max-w-full">
          {/* Previews: refracted result + the map that drives it. */}
          <div className="flex flex-wrap justify-center gap-5">
            <div
              ref={stageRef}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative overflow-hidden rounded-3xl border border-border"
              style={{ width: PANEL, height: PANEL }}
            >
              <RefractableContent />
              <Glass
                map={map}
                version={version}
                width={s.width}
                height={s.height}
                borderRadius={s.borderRadius}
                x={pos.x - s.width / 2}
                y={pos.y - s.height / 2}
                chroma={s.chroma}
                blur={s.blur}
                glow={s.glow}
                edgeHighlight={s.edgeHighlight}
                specular={s.specular}
                specularAngle={s.specularAngle}
                specularBlur={s.specularBlur}
                onPointerDown={onPointerDown}
              />
            </div>

            <div
              className="flex items-center justify-center overflow-hidden rounded-3xl border border-border"
              style={{ width: PANEL, height: PANEL, backgroundColor: MAP_BG }}
            >
              {map && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Generated displacement map"
                  src={map.dataUrl}
                  width={mapPreview.w}
                  height={mapPreview.h}
                  style={{
                    width: mapPreview.w,
                    height: mapPreview.h,
                    borderRadius: s.borderRadius * (mapPreview.w / s.width),
                  }}
                />
              )}
            </div>
          </div>

          {/* Caption. */}
          <p className="my-6 text-center text-sm text-muted-foreground">
            On the left is the refracted result, on the right the map that drives
            it.
          </p>

          {/* Controls — two columns split by a divider. */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-y-0">
              <div className="space-y-5 sm:pr-8">
                {LEFT_CONTROLS.map(renderRow)}
              </div>
              <div className="space-y-5 sm:border-l sm:border-border sm:pl-8">
                {RIGHT_CONTROLS.map(renderRow)}
              </div>
            </div>
          </div>

          {/* A glass button — it refracts the strip behind it; press to squeeze. */}
          <div
            className="mt-6 flex items-center justify-center rounded-xl border border-border p-12"
            style={{
              background:
                "linear-gradient(120deg, #7c3aed 0%, #ec4899 45%, #06b6d4 100%)",
            }}
          >
            <GlassButton>hello</GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlRow({
  label,
  value,
  min,
  max,
  step,
  decimals,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 whitespace-nowrap text-[13px] font-normal text-muted-foreground">
        {label}
      </Label>
      <Slider
        className={SLIDER_CLS}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      <span className="w-12 shrink-0 text-right font-mono text-[13px] tabular-nums text-foreground/80">
        {value.toFixed(decimals)}
      </span>
    </div>
  );
}

// Distinct objects — emojis + shapes — scattered on a plain field with a faint
// grid. Recognisable edges are what make the refraction obvious as the lens
// passes over them; a flat gradient would barely show the bend.
const SHAPES = [
  { left: "69%", top: "9%", className: "h-14 w-14 rounded-full", bg: "#f59e0b" },
  { left: "15%", top: "40%", className: "h-12 w-12 rounded-md rotate-12", bg: "#38bdf8" },
  { left: "26%", top: "65%", className: "h-11 w-11 rounded-full", bg: "#fb7185" },
  { left: "50%", top: "72%", className: "h-12 w-12 rounded-lg -rotate-6", bg: "#34d399" },
];
const EMOJIS = [
  { left: "10%", top: "11%", size: "text-5xl", char: "💎" },
  { left: "43%", top: "16%", size: "text-4xl", char: "🍓" },
  { left: "68%", top: "38%", size: "text-4xl", char: "🌈" },
  { left: "12%", top: "73%", size: "text-4xl", char: "✨" },
  { left: "77%", top: "69%", size: "text-5xl", char: "🔮" },
];

function RefractableContent() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none"
      style={{ backgroundColor: "#0c0c14" }}
    >
      {/* Faint grid — a clean reference that visibly bends under the lens. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 56px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 56px)",
        }}
      />
      {SHAPES.map((s, i) => (
        <div
          key={i}
          className={`absolute ${s.className}`}
          style={{ left: s.left, top: s.top, backgroundColor: s.bg }}
        />
      ))}
      {/* A triangle near the centre so the lens refracts something on load. */}
      <div
        className="absolute"
        style={{
          left: "44%",
          top: "47%",
          width: 0,
          height: 0,
          borderLeft: "26px solid transparent",
          borderRight: "26px solid transparent",
          borderBottom: "44px solid #a78bfa",
        }}
      />
      {EMOJIS.map((e, i) => (
        <span
          key={i}
          className={`absolute ${e.size}`}
          style={{ left: e.left, top: e.top }}
        >
          {e.char}
        </span>
      ))}
    </div>
  );
}
