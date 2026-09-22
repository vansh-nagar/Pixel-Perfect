import { C, GLYPHS, type SceneFactory, glyph, gridLines, hash, pick, span, easeInOutExpo, square } from "../scene";

/** One blade in the top-right quadrant, in cells from the centre; the other three are mirrors. */
const BLADE = [
  [2, -1],
  [7, -5],
  [14, -5],
  [9, -1],
] as const;

const LOOP = 4;
/** The phrase swaps this far into each loop, while the blades are open. */
const SWAP = 0.3;
const PHRASES = ["100 CELLS 1 GRID", "0 RANDOM PLACES", "PIXEL PERFECT"];

/**
 * How far the blades are open (0–1) and how full the disc is, at time `t`.
 * Shared so the small mark in the staircase tile breathes in sync.
 */
export function emblemPose(t: number) {
  const phase = t % LOOP;
  const open = span(phase, 0, 0.55, easeInOutExpo) - span(phase, 1.1, 0.55, easeInOutExpo);
  const disc = 1 - 0.4 * (span(phase, 0.08, 0.5, easeInOutExpo) - span(phase, 1.2, 0.5, easeInOutExpo));
  return { phase, open, disc };
}

type EmblemOptions = { open?: number; disc?: number; color?: string; background?: string };

/** The four-blade mark with a banded disc, centred on (cx, cy) with cell size `u`. */
export function drawEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u: number,
  { open = 0, disc = 1, color = C.orange, background = C.ink }: EmblemOptions = {},
) {
  ctx.fillStyle = color;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      // Opening slides each blade outwards along its own 5:4 slant.
      for (const [x, y] of BLADE) ctx.lineTo(cx + sx * (x + open * 1.25) * u, cy + sy * (y - open) * u);
      ctx.closePath();
      ctx.fill();
    }
  }
  const r = 2 * u * disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // The text band cuts straight through the disc.
  ctx.fillStyle = background;
  ctx.fillRect(cx - r - 1, cy - 0.62 * u, 2 * r + 2, 1.24 * u);
}

/** Tile 1 — the mark: blades breathe open, the disc shrinks, the band decodes a new phrase. */
export const emblem: SceneFactory = () => {
  let width = 0;
  let height = 0;
  let u = 0;
  let cx = 0;
  let cy = 0;

  return {
    background: C.ink,
    resize(w, h) {
      width = w;
      height = h;
      // The mark is 28 × 10 cells; keep a cell of margin around it.
      u = Math.min(h / 12, w / 30);
      cx = w / 2;
      cy = h / 2;
    },
    draw(ctx, t) {
      gridLines(ctx, width, height, 4 * u, C.line, { ox: cx, oy: cy });

      const { phase, open, disc } = emblemPose(t);
      drawEmblem(ctx, cx, cy, u, { open, disc });

      // Markers ride the empty diagonal between the blades: out with the
      // blades, then one extra hop mid-rest. Blue leads, pink trails.
      const hop = span(phase, 2.3, 0.4, easeInOutExpo) - span(phase, 2.8, 0.4, easeInOutExpo);
      const hopLate = span(phase, 2.38, 0.4, easeInOutExpo) - span(phase, 2.88, 0.4, easeInOutExpo);
      for (const s of [1, -1]) {
        const blue = 1.5 + open + hop;
        const pink = 3.5 + open + hopLate;
        const bx = cx + s * blue * u;
        const by = cy - s * (blue + 1) * u;
        const px = cx + s * pink * u;
        const py = cy - s * (pink + 1) * u;
        ctx.strokeStyle = "#2c2c2c";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(px, py);
        ctx.stroke();
        square(ctx, px, py, 1.7 * u, C.pink);
        square(ctx, px, py, 0.85 * u, C.blush);
        square(ctx, bx, by, 0.95 * u, C.blue);
        square(ctx, bx, by, 0.45 * u, "#5d8bff");
      }

      // Band text: one glyph per cell. After each swap the characters
      // scramble through the glyph set and lock in left to right.
      const since = t - SWAP;
      const index = since < 0 ? 0 : Math.floor(since / LOOP) + 1;
      const age = since < 0 ? Infinity : since - (index - 1) * LOOP;
      const phrase = PHRASES[index % PHRASES.length];
      const start = cx - ((phrase.length - 1) * u) / 2;
      const flicker = Math.floor(t * 20);
      for (let i = 0; i < phrase.length; i++) {
        if (phrase[i] === " ") continue;
        const settled = age >= 0.12 + i * 0.035;
        const ch = settled ? phrase[i] : pick(GLYPHS, hash(i, flicker));
        glyph(ctx, ch, start + i * u, cy, 0.8 * u, C.orange);
      }
    },
  };
};
