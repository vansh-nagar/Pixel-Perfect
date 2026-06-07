// Displacement-map generator for the glass effect.
//
// The whole technique rests on a single SVG filter primitive, feDisplacementMap.
// It reads a small PNG we build on the fly from the lens's shape and, for every
// pixel of the refracted content, uses the map's red/green channels to decide how
// far to bend that pixel horizontally and vertically. Everywhere outside the lens
// the map sits at a neutral value so only the region under the glass moves.
//
// The map is the portable part of the effect: on live DOM it drives this SVG
// filter, and when there's no DOM to bend (a canvas QR code, a <video> Safari
// won't filter) the exact same map can feed a WebGL shader instead.

export type LensShape = {
  /** Lens width in px. */
  width: number;
  /** Lens height in px. */
  height: number;
  /** Corner radius in px. */
  borderRadius: number;
};

export type LensParams = LensShape & {
  /** Overall refraction strength (how hard the glass bends content). */
  scale: number;
  /** How far in from the edge, in px, the bend ramps up. */
  depth: number;
  /** Surface curve, 0–1: 0 = flat (thin rim bevel) → 1 = strongly domed. */
  curvature: number;
  /** Spreads the displacement outward, fattening the refracted ring. */
  splay: number;
};

export type GeneratedMap = {
  /** PNG data URL fed to feImage. */
  dataUrl: string;
  /** The pixel scale to hand feDisplacementMap so the encoded vectors land true. */
  scale: number;
  /** Suggested chromatic-aberration spread in px (caller multiplies by chroma). */
  chromaAmount: number;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const smoothStep = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1e-6), 0, 1);
  return x * x * (3 - 2 * x);
};

// Signed distance to a rounded rectangle centred at the origin.
// Negative inside, zero on the edge, positive outside.
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

/**
 * Build the displacement map for a lens. We compute the field once per shape
 * change — never on a simple move — which is what keeps dragging cheap: only the
 * filter region shifts, the map stays the same.
 *
 * Thanks to the rounded rectangle's four-fold symmetry we only ever evaluate the
 * top-left quadrant and mirror each pixel into the other three, negating the X
 * displacement across the vertical axis and Y across the horizontal one. That
 * cuts the per-pixel work to a quarter and keeps generation inside the frame
 * budget on a resize or squish.
 */
export function generateLensMap(p: LensParams): GeneratedMap {
  const w = Math.max(2, Math.round(p.width));
  const h = Math.max(2, Math.round(p.height));
  const halfW = w / 2;
  const halfH = h / 2;
  const depth = Math.max(0.5, p.depth);
  // Refraction strength, in px, scales with the smaller lens dimension so the
  // look holds as the lens changes size.
  const strength = p.scale * Math.min(w, h);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);

  // Pass 1: raw signed displacement, in px, for the top-left quadrant only.
  const qw = Math.ceil(w / 2);
  const qh = Math.ceil(h / 2);
  const dxQuad = new Float32Array(qw * qh);
  const dyQuad = new Float32Array(qw * qh);
  let maxAbs = 1e-6;

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      // Sample at pixel centre, in centre-origin coordinates.
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;

      const d = roundedRectSDF(px, py, halfW, halfH, p.borderRadius);

      let dx = 0;
      let dy = 0;
      if (d < 0) {
        // Surface normal: gradient of the SDF points outward toward the nearest
        // edge. Content is pulled along it, strongest near the rim.
        const e = 0.75;
        const gx =
          roundedRectSDF(px + e, py, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px - e, py, halfW, halfH, p.borderRadius);
        const gy =
          roundedRectSDF(px, py + e, halfW, halfH, p.borderRadius) -
          roundedRectSDF(px, py - e, halfW, halfH, p.borderRadius);
        const len = Math.hypot(gx, gy) || 1;

        // Edge proximity: 0 deep in the flat centre, 1 at the rim.
        const edge = clamp((d + depth) / depth, 0, 1);
        // Curvature 0 → flat (a thin bevel at the very rim); 1 → strongly domed,
        // the bend swelling in toward the centre. It maps to a falloff exponent,
        // kept clear of 0 — which would displace the whole lens uniformly (the
        // old "huge bend to the centre" blowup).
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

  // Pass 2: encode all four quadrants. Neutral (no bend) is 0.5 in each channel;
  // R carries the X push, G the Y push. The mirror writes flip the relevant sign.
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

  // feDisplacementMap moves a pixel by scale * (channel - 0.5). We encoded
  // (channel - 0.5) = 0.5 * (dx / maxAbs), so scale = 2 * maxAbs lands it true.
  return {
    dataUrl: canvas.toDataURL("image/png"),
    scale: 2 * maxAbs,
    chromaAmount: maxAbs,
  };
}
