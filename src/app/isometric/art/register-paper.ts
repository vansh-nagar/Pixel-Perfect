// Receipt geometry — a TypeScript copy of ~/.claude/skills/illustrations/examples/iso-register.paper.mjs.
// The paper is a ribbon x0..x1 wide that follows `curve` (world [y, z] samples, `step` apart, starting in the slot).
// L = how much paper is out; a printed row sits at distance d from the slot along the curve.
export type PaperCfg = { x0: number; x1: number; curve: number[][]; ox: number; oy: number; step: number };
export type PrintedRow = { d: number; segs: number[][] };

export function paperPaths(cfg: PaperCfg, L: number, lines: PrintedRow[]) {
  const { x0, x1, curve, ox, oy, step } = cfg;
  const n = Math.max(1, Math.min(curve.length - 1, Math.round(L / step)));
  const P = (x: number, [y, z]: number[]) => [ox + x - y, oy + (x + y) / 2 - z];
  const r = (v: number) => Math.round(v * 100) / 100;
  const q = ([X, Y]: number[]) => `${r(X)} ${r(Y)}`;
  const left: number[][] = [];
  const right: number[][] = [];
  for (let i = 0; i <= n; i++) {
    left.push(P(x0, curve[i]));
    right.push(P(x1, curve[i]));
  }
  const fill = `M${[...left, ...[...right].reverse()].map(q).join(" L")} Z`;
  const edge = `M${[...left].reverse().map(q).join(" L")} M${q(left[n])} L${q(right[n])} M${right.map(q).join(" L")}`;
  const ink: string[] = [];
  for (const ln of lines) {
    const i = Math.round(ln.d / step);
    if (i < 3 || i > n - 3) continue; // keep clear of the slot and the torn end
    for (const [a, b] of ln.segs) ink.push(`M${q(P(x0 + a, curve[i]))} L${q(P(x0 + b, curve[i]))}`);
  }
  return { fill, edge, ink: ink.join(" ") || "M0 0" };
}

// A printed row: one or two dashes, lengths from a fixed pattern so the receipt looks itemised.
export function printRow(k: number, w: number) {
  const pats = [[[3, 13], [16, w - 3]], [[3, 9], [19, w - 3]], [[3, 15], [21, w - 3]], [[3, w - 8]], [[3, 11], [17, w - 3]]];
  return pats[k % pats.length];
}
