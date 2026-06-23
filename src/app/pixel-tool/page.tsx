"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OrangePremiumButton from "@/components/pixel-perfect/orange-premium-button";
import PixelCreditsButton from "@/components/pixel-perfect/pixel-credits-button";

const STEP = 4;
const DEFAULT_PAD = 3;
const MIN_PAD = 0;
const MAX_PAD = 20;
const DEFAULT_GAP = 0;
const MIN_GAP = 0;
const MAX_GAP = 3.5;
const MIN_SIZE = 2;
const MAX_SIZE = 64;
const DEFAULT_SIZE = 7;
const SIZE_PRESETS = [7, 16, 24, 32];
const DEFAULT_COLOR = "#ffffff";
const COLOR_SWATCHES = [
  "#ffffff",
  "#1c1f21",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

const computeView = (size: number, pad: number) =>
  (size - 1) * STEP + pad * 2;

type Cell = 0 | 1 | 2; // 0 = empty, 1 = solid, 2 = semi (40% alpha)

const TOOLS: { id: "paint" | "semi" | "erase"; label: string; hint: string }[] =
  [
    { id: "paint", label: "Paint", hint: "Solid pixel" },
    { id: "semi", label: "Semi", hint: "40% alpha pixel" },
    { id: "erase", label: "Erase", hint: "Clear pixel" },
  ];

const emptyGrid = (size: number): Cell[][] =>
  Array.from({ length: size }, () => Array<Cell>(size).fill(0));

const resizeGrid = (g: Cell[][], newSize: number): Cell[][] =>
  Array.from({ length: newSize }, (_, r) =>
    Array.from({ length: newSize }, (_, c) => (g[r]?.[c] ?? 0) as Cell),
  );

const clampSize = (n: number) => {
  if (!Number.isFinite(n)) return DEFAULT_SIZE;
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(n)));
};

const parsePattern = (str: string): { size: number; grid: Cell[][] } => {
  const rows = str
    .trim()
    .split("\n")
    .map((r) => r.replace(/\s+/g, ""));
  const size = rows.length;
  const grid: Cell[][] = rows.map(
    (row) =>
      Array.from({ length: size }, (_, c) => {
        const ch = row[c];
        if (ch === "X" || ch === "#") return 1 as Cell;
        if (ch === "o") return 2 as Cell;
        return 0 as Cell;
      }) as Cell[],
  );
  return { size, grid };
};

const EXAMPLE_ALARM = `
..X...........X.
.XX..........XX.
XXXX........XXXX
....XXXXXXXX....
...X........X...
..X..........X..
..X.....X....X..
..X.....X....X..
..X...XXXXX..X..
..X.....X....X..
..X.....X....X..
...X........X...
....XXXXXXXX....
...X........X...
..X..........X..
.X............X.
`;

export default function PixelIconToolPage() {
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const [sizeInput, setSizeInput] = useState<string>(String(DEFAULT_SIZE));
  const [grid, setGrid] = useState<Cell[][]>(() => emptyGrid(DEFAULT_SIZE));
  const [tool, setTool] = useState<"paint" | "semi" | "erase">("paint");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [includeEmpty, setIncludeEmpty] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasBg, setCanvasBg] = useState<"dark" | "light">("dark");
  const [pad, setPad] = useState<number>(DEFAULT_PAD);
  const [gap, setGap] = useState<number>(DEFAULT_GAP);
  const [copied, setCopied] = useState(false);

  const strokeWidth = STEP - gap;

  const view = computeView(size, pad);

  const [overlay, setOverlay] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.35);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayInvert, setOverlayInvert] = useState(false);
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const overlaySrc = useMemo(() => {
    const t = overlay.trim();
    if (!t) return null;
    if (/^<\?xml|^<svg/i.test(t)) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(t)}`;
    }
    return t; // treat as URL (http(s):, data:, blob:, /path)
  }, [overlay]);

  const drawing = useRef(false);
  const drawValue = useRef<Cell | null>(null);
  const history = useRef<Cell[][][]>([]);

  const pushHistory = useCallback((g: Cell[][]) => {
    history.current.push(g.map((row) => [...row]) as Cell[][]);
    if (history.current.length > 50) history.current.shift();
  }, []);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (prev) setGrid(prev);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        e.key.toLowerCase() === "z"
      ) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  const setCell = useCallback((r: number, c: number, v: Cell) => {
    setGrid((prev) => {
      if (prev[r][c] === v) return prev;
      const next = prev.map((row) => [...row]) as Cell[][];
      next[r][c] = v;
      return next;
    });
  }, []);

  const onPointerDown = (r: number, c: number, e: React.PointerEvent) => {
    e.preventDefault();
    pushHistory(grid);
    drawing.current = true;
    const erase = e.button === 2 || e.shiftKey || tool === "erase";
    const v: Cell = erase ? 0 : tool === "semi" ? 2 : 1;
    drawValue.current = v;
    setCell(r, c, v);
  };

  const onPointerEnter = (r: number, c: number) => {
    if (drawing.current && drawValue.current !== null) {
      setCell(r, c, drawValue.current);
    }
  };

  const stop = () => {
    drawing.current = false;
    drawValue.current = null;
  };

  const clearAll = () => {
    pushHistory(grid);
    setGrid(emptyGrid(size));
  };

  const invertGrid = () => {
    pushHistory(grid);
    setGrid((g) =>
      g.map((row) => row.map((v): Cell => (v === 1 ? 0 : v === 0 ? 1 : v))),
    );
  };

  const fillFrame = () => {
    pushHistory(grid);
    setGrid((g) => {
      const next = g.map((row) => [...row]) as Cell[][];
      for (let i = 0; i < size; i++) {
        next[0][i] = 1;
        next[size - 1][i] = 1;
        next[i][0] = 1;
        next[i][size - 1] = 1;
      }
      return next;
    });
  };

  const convertOverlayToPixels = async () => {
    if (!overlaySrc) return;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Failed to load overlay image"));
        i.src = overlaySrc;
      });

      const SUPER = 4;
      const W = size * SUPER;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = W;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, W, W);

      const iw = img.naturalWidth || img.width || W;
      const ih = img.naturalHeight || img.height || W;
      const aspect = iw / ih;
      let dw: number;
      let dh: number;
      if (aspect >= 1) {
        dw = W;
        dh = W / aspect;
      } else {
        dw = W * aspect;
        dh = W;
      }
      dw *= overlayScale;
      dh *= overlayScale;
      const dx = (W - dw) / 2;
      const dy = (W - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);

      const data = ctx.getImageData(0, 0, W, W).data;

      if (overlayInvert) {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
      }

      let opaqueCount = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 200) opaqueCount++;
      const hasOpaqueBg = opaqueCount > W * W * 0.9;

      const mask: boolean[][] = Array.from({ length: size }, () =>
        Array<boolean>(size).fill(false),
      );
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          let sum = 0;
          for (let dy2 = 0; dy2 < SUPER; dy2++) {
            for (let dx2 = 0; dx2 < SUPER; dx2++) {
              const idx = ((r * SUPER + dy2) * W + (c * SUPER + dx2)) * 4;
              const R = data[idx];
              const G = data[idx + 1];
              const B = data[idx + 2];
              const A = data[idx + 3] / 255;
              const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
              sum += hasOpaqueBg ? (1 - lum) * A : A;
            }
          }
          mask[r][c] = sum / (SUPER * SUPER) > 0.35;
        }
      }

      const next: Cell[][] = Array.from({ length: size }, () =>
        Array<Cell>(size).fill(0),
      );
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!mask[r][c]) continue;
          const up = r > 0 ? mask[r - 1][c] : false;
          const dn = r < size - 1 ? mask[r + 1][c] : false;
          const lf = c > 0 ? mask[r][c - 1] : false;
          const rt = c < size - 1 ? mask[r][c + 1] : false;
          if (!(up && dn && lf && rt)) next[r][c] = 1;
        }
      }

      pushHistory(grid);
      setGrid(next);
      setColor(DEFAULT_COLOR);
    } catch (err) {
      console.error("Pixelation failed:", err);
    }
  };

  const applySize = (n: number) => {
    const next = clampSize(n);
    if (next === size) {
      setSizeInput(String(next));
      return;
    }
    pushHistory(grid);
    setGrid((g) => resizeGrid(g, next));
    setSize(next);
    setSizeInput(String(next));
  };

  const loadAlarmExample = () => {
    const { size: ns, grid: ng } = parsePattern(EXAMPLE_ALARM);
    pushHistory(grid);
    setSize(ns);
    setSizeInput(String(ns));
    setGrid(ng);
    setColor("#1c1f21");
  };

  const svgString = useMemo(() => {
    const base = ("#" + color.replace(/^#/, "").slice(0, 6)).toLowerCase();
    const lines: string[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const v = grid[r]?.[c] ?? 0;
        if (v === 0 && !includeEmpty) continue;
        const x = pad + c * STEP;
        const y = pad + r * STEP;
        const stroke = v === 1 ? base : v === 2 ? `${base}40` : `${base}00`;
        lines.push(
          `    <path d="M${x} ${y + 0.005}L${x} ${
            y - 0.005
          }" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="square"></path>`,
        );
      }
    }
    return `<svg width="${view}px" height="${view}px" viewBox="0 0 ${view} ${view}" xmlns="http://www.w3.org/2000/svg">
  <g stroke-linejoin="miter" stroke-linecap="butt">
${lines.join("\n")}
  </g>
</svg>`;
  }, [grid, color, includeEmpty, size, view, pad, strokeWidth]);

  const copySVG = async () => {
    try {
      await navigator.clipboard.writeText(svgString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };

  const downloadSVG = () => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixel-icon.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const previewBase = ("#" + color.replace(/^#/, "").slice(0, 6)).toLowerCase();

  const filledCount = useMemo(
    () => grid.reduce((acc, row) => acc + row.filter((v) => v !== 0).length, 0),
    [grid],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="min-h-screen w-full bg-neutral-950 text-neutral-100"
        onPointerUp={stop}
        onPointerLeave={stop}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col gap-8">
          <header className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                Pixel Perfect · Tools
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Pixel Icon Tool
              </h1>
              <p className="text-sm text-neutral-400 mt-1.5 max-w-xl">
                Paint on the {size}×{size} grid and export as SVG. Click & drag
                to draw, shift-click or right-click to erase.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1">
                {filledCount} px filled
              </span>
              <span className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1">
                {view}×{view} viewBox
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
            <section className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 sm:p-6 flex flex-col items-stretch gap-5 select-none min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  role="tablist"
                  aria-label="Drawing tool"
                  className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-800 bg-neutral-950 p-0.5"
                >
                  {TOOLS.map((t) => (
                    <Tooltip key={t.id}>
                      <TooltipTrigger asChild>
                        <button
                          role="tab"
                          aria-selected={tool === t.id}
                          onClick={() => setTool(t.id)}
                          className={`px-3 h-8 text-xs font-medium rounded-md transition-colors ${
                            tool === t.id
                              ? "bg-neutral-100 text-neutral-900"
                              : "text-neutral-400 hover:text-neutral-100"
                          }`}
                        >
                          {t.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{t.hint}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <Separator
                  orientation="vertical"
                  className="h-6! bg-neutral-800"
                />

                <div className="flex items-center gap-1 ml-auto">
                  <IconAction label="Undo" shortcut="Ctrl+Z" onClick={undo}>
                    <UndoIcon />
                  </IconAction>
                  <IconAction label="Frame" onClick={fillFrame}>
                    <FrameIcon />
                  </IconAction>
                  <IconAction label="Invert" onClick={invertGrid}>
                    <InvertIcon />
                  </IconAction>
                  <IconAction
                    label="Load 16×16 alarm example"
                    onClick={loadAlarmExample}
                  >
                    <SparkleIcon />
                  </IconAction>
                  <Separator
                    orientation="vertical"
                    className="!h-6 bg-neutral-800 mx-1"
                  />
                  <IconAction label="Clear all" onClick={clearAll} danger>
                    <TrashIcon />
                  </IconAction>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40">
                <button
                  type="button"
                  onClick={() => setOverlayOpen((o) => !o)}
                  aria-expanded={overlayOpen}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-neutral-500 transition-transform inline-block ${
                        overlayOpen ? "rotate-90" : ""
                      }`}
                    >
                      ▶
                    </span>
                    <span className="font-medium">Trace overlay</span>
                    {overlaySrc && (
                      <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        active
                      </span>
                    )}
                  </span>
                  {overlaySrc && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOverlay("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setOverlay("");
                        }
                      }}
                      className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1 rounded-md border border-neutral-800"
                    >
                      Remove
                    </span>
                  )}
                </button>

                {overlayOpen && (
                  <div className="px-4 pb-4 pt-1 flex flex-col gap-4 border-t border-neutral-800">
                    <textarea
                      value={overlay}
                      onChange={(e) => setOverlay(e.target.value)}
                      placeholder="Paste an SVG (<svg ...>...</svg>) or an image URL to trace over"
                      spellCheck={false}
                      className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-md p-2.5 text-[11px] font-mono resize-none leading-tight text-neutral-200 placeholder:text-neutral-600 focus-visible:outline-none focus-visible:border-neutral-600"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <SliderField
                        label="Opacity"
                        value={overlayOpacity}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={setOverlayOpacity}
                        format={(v) => `${Math.round(v * 100)}%`}
                      />
                      <SliderField
                        label="Size"
                        value={overlayScale}
                        min={0.25}
                        max={3}
                        step={0.01}
                        onChange={setOverlayScale}
                        format={(v) => `${Math.round(v * 100)}%`}
                        onReset={() => setOverlayScale(1)}
                      />
                    </div>

                    <div className="flex items-center gap-5 text-sm">
                      <Toggle
                        checked={overlayVisible}
                        onChange={setOverlayVisible}
                        label="Show"
                      />
                      <Toggle
                        checked={overlayInvert}
                        onChange={setOverlayInvert}
                        label="Invert"
                      />
                      <div className="ml-auto">
                        <OrangePremiumButton
                          onClick={convertOverlayToPixels}
                          disabled={!overlaySrc}
                          className="py-2! px-4! text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Convert to pixels
                        </OrangePremiumButton>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Traces the source as a single-pixel outline on the current
                      {" "}
                      {size}×{size} grid (filled interiors are dropped). Tweak
                      the size slider if the trace looks too dense or too thin.
                      Undo with Ctrl+Z.
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full flex justify-center">
                <div
                  className="relative rounded-lg overflow-hidden w-full max-w-[640px] aspect-square ring-1 ring-neutral-800"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    touchAction: "none",
                    backgroundColor: canvasBg === "dark" ? "#0a0a0a" : "#ffffff",
                    backgroundImage: showGrid
                      ? `linear-gradient(to right, ${
                          canvasBg === "dark"
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(0,0,0,0.08)"
                        } 1px, transparent 1px),
                         linear-gradient(to bottom, ${
                           canvasBg === "dark"
                             ? "rgba(255,255,255,0.07)"
                             : "rgba(0,0,0,0.08)"
                         } 1px, transparent 1px)`
                      : undefined,
                    backgroundSize: showGrid
                      ? `${100 / size}% ${100 / size}%`
                      : undefined,
                    backgroundPosition: "top left",
                  }}
                >
                  {overlaySrc && overlayVisible && (
                    <img
                      src={overlaySrc}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                      style={{
                        opacity: overlayOpacity,
                        filter: overlayInvert ? "invert(1)" : undefined,
                        transform: `scale(${overlayScale})`,
                        transformOrigin: "center",
                      }}
                    />
                  )}
                  <div
                    className="grid w-full h-full relative"
                    style={{
                      gridTemplateColumns: `repeat(${size}, 1fr)`,
                      gridTemplateRows: `repeat(${size}, 1fr)`,
                      gap: gap > 0 ? `${(gap / STEP) * (100 / size)}%` : undefined,
                    }}
                  >
                    {grid.map((row, r) =>
                      row.map((v, c) => {
                        const fill =
                          v === 1
                            ? color
                            : v === 2
                              ? `${color}66`
                              : "transparent";
                        return (
                          <div
                            key={`${r}-${c}`}
                            onPointerDown={(e) => onPointerDown(r, c, e)}
                            onPointerEnter={() => onPointerEnter(r, c)}
                            style={{ background: fill }}
                            className="cursor-crosshair"
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-5 items-center">
                <div className="flex items-center gap-3 flex-wrap">
                  <SectionLabel>Color</SectionLabel>
                  <label
                    className="relative size-8 rounded-md overflow-hidden ring-1 ring-neutral-700 cursor-pointer"
                    title="Custom color"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 size-full opacity-0 cursor-pointer"
                    />
                    <span
                      className="block size-full"
                      style={{ background: color }}
                    />
                  </label>
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-24 h-8 font-mono text-xs bg-neutral-950 border-neutral-800"
                  />
                  <div className="flex items-center gap-1">
                    {COLOR_SWATCHES.map((c) => {
                      const active = color.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          aria-label={`Use color ${c}`}
                          title={c}
                          className={`size-5 rounded-sm transition-transform ${
                            active
                              ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-neutral-100 scale-110"
                              : "ring-1 ring-neutral-700 hover:scale-110"
                          }`}
                          style={{ background: c }}
                        />
                      );
                    })}
                  </div>
                </div>

                <Separator
                  orientation="vertical"
                  className="h-8! bg-neutral-800 hidden md:block"
                />

                <div className="flex items-center gap-3 md:justify-end flex-wrap">
                  <SectionLabel>Size</SectionLabel>
                  <Input
                    type="number"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onBlur={() => applySize(parseInt(sizeInput, 10))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        applySize(parseInt(sizeInput, 10));
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-16 h-8 font-mono text-xs bg-neutral-950 border-neutral-800"
                  />
                  <div className="inline-flex items-center gap-0.5 rounded-md border border-neutral-800 bg-neutral-950 p-0.5">
                    {SIZE_PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => applySize(p)}
                        className={`px-2 h-7 text-xs rounded-sm transition-colors ${
                          size === p
                            ? "bg-neutral-100 text-neutral-900"
                            : "text-neutral-400 hover:text-neutral-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-3 flex items-center gap-5 pt-2 border-t border-neutral-800/60 flex-wrap">
                  <div className="flex items-center gap-2">
                    <SectionLabel>Canvas</SectionLabel>
                    <div className="inline-flex items-center gap-0.5 rounded-md border border-neutral-800 bg-neutral-950 p-0.5">
                      <button
                        onClick={() => setCanvasBg("dark")}
                        aria-pressed={canvasBg === "dark"}
                        className={`px-2.5 h-7 text-xs rounded-sm transition-colors ${
                          canvasBg === "dark"
                            ? "bg-neutral-100 text-neutral-900"
                            : "text-neutral-400 hover:text-neutral-100"
                        }`}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => setCanvasBg("light")}
                        aria-pressed={canvasBg === "light"}
                        className={`px-2.5 h-7 text-xs rounded-sm transition-colors ${
                          canvasBg === "light"
                            ? "bg-neutral-100 text-neutral-900"
                            : "text-neutral-400 hover:text-neutral-100"
                        }`}
                      >
                        Light
                      </button>
                    </div>
                  </div>
                  <Toggle
                    checked={showGrid}
                    onChange={setShowGrid}
                    label="Gridlines"
                  />
                  <Toggle
                    checked={includeEmpty}
                    onChange={setIncludeEmpty}
                    label="Include empty pixels in SVG"
                  />
                  <div className="flex items-center gap-4 ml-auto basis-full md:basis-auto md:min-w-[420px] flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                      <SectionLabel>Padding</SectionLabel>
                      <Slider
                        min={MIN_PAD}
                        max={MAX_PAD}
                        step={1}
                        value={[pad]}
                        onValueChange={(v) => setPad(v[0])}
                        className="flex-1"
                      />
                      <span className="text-xs text-neutral-300 font-mono tabular-nums w-6 text-right">
                        {pad}
                      </span>
                      {pad !== DEFAULT_PAD && (
                        <button
                          type="button"
                          onClick={() => setPad(DEFAULT_PAD)}
                          title="Reset padding"
                          className="text-xs text-neutral-500 hover:text-neutral-200"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                      <SectionLabel>Gap</SectionLabel>
                      <Slider
                        min={MIN_GAP}
                        max={MAX_GAP}
                        step={0.25}
                        value={[gap]}
                        onValueChange={(v) => setGap(v[0])}
                        className="flex-1"
                      />
                      <span className="text-xs text-neutral-300 font-mono tabular-nums w-8 text-right">
                        {gap.toFixed(2)}
                      </span>
                      {gap !== DEFAULT_GAP && (
                        <button
                          type="button"
                          onClick={() => setGap(DEFAULT_GAP)}
                          title="Reset gap"
                          className="text-xs text-neutral-500 hover:text-neutral-200"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-5 min-w-0">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <SectionLabel>Preview</SectionLabel>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {view}×{view}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-5 flex items-center justify-center ring-1 ring-neutral-800">
                  <svg
                    viewBox={`0 0 ${view} ${view}`}
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto max-w-[260px]"
                    style={{ imageRendering: "pixelated" }}
                  >
                    <g fill="none" strokeLinejoin="miter" strokeLinecap="butt">
                      {grid.map((row, r) =>
                        row.map((v, c) => {
                          if (v === 0) return null;
                          const x = pad + c * STEP;
                          const y = pad + r * STEP;
                          const stroke =
                            v === 1 ? previewBase : `${previewBase}40`;
                          return (
                            <path
                              key={`${r}-${c}`}
                              d={`M${x} ${y + 0.005}L${x} ${y - 0.005}`}
                              stroke={stroke}
                              strokeWidth={strokeWidth}
                              strokeLinecap="square"
                            />
                          );
                        }),
                      )}
                    </g>
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PixelCreditsButton
                  onClick={copySVG}
                  className="flex-1 py-2.5! text-sm font-medium"
                >
                  {copied ? "Copied!" : "Copy SVG"}
                </PixelCreditsButton>
                <Button
                  onClick={downloadSVG}
                  variant="outline"
                  className="flex-1 h-[42px] bg-neutral-950 border-neutral-800 hover:bg-neutral-900 hover:text-neutral-100"
                >
                  Download
                </Button>
              </div>

              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>SVG output</SectionLabel>
                  <span className="text-[10px] text-neutral-500">
                    read-only
                  </span>
                </div>
                <textarea
                  value={svgString}
                  readOnly
                  spellCheck={false}
                  className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-md p-2.5 text-[11px] font-mono resize-none leading-tight text-neutral-300 focus-visible:outline-none focus-visible:border-neutral-600"
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-medium">
      {children}
    </span>
  );
}

function IconAction({
  label,
  shortcut,
  onClick,
  children,
  danger,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={`grid place-items-center size-8 rounded-md text-neutral-400 transition-colors ${
            danger
              ? "hover:bg-red-950/40 hover:text-red-300"
              : "hover:bg-neutral-800 hover:text-neutral-100"
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
        {shortcut && (
          <span className="ml-2 text-neutral-400">{shortcut}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  onReset,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-neutral-500">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-300 font-mono tabular-nums">
            {format(value)}
          </span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Reset"
              className="text-xs text-neutral-500 hover:text-neutral-200"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer select-none">
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-neutral-100" : "bg-neutral-700"
        }`}
      >
        <span
          className={`inline-block size-3 rounded-full bg-neutral-950 transition-transform ${
            checked ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="text-neutral-400">{label}</span>
    </label>
  );
}

function UndoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
      <path d="M7.5 5.5h5a4.5 4.5 0 0 1 0 9h-3a.75.75 0 0 1 0-1.5h3a3 3 0 0 0 0-6h-5v2.25a.5.5 0 0 1-.83.37l-3.5-3a.5.5 0 0 1 0-.74l3.5-3A.5.5 0 0 1 7.5 3.25z" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="13" height="13" rx="1" />
    </svg>
  );
}

function InvertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a8 8 0 1 0 0 16V2z" />
      <path
        d="M10 2a8 8 0 0 1 0 16V2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6zM15.5 13l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8 2.5h4a1 1 0 0 1 1 1v1h3a.75.75 0 0 1 0 1.5h-.6l-.83 9.4A2 2 0 0 1 12.58 17H7.42a2 2 0 0 1-1.99-1.6L4.6 6H4a.75.75 0 0 1 0-1.5h3v-1a1 1 0 0 1 1-1zm.5 1.5v.5h3V4zM8.25 8a.75.75 0 0 0-.75.75v5a.75.75 0 0 0 1.5 0v-5A.75.75 0 0 0 8.25 8zm3.5 0a.75.75 0 0 0-.75.75v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-.75-.75z" />
    </svg>
  );
}
