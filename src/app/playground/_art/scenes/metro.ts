import { C, LETTERS, type SceneFactory, beat, disc, font, mod, rng } from "../scene";

type Point = { x: number; y: number };
type Kind = "dot" | "bead" | "diamond" | "capsule" | "skip" | "glyph" | "gap";
type Style = "mixed" | "dots" | "beads";
type Track = { xs: number[]; ys: number[]; length: number; pattern: Kind[]; reverse: boolean };

const ROWS = 14;
const PERIOD = 0.4;
const PATTERN = 60;
/** The eight octilinear directions, clockwise from east (y points down). */
const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];
const YELLOW = "#ffb31a";
const TEXT = "#e7c6f2";

const RUNS: Record<Style, [Kind, number, number][]> = {
  mixed: [["dot", 4, 8], ["diamond", 2, 4], ["glyph", 4, 6], ["capsule", 1, 1], ["bead", 3, 6], ["gap", 1, 2]],
  dots: [["dot", 8, 14], ["diamond", 2, 3], ["dot", 6, 10], ["capsule", 1, 1], ["gap", 1, 1]],
  beads: [["bead", 4, 6], ["gap", 2, 2], ["glyph", 3, 5], ["bead", 3, 4], ["dot", 4, 6]],
};

function buildPattern(style: Style, seed: number): Kind[] {
  const random = rng(seed);
  const runs = RUNS[style];
  const out: Kind[] = [];
  let i = Math.floor(random() * runs.length);
  while (out.length < PATTERN) {
    const [kind, min, max] = runs[i++ % runs.length];
    const length = min + Math.floor(random() * (max - min + 1));
    // A capsule is one token that fills three slots.
    for (let k = 0; k < length; k++) out.push(...(kind === "capsule" ? (["capsule", "skip", "skip"] as Kind[]) : [kind]));
  }
  return out.slice(0, PATTERN);
}

/** Octilinear random walk: straight runs of 3–7 cells, turning 45° at a time, never more than 90° off its heading. */
function walk(random: () => number, start: Point, heading: number, cols: number): Point[] {
  const points = [start];
  let p = start;
  let d = heading;
  const off = (a: number, b: number) => Math.min(mod(a - b, 8), mod(b - a, 8));
  for (let seg = 0; seg < 14; seg++) {
    const length = 3 + Math.floor(random() * 5);
    p = { x: p.x + DIRS[d].x * length, y: p.y + DIRS[d].y * length };
    points.push(p);
    if (p.x < -2 || p.y < -2 || p.x > cols + 2 || p.y > ROWS + 2) break;
    const turn = random() < 0.5 ? 1 : -1;
    d = off(mod(d + turn, 8), heading) > 2 ? mod(d - turn, 8) : mod(d + turn, 8);
  }
  return points;
}

/** Shift a polyline sideways by `d` cells, with mitred corners, to lay a parallel track. */
function offset(points: Point[], d: number): Point[] {
  const normal = (a: Point, b: Point) => {
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
  };
  return points.map((p, i) => {
    const n1 = normal(points[Math.max(0, i - 1)], points[Math.max(1, i)]);
    const n2 = normal(points[Math.min(points.length - 2, i)], points[Math.min(points.length - 1, i + 1)]);
    const mx = n1.x + n2.x;
    const my = n1.y + n2.y;
    const ml = Math.hypot(mx, my);
    const scale = d / ((mx / ml) * n1.x + (my / ml) * n1.y);
    return { x: p.x + (mx / ml) * scale, y: p.y + (my / ml) * scale };
  });
}

/** Round every corner with a quadratic curve, then resample at an even `step` so tokens can be spaced by distance. */
function resample(points: Point[], radius: number, step: number) {
  const dense: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    const la = Math.hypot(b.x - a.x, b.y - a.y);
    const lc = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(radius, la / 2, lc / 2);
    const p0 = { x: b.x + ((a.x - b.x) / la) * r, y: b.y + ((a.y - b.y) / la) * r };
    const p1 = { x: b.x + ((c.x - b.x) / lc) * r, y: b.y + ((c.y - b.y) / lc) * r };
    for (let k = 0; k <= 8; k++) {
      const s = k / 8;
      dense.push({
        x: (1 - s) ** 2 * p0.x + 2 * (1 - s) * s * b.x + s * s * p1.x,
        y: (1 - s) ** 2 * p0.y + 2 * (1 - s) * s * b.y + s * s * p1.y,
      });
    }
  }
  dense.push(points[points.length - 1]);

  const xs = [dense[0].x];
  const ys = [dense[0].y];
  let carry = 0;
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1];
    const b = dense[i];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    let s = step - carry;
    while (s <= l) {
      xs.push(a.x + ((b.x - a.x) * s) / l);
      ys.push(a.y + ((b.y - a.y) * s) / l);
      s += step;
    }
    carry = l - (s - step);
  }
  return { xs, ys, length: (xs.length - 1) * step };
}

/**
 * Tile 10 — a metro map. Routes are octilinear walks on the cell grid with
 * rounded corners; each carries a looping pattern of tokens that steps along
 * it on a shared beat, so the whole map moves like traffic.
 */
export const metro: SceneFactory = () => {
  let u = 0;
  let spacing = 0;
  const step = 1;
  let tracks: Track[] = [];

  /** Position and heading at arc length `s` along a track. */
  const at = (track: Track, s: number) => {
    const i = Math.max(0, Math.min(track.xs.length - 2, Math.floor(s / step)));
    const f = s / step - i;
    const dx = track.xs[i + 1] - track.xs[i];
    const dy = track.ys[i + 1] - track.ys[i];
    return { x: track.xs[i] + dx * f, y: track.ys[i] + dy * f, angle: Math.atan2(dy, dx) };
  };

  return {
    background: C.ink,
    resize(w, h) {
      u = h / ROWS;
      spacing = 0.8 * u;
      const cols = Math.ceil(w / u);
      const random = rng(21);
      const plan: { start: Point; heading: number; style: Style; bundle?: number[] }[] = [
        { start: { x: -1, y: 4 }, heading: 0, style: "mixed" },
        { start: { x: Math.round(cols * 0.55), y: -1 }, heading: 2, style: "dots" },
        { start: { x: -1, y: 10 }, heading: 0, style: "dots", bundle: [-1, 1, 2] },
        { start: { x: Math.round(cols * 0.3), y: ROWS + 1 }, heading: 6, style: "mixed" },
        { start: { x: cols + 1, y: 7 }, heading: 4, style: "beads" },
        { start: { x: Math.round(cols * 0.85), y: -1 }, heading: 3, style: "mixed" },
      ];
      tracks = [];
      plan.forEach((route, ri) => {
        const path = walk(random, route.start, route.heading, cols);
        for (const d of [0, ...(route.bundle ?? [])]) {
          const shifted = d === 0 ? path : offset(path, d);
          const px = shifted.map((p) => ({ x: p.x * u, y: p.y * u }));
          const { xs, ys, length } = resample(px, 1.4 * u, step);
          tracks.push({
            xs,
            ys,
            length,
            pattern: buildPattern(d === 0 ? route.style : "dots", 300 + ri * 13 + d),
            reverse: ri % 2 === 1,
          });
        }
      });
    },
    draw(ctx, t) {
      const { index, p } = beat(t, PERIOD, 0.6);
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const glyphSize = 0.62 * u;

      for (const track of tracks) {
        const first = -index - 2;
        const last = Math.ceil(track.length / spacing) - index + 1;
        for (let m = first; m <= last; m++) {
          const kind = track.pattern[mod(m, PATTERN)];
          if (kind === "gap" || kind === "skip") continue;
          let s = (m + index + p) * spacing;
          if (s < 0 || s > track.length) continue;
          if (track.reverse) s = track.length - s;
          const { x, y, angle } = at(track, s);

          if (kind === "dot") disc(ctx, x, y, 0.13 * u, YELLOW);
          else if (kind === "bead") disc(ctx, x, y, 0.42 * u, C.red);
          else if (kind === "diamond") {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = C.pink;
            ctx.beginPath();
            ctx.moveTo(-0.46 * u, 0);
            ctx.lineTo(0, -0.34 * u);
            ctx.lineTo(0.46 * u, 0);
            ctx.lineTo(0, 0.34 * u);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else if (kind === "capsule") {
            // A solid bar that bends with the track across three slots.
            const dir = track.reverse ? -1 : 1;
            ctx.strokeStyle = C.pink;
            ctx.lineWidth = 0.62 * u;
            ctx.beginPath();
            for (let k = 0; k <= 8; k++) {
              const q = at(track, Math.max(0, Math.min(track.length, s + dir * ((k / 8) * 2.2 - 0.1) * spacing)));
              if (k === 0) ctx.moveTo(q.x, q.y);
              else ctx.lineTo(q.x, q.y);
            }
            ctx.stroke();
          } else if (kind === "glyph") {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.font = font(glyphSize, 400);
            ctx.fillStyle = TEXT;
            ctx.fillText(LETTERS[mod(m, 3)], 0, glyphSize * 0.36);
            ctx.restore();
          }
        }
      }
    },
  };
};
