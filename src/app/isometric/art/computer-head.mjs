// Copy of ~/.claude/skills/illustrations/examples/iso-computer.head.mjs — keep the two in sync.
// The computer's head (neck, CRT tube, bezel, screen, eyes) as a function of its yaw: rebuilt from the 3D model
// at any angle, so it can turn on its stand and still occlude correctly. Self-contained (no imports) so the
// same file runs in the generator, the demo page and the Next page (copied to src/app/isometric/art/).
// Yaw turns the head about the stand's pivot; 0 faces +x (down-right on screen).

export const ORIGIN = [80, 86];
export const PIVOT = [38, 32];
/** How far the head may turn (radians): past these the screen or the side face foreshortens into a smudge. */
export const YAW = [-0.4, 0.42];

const P = ([x, y, z]) => [ORIGIN[0] + x - y, ORIGIN[1] + (x + y) / 2 - z];
const r2 = (n) => Math.round(n * 100) / 100;
const path = (pts, close = true) => "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join(" L") + (close ? " Z" : "");
const add = (a, b, k = 1) => a.map((c, i) => c + b[i] * k);

function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const c = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && c(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && c(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/** Rounded rect on any plane (corner o, axes u, v, size a × b, radius r), with each point's outward normal. */
function ringN(o, u, v, a, b, r, n = 6) {
  const pts = [], nrm = [];
  for (const [cs, ct, s0] of [[a - r, r, -90], [a - r, b - r, 0], [r, b - r, 90], [r, r, 180]])
    for (let i = 0; i <= n; i++) {
      const t = ((s0 + (90 * i) / n) * Math.PI) / 180, cu = Math.cos(t), cv = Math.sin(t);
      pts.push([0, 1, 2].map((k) => o[k] + u[k] * (cs + r * cu) + v[k] * (ct + r * cv)));
      nrm.push([0, 1, 2].map((k) => u[k] * cu + v[k] * cv));
    }
  return { pts, nrm };
}
/** A ring swept along dir: body (fill), sil (silhouette without the near cap), near (cap facing the viewer), seam(t). */
function prism(ring, dir) {
  const R0 = ring.pts, R1 = R0.map((p) => add(p, dir)), nearIs1 = dir[0] + dir[1] + dir[2] > 0;
  const near = nearIs1 ? R1 : R0, far = nearIs1 ? R0 : R1;
  const ok = ring.nrm.map((q) => q[0] + q[1] + q[2] > 1e-9), n = ok.length;
  const s = ok.findIndex((v, i) => v && !ok[(i - 1 + n) % n]), run = [];
  for (let k = 0; k < n && ok[(s + k) % n]; k++) run.push((s + k) % n);
  const i0 = run[0], i1 = run.at(-1);
  return {
    body: path(hull([...R0, ...R1].map(P))),
    sil: [path(run.map((i) => P(far[i])), false), path([P(far[i0]), P(near[i0])], false), path([P(far[i1]), P(near[i1])], false)].join(" "),
    near: path(near.map(P)),
    seam: (t) => path(run.map((i) => P(add(R0[i], dir, t))), false),
  };
}

/** Every path of the head at yaw (radians), keyed; plus the eyes' decal matrix and whether the side marks face us. */
export function head(yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw), X = [c, s, 0], Y = [-s, c, 0], Z = [0, 0, 1];
  const W = (lx, ly, z) => [PIVOT[0] + (lx - PIVOT[0]) * c - (ly - PIVOT[1]) * s, PIVOT[1] + (lx - PIVOT[0]) * s + (ly - PIVOT[1]) * c, z];
  const box = (x0, y0, x1, y1, z0, z1, r) => prism(ringN(W(x0, y0, z0), X, Y, x1 - x0, y1 - y0, r), [0, 0, z1 - z0]);
  const onTop = (x, y, z, a, b, r) => path(ringN(W(x, y, z), X, Y, a, b, r, 4).pts.map(P));
  const onFront = (x, y, z, a, b, r) => path(ringN(W(x, y, z), Y, Z, a, b, r, 4).pts.map(P)); // a face at local x = const
  const onSide = (x, y, z, a, b, r) => path(ringN(W(x, y, z), X, Z, a, b, r, 4).pts.map(P)); // a face at local y = const
  const neck = box(32, 26, 44, 38, 24, 28, 3);
  const tube = box(18, 15, 48, 49, 31, 64, 7);
  const bezel = box(44, 6, 62, 58, 28, 74, 4); // sits on the neck, clear of the stand plate
  const sideShows = c - s > 0.72; // +y faces foreshorten as the head turns right: hide their marks before they crowd
  const eo = W(62, 32, 49), eu = [s, -c, 0], m = (n) => r2(n);
  return {
    paths: {
      "neck-body": neck.body, "neck-sil": neck.sil, "neck-top": neck.near,
      "tube-body": tube.body, "tube-top": tube.near, "tube-sil": tube.sil, "tube-bevel": tube.seam(31 / 33),
      "tube-slots": [20.5, 23.5, 26.5].map((x) => onTop(x, 22, 64, 1.6, 20, 0.8)).join(" "), // well back from the bezel at every yaw
      "tube-frame": sideShows ? onSide(27, 49, 37, 12, 21, 3) : "M0 0",
      "tube-frame-in": sideShows ? onSide(30, 49, 40, 6, 15, 2) : "M0 0",
      "bezel-body": bezel.body, "bezel-top": bezel.near, "bezel-sil": bezel.sil, "bezel-bevel": bezel.seam(44 / 46),
      "bezel-side": sideShows ? onSide(48, 58, 31, 10, 36, 2.5) : "M0 0",
      "screen-frame": onFront(62, 11, 31, 42, 36, 6), "screen-step": onFront(62, 13.5, 33.5, 37, 31, 4.5), "screen": onFront(62, 16, 36, 32, 26, 3.5),
    },
    // decal for the eyes: (s, t) → eo + eu·s − z·t, so they read toward screen-right and down
    decal: `matrix(${m(eu[0] - eu[1])} ${m((eu[0] + eu[1]) / 2)} 0 1 ${m(P(eo)[0])} ${m(P(eo)[1])})`,
  };
}

/** Classes for each path, in paint order (the generator writes them, the page updates their d). */
export const HEAD_ORDER = [
  ["neck-body", "o"], ["neck-sil", "sm"], ["neck-top", "o2 sm"],
  ["tube-body", "o"], ["tube-top", "o2 sm"], ["tube-sil", "s"], ["tube-bevel", "sd"], ["tube-slots", "v sd"], ["tube-frame", "sm"], ["tube-frame-in", "sd"],
  ["bezel-body", "o"], ["bezel-top", "o2 sm"], ["bezel-sil", "s hl"], ["bezel-bevel", "sd"], ["bezel-side", "sd"],
  ["screen-frame", "sm"], ["screen-step", "sd"], ["screen", "v sd"],
];
