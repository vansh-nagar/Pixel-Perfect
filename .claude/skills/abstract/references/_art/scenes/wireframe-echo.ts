import { C, type SceneFactory, beat, easeInOutExpo } from "../scene";

const PERIOD = 2.2;
const ECHOES = 5;
/** Seconds each echo trails the one in front of it. */
const LAG = 0.07;
const LINE = "#74c6ff";
/** Box half-extents in grid units: 6 × 3 × 4 when whole. */
const BOX = [3, 1.5, 2] as const;
const EDGES = [
  [0, 1], [1, 3], [3, 2], [2, 0],
  [4, 5], [5, 7], [7, 6], [6, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
] as const;

/**
 * Tile 12 — a wireframe box on blue that snaps a quarter turn every beat.
 * Echo copies replay the same turn a few frames late, so they fan out while
 * the box is moving and collapse back into one clean box when it rests.
 */
export const wireframeEcho: SceneFactory = () => {
  let height = 0;
  let cx = 0;
  let cy = 0;

  return {
    background: C.blue,
    resize(w, h) {
      height = h;
      cx = w / 2;
      cy = h * 0.46;
    },
    draw(ctx, t) {
      const scale = height * 0.155;
      const pitch = 0.42;
      const distance = 11;
      ctx.lineWidth = 1;
      ctx.strokeStyle = LINE;

      for (let e = ECHOES - 1; e >= 0; e--) {
        const { index, p } = beat(Math.max(0, t - e * LAG), PERIOD, 0.5, easeInOutExpo);
        const yaw = 0.6 + (Math.PI / 2) * (index + p);
        // Each echo is a touch smaller and fainter than the one in front.
        const size = 1 - e * 0.045;
        ctx.globalAlpha = 1 - e * 0.16;

        const points: [number, number][] = [];
        for (let i = 0; i < 8; i++) {
          const x = (i & 1 ? 1 : -1) * BOX[0] * size;
          const y = (i & 2 ? 1 : -1) * BOX[1] * size;
          const z = (i & 4 ? 1 : -1) * BOX[2] * size;
          // Turn about the vertical axis, tip towards the viewer, then project.
          const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
          const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
          const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
          const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
          const f = distance / (distance + z2);
          points.push([cx + x1 * f * scale, cy + y2 * f * scale]);
        }
        ctx.beginPath();
        for (const [a, b] of EDGES) {
          ctx.moveTo(points[a][0], points[a][1]);
          ctx.lineTo(points[b][0], points[b][1]);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  };
};
