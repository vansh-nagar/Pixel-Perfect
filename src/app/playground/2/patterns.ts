// Seeded generator for 4-fold symmetric pixel emblems. Every motif is a rule
// on (a, b) = sorted |x|, |y| from the centre, so the result is symmetric
// across both axes and both diagonals by construction.

export const GRID = 19;
export const HALF = (GRID - 1) / 2;

type Rule = (a: number, b: number) => boolean;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOTIFS: ((r: () => number, int: (lo: number, hi: number) => number) => Rule)[] = [
  // Checkerboard core.
  (_, int) => {
    const size = int(1, 3);
    return (a, b) => b <= size && (a + b) % 2 === 0;
  },
  // Diamond ring.
  (_, int) => {
    const at = int(3, HALF + 2);
    const thick = int(0, 1);
    return (a, b) => a + b >= at && a + b <= at + thick;
  },
  // Square ring with gaps along its edges.
  (r, int) => {
    const at = int(3, HALF);
    const gap = int(0, at - 1);
    const gapWidth = r() < 0.5 ? 0 : 1;
    return (a, b) => b === at && Math.abs(a - gap) > gapWidth;
  },
  // Spokes along the axes.
  (_, int) => {
    const from = int(1, HALF - 2);
    const to = int(from + 1, HALF);
    return (a, b) => a === 0 && b >= from && b <= to;
  },
  // Spokes along the diagonals.
  (_, int) => {
    const from = int(1, HALF - 3);
    const to = int(from + 1, HALF - 1);
    return (a, b) => a === b && b >= from && b <= to;
  },
  // Corner brackets.
  (_, int) => {
    const at = int(4, HALF);
    const arm = int(1, 3);
    return (a, b) => b === at && a >= at - arm;
  },
  // Crosses capping the axes.
  (_, int) => {
    const at = int(3, HALF - 1);
    return (a, b) => (a === 0 && (b === at || b === at - 1 || b === at + 1)) || (a === 1 && b === at);
  },
  // Isolated dots.
  (_, int) => {
    const b0 = int(2, HALF);
    const a0 = int(0, b0);
    return (a, b) => a === a0 && b === b0;
  },
  // Stepped rays: a staircase out from the centre.
  (_, int) => {
    const from = int(2, HALF - 3);
    const to = int(from + 2, HALF);
    return (a, b) => b >= from && b <= to && (b - a === 1 || b - a === 2) && b % 2 === 0;
  },
];

export type Pattern = { name: string; cells: { x: number; y: number }[] };

export function generate(seed: number, name = `Seed ${seed}`): Pattern {
  const r = mulberry32(seed);
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (Math.max(lo, hi) - lo + 1));

  const count = int(3, 5);
  const rules: { rule: Rule; xor: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const motif = MOTIFS[Math.floor(r() * MOTIFS.length)];
    rules.push({ rule: motif(r, int), xor: i > 0 && r() < 0.2 });
  }

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const ax = Math.abs(x - HALF);
      const ay = Math.abs(y - HALF);
      const a = Math.min(ax, ay);
      const b = Math.max(ax, ay);
      let on = false;
      for (const { rule, xor } of rules) on = xor ? on !== rule(a, b) : on || rule(a, b);
      if (on) cells.push({ x, y });
    }
  }
  return { name, cells };
}

export function toAscii(p: Pattern) {
  const rows = Array.from({ length: GRID }, () => Array(GRID).fill("."));
  p.cells.forEach(({ x, y }) => (rows[y][x] = "#"));
  return rows.map((r) => r.join("")).join("\n");
}
