/**
 * The endless world for the street drive: rolling hills, a winding road draped over them,
 * and towns, shops and trees along the way.
 *
 * Everything hangs off one smooth height function `heightAt(x, z)` in world metres:
 *  - the terrain mesh around the car samples it on a fixed world grid (so it never swims),
 *  - the physics heightfield around the car samples the same function,
 *  - the road ribbon samples it at its edges, so the road always lies on the ground and
 *    banks with the hillside.
 * The road's centreline comes from a curvature function of distance (alternating S-bends
 * with the odd straight), integrated a couple of metres at a time as the car drives on.
 *
 * Coordinates: world positions are JS doubles; everything handed to three.js and Rapier
 * is relative to a floating `origin` that is moved when the car gets far from it, so f32
 * positions stay small.
 */

import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export const ROAD = { width: 14, tile: 12, lane: 1.85 };
const DS = 2; // m between centreline samples
const CHUNK = 60; // samples per chunk (120 m)
const AHEAD = 1000; // m of road kept ahead of the car; the fog ends at 950
const BEHIND = 120; // enough to see in the mirror-view drag and to reverse

// Terrain: a grid on a fixed world lattice, re-centred as the car moves.
const TERRAIN = { cell: 8, cells: 250, tiles: 10, recentre: 120 };
// Physics heightfield: finer and smaller.
const FIELD = { cell: 2, cells: 160, recentre: 70 };

/** Rolling hills, in world metres. Slopes stay under ~16%, crests go light at speed. */
export function heightAt(x: number, z: number) {
  return (
    18 * Math.sin(x * 0.0021 + 1.3) * Math.cos(z * 0.0017) +
    7 * Math.sin(x * 0.0061 + z * 0.0043) +
    3.2 * Math.sin(z * 0.011 - x * 0.007 + 2) +
    1.2 * Math.sin(x * 0.023) * Math.sin(z * 0.019)
  );
}

/** Curvature (1/m) at distance s: S-bends of two lengths, eased into straights now and then. */
const curvatureAt = (s: number) => {
  const envelope = 0.55 + 0.45 * Math.sin(s / 900 + 0.4);
  // Straight out of the start, easing into the bends over the first ~400 m.
  const ease = Math.min(1, Math.max(0, (s - 120) / 300));
  return ((0.75 * Math.sin(s / 170 + 0.5) + 0.45 * Math.sin(s / 71)) * envelope * ease * ease) / 150;
};

/** Town or country at distance s; towns get buildings and shops, the country gets trees. */
const townAt = (s: number) => Math.sin(s / 650 + 1) > 0.15;

const random = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** The centreline, generated ahead and dropped behind. Index `i` is global. */
class Path {
  base = 0;
  x: number[] = [];
  z: number[] = [];
  th: number[] = [];
  private s = 0;
  private cx = 0;
  private cz = 0;
  private cth = 0;

  get end() {
    return this.base + this.x.length;
  }
  ensure(index: number) {
    while (this.end <= index) {
      this.x.push(this.cx);
      this.z.push(this.cz);
      this.th.push(this.cth);
      // Midpoint integration of heading, then position.
      const mid = this.cth + (curvatureAt(this.s) * DS) / 2;
      this.cx += Math.sin(mid) * DS;
      this.cz += Math.cos(mid) * DS;
      this.cth += curvatureAt(this.s) * DS;
      this.s += DS;
    }
  }
  trim(index: number) {
    const n = index - this.base;
    if (n <= 0) return;
    this.x.splice(0, n);
    this.z.splice(0, n);
    this.th.splice(0, n);
    this.base = index;
  }
  px(i: number) {
    return this.x[i - this.base];
  }
  pz(i: number) {
    return this.z[i - this.base];
  }
  heading(i: number) {
    return this.th[i - this.base];
  }
  /** Nearest sample to a world point, searching around a hint. */
  nearest(x: number, z: number, hint: number, reach = 80) {
    let best = hint;
    let bestD = Infinity;
    const lo = Math.max(this.base, hint - reach);
    const hi = Math.min(this.end - 1, hint + reach);
    for (let i = lo; i <= hi; i++) {
      const d = (this.px(i) - x) ** 2 + (this.pz(i) - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return { index: best, dist: Math.sqrt(bestD) };
  }
}

type Chunk = { index: number; anchorX: number; anchorZ: number; group: THREE.Group; body: RAPIER.RigidBody; meshes: THREE.Mesh[] };

const canvasTexture = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, anisotropy: number, srgb = true) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
};

// One 3.5 m × 3.2 m bay of facade: wall, a window with frame, sill and a glint of sky.
const drawFacade = (c: CanvasRenderingContext2D) => {
  c.fillStyle = "#f2efe8";
  c.fillRect(0, 0, 256, 256);
  const g = c.createLinearGradient(0, 60, 0, 200);
  g.addColorStop(0, "#5d7186");
  g.addColorStop(0.55, "#2b3542");
  g.addColorStop(1, "#1d232c");
  c.fillStyle = "#cfc9bd";
  c.fillRect(44, 52, 168, 152);
  c.fillStyle = g;
  c.fillRect(52, 60, 152, 136);
  c.fillStyle = "rgba(255,255,255,0.18)";
  c.beginPath();
  c.moveTo(52, 60);
  c.lineTo(120, 60);
  c.lineTo(52, 150);
  c.fill();
  c.fillStyle = "#cfc9bd";
  c.fillRect(126, 60, 4, 136);
  c.fillStyle = "#bdb6a8";
  c.fillRect(38, 204, 180, 8);
};

// Awning: stripes, tinted per shop.
const drawAwning = (c: CanvasRenderingContext2D) => {
  for (let i = 0; i < 8; i++) {
    c.fillStyle = i % 2 ? "#ffffff" : "#d9d9d9";
    c.fillRect(i * 32, 0, 32, 64);
  }
};

const drawGround = (c: CanvasRenderingContext2D) => {
  c.fillStyle = "#857f57";
  c.fillRect(0, 0, 512, 512);
  const rand = random(9);
  for (let i = 0; i < 30000; i++) {
    c.fillStyle = ["#79744f", "#938b62", "#6c6a4a", "#a0956b", "#76804f"][Math.floor(rand() * 5)];
    c.globalAlpha = 0.25 + rand() * 0.4;
    const r = 1 + rand() * 3;
    c.fillRect(rand() * 512, rand() * 512, r, r);
  }
  c.globalAlpha = 1;
};

/** Window UVs from the instance's metric size, so bays tile instead of stretching. */
const facadeShader = (shader: THREE.WebGLProgramParametersWithUniforms) => {
  shader.vertexShader = shader.vertexShader.replace(
    "#include <uv_vertex>",
    /* glsl */ `
      #include <uv_vertex>
      #ifdef USE_INSTANCING
        vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
      #else
        vec3 sc = vec3(1.0);
      #endif
      vec3 lp = (position + vec3(0.0, 0.5, 0.0)) * sc;
      vec2 fuv = abs(normal.x) > 0.5 ? vec2(lp.z, lp.y) : vec2(lp.x, lp.y);
      vMapUv = fuv / vec2(3.5, 3.2);
    `,
  );
};

export function createWorld({
  scene,
  physics,
  anisotropy,
  roadMap,
}: {
  scene: THREE.Scene;
  physics: RAPIER.World;
  anisotropy: number;
  roadMap: THREE.Texture;
}) {
  const origin = { x: 0, z: 0 };
  const path = new Path();
  const chunks = new Map<number, Chunk>();
  const disposables: { dispose: () => void }[] = [];
  let hint = 0;

  // Shared geometry and materials.
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  unitBox.translate(0, 0.5, 0); // base at y = 0
  const facadeMap = canvasTexture(256, 256, drawFacade, anisotropy);
  const facadeMat = new THREE.MeshStandardMaterial({ map: facadeMap, roughness: 0.85 });
  facadeMat.onBeforeCompile = facadeShader;
  facadeMat.customProgramCacheKey = () => "facade";
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a4744, roughness: 0.95 });
  const awningMap = canvasTexture(256, 64, drawAwning, anisotropy);
  const awningMat = new THREE.MeshStandardMaterial({ map: awningMap, roughness: 0.8 });
  const signMat = new THREE.MeshStandardMaterial({ roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.08 });
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 1, 6);
  trunkGeo.translate(0, 0.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b4632, roughness: 1 });
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const pineGeo = new THREE.ConeGeometry(1, 1, 7);
  pineGeo.translate(0, 0.5, 0);
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
  const postGeo = new THREE.BoxGeometry(0.12, 1, 0.12);
  postGeo.translate(0, 0.5, 0);
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 });
  const reflectorMat = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 0.6, roughness: 0.4 });
  const roadMat = new THREE.MeshStandardMaterial({ map: roadMap, roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 });
  disposables.push(unitBox, facadeMap, facadeMat, roofMat, awningMap, awningMat, signMat, trunkGeo, trunkMat, crownGeo, pineGeo, leafMat, postGeo, postMat, reflectorMat, roadMat);

  // Terrain: a grid of tiles, so the camera's view cone skips the ones it can't see
  // (behind the car, off to the sides). Normals come from the height function itself, so
  // tile edges light identically and never show a seam.
  const groundMap = canvasTexture(512, 512, drawGround, anisotropy);
  const groundMat = new THREE.MeshStandardMaterial({ map: groundMap, roughness: 1 });
  const tileCells = TERRAIN.cells / TERRAIN.tiles;
  const tN = tileCells + 1;
  const tiles = Array.from({ length: TERRAIN.tiles * TERRAIN.tiles }, () => {
    const geo = new THREE.PlaneGeometry(1, 1, tileCells, tileCells);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, groundMat);
    scene.add(mesh);
    disposables.push(geo);
    return mesh;
  });
  disposables.push(groundMap, groundMat);
  let terrainCentre = { x: Infinity, z: Infinity };

  const normal = new THREE.Vector3();
  const buildTerrain = (cx: number, cz: number) => {
    // Centre on the world lattice so vertices always land on the same world points.
    const gx = Math.round(cx / TERRAIN.cell) * TERRAIN.cell;
    const gz = Math.round(cz / TERRAIN.cell) * TERRAIN.cell;
    terrainCentre = { x: gx, z: gz };
    const half = (TERRAIN.cells * TERRAIN.cell) / 2;
    const e = 0.5; // finite-difference step for normals
    tiles.forEach((tile, t) => {
      const tx = t % TERRAIN.tiles;
      const tz = Math.floor(t / TERRAIN.tiles);
      const geo = tile.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const nor = geo.attributes.normal as THREE.BufferAttribute;
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      for (let r = 0; r < tN; r++) {
        for (let c = 0; c < tN; c++) {
          const k = r * tN + c;
          const wx = gx - half + (tx * tileCells + c) * TERRAIN.cell;
          const wz = gz - half + (tz * tileCells + r) * TERRAIN.cell;
          // Sit a hair under the road so the ribbon always wins.
          pos.setXYZ(k, wx - origin.x, heightAt(wx, wz) - 0.02, wz - origin.z);
          normal.set(heightAt(wx - e, wz) - heightAt(wx + e, wz), 2 * e, heightAt(wx, wz - e) - heightAt(wx, wz + e)).normalize();
          nor.setXYZ(k, normal.x, normal.y, normal.z);
          uv.setXY(k, (wx % 24000) / 24, (wz % 24000) / 24);
        }
      }
      pos.needsUpdate = nor.needsUpdate = uv.needsUpdate = true;
      geo.computeBoundingSphere();
    });
  };

  // Physics heightfield.
  let field: RAPIER.Collider | null = null;
  let fieldCentre = { x: Infinity, z: Infinity };
  const buildField = (cx: number, cz: number) => {
    const gx = Math.round(cx / FIELD.cell) * FIELD.cell;
    const gz = Math.round(cz / FIELD.cell) * FIELD.cell;
    fieldCentre = { x: gx, z: gz };
    const n = FIELD.cells;
    const size = n * FIELD.cell;
    const heights = new Float32Array((n + 1) * (n + 1));
    // Rapier layout: row i runs along z, column j along x, column-major.
    for (let j = 0; j <= n; j++) {
      const wx = gx + (j / n - 0.5) * size;
      for (let i = 0; i <= n; i++) heights[i + j * (n + 1)] = heightAt(wx, gz + (i / n - 0.5) * size);
    }
    if (field) physics.removeCollider(field, false);
    field = physics.createCollider(
      RAPIER.ColliderDesc.heightfield(n, n, heights, { x: size, y: 1, z: size })
        .setTranslation(gx - origin.x, 0, gz - origin.z)
        .setFriction(1),
    );
  };

  // A chunk: road ribbon, posts, props and their colliders.
  const buildChunk = (index: number): Chunk => {
    const i0 = index * CHUNK;
    const i1 = i0 + CHUNK; // inclusive, so neighbouring ribbons share an edge
    path.ensure(i1 + 1);
    const anchorX = path.px(i0);
    const anchorZ = path.pz(i0);
    const group = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    const rand = random(index * 7919 + 13);

    // Road ribbon: five points across, each on the ground.
    const across = [-ROAD.width / 2, -ROAD.width / 4, 0, ROAD.width / 4, ROAD.width / 2];
    const rows = i1 - i0 + 1;
    const pos = new Float32Array(rows * across.length * 3);
    const uv = new Float32Array(rows * across.length * 2);
    for (let r = 0; r < rows; r++) {
      const i = i0 + r;
      const th = path.heading(i);
      const lx = Math.cos(th); // left of travel
      const lz = -Math.sin(th);
      across.forEach((o, a) => {
        const wx = path.px(i) + lx * o;
        const wz = path.pz(i) + lz * o;
        const k = r * across.length + a;
        pos.set([wx - anchorX, heightAt(wx, wz), wz - anchorZ], k * 3);
        uv.set([(o + ROAD.width / 2) / ROAD.width, (i * DS) / ROAD.tile], k * 2);
      });
    }
    const idx: number[] = [];
    for (let r = 0; r < rows - 1; r++) {
      for (let a = 0; a < across.length - 1; a++) {
        const k = r * across.length + a;
        const n = k + across.length;
        idx.push(k, n, k + 1, k + 1, n, n + 1);
      }
    }
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    roadGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    roadGeo.setIndex(idx);
    roadGeo.computeVertexNormals();
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.renderOrder = 1;
    group.add(roadMesh);
    meshes.push(roadMesh);

    // Collect props as transforms, then instance them.
    type Inst = { m: THREE.Matrix4; c?: THREE.Color };
    const posts: Inst[] = [];
    const reflectors: Inst[] = [];
    const bodies: Inst[] = [];
    const roofs: Inst[] = [];
    const awnings: Inst[] = [];
    const signs: Inst[] = [];
    const trunks: Inst[] = [];
    const crowns: Inst[] = [];
    const pines: Inst[] = [];
    const colliders: RAPIER.ColliderDesc[] = [];

    const quat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    // Turned to the road heading `yaw`, a box's local x runs across the road (to the left)
    // and local z along it. `tilt` rolls it about its along-road axis.
    const place = (x: number, y: number, z: number, yaw: number, sx: number, sy: number, sz: number, tilt = 0) => {
      quat.setFromAxisAngle(up, yaw);
      if (tilt) quat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt));
      return new THREE.Matrix4().compose(new THREE.Vector3(x - anchorX, y, z - anchorZ), quat.clone(), new THREE.Vector3(sx, sy, sz));
    };
    // Is a world point at least `gap` metres from the road centreline?
    const clear = (x: number, z: number, gap: number) => path.nearest(x, z, i0 + CHUNK / 2, CHUNK + 40).dist > gap;

    const facades = [0xf3e9dc, 0xe9dccd, 0xdfe4e6, 0xf1dccf, 0xe4e0d0, 0xd9d4cc, 0xefe4c8];
    const awningTints = [0xc8423a, 0x2f6f8f, 0x3c8a55, 0xe0a23a, 0x7a4fa0];
    const greens = [0x5e7a3a, 0x6f8b43, 0x4f6b33, 0x7d8f45, 0x56723f];

    for (let i = i0; i < i1; i++) {
      const th = path.heading(i);
      const lx = Math.cos(th);
      const lz = -Math.sin(th);
      const s = i * DS;
      const x0 = path.px(i);
      const z0 = path.pz(i);

      // Delineator posts every 24 m, both sides.
      if (i % 12 === 0) {
        for (const side of [-1, 1]) {
          const x = x0 + lx * side * 7.7;
          const z = z0 + lz * side * 7.7;
          const y = heightAt(x, z);
          posts.push({ m: place(x, y, z, th, 1, 1.05, 1) });
          reflectors.push({ m: place(x, y + 0.82, z, th, 0.14, 0.16, 0.14) });
        }
      }

      const town = townAt(s);
      for (const side of [-1, 1]) {
        if (town) {
          // A lot every ~8 m of frontage, mostly filled.
          if ((i + (side > 0 ? 0 : 2)) % 4 !== 0 || rand() < 0.2) continue;
          const shop = rand() < 0.42;
          const width = shop ? 7 + rand() * 4 : 8 + rand() * 6;
          const depth = 8 + rand() * 8;
          const height = shop ? 4.2 + rand() * 1.4 : 7 + rand() * 20;
          const setback = (shop ? 12.5 : 14) + rand() * 3 + depth / 2;
          const x = x0 + lx * side * setback;
          const z = z0 + lz * side * setback;
          // Keep every corner off the road, even on the inside of a bend.
          const fx = Math.sin(th);
          const fz = Math.cos(th);
          let ok = true;
          for (const [a, b] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            if (!clear(x + fx * a * width * 0.5 + lx * b * depth * 0.5, z + fz * a * width * 0.5 + lz * b * depth * 0.5, 10.5)) ok = false;
          }
          if (!ok) continue;
          const yBase = heightAt(x, z) - 2.2; // sunk in, so slopes never show a gap
          const h = height + 2.2;
          const tint = new THREE.Color(facades[Math.floor(rand() * facades.length)]);
          // Depth runs across the road, width (the frontage) along it.
          bodies.push({ m: place(x, yBase, z, th, depth, h, width), c: tint });
          roofs.push({ m: place(x, yBase + h, z, th, depth + 0.3, 0.35, width + 0.3) });
          colliders.push(
            RAPIER.ColliderDesc.cuboid(depth / 2, h / 2, width / 2)
              .setTranslation(x - anchorX, yBase + h / 2, z - anchorZ)
              .setRotation({ x: 0, y: Math.sin(th / 2), z: 0, w: Math.cos(th / 2) }),
          );
          if (shop) {
            // Awning and sign on the road-facing side.
            const fx2 = x - lx * side * (depth / 2 + 0.9);
            const fz2 = z - lz * side * (depth / 2 + 0.9);
            const ya = heightAt(fx2, fz2) + 3;
            // Sloping down toward the road: the road-side edge is the lower one.
            awnings.push({
              m: place(fx2, ya, fz2, th, 1.8, 0.08, width * 0.86, side * 0.35),
              c: new THREE.Color(awningTints[Math.floor(rand() * awningTints.length)]),
            });
            const sx2 = x - lx * side * (depth / 2 + 0.12);
            const sz2 = z - lz * side * (depth / 2 + 0.12);
            signs.push({
              m: place(sx2, yBase + h - 1.25, sz2, th, 0.2, 0.85, width * 0.6),
              c: new THREE.Color().setHSL(rand(), 0.55, 0.5),
            });
          }
        } else {
          // Country: trees, denser away from the road.
          if (rand() < 0.55) continue;
          const offset = 11 + rand() ** 1.5 * 70;
          const along = (rand() - 0.5) * DS;
          const x = x0 + lx * side * offset + Math.sin(th) * along;
          const z = z0 + lz * side * offset + Math.cos(th) * along;
          if (!clear(x, z, 10)) continue;
          const y = heightAt(x, z) - 0.2;
          const scale = 0.8 + rand() * 0.7;
          const tint = new THREE.Color(greens[Math.floor(rand() * greens.length)]).multiplyScalar(0.85 + rand() * 0.3);
          if (rand() < 0.3) {
            trunks.push({ m: place(x, y, z, 0, scale, 2.2 * scale, scale) });
            pines.push({ m: place(x, y + 1.6 * scale, z, rand() * 6, 2.2 * scale, 7 * scale, 2.2 * scale), c: tint });
          } else {
            const hgt = 3 + rand() * 2;
            trunks.push({ m: place(x, y, z, 0, scale, hgt * scale, scale) });
            crowns.push({ m: place(x, y + (hgt + 1.4) * scale, z, rand() * 6, 2.6 * scale, 2.2 * scale, 2.6 * scale), c: tint });
          }
          if (offset < 25) colliders.push(RAPIER.ColliderDesc.cylinder(2, 0.3 * scale).setTranslation(x - anchorX, y + 2, z - anchorZ));
        }
      }
    }

    const instance = (geo: THREE.BufferGeometry, mat: THREE.Material, list: Inst[]) => {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((it, k) => {
        mesh.setMatrixAt(k, it.m);
        if (it.c) mesh.setColorAt(k, it.c);
      });
      mesh.computeBoundingSphere();
      group.add(mesh);
      meshes.push(mesh);
    };
    instance(postGeo, postMat, posts);
    instance(unitBox, reflectorMat, reflectors);
    instance(unitBox, facadeMat, bodies);
    instance(unitBox, roofMat, roofs);
    instance(unitBox, awningMat, awnings);
    instance(unitBox, signMat, signs);
    instance(trunkGeo, trunkMat, trunks);
    instance(crownGeo, leafMat, crowns);
    instance(pineGeo, leafMat, pines);

    const body = physics.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(anchorX - origin.x, 0, anchorZ - origin.z));
    for (const c of colliders) physics.createCollider(c.setFriction(0.6), body);

    group.position.set(anchorX - origin.x, 0, anchorZ - origin.z);
    scene.add(group);
    return { index, anchorX, anchorZ, group, body, meshes };
  };

  const dropChunk = (c: Chunk) => {
    scene.remove(c.group);
    c.meshes.forEach((m) => {
      if (m.geometry !== unitBox && m.geometry !== trunkGeo && m.geometry !== crownGeo && m.geometry !== pineGeo && m.geometry !== postGeo) m.geometry.dispose();
      if ((m as THREE.InstancedMesh).isInstancedMesh) (m as THREE.InstancedMesh).dispose();
    });
    physics.removeRigidBody(c.body);
  };

  /** Keep road, props, terrain and heightfield around the car. `x, z` are local. */
  const update = (lx: number, lz: number) => {
    const wx = lx + origin.x;
    const wz = lz + origin.z;
    path.ensure(hint + AHEAD / DS);
    hint = path.nearest(wx, wz, hint).index;
    const first = Math.max(0, Math.floor((hint - BEHIND / DS) / CHUNK));
    const last = Math.floor((hint + AHEAD / DS) / CHUNK);
    for (const [k, c] of chunks) {
      if (k < first || k > last) {
        dropChunk(c);
        chunks.delete(k);
      }
    }
    // One new chunk per frame at most, nearest first, so nothing hitches.
    for (let k = first; k <= last; k++) {
      if (!chunks.has(k)) {
        chunks.set(k, buildChunk(k));
        break;
      }
    }
    path.trim(first * CHUNK - 4);
    if (Math.hypot(wx - terrainCentre.x, wz - terrainCentre.z) > TERRAIN.recentre) buildTerrain(wx, wz);
    if (Math.hypot(wx - fieldCentre.x, wz - fieldCentre.z) > FIELD.recentre) buildField(wx, wz);
  };

  /** Move the floating origin by (dx, dz); the caller shifts the car itself. */
  const rebase = (dx: number, dz: number) => {
    origin.x += dx;
    origin.z += dz;
    for (const c of chunks.values()) {
      c.group.position.set(c.anchorX - origin.x, 0, c.anchorZ - origin.z);
      c.body.setTranslation({ x: c.anchorX - origin.x, y: 0, z: c.anchorZ - origin.z }, true);
    }
    terrainCentre = { x: Infinity, z: Infinity };
    fieldCentre = { x: Infinity, z: Infinity };
  };

  /** A spot on the right-hand lane near sample `i` (or the car's nearest), local coords. */
  const laneSpot = (i = hint) => {
    path.ensure(i + 2);
    const th = path.heading(i);
    const x = path.px(i) - Math.cos(th) * ROAD.lane;
    const z = path.pz(i) + Math.sin(th) * ROAD.lane;
    return { x: x - origin.x, y: heightAt(x, z), z: z - origin.z, heading: th };
  };

  /** How far the car is from the centreline, and the route ahead for the minimap. */
  const route = (count = 220, step = 2) => {
    const out = new Float32Array(count * 2);
    for (let k = 0; k < count; k++) {
      const i = Math.min(path.end - 1, Math.max(path.base, hint - 40 + k * step));
      out[k * 2] = path.px(i) - origin.x;
      out[k * 2 + 1] = path.pz(i) - origin.z;
    }
    return out;
  };
  const offRoad = (lx: number, lz: number) => path.nearest(lx + origin.x, lz + origin.z, hint, 20).dist - ROAD.width / 2;
  const groundAt = (lx: number, lz: number) => heightAt(lx + origin.x, lz + origin.z);

  const dispose = () => {
    for (const c of chunks.values()) dropChunk(c);
    chunks.clear();
    if (field) physics.removeCollider(field, false);
    tiles.forEach((t) => scene.remove(t));
    disposables.forEach((d) => d.dispose());
  };

  return { update, rebase, laneSpot, route, offRoad, groundAt, dispose, origin };
}
