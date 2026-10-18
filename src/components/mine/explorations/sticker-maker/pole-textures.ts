/**
 * Procedural textures for the street pole, generated on a canvas (no image assets).
 *
 * Each skin returns two textures that tile around the cylinder (seamless in u):
 *  - `color`: sRGB albedo
 *  - `orm`:   R = bump height, G = roughness, B = metalness. three reads roughness from G and
 *             metalness from B, and bump from R, so one texture feeds all three maps.
 */

import * as THREE from "three";

export type PoleSkin = "painted" | "steel" | "concrete";

const SIZE = 768;

// --- noise ------------------------------------------------------------------

const hash = (i: number, j: number, seed: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Value noise, periodic in both axes (wraps around the pole and tiles vertically). */
function noise(x: number, y: number, px: number, py: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const x0 = ((xi % px) + px) % px;
  const x1 = (x0 + 1) % px;
  const y0 = ((yi % py) + py) % py;
  const y1 = (y0 + 1) % py;
  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

/** Fractal noise over u,v in [0,1) with `fu` cells around and `fv` cells down; tiles both ways. */
function fbm(
  u: number,
  v: number,
  fu: number,
  fv: number,
  seed: number,
  octaves = 4,
) {
  let sum = 0;
  let amp = 0.5;
  let a = fu;
  let b = fv;
  for (let o = 0; o < octaves; o++) {
    sum += noise(u * a, v * b, a, b, seed + o * 13) * amp;
    a *= 2;
    b *= 2;
    amp *= 0.5;
  }
  return sum / (1 - Math.pow(0.5, octaves));
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// --- skins --------------------------------------------------------------------

type Pixel = {
  r: number;
  g: number;
  b: number;
  bump: number;
  rough: number;
  metal: number;
};

function painted(u: number, v: number): Pixel {
  const blotch = fbm(u, v, 5, 5, 1);
  const fine = fbm(u, v, 28, 28, 2, 3);
  const streak = fbm(u, v, 60, 7, 3, 2); // long vertical drips
  const chipField = blotch * 0.55 + fine * 0.45;
  const chip = smooth(0.66, 0.68, chipField);
  const edge = smooth(0.62, 0.66, chipField) * (1 - chip);

  // Teal enamel, faded and streaked.
  const shade = (0.82 + fine * 0.28) * mix(0.8, 1, streak);
  let r = 34 * shade;
  let g = 98 * shade;
  let b = 92 * shade;
  // Lighter worn rim around each chip.
  r = mix(r, 120, edge * 0.45);
  g = mix(g, 160, edge * 0.45);
  b = mix(b, 150, edge * 0.45);

  // Under the chips: rust or bare steel.
  const rusty = fbm(u, v, 40, 40, 4, 3) > 0.48;
  const grain = fbm(u, v, 90, 90, 5, 2);
  const under = rusty
    ? [mix(92, 160, grain), mix(42, 78, grain), mix(20, 34, grain)]
    : [mix(120, 165, grain), mix(122, 168, grain), mix(126, 172, grain)];
  r = mix(r, under[0], chip);
  g = mix(g, under[1], chip);
  b = mix(b, under[2], chip);

  // Grime gathered in the streaks.
  const grime = smooth(0.55, 0.85, streak) * 0.25;
  return {
    r: r * (1 - grime),
    g: g * (1 - grime),
    b: b * (1 - grime),
    bump: mix(0.6, rusty ? 0.32 + grain * 0.12 : 0.28, chip) + edge * 0.18,
    rough: mix(0.42 + fine * 0.18, rusty ? 0.95 : 0.36, chip),
    metal: chip * (rusty ? 0.1 : 0.9),
  };
}

function steel(u: number, v: number): Pixel {
  // Satin galvanised zinc: low-contrast mottling, faint spangle, fine vertical grain and
  // a few water stains. Character comes from roughness variation, not from painted lines.
  const mottle = fbm(u, v, 4, 6, 13);
  const spangle = fbm(u, v, 40, 60, 11, 2);
  const grain = fbm(u, v, 160, 6, 12, 2);
  const water = smooth(0.62, 0.88, fbm(u, v, 30, 4, 16, 2));
  const seam = Math.max(0, 1 - Math.abs(u - 0.5) * 300); // weld seam on the back side
  const base =
    166 +
    (mottle - 0.5) * 9 +
    (spangle - 0.5) * 8 +
    (grain - 0.5) * 6 -
    water * 7 -
    seam * 18;
  return {
    r: base * 0.98,
    g: base * 0.995,
    b: base * 1.02,
    bump: 0.5 + (spangle - 0.5) * 0.06 + seam * 0.2,
    rough: 0.46 + (spangle - 0.5) * 0.08 + (grain - 0.5) * 0.04 + water * 0.1,
    metal: 1,
  };
}

/** Faint hairline scratches and hand-polished scuffs; nothing that reads as drawn-on. */
function drawSteelDetails(
  color: CanvasRenderingContext2D,
  orm: CanvasRenderingContext2D,
) {
  const rand = seeded(11);
  const both = (
    fn: (ctx: CanvasRenderingContext2D, isOrm: boolean) => void,
  ) => {
    fn(color, false);
    fn(orm, true);
  };
  for (let i = 0; i < 14; i++) {
    const x = (0.08 + rand() * 0.84) * SIZE;
    const y = rand() * SIZE;
    const rx = 30 + rand() * 80;
    const ry = 12 + rand() * 40;
    both((ctx, isOrm) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
      g.addColorStop(
        0,
        isOrm ? "rgba(128, 56, 255, 0.45)" : "rgba(214, 218, 224, 0.12)",
      );
      g.addColorStop(
        1,
        isOrm ? "rgba(128, 56, 255, 0)" : "rgba(214, 218, 224, 0)",
      );
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      ctx.translate(-x, -y);
      ctx.fillStyle = g;
      ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
      ctx.restore();
    });
  }
  for (let i = 0; i < 160; i++) {
    const x = (0.04 + rand() * 0.92) * SIZE;
    const y = rand() * SIZE;
    const len = 4 + Math.pow(rand(), 2) * 40;
    const a = (rand() - 0.5) * 0.7; // mostly horizontal, like things dragged around the pole
    both((ctx, isOrm) => {
      ctx.strokeStyle = isOrm
        ? "rgba(128, 60, 255, 0.6)"
        : "rgba(232, 236, 240, 0.16)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    });
  }
}

function concrete(u: number, v: number): Pixel {
  const stain = fbm(u, v, 3, 3, 21);
  const mottled = fbm(u, v, 16, 16, 22, 3);
  const h = hash(Math.floor(u * SIZE), Math.floor(v * SIZE), 23);
  const aggregateDark = h > 0.985 ? 1 : 0;
  const aggregateLight = h < 0.012 ? 1 : 0;
  const pit = smooth(0.8, 0.86, fbm(u, v, 60, 60, 24, 2));
  const formSeam = Math.max(0, 1 - Math.abs(((v * 4) % 1) - 0.5) * 200); // formwork lines
  const base =
    mix(132, 182, mottled * 0.6 + stain * 0.4) -
    aggregateDark * 55 +
    aggregateLight * 35 -
    pit * 40 -
    formSeam * 25;
  const water = smooth(0.6, 0.9, fbm(u, v, 30, 6, 25, 2)) * 22; // vertical water staining
  return {
    r: base - water,
    g: base - 2 - water,
    b: base - 6 - water * 1.1,
    bump: 0.55 + mottled * 0.15 - pit * 0.3 - formSeam * 0.2,
    rough: 0.93,
    metal: 0,
  };
}

// --- old flyers, tape and staples painted on top (painted skin only) -----------

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function drawScraps(
  color: CanvasRenderingContext2D,
  orm: CanvasRenderingContext2D,
) {
  const rand = seeded(7);
  const torn = (cx: number, cy: number, w: number, h: number) => {
    const pts: [number, number][] = [];
    const steps = 22;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const side = Math.floor(t * 4);
      const f = (t * 4) % 1;
      const jag = () => (rand() - 0.5) * Math.min(w, h) * 0.22;
      const x =
        side === 0
          ? -w / 2 + f * w
          : side === 1
            ? w / 2
            : side === 2
              ? w / 2 - f * w
              : -w / 2;
      const y =
        side === 0
          ? -h / 2
          : side === 1
            ? -h / 2 + f * h
            : side === 2
              ? h / 2
              : h / 2 - f * h;
      pts.push([cx + x + jag(), cy + y + jag()]);
    }
    return pts;
  };
  const fill = (
    ctx: CanvasRenderingContext2D,
    pts: [number, number][],
    style: string,
  ) => {
    ctx.fillStyle = style;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  };
  // Torn paper left behind by old flyers.
  for (let i = 0; i < 7; i++) {
    const cx = (0.12 + rand() * 0.76) * SIZE;
    const cy = rand() * SIZE;
    const pts = torn(cx, cy, 40 + rand() * 110, 30 + rand() * 90);
    const tone = 200 + rand() * 40;
    fill(
      color,
      pts,
      `rgba(${tone}, ${tone - 8}, ${tone - 26}, ${0.75 + rand() * 0.2})`,
    );
    fill(orm, pts, "rgb(150, 220, 0)");
    // Faded print on some scraps.
    if (rand() > 0.4) {
      color.fillStyle = `rgba(${rand() > 0.5 ? "190, 40, 40" : "30, 30, 30"}, 0.35)`;
      for (let l = 0; l < 3; l++)
        color.fillRect(
          cx - 20 + rand() * 10,
          cy - 15 + l * 9,
          25 + rand() * 30,
          4,
        );
    }
  }
  // Yellowed tape strips.
  for (let i = 0; i < 6; i++) {
    const x = (0.1 + rand() * 0.8) * SIZE;
    const y = rand() * SIZE;
    color.save();
    color.translate(x, y);
    color.rotate((rand() - 0.5) * 1.2);
    color.fillStyle = "rgba(225, 200, 120, 0.35)";
    color.fillRect(-28, -6, 56, 12);
    color.restore();
  }
  // Staples.
  for (let i = 0; i < 40; i++) {
    const x = (0.08 + rand() * 0.84) * SIZE;
    const y = rand() * SIZE;
    const a = (rand() - 0.5) * 0.6;
    for (const [ctx, style] of [
      [color, "rgba(205, 210, 215, 0.95)"],
      [orm, "rgb(220, 70, 255)"],
    ] as const) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = style;
      ctx.fillRect(-5, -1, 10, 2);
      ctx.restore();
    }
  }
}

// --- assembly -----------------------------------------------------------------

const cache = new Map<
  PoleSkin,
  { color: THREE.CanvasTexture; orm: THREE.CanvasTexture }
>();

export function poleTextures(skin: PoleSkin) {
  const hit = cache.get(skin);
  if (hit) return hit;
  const shader =
    skin === "painted" ? painted : skin === "steel" ? steel : concrete;
  const colorCanvas = document.createElement("canvas");
  const ormCanvas = document.createElement("canvas");
  colorCanvas.width = ormCanvas.width = SIZE;
  colorCanvas.height = ormCanvas.height = SIZE;
  const cctx = colorCanvas.getContext("2d")!;
  const octx = ormCanvas.getContext("2d")!;
  const cdata = cctx.createImageData(SIZE, SIZE);
  const odata = octx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = shader(x / SIZE, y / SIZE);
      const i = (y * SIZE + x) * 4;
      cdata.data[i] = p.r;
      cdata.data[i + 1] = p.g;
      cdata.data[i + 2] = p.b;
      cdata.data[i + 3] = 255;
      odata.data[i] = p.bump * 255;
      odata.data[i + 1] = p.rough * 255;
      odata.data[i + 2] = p.metal * 255;
      odata.data[i + 3] = 255;
    }
  }
  cctx.putImageData(cdata, 0, 0);
  octx.putImageData(odata, 0, 0);
  if (skin === "painted") drawScraps(cctx, octx);
  if (skin === "steel") drawSteelDetails(cctx, octx);

  const make = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 4);
    t.anisotropy = 8;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return t;
  };
  const result = {
    color: make(colorCanvas, true),
    orm: make(ormCanvas, false),
  };
  cache.set(skin, result);
  return result;
}

// --- signs ---------------------------------------------------------------------

const SIGN_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws text horizontally condensed (road-sign lettering is narrow), returning its width. */
function condensed(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  squeeze = 0.8,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(squeeze, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return ctx.measureText(text).width * squeeze;
}

/** Subtle sheet variation so flat colour reads as printed retroreflective film. */
function filmNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number,
) {
  const img = ctx.getImageData(0, 0, w, h);
  const rand = seeded(5);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const n = (rand() - 0.5) * amount;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function finish(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Green street-name blade: block number, name, and smaller suffix, in a white inset border. */
export function streetBladeTexture(
  name: string,
  suffix: string,
  block: string,
  aspect: number,
) {
  const W = 2048;
  const H = Math.round(W / aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const r = H * 0.12;
  roundRect(ctx, 0, 0, W, H, r);
  ctx.fillStyle = "#06683c";
  ctx.fill();
  const inset = H * 0.07;
  roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, r * 0.7);
  ctx.lineWidth = H * 0.035;
  ctx.strokeStyle = "#f4f6f2";
  ctx.stroke();

  ctx.fillStyle = "#f4f6f2";
  ctx.textBaseline = "alphabetic";
  const big = H * 0.56;
  const small = H * 0.34;
  ctx.font = `700 ${big}px ${SIGN_FONT}`;
  const nameW = ctx.measureText(name).width * 0.8;
  ctx.font = `700 ${small}px ${SIGN_FONT}`;
  const suffixW = ctx.measureText(suffix).width * 0.8;
  const gap = H * 0.12;
  const total = nameW + gap + suffixW;
  let x = (W - total) / 2 + H * 0.18;
  const baseline = H * 0.7;
  ctx.font = `700 ${big}px ${SIGN_FONT}`;
  x += condensed(ctx, name, x, baseline) + gap;
  ctx.font = `700 ${small}px ${SIGN_FONT}`;
  condensed(ctx, suffix, x, baseline);
  // Block number, small, stacked at the left.
  ctx.font = `700 ${H * 0.2}px ${SIGN_FONT}`;
  condensed(ctx, block, inset * 2.2, H * 0.36, 0.85);
  filmNoise(ctx, W, H, 6);
  return finish(c);
}

/** "NO STICKERS" regulatory sign: red circle-slash over a peeling sticker. */
export function noStickersTexture(aspect: number) {
  const W = 1200;
  const H = Math.round(W / aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const r = W * 0.05;
  roundRect(ctx, 0, 0, W, H, r);
  ctx.fillStyle = "#f6f5f1";
  ctx.fill();
  const inset = W * 0.035;
  roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, r * 0.6);
  ctx.lineWidth = W * 0.018;
  ctx.strokeStyle = "#141414";
  ctx.stroke();

  // Pictogram: a square sticker with its corner peeling, under a red circle-slash.
  const cx = W / 2;
  const cy = H * 0.33;
  const R = W * 0.27;
  const s = R * 0.95;
  ctx.fillStyle = "#141414";
  ctx.beginPath();
  ctx.moveTo(cx - s / 2, cy - s / 2);
  ctx.lineTo(cx + s / 2, cy - s / 2);
  ctx.lineTo(cx + s / 2, cy + s / 2 - s * 0.32);
  ctx.lineTo(cx + s / 2 - s * 0.32, cy + s / 2);
  ctx.lineTo(cx - s / 2, cy + s / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f6f5f1"; // the peeled-back flap
  ctx.beginPath();
  ctx.moveTo(cx + s / 2, cy + s / 2 - s * 0.32);
  ctx.lineTo(cx + s / 2 - s * 0.32, cy + s / 2);
  ctx.lineTo(cx + s / 2 - s * 0.36, cy + s / 2 - s * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = W * 0.008;
  ctx.stroke();
  ctx.strokeStyle = "#c8102e";
  ctx.lineWidth = W * 0.05;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - R * Math.cos(Math.PI / 4), cy - R * Math.sin(Math.PI / 4));
  ctx.lineTo(cx + R * Math.cos(Math.PI / 4), cy + R * Math.sin(Math.PI / 4));
  ctx.stroke();

  ctx.fillStyle = "#141414";
  ctx.textBaseline = "alphabetic";
  const center = (
    text: string,
    size: number,
    y: number,
    color = "#141414",
    squeeze = 0.82,
  ) => {
    ctx.font = `700 ${size}px ${SIGN_FONT}`;
    ctx.fillStyle = color;
    const w = ctx.measureText(text).width * squeeze;
    condensed(ctx, text, (W - w) / 2, y, squeeze);
  };
  center("NO", W * 0.17, H * 0.74);
  center("STICKERS", W * 0.17, H * 0.87);
  center("ON THIS POLE", W * 0.062, H * 0.935, "#141414", 0.9);
  filmNoise(ctx, W, H, 5);
  return finish(c);
}

/** Back of an aluminium sign: brushed metal, a fabrication label and a stamped part number. */
export function signBackTexture(aspect: number) {
  const W = 1024;
  const H = Math.round(W / aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  roundRect(ctx, 0, 0, W, H, W * 0.05);
  ctx.fillStyle = "#b9bec4";
  ctx.fill();
  ctx.save();
  ctx.clip();
  const rand = seeded(29);
  for (let i = 0; i < 1400; i++) {
    const y = rand() * H;
    const tone = 170 + rand() * 50;
    ctx.strokeStyle = `rgba(${tone}, ${tone + 3}, ${tone + 8}, ${0.08 + rand() * 0.12})`;
    ctx.lineWidth = 0.6 + rand();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + (rand() - 0.5) * 3);
    ctx.stroke();
  }
  // Fabrication label.
  const lx = W * 0.12;
  const ly = H * 0.12;
  ctx.fillStyle = "#f2efe6";
  ctx.fillRect(lx, ly, W * 0.42, H * 0.1);
  ctx.fillStyle = "#2b2b2b";
  ctx.font = `700 ${H * 0.026}px ${SIGN_FONT}`;
  ctx.fillText("PXL SIGN CO.", lx + W * 0.025, ly + H * 0.04);
  ctx.font = `500 ${H * 0.02}px ui-monospace, Menlo, monospace`;
  ctx.fillText("R5-STK · 24×33 · 0.080 AL", lx + W * 0.025, ly + H * 0.075);
  // Stamped date code.
  ctx.fillStyle = "rgba(60, 64, 70, 0.55)";
  ctx.font = `700 ${H * 0.03}px ui-monospace, Menlo, monospace`;
  ctx.fillText("04 · 17 · 26", W * 0.62, H * 0.9);
  ctx.restore();
  return finish(c);
}

/** A small stamped ID plate for the pole. */
export function plateTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 288;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 512, 288);
  g.addColorStop(0, "#c9ccd0");
  g.addColorStop(1, "#8e9398");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 288);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, 484, 260);
  ctx.fillStyle = "#2b2e33";
  ctx.font = "bold 46px ui-monospace, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("CITY OF PIXELS", 256, 104);
  ctx.font = "bold 92px ui-monospace, Menlo, monospace";
  ctx.fillText("PX-0417", 256, 210);
  ctx.font = "28px ui-monospace, Menlo, monospace";
  ctx.fillText("STREET LIGHTING · 240V", 256, 256);
  for (const [x, y] of [
    [36, 36],
    [476, 36],
    [36, 252],
    [476, 252],
  ]) {
    ctx.fillStyle = "#6b7076";
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
