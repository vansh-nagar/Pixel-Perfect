"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Glass } from "./Glass";
import { GlassButton } from "./GlassButton";
import { generateLensMap, type GeneratedMap } from "./lib/displacement";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plus, X, Copy, Check } from "lucide-react";

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
  edgeHighlight: 0.33,
  edgeHighlightAngle: 0,
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
  { key: "edgeHighlight", label: "Edge Highlight", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "edgeHighlightAngle", label: "Edge Angle", min: 0, max: 360, step: 1, decimals: 0 },
  { key: "specular", label: "Specular", min: 0, max: 1, step: 0.01, decimals: 2 },
  { key: "specularAngle", label: "Specular Angle", min: 0, max: 360, step: 1, decimals: 0 },
  { key: "specularBlur", label: "Specular Blur", min: 0, max: 30, step: 0.5, decimals: 1 },
];

// The two columns fill row by row: Width | Height, BorderRadius | Scale, …
const LEFT_CONTROLS = CONTROLS.filter((_, i) => i % 2 === 0);
const RIGHT_CONTROLS = CONTROLS.filter((_, i) => i % 2 === 1);

const PANEL = 330; // square preview size, px
const TILE = 210; // saved-snapshot tile size, px
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

  // Saved snapshots: each "+" freezes the current settings into a tile below.
  const [snapshots, setSnapshots] = useState<{ id: number; settings: State }[]>(
    []
  );
  const nextId = useRef(0);
  const addSnapshot = useCallback(
    () =>
      setSnapshots((prev) => [...prev, { id: nextId.current++, settings: s }]),
    [s]
  );
  const removeSnapshot = useCallback(
    (id: number) =>
      setSnapshots((prev) => prev.filter((snap) => snap.id !== id)),
    []
  );

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
                glow={0}
                edgeHighlight={s.edgeHighlight}
                edgeHighlightAngle={s.edgeHighlightAngle}
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

          {/* Snapshots — each "+" freezes the current settings into a tile. */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={addSnapshot}
              title="Save current settings as a tile"
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-violet-500/60 hover:text-foreground"
              style={{ width: TILE, height: TILE }}
            >
              <Plus className="size-7" />
              <span className="text-xs">Add snapshot</span>
            </button>
            {snapshots.map(({ id, settings }) => (
              <SnapshotTile
                key={id}
                id={id}
                settings={settings}
                onRemove={() => removeSnapshot(id)}
              />
            ))}
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

// A frozen tile: the current settings captured into a fixed-size glass rectangle
// that refracts the content behind it, plus copy / remove actions.
function SnapshotTile({
  id,
  settings: s,
  onRemove,
}: {
  id: number;
  settings: State;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const sig = MAP_KEYS.map((k) => s[k]).join("|");
  const map = useMemo<GeneratedMap | null>(() => {
    if (typeof window === "undefined") return null;
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
  }, [sig]);
  // Unique per tile so duplicate settings don't share (and fight over) a filter ID.
  const version = useMemo(() => hashString(`${id}:${sig}`), [id, sig]);

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(buildSnapshotCode(s)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [s]);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border"
      style={{ width: TILE, height: TILE }}
    >
      <RefractableContent />
      <Glass
        map={map}
        version={version}
        width={s.width}
        height={s.height}
        borderRadius={s.borderRadius}
        x={(TILE - s.width) / 2}
        y={(TILE - s.height) / 2}
        chroma={s.chroma}
        blur={s.blur}
        glow={0}
        edgeHighlight={s.edgeHighlight}
        edgeHighlightAngle={s.edgeHighlightAngle}
        specular={s.specular}
        specularAngle={s.specularAngle}
        specularBlur={s.specularBlur}
      />
      <div className="absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onCopy}
          title="Copy as a self-contained component"
          className="flex size-6 items-center justify-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="flex size-6 items-center justify-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// Emit a self-contained React component for a snapshot: the displacement
// generator and the glass rectangle, with every value baked in. Paste it
// anywhere — it refracts whatever sits behind it (needs textured content).
function buildSnapshotCode(s: State): string {
  return `"use client";

import { CSSProperties, useMemo } from "react";

// ---- Displacement-map generator (feDisplacementMap drives the refraction) ----
type LensParams = {
  width: number;
  height: number;
  borderRadius: number;
  scale: number;
  depth: number;
  curvature: number;
  splay: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smoothStep = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1e-6), 0, 1);
  return x * x * (3 - 2 * x);
};
const roundedRectSDF = (x: number, y: number, halfW: number, halfH: number, radius: number) => {
  const r = Math.min(radius, Math.min(halfW, halfH));
  const qx = Math.abs(x) - (halfW - r);
  const qy = Math.abs(y) - (halfH - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r;
};

function generateLensMap(p: LensParams) {
  const w = Math.max(2, Math.round(p.width));
  const h = Math.max(2, Math.round(p.height));
  const halfW = w / 2;
  const halfH = h / 2;
  const depth = Math.max(0.5, p.depth);
  const strength = p.scale * Math.min(w, h);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);

  const qw = Math.ceil(w / 2);
  const qh = Math.ceil(h / 2);
  const dxQuad = new Float32Array(qw * qh);
  const dyQuad = new Float32Array(qw * qh);
  let maxAbs = 1e-6;

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const d = roundedRectSDF(px, py, halfW, halfH, p.borderRadius);
      let dx = 0;
      let dy = 0;
      if (d < 0) {
        const e = 0.75;
        const gx =
          roundedRectSDF(px + e, py, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px - e, py, halfW, halfH, p.borderRadius);
        const gy =
          roundedRectSDF(px, py + e, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px, py - e, halfW, halfH, p.borderRadius);
        const len = Math.hypot(gx, gy) || 1;
        const edge = clamp((d + depth) / depth, 0, 1);
        const curve = clamp(p.curvature, 0, 1);
        const exponent = 5 - 4.6 * curve;
        const profile = Math.pow(smoothStep(0, 1, edge), exponent);
        const amount = profile * strength * p.splay;
        dx = (gx / len) * amount;
        dy = (gy / len) * amount;
      }
      dxQuad[y * qw + x] = dx;
      dyQuad[y * qw + x] = dy;
      maxAbs = Math.max(maxAbs, Math.abs(dx), Math.abs(dy));
    }
  }

  const data = img.data;
  const put = (x: number, y: number, dx: number, dy: number) => {
    const i = (y * w + x) * 4;
    data[i] = (0.5 + 0.5 * (dx / maxAbs)) * 255;
    data[i + 1] = (0.5 + 0.5 * (dy / maxAbs)) * 255;
    data[i + 2] = 128;
    data[i + 3] = 255;
  };
  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const dx = dxQuad[y * qw + x];
      const dy = dyQuad[y * qw + x];
      const mx = w - 1 - x;
      const my = h - 1 - y;
      put(x, y, dx, dy);
      put(mx, y, -dx, dy);
      put(x, my, dx, -dy);
      put(mx, my, -dx, -dy);
    }
  }
  ctx.putImageData(img, 0, 0);
  return { dataUrl: canvas.toDataURL("image/png"), scale: 2 * maxAbs, chromaAmount: maxAbs };
}

// ---- Frozen settings (captured from the glass playground) ----
const S = {
  width: ${s.width},
  height: ${s.height},
  borderRadius: ${s.borderRadius},
  scale: ${s.scale},
  depth: ${s.depth},
  curvature: ${s.curvature},
  splay: ${s.splay},
  chroma: ${s.chroma},
  blur: ${s.blur},
  edgeHighlight: ${s.edgeHighlight},
  edgeHighlightAngle: ${s.edgeHighlightAngle},
  specular: ${s.specular},
  specularAngle: ${s.specularAngle},
  specularBlur: ${s.specularBlur},
};

// A self-contained glass rectangle. Place it over textured content — it refracts
// whatever is painted behind it.
export default function GlassRectangle() {
  const map = useMemo(() => {
    if (typeof window === "undefined") return null;
    return generateLensMap(S);
  }, []);

  const filterId = "glass-rectangle";
  const lensScale = map?.scale ?? 0;
  const spread = S.chroma * (map?.chromaAmount ?? 0) * 0.6;
  const scaleR = lensScale + spread;
  const scaleG = lensScale;
  const scaleB = lensScale - spread;
  const frost = Math.min(0.22, S.blur * 0.02);

  // Rim light direction: 0 = top-lit; the bright/dark pair rotates with the angle.
  const rimRad = (S.edgeHighlightAngle * Math.PI) / 180;
  const rimX = +Math.sin(rimRad).toFixed(3);
  const rimY = +Math.cos(rimRad).toFixed(3);

  const lensStyle: CSSProperties = {
    position: "relative",
    width: S.width,
    height: S.height,
    borderRadius: S.borderRadius,
    overflow: "hidden",
    backdropFilter: map ? \`url(#\${filterId})\` : undefined,
    WebkitBackdropFilter: map ? \`url(#\${filterId})\` : undefined,
    backgroundColor: \`rgba(255,255,255,\${frost})\`,
    boxShadow: [
      \`inset \${rimX}px \${rimY}px 1px rgba(255,255,255,\${0.5 * S.edgeHighlight})\`,
      \`inset 0 0 0 1px rgba(255,255,255,\${0.35 * S.edgeHighlight})\`,
      \`inset \${-rimX}px \${-rimY}px 2px rgba(0,0,0,\${0.12 * S.edgeHighlight})\`,
    ].join(", "),
  };

  const sheenStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: S.borderRadius,
    pointerEvents: "none",
    background: \`linear-gradient(\${S.specularAngle}deg, rgba(255,255,255,\${
      0.9 * S.specular
    }) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,\${
      0.45 * S.specular
    }) 100%)\`,
    filter: S.specularBlur > 0 ? \`blur(\${S.specularBlur}px)\` : undefined,
    mixBlendMode: "screen",
  };

  return (
    <div style={lensStyle}>
      {map && (
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
              <feImage href={map.dataUrl} x="0" y="0" width={S.width} height={S.height} preserveAspectRatio="none" result="map" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={scaleR} xChannelSelector="R" yChannelSelector="G" result="dispR" />
              <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={scaleG} xChannelSelector="R" yChannelSelector="G" result="dispG" />
              <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={scaleB} xChannelSelector="R" yChannelSelector="G" result="dispB" />
              <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="rgb" />
              <feGaussianBlur in="rgb" stdDeviation={S.blur} />
            </filter>
          </defs>
        </svg>
      )}
      <div style={sheenStyle} />
    </div>
  );
}
`;
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
