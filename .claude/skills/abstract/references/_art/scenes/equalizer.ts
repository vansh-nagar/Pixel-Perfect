import { C, GLYPHS, LETTERS, type SceneFactory, beat, clamp01, disc, easeInOutCubic, glyph, hash, lerp, mod, pick, rng, square } from "../scene";

const ROWS = 5;
const PERIOD = 1.4;
/** Column-group widths, repeated across the tile. Width-1 groups are circle stacks. */
const GROUP_WIDTHS = [4, 3, 1, 3, 1];

type Group = { start: number; width: number; fromTop: boolean };

/**
 * Tile 5 — a blue equalizer. Each group of columns steps to a new staircase
 * profile every beat. The bars are masks over a fixed grid of glyphs, so the
 * glyphs never move; the bars reveal and cover them.
 */
export const equalizer: SceneFactory = () => {
  let width = 0;
  let height = 0;
  let u = 0;
  let x0 = 0;
  let groups: Group[] = [];

  /** Target levels (cells filled) for every column at beat `n`. */
  const levels = (n: number) => {
    const out: number[] = [];
    groups.forEach((g, gi) => {
      const random = rng(n * 131 + gi * 17 + 1);
      if (g.width === 1) {
        out.push(1 + Math.floor(random() * 4));
        return;
      }
      // A clean staircase: a base height plus a fixed slope across the group.
      const slope = [-1, 0, 1][Math.floor(random() * 3)];
      const base = 1 + Math.floor(random() * 3);
      for (let i = 0; i < g.width; i++) out.push(Math.max(0, Math.min(ROWS, base + slope * i)));
    });
    return out;
  };

  return {
    background: C.ink,
    resize(w, h) {
      width = w;
      height = h;
      u = h / ROWS;
      const designed = GROUP_WIDTHS.reduce((a, b) => a + b, 0);
      x0 = (w - designed * u) / 2;
      // Repeat the group pattern outwards from column 0 until the tile is covered.
      const widthAt = (i: number) => GROUP_WIDTHS[mod(i, GROUP_WIDTHS.length)];
      let start = 0;
      let i = 0;
      while (x0 + start * u > 0) start -= widthAt(--i);
      groups = [];
      for (; x0 + start * u < w; i++) {
        groups.push({ start, width: widthAt(i), fromTop: mod(i, 2) === 0 });
        start += widthAt(i);
      }
    },
    draw(ctx, t) {
      const { index } = beat(t, PERIOD);
      const from = levels(index);
      const to = levels(index + 1);
      const local = t / PERIOD - index;
      let column = 0;

      groups.forEach((g) => {
        for (let i = 0; i < g.width; i++, column++) {
          const c = g.start + i;
          const x = x0 + c * u;
          if (x > width || x + u < 0) continue;
          const p = easeInOutCubic(clamp01((local - column * 0.02 - 0.05) / 0.4));
          const level = lerp(from[column], to[column], p);

          if (g.width === 1) {
            // Circle stack: each circle scales in as the level passes it,
            // with an orange letter riding on top.
            for (let k = 0; k < ROWS; k++) {
              const s = clamp01(level - k);
              disc(ctx, x + u / 2, height - (k + 0.5) * u, 0.47 * u * s, C.blue);
            }
            glyph(ctx, pick(LETTERS, hash(c, index)), x + u / 2, height - (level + 0.5) * u, 0.6 * u, C.orange, 400);
            continue;
          }

          const barTop = g.fromTop ? 0 : height - level * u;
          const barH = level * u;
          const dotted = hash(c, 77) > 0.3;
          for (let r = 0; r < ROWS; r++) {
            const y = r * u;
            const covered = g.fromTop ? r + 0.5 < level : ROWS - r - 0.5 < level;
            if (!covered && dotted) square(ctx, x + u / 2, y + u / 2, 0.28 * u, C.blue);
          }
          if (barH <= 0) continue;
          ctx.fillStyle = C.blue;
          ctx.fillRect(x - 0.25, barTop, u + 0.5, barH);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, barTop, u, barH);
          ctx.clip();
          for (let r = 0; r < ROWS; r++) glyph(ctx, pick(GLYPHS, hash(c, r)), x + u / 2, (r + 0.5) * u, 0.58 * u, "#c9d1ff", 400);
          ctx.restore();
        }
      });

      // Orange rules on every group boundary.
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      groups.forEach((g) => {
        const x = Math.round(x0 + g.start * u);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      });
      ctx.stroke();
    },
  };
};
