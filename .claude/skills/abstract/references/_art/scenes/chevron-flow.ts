import { C, DIGITS, type SceneFactory, beat, disc, glyph, mod, rng, square } from "../scene";

type Kind = "dot" | "circle" | "letter" | "box" | "gap";

const ROWS = 18;
const TOKEN = "#ffb01f";
const PATTERN = 64;
const PERIOD = 0.55;
/** Paths from the innermost V outwards: j = -1 starts above the frame. */
const PATHS = [-1, 0, 1, 2, 3, 4, 5, 6];
const WORD = ["A", "L", "B"];

const RUNS: [Kind, number, number][] = [
  ["dot", 3, 8],
  ["letter", 3, 6],
  ["box", 2, 4],
  ["circle", 2, 6],
  ["gap", 1, 2],
];
/** Each chevron's lead token, innermost first, so every V reads as one continuous line. */
const LEADS: Kind[] = ["dot", "circle", "dot", "letter", "circle", "dot", "box", "dot"];

function buildPattern(seed: number, lead: Kind): Kind[] {
  const random = rng(seed);
  const out: Kind[] = [];
  let last: Kind | null = null;
  while (out.length < PATTERN) {
    // Half the runs are the lead kind; the rest are picked at random, never twice in a row.
    const run = random() < 0.5 ? RUNS.find(([kind]) => kind === lead)! : RUNS[Math.floor(random() * RUNS.length)];
    const [kind, min, max] = run;
    if (kind === last) continue;
    last = kind;
    const length = min + Math.floor(random() * (max - min + 1));
    for (let k = 0; k < length && out.length < PATTERN; k++) out.push(kind);
  }
  return out;
}

/**
 * Tile 9 — nested chevrons on orange. Each path runs flat, then drops at 45°
 * into the centre. Tokens are placed by whole columns, so on the diagonal they
 * still land on grid points. Everything hops toward the centre on a shared
 * beat, and the right half is a true mirror — text included.
 */
export const chevronFlow: SceneFactory = () => {
  let height = 0;
  let u = 0;
  let cx = 0;
  const patterns = PATHS.map((j, i) => buildPattern(900 + j * 37, LEADS[i]));

  const drawHalf = (ctx: CanvasRenderingContext2D, t: number) => {
    const slots = Math.ceil(cx / u) + 2;
    PATHS.forEach((j, pi) => {
      const level = (2 + 3 * j) * u;
      // Distance from the centre to where this path turns; each outer path turns one cell further out.
      const turn = (8 + j) * u;
      const pattern = patterns[pi];
      const { index, p } = beat(t + pi * 0.03, PERIOD, 0.55);
      // Token `m` rests at slot m - index; during a beat it slides in from one slot further out.
      for (let m = index - 1; m < index + slots; m++) {
        const s = m - index + 1 - p;
        if (s < 0) continue;
        const x = cx - s * u;
        const y = level + Math.max(0, turn - s * u);
        if (y < -u || y > height + u) continue;
        const kind = pattern[mod(m, PATTERN)];
        if (kind === "dot") square(ctx, x, y, 0.3 * u, TOKEN);
        else if (kind === "circle") disc(ctx, x, y, 0.62 * u, TOKEN);
        else if (kind === "letter") glyph(ctx, WORD[mod(m, 3)], x, y, 0.85 * u, TOKEN);
        else if (kind === "box") {
          ctx.fillStyle = TOKEN;
          ctx.fillRect(x - u / 2 - 0.25, y - 0.55 * u, u + 0.5, 1.1 * u);
          glyph(ctx, DIGITS[mod(m, 3)], x, y, 0.85 * u, C.orange);
        }
      }
    });
  };

  return {
    background: C.orange,
    resize(w, h) {
      height = h;
      u = h / ROWS;
      // Columns are measured out from the centre, so both halves share one grid.
      cx = w / 2;
    },
    draw(ctx, t) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, cx, height);
      ctx.clip();
      drawHalf(ctx, t);
      ctx.restore();

      ctx.save();
      ctx.translate(2 * cx, 0);
      ctx.scale(-1, 1);
      ctx.beginPath();
      ctx.rect(0, 0, cx, height);
      ctx.clip();
      drawHalf(ctx, t);
      ctx.restore();
    },
  };
};
