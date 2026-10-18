/**
 * Turns any image (PNG/JPG/WebP/GIF/SVG) into a die-cut sticker texture, all on the CPU:
 *
 *  1. Rasterise the source to fit a 900px box (SVGs at full resolution, never upscaled blurrily).
 *  2. If the image is opaque and its corners agree on a colour, flood-fill that background away.
 *  3. Dilate the silhouette by the border width with an exact Euclidean distance transform,
 *     then "close" it (dilate + erode) so concave corners round off like a real die cut.
 *  4. Fill holes, so letter counters and gaps become white backing instead of see-through.
 *  5. Paint the border colour inside the cut, the artwork on top, and a blurred copy of the
 *     cut as a drop shadow.
 */

export type StickerOptions = {
  /** Border width in px at the 900px working size. */
  border: number;
  borderColor: string;
  /** Remove a flat background from opaque images: "auto" only does it when the corners agree. */
  removeBackground: "auto" | "on" | "off";
};

export type Sticker = {
  /** Die-cut sticker, RGBA, transparent outside the cut. */
  canvas: HTMLCanvasElement;
  /** Soft black silhouette for the drop shadow, same size. */
  shadow: HTMLCanvasElement;
  width: number;
  height: number;
};

const WORK_SIZE = 900;
const INF = 1e20;

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/** Loads a File, Blob or URL into an image. SVGs get explicit pixel dimensions so they rasterise crisply. */
export async function loadImage(
  source: File | Blob | string,
): Promise<HTMLImageElement> {
  let url: string;
  let revoke = false;
  if (typeof source === "string") {
    url = source;
  } else if (
    source.type === "image/svg+xml" ||
    (source instanceof File && source.name.toLowerCase().endsWith(".svg"))
  ) {
    url = URL.createObjectURL(
      new Blob([sizeSvg(await source.text())], { type: "image/svg+xml" }),
    );
    revoke = true;
  } else {
    url = URL.createObjectURL(source);
    revoke = true;
  }
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    if (revoke) URL.revokeObjectURL(url);
  }
}

/** Gives an SVG explicit width/height (from its viewBox) scaled so its long side is WORK_SIZE. */
export function sizeSvg(text: string): string {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName.toLowerCase() !== "svg") return text;
  let w = parseFloat(svg.getAttribute("width") ?? "");
  let h = parseFloat(svg.getAttribute("height") ?? "");
  const viewBox = svg
    .getAttribute("viewBox")
    ?.split(/[\s,]+/)
    .map(Number);
  if ((!w || !h) && viewBox?.length === 4) {
    w = viewBox[2];
    h = viewBox[3];
  }
  if (!w || !h) {
    w = WORK_SIZE;
    h = WORK_SIZE;
  }
  if (!svg.getAttribute("viewBox"))
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const scale = WORK_SIZE / Math.max(w, h);
  svg.setAttribute("width", String(Math.round(w * scale)));
  svg.setAttribute("height", String(Math.round(h * scale)));
  return new XMLSerializer().serializeToString(svg);
}

// ---------------------------------------------------------------------------
// Distance transform (Felzenszwalb & Huttenlocher, exact squared Euclidean)
// ---------------------------------------------------------------------------

function edt1d(
  f: Float64Array,
  n: number,
  d: Float64Array,
  v: Int32Array,
  z: Float64Array,
) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Distance in px from every pixel to the nearest pixel where `inside[i]` is true. */
function distanceTo(inside: Uint8Array, w: number, h: number): Float32Array {
  const grid = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) grid[i] = inside[i] ? 0 : INF;
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Flood fills
// ---------------------------------------------------------------------------

/** Marks pixels reachable from the image edge through pixels where `passable` is true. */
function floodFromEdges(
  passable: (i: number) => boolean,
  w: number,
  h: number,
): Uint8Array {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;
  const push = (i: number) => {
    if (!seen[i] && passable(i)) {
      seen[i] = 1;
      stack[top++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (top > 0) {
    const i = stack[--top];
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  return seen;
}

function colorDistance(
  data: Uint8ClampedArray,
  i: number,
  r: number,
  g: number,
  b: number,
) {
  const dr = data[i * 4] - r;
  const dg = data[i * 4 + 1] - g;
  const db = data[i * 4 + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Removes a flat background from an opaque image by flooding from the edges. Returns true if it did. */
function removeFlatBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  force: boolean,
): boolean {
  // Average an 8×8 patch per corner so paper grain or JPEG noise doesn't fool the check.
  const patch = Math.max(1, Math.min(8, Math.floor(Math.min(w, h) / 4)));
  const cornerMean = (x0: number, y0: number) => {
    const m = [0, 0, 0];
    for (let y = y0; y < y0 + patch; y++)
      for (let x = x0; x < x0 + patch; x++)
        for (let c = 0; c < 3; c++)
          m[c] += data[(y * w + x) * 4 + c] / (patch * patch);
    return m;
  };
  const means = [
    cornerMean(0, 0),
    cornerMean(w - patch, 0),
    cornerMean(0, h - patch),
    cornerMean(w - patch, h - patch),
  ];
  const ref = [0, 1, 2].map((c) => means.reduce((s, m) => s + m[c] / 4, 0));
  const cornersAgree = means.every(
    (m) => Math.hypot(m[0] - ref[0], m[1] - ref[1], m[2] - ref[2]) < 30,
  );
  if (!force && !cornersAgree) return false;
  const tolerance = 42;
  // Also take drop shadows cast on the background: same hue as the background, just darker.
  // The brightness floor keeps near-neutral darks (black hair, outlines) out.
  const refSum = ref[0] + ref[1] + ref[2];
  const isBackground = (i: number) => {
    if (colorDistance(data, i, ref[0], ref[1], ref[2]) < tolerance) return true;
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const sum = r + g + b;
    if (sum < refSum * 0.3) return false;
    return (
      Math.hypot(
        r / sum - ref[0] / refSum,
        g / sum - ref[1] / refSum,
        b / sum - ref[2] / refSum,
      ) < 0.045
    );
  };
  const bg = floodFromEdges(isBackground, w, h);
  for (let i = 0; i < w * h; i++) if (bg[i]) data[i * 4 + 3] = 0;
  // Soften the cut edge by one pixel so it doesn't alias.
  for (let i = 0; i < w * h; i++) {
    if (bg[i]) continue;
    const x = i % w;
    const edge =
      (x > 0 && bg[i - 1]) ||
      (x < w - 1 && bg[i + 1]) ||
      (i >= w && bg[i - w]) ||
      (i < w * (h - 1) && bg[i + w]);
    if (edge) data[i * 4 + 3] = Math.min(data[i * 4 + 3], 140);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function makeSticker(
  image: HTMLImageElement,
  options: StickerOptions,
): Sticker {
  const srcW = image.naturalWidth || WORK_SIZE;
  const srcH = image.naturalHeight || WORK_SIZE;
  const scale = WORK_SIZE / Math.max(srcW, srcH);
  const artW = Math.max(1, Math.round(srcW * scale));
  const artH = Math.max(1, Math.round(srcH * scale));

  const border = Math.max(0, options.border);
  const round = Math.round(border * 0.6 + 4); // closing radius: rounds concave corners
  const shadowBlur = Math.round(border * 0.8 + 10);
  const pad = Math.ceil(border + round + shadowBlur + 6);
  const w = artW + pad * 2;
  const h = artH + pad * 2;

  // 1. Artwork on a padded canvas.
  const art = document.createElement("canvas");
  art.width = w;
  art.height = h;
  const actx = art.getContext("2d", { willReadFrequently: true })!;
  actx.imageSmoothingQuality = "high";
  actx.drawImage(image, pad, pad, artW, artH);
  const artData = actx.getImageData(0, 0, w, h);
  const px = artData.data;

  // 2. Opaque images: knock out a flat background.
  let opaque = true;
  for (let y = pad; y < pad + artH && opaque; y += 7)
    for (let x = pad; x < pad + artW; x += 7)
      if (px[(y * w + x) * 4 + 3] < 250) {
        opaque = false;
        break;
      }
  if (opaque && options.removeBackground !== "off") {
    // Flood only inside the artwork rect; the padding is already transparent.
    const sub = actx.getImageData(pad, pad, artW, artH);
    if (
      removeFlatBackground(
        sub.data,
        artW,
        artH,
        options.removeBackground === "on",
      )
    ) {
      actx.putImageData(sub, pad, pad);
      artData.data.set(actx.getImageData(0, 0, w, h).data);
    }
  }

  // 3. Silhouette → dilate by border + round → erode by round (morphological closing).
  const content = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) content[i] = px[i * 4 + 3] > 127 ? 1 : 0;
  const toContent = distanceTo(content, w, h);
  const dilated = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++)
    dilated[i] = toContent[i] <= border + round ? 1 : 0;

  // 4. Fill holes in the dilated shape before eroding.
  const outside = floodFromEdges((i) => !dilated[i], w, h);
  const notShape = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) notShape[i] = outside[i];
  const toOutside = distanceTo(notShape, w, h);

  // Anti-aliased cut: distance from the eroded edge, ±0.5px.
  const cut = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    cut[i] = Math.min(1, Math.max(0, toOutside[i] - round + 0.5));
  // Keep artwork that would poke past a zero-width border fully covered.
  for (let i = 0; i < w * h; i++)
    cut[i] = Math.max(cut[i], px[i * 4 + 3] / 255);

  // 5. Paint: border colour inside the cut, artwork on top.
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const color = parseColor(options.borderColor);
  const base = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    base.data[i * 4] = color[0];
    base.data[i * 4 + 1] = color[1];
    base.data[i * 4 + 2] = color[2];
    base.data[i * 4 + 3] = Math.round(cut[i] * 255);
  }
  ctx.putImageData(base, 0, 0);
  ctx.drawImage(art, 0, 0); // the cut already covers every artwork pixel

  // Shadow: blurred silhouette.
  const silhouette = document.createElement("canvas");
  silhouette.width = w;
  silhouette.height = h;
  const sctx = silhouette.getContext("2d")!;
  const sdata = sctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++)
    sdata.data[i * 4 + 3] = Math.round(cut[i] * 255);
  sctx.putImageData(sdata, 0, 0);
  const shadow = document.createElement("canvas");
  shadow.width = w;
  shadow.height = h;
  const shctx = shadow.getContext("2d")!;
  shctx.filter = `blur(${shadowBlur * 0.5}px)`;
  shctx.drawImage(silhouette, 0, 0);

  return { canvas, shadow, width: w, height: h };
}

function parseColor(css: string): [number, number, number] {
  const c = document.createElement("canvas").getContext("2d")!;
  c.fillStyle = css;
  const hex = c.fillStyle;
  if (hex.startsWith("#"))
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  const m = hex.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
  return [m[0], m[1], m[2]];
}
