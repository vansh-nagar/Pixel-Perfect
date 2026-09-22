import { C, type SceneFactory, beat, clamp01, disc, easeInOutCubic, gridLines, lerp, mod } from "../scene";

type Tip = [number, number];

const ROWS = 9;
const PER_SIDE = 8;
const PERIOD = 2.4;
const RAY_COLORS = [C.sky, C.pink, C.amber, C.blue, C.sky, C.amber, C.pink, C.red];
const BEAD_COLORS = [C.pink, C.red, C.amber, C.red, C.pink, C.amber];

/**
 * Formations for the right-hand tips, in cells from the origin (y is up).
 * The left side is the mirror image. Every tip is a grid point.
 */
const FORMATIONS: ((k: number) => Tip)[] = [
  (k) => [7, 8 - k], // a column
  (k) => [1 + k, 1 + k], // a 45° V
  (k) => [2 + k, 6], // a row
  (k) => [2 + k, 8 - k], // a Λ
  (k) => {
    // A quarter arc, rounded to the nearest grid points.
    const a = Math.PI / 2 - ((k + 0.5) / PER_SIDE) * (Math.PI * 0.45);
    return [Math.round(7.5 * Math.cos(a)), Math.round(7.5 * Math.sin(a))];
  },
];

/** Wing slope (rise per column) for each formation; the wings flap between them. */
const WING_SLOPES = [0.375, 0.5, 0.25, 0.5, 0.375];

/**
 * Tile 7 — a mirrored fan from the bottom centre. The tips regroup into a new
 * formation every beat, rippling out from the centre, while two long wing rays
 * carry beads that hop outward one column at a time.
 */
export const wings: SceneFactory = () => {
  let width = 0;
  let height = 0;
  let u = 0;
  let ox = 0;
  let oy = 0;

  return {
    background: C.ink,
    resize(w, h) {
      width = w;
      height = h;
      u = h / ROWS;
      ox = w / 2;
      oy = h - 0.1 * u;
    },
    draw(ctx, t) {
      gridLines(ctx, width, height, u, "#171717", { ox, horizontal: false });

      const { index } = beat(t, PERIOD);
      const local = t / PERIOD - index;
      const from = FORMATIONS[mod(index, FORMATIONS.length)];
      const to = FORMATIONS[mod(index + 1, FORMATIONS.length)];
      const X = (x: number) => ox + x * u;
      const Y = (y: number) => oy - y * u;
      const dots: [number, number, string][] = [];

      ctx.lineWidth = 1.25;
      for (let k = 0; k < PER_SIDE; k++) {
        const p = easeInOutCubic(clamp01((local - k * 0.035) / 0.42));
        const [ax, ay] = from(k);
        const [bx, by] = to(k);
        const x = lerp(ax, bx, p);
        const y = lerp(ay, by, p);
        const color = RAY_COLORS[k];
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (const side of [-1, 1]) {
          ctx.moveTo(ox, oy);
          ctx.lineTo(X(side * x), Y(y));
          dots.push([X(side * x), Y(y), color]);
        }
        ctx.stroke();
      }

      // Wings: one heavy orange ray with a salmon partner just above it.
      const wp = easeInOutCubic(clamp01(local / 0.5));
      const slope = lerp(WING_SLOPES[mod(index, WING_SLOPES.length)], WING_SLOPES[mod(index + 1, WING_SLOPES.length)], wp);
      const reach = width / u / 2 + 1;
      for (const side of [-1, 1]) {
        ctx.lineCap = "round";
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(X(side * reach), Y(reach * slope));
        ctx.stroke();
        ctx.strokeStyle = C.salmon;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(X(side * reach), Y(reach * slope * 1.12));
        ctx.stroke();
        ctx.lineCap = "butt";
      }

      // Beads sit on whole columns of the wing and hop out one column per half-beat.
      const hop = beat(t, PERIOD / 4, 0.5);
      for (let k = 0; k <= reach; k++) {
        const x = k + 1 + hop.p;
        const color = BEAD_COLORS[mod(k - hop.index, BEAD_COLORS.length)];
        for (const side of [-1, 1]) dots.push([X(side * x), Y(x * slope), color]);
      }

      // A flat pair along the floor, fixed on the grid.
      ctx.lineWidth = 1.25;
      for (const [x, color] of [[6, C.amber], [8, C.red]] as const) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (const side of [-1, 1]) {
          ctx.moveTo(ox, oy);
          ctx.lineTo(X(side * x), Y(0.25));
          dots.push([X(side * x), Y(0.25), color]);
        }
        ctx.stroke();
      }

      for (const [x, y, color] of dots) disc(ctx, x, y, 0.2 * u, color);
    },
  };
};
