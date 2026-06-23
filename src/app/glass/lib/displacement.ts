
export type LensShape = {
  width: number;
  height: number;
  borderRadius: number;
};

export type LensParams = LensShape & {
  scale: number;
  depth: number;
  curvature: number;
  splay: number;
};

export type GeneratedMap = {
  dataUrl: string;
  scale: number;
  chromaAmount: number;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const smoothStep = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1e-6), 0, 1);
  return x * x * (3 - 2 * x);
};

const roundedRectSDF = (
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  radius: number
) => {
  const r = Math.min(radius, Math.min(halfW, halfH));
  const qx = Math.abs(x) - (halfW - r);
  const qy = Math.abs(y) - (halfH - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r;
};

export function generateLensMap(p: LensParams): GeneratedMap {
  const w = Math.max(2, Math.round(p.width));
  const h = Math.max(2, Math.round(p.height));
  const halfW = w / 2;
  const halfH = h / 2;
  const depth = Math.max(0.5, p.depth);
  const strength = p.scale * Math.min(w, h);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);

  const qw = Math.ceil(w / 2);
  const qh = Math.ceil(h / 2);
  const dxQuad = new Float32Array(qw * qh);
  const dyQuad = new Float32Array(qw * qh);
  let maxAbs = 1e-6;

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;

      const d = roundedRectSDF(px, py, halfW, halfH, p.borderRadius);

      let dx = 0;
      let dy = 0;
      if (d < 0) {
        const e = 0.75;
        const gx =
          roundedRectSDF(px + e, py, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px - e, py, halfW, halfH, p.borderRadius);
        const gy =
          roundedRectSDF(px, py + e, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px, py - e, halfW, halfH, p.borderRadius);
        const len = Math.hypot(gx, gy) || 1;

        const edge = clamp((d + depth) / depth, 0, 1);
        const curve = clamp(p.curvature, 0, 1);
        const exponent = 5 - 4.6 * curve; // 5 (thin rim) → 0.4 (broad dome)
        const profile = Math.pow(smoothStep(0, 1, edge), exponent);
        const amount = profile * strength * p.splay;

        dx = (gx / len) * amount;
        dy = (gy / len) * amount;
      }

      dxQuad[y * qw + x] = dx;
      dyQuad[y * qw + x] = dy;
      maxAbs = Math.max(maxAbs, Math.abs(dx), Math.abs(dy));
    }
  }

  const data = img.data;
  const put = (x: number, y: number, dx: number, dy: number) => {
    const i = (y * w + x) * 4;
    data[i] = (0.5 + 0.5 * (dx / maxAbs)) * 255; // R = horizontal
    data[i + 1] = (0.5 + 0.5 * (dy / maxAbs)) * 255; // G = vertical
    data[i + 2] = 128; // B unused, held neutral
    data[i + 3] = 255;
  };

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const dx = dxQuad[y * qw + x];
      const dy = dyQuad[y * qw + x];
      const mx = w - 1 - x; // mirrored column
      const my = h - 1 - y; // mirrored row

      put(x, y, dx, dy);
      put(mx, y, -dx, dy);
      put(x, my, dx, -dy);
      put(mx, my, -dx, -dy);
    }
  }

  ctx.putImageData(img, 0, 0);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    scale: 2 * maxAbs,
    chromaAmount: maxAbs,
  };
}
