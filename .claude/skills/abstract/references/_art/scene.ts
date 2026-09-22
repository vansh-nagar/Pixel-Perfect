/**
 * Shared plumbing for the procedural tiles: the Scene contract, the palette,
 * deterministic randomness, easing, and a few drawing helpers.
 *
 * Every tile follows the same rule: pick a cell size `u` from the tile height,
 * then place everything at whole (or half) cells. Randomness only decides
 * *which* cell or glyph — never an arbitrary pixel position.
 */

export interface Scene {
  /** Solid fill painted before every frame. */
  background: string;
  /** Rebuild the layout for a new size, in CSS pixels. */
  resize(width: number, height: number): void;
  /** Paint one frame at `t` seconds. */
  draw(ctx: CanvasRenderingContext2D, t: number): void;
}

export type SceneFactory = () => Scene;

/** Flat, solid colours only — no gradients, no glows. */
export const C = {
  ink: "#101010",
  line: "#1b1b1b",
  orange: "#ff5d00",
  ember: "#2e0d04",
  blue: "#2a46ff",
  cobalt: "#3461fa",
  sky: "#5ab4f5",
  pink: "#f07bff",
  blush: "#f8dcff",
  amber: "#ffae12",
  violet: "#6a3ce0",
  red: "#f5532a",
  salmon: "#ffa58a",
} as const;

export const DIGITS = ["0", "1", "%"];
export const LETTERS = ["A", "B", "L"];
export const GLYPHS = [...LETTERS, ...DIGITS];

/** Mulberry32 — small, fast, and the same sequence for the same seed. */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 0–1 value for an integer triple. Per-cell choices use this so they never flicker. */
export function hash(a: number, b = 0, c = 0) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x1b873593);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const pick = <T,>(list: readonly T[], v: number) => list[Math.min(list.length - 1, Math.floor(v * list.length))];
export const mod = (n: number, m: number) => ((n % m) + m) % m;
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
export const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
export const easeInOutExpo = (p: number) =>
  p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2;

/** Eased 0→1 progress through the window [start, start + duration]. */
export const span = (t: number, start: number, duration: number, ease = easeInOutCubic) =>
  ease(clamp01((t - start) / duration));

/**
 * Split time into beats. `index` counts whole beats; `p` eases 0→1 over the
 * first `move` fraction of each beat, then rests at 1. This snap-then-hold
 * rhythm is what keeps moving things landing back on the grid.
 */
export function beat(t: number, period: number, move = 0.5, ease = easeInOutCubic) {
  const index = Math.floor(t / period);
  return { index, p: ease(clamp01((t / period - index) / move)) };
}

let family = "";
/** Canvas font string in the page's own typeface (Inter Tight), resolved once. */
export function font(size: number, weight = 500) {
  if (!family) family = getComputedStyle(document.body).fontFamily || "sans-serif";
  return `${weight} ${size}px ${family}`;
}

/** Draw one character optically centred on (x, y). */
export function glyph(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, size: number, color: string, weight = 500) {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // Cap height is ~0.72em, so drop the baseline by half of it.
  ctx.fillText(ch, x, y + size * 0.36);
}

export function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  if (r <= 0) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Square of side `size` centred on (x, y). */
export function square(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  if (size <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

/** Crisp 1px grid lines every `step` px, aligned so one line passes through (ox, oy). */
export function gridLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step: number,
  color: string,
  { ox = 0, oy = 0, vertical = true, horizontal = true } = {},
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (vertical) {
    for (let x = mod(ox, step); x <= width; x += step) {
      const px = Math.round(x) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
  }
  if (horizontal) {
    for (let y = mod(oy, step); y <= height; y += step) {
      const py = Math.round(y) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
  }
  ctx.stroke();
}
