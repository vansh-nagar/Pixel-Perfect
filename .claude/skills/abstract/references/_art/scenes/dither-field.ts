import { C, type SceneFactory, hash, mod } from "../scene";

const MARK = "#ff9249";

const smooth = (p: number) => p * p * (3 - 2 * p);

/** 3D value noise in 0–1: hashed lattice corners, smoothly interpolated. */
function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const fz = smooth(z - zi);
  const corner = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
  const face = (dz: number) =>
    lerp(lerp(corner(0, 0, dz), corner(1, 0, dz), fx), lerp(corner(0, 1, dz), corner(1, 1, dz), fx), fy);
  return lerp(face(0), face(1), fz);
}

/**
 * Tile 11 — a dithered field on orange. A fine grid of marks is fixed in place;
 * a slowly drifting noise field only decides which marks are on, so the blobs
 * flow while every mark stays in its cell. A diagonal skip pattern gives the
 * marks their woven, hatched texture.
 */
export const ditherField: SceneFactory = () => {
  let width = 0;
  let height = 0;
  let pitch = 0;

  return {
    background: C.orange,
    resize(w, h) {
      width = w;
      height = h;
      pitch = Math.max(3, h / 44);
    },
    draw(ctx, t) {
      const cols = Math.ceil(width / pitch);
      const rows = Math.ceil(height / pitch);
      const markW = pitch * 0.72;
      const markH = pitch * 0.4;
      ctx.fillStyle = MARK;
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        // Noise coordinates in tile heights, stretched so blobs run wide.
        const ny = ((j * pitch) / height) * 2.6;
        for (let i = 0; i < cols; i++) {
          if (mod(i - j, 3) === 0) continue;
          const nx = ((i * pitch) / height) * 1.4 - t * 0.09;
          // A slow warp bends the lattice so blob edges read organic, not diagonal.
          const warp = noise(nx * 0.6 + 11, ny * 0.6, t * 0.05);
          const v = 0.65 * noise(nx + warp * 1.2, ny, t * 0.12) + 0.35 * noise(nx * 2.3 + 7, ny * 2.3, t * 0.2 + 3);
          if (v < 0.5) continue;
          ctx.rect(i * pitch + (pitch - markW) / 2, j * pitch + (pitch - markH) / 2, markW, markH);
        }
      }
      ctx.fill();
    },
  };
};
