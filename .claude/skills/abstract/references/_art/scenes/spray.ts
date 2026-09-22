import { C, type SceneFactory, beat, clamp01, disc, easeInOutCubic, gridLines, lerp, rng } from "../scene";

type Point = { x: number; y: number };

const ROWS = 12;
const GROUPS = 5;
const PER_GROUP = 5;
const PERIOD = 2.6;
const RAY_COLORS = [C.red, C.sky, C.blue, C.amber, C.pink];
/** Directions a group of tips can line up along, in cells. */
const STEPS: Point[] = [
  { x: 2, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: 0, y: 1 },
  { x: 2, y: 1 },
  { x: -1, y: 1 },
];

/**
 * Tile 2 — a spray of rays from one point below the frame. The tips never sit
 * anywhere arbitrary: every few beats they regroup into five short lines of
 * grid points (a row, a diagonal, a column…), and the rays stretch to follow.
 */
export const spray: SceneFactory = () => {
  let width = 0;
  let height = 0;
  let u = 0;
  let cols = 0;
  let origin: Point = { x: 0, y: 0 };
  const cache = new Map<number, { tips: Point[]; lead: Point }>();

  /** Formation `n`: seeded, so the same beat always produces the same shape. */
  const formation = (n: number) => {
    const hit = cache.get(n);
    if (hit) return hit;
    const random = rng(n * 7919 + 13);
    const tips: Point[] = [];
    for (let g = 0; g < GROUPS; g++) {
      const step = STEPS[Math.floor(random() * STEPS.length)];
      const reachX = step.x * (PER_GROUP - 1);
      const reachY = step.y * (PER_GROUP - 1);
      const minX = 1 - Math.min(0, reachX);
      const maxX = Math.max(minX, Math.floor(cols) - 2 - Math.max(0, reachX));
      const minY = 1 - Math.min(0, reachY);
      const maxY = Math.max(minY, 8 - Math.max(0, reachY));
      const ax = minX + Math.floor(random() * (maxX - minX + 1));
      const ay = minY + Math.floor(random() * (maxY - minY + 1));
      for (let j = 0; j < PER_GROUP; j++) tips.push({ x: ax + step.x * j, y: ay + step.y * j });
    }
    const lead = { x: origin.x + 2 + Math.floor(random() * 5), y: -1 };
    const value = { tips, lead };
    cache.set(n, value);
    if (cache.size > 8) cache.delete(cache.keys().next().value as number);
    return value;
  };

  const toPx = (p: Point) => ({ x: p.x * u, y: p.y * u });

  return {
    background: C.ink,
    resize(w, h) {
      width = w;
      height = h;
      u = h / ROWS;
      cols = w / u;
      origin = { x: Math.round(cols * 0.42), y: ROWS + 0.6 };
      cache.clear();
    },
    draw(ctx, t) {
      gridLines(ctx, width, height, u, "#171717", { vertical: false });

      const { index } = beat(t, PERIOD);
      const from = formation(index);
      const to = formation(index + 1);
      const local = t / PERIOD - index;
      const o = toPx(origin);
      const tips: Point[] = [];

      ctx.lineWidth = 1.25;
      for (let r = 0; r < GROUPS * PER_GROUP; r++) {
        // Each ray starts a touch later than the last, so the regroup ripples.
        const p = easeInOutCubic(clamp01((local - r * 0.018) / 0.42));
        const tip = toPx({ x: lerp(from.tips[r].x, to.tips[r].x, p), y: lerp(from.tips[r].y, to.tips[r].y, p) });
        tips.push(tip);
        ctx.strokeStyle = RAY_COLORS[r % RAY_COLORS.length];
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
      }

      // The lead ray: a thick orange line with a salmon core, exiting the top.
      const lp = easeInOutCubic(clamp01(local / 0.5));
      const lead = toPx({ x: lerp(from.lead.x, to.lead.x, lp), y: -1 });
      ctx.lineCap = "round";
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(lead.x, lead.y);
      ctx.stroke();
      ctx.strokeStyle = C.salmon;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineCap = "butt";

      const r = 0.27 * u;
      // Beads on the lead ray sit exactly where it crosses rows 2, 4 and 6.
      [2, 4, 6].forEach((row, i) => {
        const y = row * u;
        const k = (o.y - y) / (o.y - lead.y);
        disc(ctx, lerp(o.x, lead.x, k), y, r, [C.pink, C.red, C.amber][i]);
      });
      tips.forEach((tip, i) => disc(ctx, tip.x, tip.y, r, RAY_COLORS[i % RAY_COLORS.length]));
    },
  };
};
