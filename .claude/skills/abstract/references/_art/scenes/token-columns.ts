import { C, DIGITS, LETTERS, type SceneFactory, beat, disc, glyph, mod, pick, rng, square } from "../scene";

type Scheme = {
  /** Block, dot and circle colour. */
  fill: string;
  /** Glyphs printed on a filled block. */
  onFill: string;
  /** Loose glyphs on the dark ground. */
  letter: string;
  /** Column outline. */
  rule: string;
};

type Token = { kind: "dot" | "block" | "letter" | "circle"; ch: string };
type Row = [Token, Token];

type Column = { at: number; scheme: Scheme; dir: 1 | -1; delay: number };
type Drifter = { at: number; row: number; color: string; dir: 1 | -1 };

export type TokenColumnsConfig = {
  rows: number;
  /** Width of the composition in cells; it is centred in the tile. */
  span: number;
  columns: Column[];
  drifters?: Drifter[];
  period: number;
  seed: number;
};

const dot: Token = { kind: "dot", ch: "" };

/**
 * A column's contents as a loop of rows, built from a handful of motifs so the
 * strip reads as designed rather than noisy: dot runs, solid bars, letter
 * pairs, stacks of circles, and small stepped blocks.
 */
function buildStrip(seed: number): Row[] {
  const random = rng(seed);
  const digit = (): Token => ({ kind: "block", ch: pick(DIGITS, random()) });
  const letter = (): Token => ({ kind: "letter", ch: pick(LETTERS, random()) });
  const circle = (): Token => ({ kind: "circle", ch: "" });
  const motifs: (() => Row[])[] = [
    () => Array.from({ length: 2 + Math.floor(random() * 3) }, () => [dot, dot] as Row),
    () => {
      const ch = pick(DIGITS, random());
      return [[{ kind: "block", ch }, { kind: "block", ch }] as Row];
    },
    () => [[letter(), letter()]],
    () => Array.from({ length: 2 + Math.floor(random() * 3) }, () => (random() < 0.35 ? [circle(), circle()] : [circle(), letter()]) as Row),
    () => [[digit(), dot], [digit(), dot], [letter(), digit()]],
    () => [[letter(), digit()], [digit(), digit()], [digit(), dot]],
  ];
  // Dot runs are listed twice so they come up more often and give the strip air.
  const order = [0, 0, 1, 2, 3, 4, 5];
  const rows: Row[] = [];
  let last = -1;
  while (rows.length < 26) {
    let m = order[Math.floor(random() * order.length)];
    if (m === last) m = (m + 1) % motifs.length;
    last = m;
    rows.push(...motifs[m]());
  }
  return rows;
}

/**
 * Tiles 3 and 8 — outlined two-cell columns of tokens that tick along one row
 * per beat, each column on its own phase and direction, like a departures board.
 */
export const tokenColumns =
  (config: TokenColumnsConfig): SceneFactory =>
  () => {
    let height = 0;
    let u = 0;
    let x0 = 0;
    const strips = config.columns.map((_, i) => buildStrip(config.seed * 31 + i));

    const drawToken = (ctx: CanvasRenderingContext2D, token: Token, x: number, y: number, w: number, scheme: Scheme) => {
      const mx = x + w / 2;
      const my = y + u / 2;
      switch (token.kind) {
        case "dot":
          square(ctx, mx, my, 0.3 * u, scheme.fill);
          break;
        case "circle":
          disc(ctx, mx, my, 0.46 * u, scheme.fill);
          break;
        case "letter":
          glyph(ctx, token.ch, mx, my, 0.62 * u, scheme.letter);
          break;
        case "block":
          ctx.fillStyle = scheme.fill;
          // Half a pixel of overlap so neighbouring blocks fuse into one shape.
          ctx.fillRect(x - 0.25, y - 0.25, w + 0.5, u + 0.5);
          glyph(ctx, token.ch, mx, my, 0.62 * u, scheme.onFill);
          break;
      }
    };

    return {
      background: C.ink,
      resize(w, h) {
        height = h;
        u = h / config.rows;
        x0 = (w - config.span * u) / 2;
      },
      draw(ctx, t) {
        const inset = 0.09 * u;
        const cellW = u - inset;

        config.drifters?.forEach((d) => {
          // Drifters step through the gaps on the same beat as the columns.
          const { index, p } = beat(t, config.period, 0.45);
          const row = mod(d.row + d.dir * (index + p), config.rows + 2) - 1;
          disc(ctx, x0 + (d.at + 0.5) * u, (row + 0.5) * u, 0.15 * u, d.color);
        });

        config.columns.forEach((column, i) => {
          const strip = strips[i];
          const { index, p } = beat(t + column.delay, config.period, 0.45);
          const offset = column.dir * (index + p);
          const base = Math.floor(offset);
          const frac = offset - base;
          const left = x0 + column.at * u + inset;
          const right = x0 + (column.at + 2) * u - inset;

          ctx.save();
          ctx.beginPath();
          ctx.rect(left, 0, right - left, height);
          ctx.clip();
          for (let r = -1; r <= config.rows + 1; r++) {
            const row = strip[mod(r + base, strip.length)];
            const y = (r - frac) * u;
            drawToken(ctx, row[0], left, y, cellW, column.scheme);
            drawToken(ctx, row[1], left + cellW, y, cellW, column.scheme);
          }
          ctx.restore();

          ctx.strokeStyle = column.scheme.rule;
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(left) - 0.5, -1, Math.round(right - left) + 1, height + 2);
        });
      },
    };
  };

const ORANGE: Scheme = { fill: C.orange, onFill: "#ffd9c4", letter: C.amber, rule: "#5c2206" };
const BLUE: Scheme = { fill: C.blue, onFill: "#c6cfff", letter: C.orange, rule: "#1f2b78" };
const VIOLET: Scheme = { fill: C.violet, onFill: "#dccfff", letter: "#b59bff", rule: "#35205f" };
const AMBER: Scheme = { fill: C.amber, onFill: "#3b2300", letter: "#5b86ff", rule: "#5e4008" };
const MONO: Scheme = { fill: C.orange, onFill: "#2a0f02", letter: C.orange, rule: "#6b2a06" };

/** Tile 3 — six coloured columns, paired and single, with drifting dots in the gaps. */
export const tokenColumnsColor = tokenColumns({
  rows: 12,
  span: 30,
  period: 0.8,
  seed: 3,
  columns: [
    { at: 3, scheme: ORANGE, dir: 1, delay: 0 },
    { at: 5, scheme: BLUE, dir: -1, delay: 0.1 },
    { at: 11, scheme: BLUE, dir: 1, delay: 0.2 },
    { at: 16, scheme: VIOLET, dir: -1, delay: 0.3 },
    { at: 22, scheme: VIOLET, dir: 1, delay: 0.4 },
    { at: 24, scheme: AMBER, dir: -1, delay: 0.5 },
  ],
  drifters: [
    { at: 1, row: 6, color: C.sky, dir: 1 },
    { at: 9, row: 0, color: C.amber, dir: -1 },
    { at: 14, row: 5, color: C.sky, dir: 1 },
    { at: 19, row: 10, color: C.amber, dir: -1 },
    { at: 28, row: 6, color: C.amber, dir: 1 },
  ],
});

/** Tile 8 — the same system at a larger scale, in orange alone. */
export const tokenColumnsMono = tokenColumns({
  rows: 9,
  span: 22,
  period: 1,
  seed: 8,
  columns: [
    { at: 4, scheme: MONO, dir: 1, delay: 0 },
    { at: 10, scheme: MONO, dir: -1, delay: 0.12 },
    { at: 16, scheme: MONO, dir: 1, delay: 0.24 },
  ],
});
