import * as THREE from "three";

type Glyph = {
  unicode: number;
  advance: number;
  isWhitespace: boolean;
  planeBounds?: { left: number; bottom: number; right: number; top: number };
  atlasBounds?: { left: number; bottom: number; right: number; top: number };
};

export type MsdfFont = {
  atlas: { width: number; height: number };
  metrics: { lineHeight: number };
  glyphs: Record<string, Glyph>;
  kerning?: { unicode1: number; unicode2: number; advance: number }[];
  placeholderChar: string;
};

export type TextOptions = {
  text: string;
  width?: number;
  align?: "left" | "center" | "right";
  size?: number;
  letterSpacing?: number;
  lineHeight?: number;
  wordSpacing?: number;
  wordBreak?: boolean;
  baseOffset?: number;
};

export async function loadMsdfFont(url: string): Promise<MsdfFont> {
  const raw = (await fetch(url).then((r) => r.json())) as Omit<MsdfFont, "glyphs" | "placeholderChar"> & {
    glyphs: Omit<Glyph, "isWhitespace">[];
  };
  const glyphs: Record<string, Glyph> = {};
  raw.glyphs.forEach((g) => {
    const ch = String.fromCharCode(g.unicode);
    glyphs[ch] = { ...g, isWhitespace: /\s/.test(ch) };
  });
  return { ...raw, glyphs, placeholderChar: Object.keys(glyphs).sort()[0] };
}

function kerning(font: MsdfFont, a: number, b: number) {
  for (const k of font.kerning ?? []) if (k.unicode1 === a && k.unicode2 === b) return k.advance;
  return 0;
}

export function layoutText(font: MsdfFont, o: TextOptions): THREE.BufferGeometry {
  let text = o.text || "";
  const maxWidth = o.width || Infinity;
  const align = o.align || "left";
  const size = o.size || 1;
  const letterSpacing = o.letterSpacing || 0;
  const lineHeight = o.lineHeight || 1.4;
  const wordSpacing = o.wordSpacing || 0;
  const wordBreak = o.wordBreak || false;
  const baseOffset = o.baseOffset || 0;
  const g = size / font.metrics.lineHeight;
  text = text.replace(/\xA0/g, " ");
  const count = text.replace(/[ \n]/g, "").length;

  const index = new Uint16Array(count * 6);
  const position = new Float32Array(count * 4 * 3);
  const uv = new Float32Array(count * 4 * 2);
  const centr = new Float32Array(count * 4 * 3);
  const uvMask = new Float32Array(count * 4 * 4);
  const textWeights = new Float32Array(count * 4 * 2);
  const lineWeights = new Float32Array(count * 4 * 3);
  for (let t = 0; t < count; t++) index.set([t * 4, t * 4 + 2, t * 4 + 1, t * 4 + 1, t * 4 + 2, t * 4 + 3], t * 6);

  type Line = { width: number; glyphs: [Glyph, number][] };
  const lines: Line[] = [];
  let l = 0;
  let wordStart = 0;
  let wordWidth = 0;
  const newLine = () => {
    const line: Line = { width: 0, glyphs: [] };
    lines.push(line);
    wordStart = l;
    wordWidth = 0;
    return line;
  };
  let line = newLine();
  while (l < text.length) {
    let ch = text[l];
    if (!line.width && /[ \t]/.test(ch)) {
      l++;
      wordStart = l;
      wordWidth = 0;
      continue;
    }
    if (/\n/.test(ch)) {
      if (line.glyphs.length && line.glyphs[line.glyphs.length - 1][0].isWhitespace) {
        line.width -= wordSpacing * size + line.glyphs[line.glyphs.length - 1][0].advance * g;
        line.glyphs.pop();
      }
      l++;
      line = newLine();
      continue;
    }
    let glyph = font.glyphs[ch];
    if (!glyph) {
      ch = font.placeholderChar;
      glyph = font.glyphs[ch];
    }
    if (line.glyphs.length) {
      const prev = line.glyphs[line.glyphs.length - 1][0];
      const k = kerning(font, glyph.unicode, prev.unicode) * g;
      line.width += k;
      wordWidth += k;
    }
    line.glyphs.push([glyph, line.width]);
    let advance = 0;
    if (glyph.isWhitespace) {
      wordStart = l;
      wordWidth = 0;
      advance += wordSpacing * size;
    } else advance += letterSpacing * size;
    advance += glyph.advance * g;
    line.width += advance;
    wordWidth += advance;
    if (line.width > maxWidth) {
      if (wordBreak && line.glyphs.length > 1) {
        line.width -= advance;
        line.glyphs.pop();
        line = newLine();
        continue;
      } else if (!wordBreak && wordWidth !== line.width) {
        const n = l - wordStart + 1;
        line.glyphs.splice(-n, n);
        l = wordStart;
        line.width -= wordWidth;
        line = newLine();
        continue;
      }
    }
    l++;
  }
  if (!line.width) lines.pop();

  const W = font.atlas.width;
  const H = font.atlas.height;
  let y = baseOffset * size;
  let f = 0;
  let glyphTotal = -1;
  let wordTotal = -1;
  const lastLine = lines.length - 1;
  const spacesPerLine: number[] = [];
  lines.forEach((ln) => {
    glyphTotal += ln.glyphs.length;
    wordTotal++;
    let n = 0;
    ln.glyphs.forEach((a) => {
      if (a[0].isWhitespace) {
        wordTotal++;
        n++;
      }
    });
    spacesPerLine.push(n);
  });
  const glyphStep = glyphTotal < 1 ? 0 : 1 / glyphTotal;
  const wordStep = wordTotal < 1 ? 0 : 1 / wordTotal;
  const lineStep = lastLine < 1 ? 0 : 1 / lastLine;
  const glyphInLineStep = lines.map((ln) => (ln.glyphs.length - 1 < 1 ? 0 : 1 / (ln.glyphs.length - 1)));
  const wordInLineStep = spacesPerLine.map((n) => (n < 1 ? 0 : 1 / n));
  let glyphIndex = -1;
  let wordIndex = 0;
  for (let t = 0; t < lines.length; t++) {
    const ln = lines[t];
    const lineWeight = t * lineStep;
    for (let h = 0, b = 0; h < ln.glyphs.length; h++) {
      const r = ln.glyphs[h][0];
      let x = ln.glyphs[h][1];
      if (align === "center") x -= ln.width * 0.5;
      else if (align === "right") x -= ln.width;
      glyphIndex++;
      if (r.isWhitespace || !r.planeBounds || !r.atlasBounds) {
        wordIndex++;
        b++;
        continue;
      }
      const L = r.planeBounds.bottom * g;
      const B = r.planeBounds.left * g;
      const P = r.planeBounds.right * g;
      const S = r.planeBounds.top * g;
      position.set([x + B, y + L, 0, x + B, y + S, 0, x + P, y + L, 0, x + P, y + S, 0], f * 12);
      const cx = x + B + (Math.abs(B) + Math.abs(P)) * 0.5;
      const cy = y + L + (Math.abs(L) + Math.abs(S)) * 0.5;
      centr.set([cx, cy, 0, cx, cy, 0, cx, cy, 0, cx, cy, 0], f * 12);
      const u0 = r.atlasBounds.left / W;
      const u1 = r.atlasBounds.right / W;
      const v0 = r.atlasBounds.bottom / H;
      const v1 = r.atlasBounds.top / H;
      uv.set([u0, v0, u0, v1, u1, v0, u1, v1], f * 8);
      uvMask.set([u0, u1, v0, v1, u0, u1, v0, v1, u0, u1, v0, v1, u0, u1, v0, v1], f * 16);
      const tw = glyphIndex * glyphStep;
      const ww = wordIndex * wordStep;
      textWeights.set([tw, ww, tw, ww, tw, ww, tw, ww], f * 8);
      const gl = glyphInLineStep[t] * h;
      const wl = wordInLineStep[t] * b;
      lineWeights.set([gl, wl, lineWeight, gl, wl, lineWeight, gl, wl, lineWeight, gl, wl, lineWeight], f * 12);
      f++;
    }
    wordIndex++;
    y -= size * lineHeight;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute("uvMask", new THREE.BufferAttribute(uvMask, 4));
  geometry.setAttribute("textWeights", new THREE.BufferAttribute(textWeights, 2));
  geometry.setAttribute("lineWeights", new THREE.BufferAttribute(lineWeights, 3));
  geometry.setAttribute("centr", new THREE.BufferAttribute(centr, 3));
  geometry.computeBoundingBox();
  return geometry;
}
