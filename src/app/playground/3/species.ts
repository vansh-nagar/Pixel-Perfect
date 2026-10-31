/**
 * Procedural lepidoptera. `buildSpecies(seed)` returns a RES×RES raster of ink density
 * (0 = no dot, 0..1 = dot weight) over specimen space u, v ∈ [-1, 1], y pointing down.
 *
 * A species is a wing silhouette (fore + hind superellipses, optional tails) with a stack
 * of pattern layers on top: dark margins, eyespots, veins, concentric bands, blotches and
 * a dark root. Each layer is switched on by the seed, so every seed is a different
 * creature, and everything is computed on |u|, so they are always bilaterally symmetric.
 */

export const RES = 200;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash2 = (i: number, j: number, s: number) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

/** Smooth value noise, 0..1. */
function noise(x: number, y: number, s: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s);
  const b = hash2(ix + 1, iy, s);
  const c = hash2(ix, iy + 1, s);
  const d = hash2(ix + 1, iy + 1, s);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

type Wing = { x: number; y: number; a: number; b: number; rot: number; n: number };

/** Wing-local coords and superellipse radius (1 = edge). */
function wingSpace(w: Wing, ax: number, v: number) {
  const dx = ax - w.x;
  const dy = v - w.y;
  const c = Math.cos(-w.rot);
  const s = Math.sin(-w.rot);
  const px = (dx * c - dy * s) / w.a;
  const py = (dx * s + dy * c) / w.b;
  const r = Math.pow(Math.pow(Math.abs(px), w.n) + Math.pow(Math.abs(py), w.n), 1 / w.n);
  return { px, py, r };
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const s = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - (ax + s * dx), py - (ay + s * dy));
}

export function buildSpecies(seed: number): Float32Array {
  const r = rng(seed * 9973 + 17);
  const pick = (a: number, b: number) => lerp(a, b, r());
  const chance = (p: number) => r() < p;

  const moth = chance(0.45);
  const fore: Wing = moth
    ? { x: pick(0.42, 0.5), y: pick(-0.12, 0.0), a: pick(0.5, 0.62), b: pick(0.17, 0.25), rot: pick(-0.16, 0.06), n: pick(2, 2.8) }
    : { x: pick(0.42, 0.5), y: pick(-0.36, -0.26), a: pick(0.48, 0.58), b: pick(0.27, 0.36), rot: pick(-0.62, -0.3), n: pick(2.2, 3.4) };
  const hind: Wing = moth
    ? { x: pick(0.26, 0.34), y: pick(0.1, 0.2), a: pick(0.26, 0.36), b: pick(0.18, 0.26), rot: pick(0.15, 0.45), n: 2 }
    : { x: pick(0.3, 0.38), y: pick(0.22, 0.32), a: pick(0.3, 0.4), b: pick(0.26, 0.34), rot: pick(0.4, 0.95), n: pick(2, 2.6) };
  const root: Wing = { x: 0.08, y: (fore.y + hind.y) / 2, a: 0.14, b: 0.26, rot: 0, n: 2 };
  const tail = !moth && chance(0.35)
    ? { x0: hind.x, y0: hind.y + 0.1, x1: hind.x + pick(0.08, 0.2), y1: hind.y + pick(0.5, 0.62), w: pick(0.035, 0.055) }
    : null;

  // Pattern recipe.
  const dark = chance(0.25); // heavy species: dark ground, light marks
  const base = dark ? pick(0.5, 0.7) : pick(0.1, 0.26);
  const sign = dark ? -1 : 1;
  const margin = chance(0.6) ? pick(0.45, 0.85) : 0;
  const marginSpots = margin > 0 && chance(0.55) ? Math.round(pick(7, 13)) : 0;
  const eyeFore = chance(0.35);
  const eyeHind = chance(0.45);
  const eye = { x: pick(-0.1, 0.35), y: pick(-0.25, 0.2), s: pick(0.28, 0.42) };
  const veins = chance(0.5) ? Math.round(pick(5, 9)) : 0;
  const bands = chance(0.45) ? { c: pick(-0.6, 0.0), f: pick(14, 26), ph: pick(0, 6.28), w: pick(0.55, 0.85) } : null;
  const blotch = chance(0.5) ? { f: pick(3, 6), t: pick(0.6, 0.7), s: Math.floor(pick(1, 9999)) } : null;
  const rootDark = chance(0.6) ? pick(0.3, 0.6) : 0;
  const grainSeed = Math.floor(pick(1, 9999));

  const antTip = { x: moth ? pick(0.3, 0.42) : pick(0.2, 0.32), y: moth ? pick(-0.92, -0.75) : pick(-0.86, -0.7) };
  const club = !moth || chance(0.3);
  const bodyTop = -0.3;
  const bodyBot = pick(0.32, 0.48);

  const out = new Float32Array(RES * RES);
  for (let j = 0; j < RES; j++) {
    const v = (j / (RES - 1)) * 2 - 1;
    for (let i = 0; i < RES; i++) {
      const u = (i / (RES - 1)) * 2 - 1;
      const ax = Math.abs(u);

      // Body and antennae sit on top of everything.
      if (ax < 0.034 && v > bodyTop && v < bodyBot) {
        const seg = Math.sin((v - bodyTop) * 42);
        out[j * RES + i] = v > 0.05 ? 0.6 + 0.3 * (seg > 0 ? 1 : 0) : 0.85;
        continue;
      }
      const ant = segDist(ax, v, 0.02, bodyTop, antTip.x, antTip.y);
      const tip = Math.hypot(ax - antTip.x, v - antTip.y);
      if (ant < 0.012 || (club && tip < 0.035)) {
        out[j * RES + i] = tip < 0.035 && club ? 0.9 : 0.45;
        continue;
      }

      const F = wingSpace(fore, ax, v);
      const H = wingSpace(hind, ax, v);
      const R = wingSpace(root, ax, v);
      const inTail = tail ? segDist(ax, v, tail.x0, tail.y0, tail.x1, tail.y1) < tail.w : false;
      if (F.r > 1 && H.r > 1 && R.r > 1 && !inTail) continue;

      // The forewing overlaps the hindwing, so it wins where both cover.
      const onFore = F.r <= 1;
      const W = onFore ? F : H.r <= 1 ? H : R;
      let t = base;

      if (margin) {
        const m = smooth(0.74, 0.94, W.r) * margin;
        let spot = 0;
        if (marginSpots && W.r > 0.8) {
          const ang = Math.atan2(W.py, W.px);
          spot = smooth(0.75, 0.95, Math.cos(ang * marginSpots)) * smooth(0.8, 0.86, W.r) * (1 - smooth(0.92, 0.97, W.r));
        }
        t += sign * m - sign * spot * 0.9;
      }
      if (veins) {
        const ang = Math.atan2(v - root.y, ax + 0.05);
        const vein = Math.pow(Math.abs(Math.cos(ang * veins)), 24) * smooth(0.2, 0.5, Math.hypot(ax, v - root.y));
        t += sign * 0.35 * vein;
      }
      if (bands) {
        const d = Math.hypot(ax, v - bands.c);
        const s = Math.sin(d * bands.f + bands.ph);
        t += sign * 0.6 * smooth(bands.w, 0.98, s);
      }
      if (blotch) {
        const n = noise(ax * blotch.f + 3.1, v * blotch.f, blotch.s);
        t += sign * 0.7 * smooth(blotch.t, blotch.t + 0.08, n);
      }
      if ((onFore && eyeFore) || (!onFore && H.r <= 1 && eyeHind)) {
        const d = Math.hypot(W.px - eye.x, W.py - eye.y) / eye.s;
        if (d < 1.1) {
          const ring = smooth(0.55, 0.7, d) * (1 - smooth(0.9, 1.05, d));
          const core = 1 - smooth(0.2, 0.32, d);
          const hollow = 1 - smooth(0.5, 0.6, d);
          t = lerp(t, dark ? 0.08 : 0.04, hollow) + 0.85 * ring + 0.9 * core;
        }
      }
      if (rootDark) t += sign * rootDark * (1 - smooth(0.0, 0.32, ax));
      if (inTail && W === R) t = base + 0.4;

      t += (hash2(i, j, grainSeed) - 0.5) * 0.08;
      out[j * RES + i] = Math.max(0.035, clamp01(t));
    }
  }
  return out;
}

/** Nearest-neighbour lookup into a species raster; 0 outside the specimen. */
export function sample(sp: Float32Array, u: number, v: number) {
  const i = Math.round((u + 1) * 0.5 * (RES - 1));
  const j = Math.round((v + 1) * 0.5 * (RES - 1));
  if (i < 0 || j < 0 || i >= RES || j >= RES) return 0;
  return sp[j * RES + i];
}
