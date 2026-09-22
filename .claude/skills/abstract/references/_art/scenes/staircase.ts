import { C, GLYPHS, LETTERS, type SceneFactory, disc, glyph, gridLines, hash, mod, pick, rng, square } from "../scene";
import { drawEmblem, emblemPose } from "./emblem";

type Cell = { c: number; r: number };
type Kind = "block" | "letter" | "circle" | "dot" | "gap";

const ROWS = 9;
const SPAN = 22;
/** Seconds per conveyor step. */
const TICK = 0.16;
const PATTERN = 48;

/** Stair runs below the header, as [row, first column, width]. */
const STAIRS = [
  [2, 12, 3],
  [3, 14, 2],
  [4, 15, 2],
  [5, 16, 2],
  [6, 17, 3],
  [7, 18, 3],
  [8, 19, 2],
  [9, 20, 2],
] as const;

/** A second, mirrored band of loose squares descending to the left. */
const LEFT_BAND: Record<number, number[]> = {
  1: [4],
  2: [2, 3, 4, 5],
  3: [2, 3, 4],
  4: [1, 2, 3],
  5: [1, 2],
  6: [0, 1, 2],
  7: [0, 1],
  8: [0, 1],
};

/** The path the conveyor follows: a two-row header, then down the stairs. */
function buildPath(): Cell[] {
  const cells: Cell[] = [];
  for (let c = 5; c <= 12; c++) cells.push({ c, r: 0 }, { c, r: 1 });
  for (const [r, start, width] of STAIRS) for (let c = start; c < start + width; c++) cells.push({ c, r });
  return cells;
}

/** The token sequence that rides the path: runs of solid blocks broken up by letters, circles and dots. */
function buildPattern(): Kind[] {
  const random = rng(44);
  const out: Kind[] = [];
  const runs: [Kind, number, number][] = [
    ["block", 5, 9],
    ["letter", 1, 2],
    ["circle", 2, 2],
    ["block", 3, 6],
    ["letter", 2, 3],
    ["block", 4, 7],
    ["dot", 1, 1],
  ];
  let i = 0;
  while (out.length < PATTERN) {
    const [kind, min, max] = runs[i++ % runs.length];
    const length = min + Math.floor(random() * (max - min + 1));
    for (let k = 0; k < length && out.length < PATTERN; k++) out.push(kind);
  }
  return out;
}

/**
 * Tile 4 — a staircase conveyor on ember. Tokens step one cell along the path
 * every tick and keep their glyph as they travel, so blocks read as pieces
 * sliding down the stairs rather than cells blinking.
 */
export const staircase: SceneFactory = () => {
  let width = 0;
  let height = 0;
  let u = 0;
  let x0 = 0;
  const path = buildPath();
  const pattern = buildPattern();

  return {
    background: C.ember,
    resize(w, h) {
      width = w;
      height = h;
      u = h / ROWS;
      x0 = Math.max(0, (w - SPAN * u) / 2);
    },
    draw(ctx, t) {
      gridLines(ctx, width, height, u, "#381208", { ox: x0 });
      const cx = (c: number) => x0 + (c + 0.5) * u;
      const cy = (r: number) => (r + 0.5) * u;

      // Loose squares: a scanline sweeps the band diagonally and briefly enlarges each one it crosses.
      const front = Math.floor(t / 0.12) % 16;
      for (const [row, columns] of Object.entries(LEFT_BAND)) {
        const r = Number(row);
        for (const c of columns) square(ctx, cx(c), cy(r), (r + c === front ? 0.55 : 0.3) * u, C.pink);
      }
      // End-of-run markers just past each stair.
      for (const [r, start, w] of STAIRS) square(ctx, cx(start + w), cy(r), 0.3 * u, C.pink);

      const shift = Math.floor(t / TICK);
      path.forEach((cell, i) => {
        // `id` is the token's identity; it stays with the token as it moves.
        const id = i - shift;
        const kind = pattern[mod(id, PATTERN)];
        const x = cx(cell.c);
        const y = cy(cell.r);
        if (kind === "block") {
          ctx.fillStyle = C.pink;
          ctx.fillRect(x - u / 2 - 0.25, y - u / 2 - 0.25, u + 0.5, u + 0.5);
          glyph(ctx, pick(GLYPHS, hash(id, 4)), x, y, 0.62 * u, C.blush);
        } else if (kind === "letter") {
          glyph(ctx, pick(LETTERS, hash(id, 5)), x, y, 0.62 * u, C.orange);
        } else if (kind === "circle") {
          disc(ctx, x, y, 0.46 * u, C.pink);
        } else if (kind === "dot") {
          square(ctx, x, y, 0.3 * u, C.pink);
        }
      });

      // The small mark in the corner breathes in sync with tile 1.
      const { open, disc: fill } = emblemPose(t);
      drawEmblem(ctx, x0 + 1.9 * u, 0.95 * u, 0.125 * u, { open, disc: fill, background: C.ember });
    },
  };
};
