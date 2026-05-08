"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STEP = 4;
const PAD = 3;
const MIN_SIZE = 2;
const MAX_SIZE = 64;
const DEFAULT_SIZE = 7;
const SIZE_PRESETS = [7, 16, 24, 32];

const computeView = (size: number) => (size - 1) * STEP + PAD * 2;

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

// X = solid, o = semi, . / space = empty. Must be a square of `size` rows of
// `size` chars each.
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
  const [color, setColor] = useState("#1c1f21");
  const [includeEmpty, setIncludeEmpty] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [copied, setCopied] = useState(false);

  const view = computeView(size);

  // Trace overlay
  const [overlay, setOverlay] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.35);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayInvert, setOverlayInvert] = useState(false);
  const [overlayScale, setOverlayScale] = useState(1);

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
      // Don't hijack undo while user is typing in an input/textarea
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

      // object-contain fit, then apply user scale around center
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

      // Detect opaque-background SVGs (white-bg icons) and switch to
      // luminance-based ink detection so the white background isn't treated
      // as filled.
      let opaqueCount = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 200) opaqueCount++;
      const hasOpaqueBg = opaqueCount > W * W * 0.9;

      // 1) Build a binary "filled" mask per cell from supersampled ink avg.
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

      // 2) Keep only outline cells: a filled cell that has at least one 4-
      // neighbour that is empty (or off-grid). Filled interior pixels are
      // dropped, giving a clean single-pixel-wide trace.
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
      setColor("#1c1f21");
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
        const x = PAD + c * STEP;
        const y = PAD + r * STEP;
        const stroke = v === 1 ? base : v === 2 ? `${base}40` : `${base}00`;
        lines.push(
          `    <path d="M${x} ${y + 0.005}L${x} ${
            y - 0.005
          }" stroke="${stroke}" stroke-width="4" stroke-linecap="square"></path>`,
        );
      }
    }
    return `<svg width="${view}px" height="${view}px" viewBox="0 0 ${view} ${view}" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke-linejoin="miter" stroke-linecap="butt">
${lines.join("\n")}
  </g>
</svg>`;
  }, [grid, color, includeEmpty, size, view]);

  const copySVG = async () => {
    try {
      await navigator.clipboard.writeText(svgString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
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

  // Render the preview as a real SVG element so it scales with its container.
  const previewBase = ("#" + color.replace(/^#/, "").slice(0, 6)).toLowerCase();

  return (
    <div
      className="min-h-screen w-full bg-neutral-950 text-neutral-100"
      onPointerUp={stop}
      onPointerLeave={stop}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col gap-6">
        <header>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Pixel Icon Tool
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Paint on the {size}×{size} grid and export as SVG. Click & drag to
            draw. Shift-click or right-click to erase.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          {/* EDITOR */}
          <section className="bg-neutral-900 rounded-xl p-4 sm:p-5 flex flex-col items-stretch gap-4 select-none min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  title={t.hint}
                  className={`px-3 py-1.5 text-sm rounded-md border transition ${
                    tool === t.id
                      ? "bg-neutral-100 text-neutral-900 border-neutral-100"
                      : "bg-neutral-900 border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  onClick={undo}
                  className="px-3 py-1.5 text-sm rounded-md border border-neutral-700 hover:border-neutral-500"
                >
                  Undo
                </button>
                <button
                  onClick={fillFrame}
                  className="px-3 py-1.5 text-sm rounded-md border border-neutral-700 hover:border-neutral-500"
                >
                  Frame
                </button>
                <button
                  onClick={loadAlarmExample}
                  title="Load alarm-clock example (16×16)"
                  className="px-3 py-1.5 text-sm rounded-md border border-neutral-700 hover:border-neutral-500"
                >
                  Alarm
                </button>
                <button
                  onClick={invertGrid}
                  className="px-3 py-1.5 text-sm rounded-md border border-neutral-700 hover:border-neutral-500"
                >
                  Invert
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-sm rounded-md border border-red-900/60 text-red-400 hover:bg-red-950/40"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Trace overlay panel */}
            <details className="border border-neutral-800 rounded-md group">
              <summary className="px-3 py-2 cursor-pointer text-sm flex items-center justify-between list-none">
                <span className="flex items-center gap-2">
                  <span className="text-neutral-400 group-open:rotate-90 transition-transform inline-block">
                    ▶
                  </span>
                  Trace overlay
                  {overlaySrc && (
                    <span className="text-xs text-emerald-400">· active</span>
                  )}
                </span>
                {overlaySrc && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setOverlay("");
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-100"
                  >
                    Remove
                  </button>
                )}
              </summary>
              <div className="p-3 flex flex-col gap-3 border-t border-neutral-800">
                <textarea
                  value={overlay}
                  onChange={(e) => setOverlay(e.target.value)}
                  placeholder="Paste an SVG (<svg ...>...</svg>) or an image URL to trace over"
                  spellCheck={false}
                  className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-md p-2 text-[11px] font-mono resize-none leading-tight"
                />
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <label className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span className="text-neutral-400 text-xs w-14">
                      Opacity
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={overlayOpacity}
                      onChange={(e) =>
                        setOverlayOpacity(parseFloat(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-xs text-neutral-500 w-10 text-right">
                      {Math.round(overlayOpacity * 100)}%
                    </span>
                  </label>
                  <label className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span className="text-neutral-400 text-xs w-14">Size</span>
                    <input
                      type="range"
                      min={0.25}
                      max={3}
                      step={0.01}
                      value={overlayScale}
                      onChange={(e) =>
                        setOverlayScale(parseFloat(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-xs text-neutral-500 w-10 text-right">
                      {Math.round(overlayScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setOverlayScale(1)}
                      title="Reset to 100%"
                      className="text-xs text-neutral-400 hover:text-neutral-100 px-1"
                    >
                      ↺
                    </button>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overlayVisible}
                      onChange={(e) => setOverlayVisible(e.target.checked)}
                    />
                    Show
                  </label>
                  <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overlayInvert}
                      onChange={(e) => setOverlayInvert(e.target.checked)}
                    />
                    Invert
                  </label>
                </div>
                <button
                  type="button"
                  onClick={convertOverlayToPixels}
                  disabled={!overlaySrc}
                  className="w-full bg-emerald-500 text-neutral-950 px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Convert overlay → pixels
                </button>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Traces the pasted SVG as a single-pixel black outline on the
                  current {size}×{size} grid (filled interiors are dropped).
                  Tweak the scale slider if the trace looks too dense or too
                  thin. Undo with Ctrl+Z.
                </p>
              </div>
            </details>

            {/* Canvas wrapper centers a square box that scales with the column */}
            <div className="w-full flex justify-center">
              <div
                className="relative rounded-md overflow-hidden w-full max-w-[640px] aspect-square"
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  touchAction: "none",
                  backgroundColor: "#0a0a0a",
                  backgroundImage: showGrid
                    ? `linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
                       linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)`
                    : undefined,
                  backgroundSize: showGrid
                    ? `${100 / size}% ${100 / size}%`
                    : undefined,
                  backgroundPosition: "top left",
                }}
              >
                {/* Trace overlay sits behind the cells so painted pixels cover it */}
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

            {/* Settings */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <label className="flex items-center gap-2">
                <span className="text-neutral-400">Color</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border border-neutral-700"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono"
                />
              </label>
              <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                Gridlines
              </label>
              <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEmpty}
                  onChange={(e) => setIncludeEmpty(e.target.checked)}
                />
                Include empty pixels
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-neutral-400">Size</span>
                <input
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
                  className="w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono"
                />
                <div className="flex gap-1">
                  {SIZE_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => applySize(p)}
                      className={`px-2 py-1 text-xs rounded border transition ${
                        size === p
                          ? "bg-neutral-100 text-neutral-900 border-neutral-100"
                          : "border-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* PREVIEW + EXPORT */}
          <aside className="bg-neutral-900 rounded-xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
            <div>
              <div className="text-sm text-neutral-400 mb-2">
                Preview · {view}×{view}
              </div>
              <div className="bg-white rounded-md p-4 flex items-center justify-center">
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
                        const x = PAD + c * STEP;
                        const y = PAD + r * STEP;
                        const stroke =
                          v === 1 ? previewBase : `${previewBase}40`;
                        return (
                          <path
                            key={`${r}-${c}`}
                            d={`M${x} ${y + 0.005}L${x} ${y - 0.005}`}
                            stroke={stroke}
                            strokeWidth={4}
                            strokeLinecap="square"
                          />
                        );
                      }),
                    )}
                  </g>
                </svg>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copySVG}
                className="flex-1 bg-neutral-100 text-neutral-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-white transition"
              >
                {copied ? "Copied!" : "Copy SVG"}
              </button>
              <button
                onClick={downloadSVG}
                className="flex-1 border border-neutral-700 hover:border-neutral-500 px-3 py-2 rounded-md text-sm transition"
              >
                Download
              </button>
            </div>

            <div className="flex flex-col min-h-0">
              <div className="text-sm text-neutral-400 mb-2">SVG output</div>
              <textarea
                value={svgString}
                readOnly
                spellCheck={false}
                className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-md p-2 text-[11px] font-mono resize-none leading-tight"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
