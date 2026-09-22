import { C, type SceneFactory, beat, clamp01, easeInOutCubic } from "../scene";

type Point = { x: number; y: number };

const MAX_DEPTH = 5;
const PERIOD = 1.8;
const LINE = "#7cc4ff";
/** How quickly the wanted cell size grows with distance from a focus. Higher = tighter clusters. */
const FALLOFF = 4.5;

/**
 * Tile 6 — a quadtree on cobalt. Squares split at their exact midpoints only,
 * so every line lands on a power-of-two grid. Three focus points hop to a new
 * cell each beat; squares near them split, cascading down one level at a
 * time, and squares they leave merge back from the smallest level up. At rest
 * every square is either whole or fully split — no half-drawn crosses.
 */
export const subdivision: SceneFactory = () => {
  let width = 0;
  let height = 0;
  let base = 0;
  let x0 = 0;
  let cols = 0;

  /** Focus points for beat `n`, snapped to the centres of the smallest cells. */
  const fociAt = (n: number): Point[] => {
    const t = n * 0.9;
    const min = base / 2 ** MAX_DEPTH;
    const snap = (x: number, y: number) => ({
      x: x0 + (Math.floor((x - x0) / min) + 0.5) * min,
      y: (Math.floor(y / min) + 0.5) * min,
    });
    return [
      snap(width * (0.5 + 0.42 * Math.sin(t * 0.23)), height * (0.5 + 0.42 * Math.sin(t * 0.37 + 1))),
      snap(width * (0.5 + 0.4 * Math.sin(t * 0.17 + 2.1)), height * (0.5 + 0.44 * Math.cos(t * 0.29))),
      snap(width * (0.5 + 0.44 * Math.cos(t * 0.13 + 4)), height * (0.5 + 0.4 * Math.sin(t * 0.41 + 3))),
    ];
  };

  /** Should a square of this size, centred here, be split for these foci? */
  const wantsSplit = (foci: Point[], mx: number, my: number, size: number) => {
    let d = Infinity;
    for (const f of foci) d = Math.min(d, Math.hypot(f.x - mx, f.y - my));
    const desired = (base / 2 ** MAX_DEPTH) * 2 ** ((d / base) * FALLOFF);
    return Math.log2(size / desired) >= 0.5;
  };

  return {
    background: C.cobalt,
    resize(w, h) {
      width = w;
      height = h;
      base = h / 2;
      cols = Math.ceil(w / base) + 1;
      x0 = (w - cols * base) / 2;
    },
    draw(ctx, t) {
      const { index } = beat(t, PERIOD);
      const local = t / PERIOD - index;
      const before = fociAt(index - 1);
      const after = fociAt(index);
      const highlights: [number, number, number][] = [];

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();

      const node = (x: number, y: number, size: number, depth: number) => {
        if (depth === MAX_DEPTH) {
          if (after.some((f) => f.x >= x && f.x < x + size && f.y >= y && f.y < y + size)) highlights.push([x, y, size]);
          return;
        }
        const mx = x + size / 2;
        const my = y + size / 2;
        const was = wantsSplit(before, mx, my, size);
        const is = wantsSplit(after, mx, my, size);
        if (!was && !is) return;
        let amount = 1;
        // Splits cascade from big to small; merges unwind from small to big.
        if (!was) amount = easeInOutCubic(clamp01((local - depth * 0.08) / 0.24));
        else if (!is) amount = 1 - easeInOutCubic(clamp01((local - (MAX_DEPTH - 1 - depth) * 0.08) / 0.24));
        if (amount <= 0) return;
        const reach = (amount * size) / 2;
        const px = Math.round(mx) + 0.5;
        const py = Math.round(my) + 0.5;
        ctx.moveTo(mx - reach, py);
        ctx.lineTo(mx + reach, py);
        ctx.moveTo(px, my - reach);
        ctx.lineTo(px, my + reach);
        if (amount < 1) return;
        const half = size / 2;
        node(x, y, half, depth + 1);
        node(x + half, y, half, depth + 1);
        node(x, y + half, half, depth + 1);
        node(x + half, y + half, half, depth + 1);
      };

      // The fixed base grid.
      for (let c = 0; c <= cols; c++) {
        const x = Math.round(x0 + c * base) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let r = 0; r <= 2; r++) {
        const y = Math.round(r * base) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let c = 0; c < cols; c++) for (let r = 0; r < 2; r++) node(x0 + c * base, r * base, base, 0);
      ctx.stroke();

      // The smallest cell under each focus lights up once the cascade reaches it.
      if (local > MAX_DEPTH * 0.08) {
        ctx.fillStyle = "#b3e0ff";
        for (const [x, y, size] of highlights) ctx.fillRect(x + 1, y + 1, size - 1, size - 1);
      }
    },
  };
};
