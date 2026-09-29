/**
 * Plush fur for the dots characters, ported 1:1 from openai.com.
 *
 * Two layers make the fuzzy look:
 *  1. "Pile": the body keeps its mesh but gets a MeshStandardMaterial patched with a
 *     triplanar fiber texture (colour variation + normal relief). No extra geometry.
 *  2. "Cards": up to 8192 instanced hair cards scattered over the body surface. They
 *     are skinned to the same skeleton, fade in by on-screen size, and turn into wide
 *     tufts along the silhouette. That rim of cards is the soft edge.
 *
 * Both textures and the card scatter are generated procedurally with seeded LCGs, so
 * every visit (and this rebuild) produces the same fur.
 */
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Surface detection
// ---------------------------------------------------------------------------

type AnyMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;

const materialsOf = (mesh: THREE.Mesh) =>
  (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[];

export function getGeometryBounds(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  if (!geometry.boundingBox) throw new Error("Fur surface has no bounds");
  return geometry.boundingBox;
}

export function isFurBody(o: THREE.Object3D): o is THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> {
  return (
    o instanceof THREE.Mesh &&
    o.material instanceof THREE.MeshStandardMaterial &&
    o.material.name.endsWith("soft matte silicone") &&
    (o.userData.partKind === "body" || /body/i.test(o.name))
  );
}

export function isFurSurface(o: THREE.Object3D): o is THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> {
  return (
    isFurBody(o) ||
    (o instanceof THREE.Mesh &&
      o.material instanceof THREE.MeshStandardMaterial &&
      ((o.material.name === "Hat" && /hat/i.test(o.name)) ||
        (o.material.name === "Thelma · soft matte silicone" && o.name === "Thelma_Crown_floating_yellow_orb")))
  );
}

// Keeps cards away from Todd's inset eyes (1 = full length, 0 = no card).
// Custom bodies opt in with `userData.eyeClearance`.
function createEyeClearance(mesh: AnyMesh, root: THREE.Object3D, scale: number) {
  const position = mesh.geometry.getAttribute("position");
  const clearance = new Float32Array(position.count).fill(1);
  if (!/^(Todd|Josh)_/.test(mesh.name) && !mesh.userData.eyeClearance) return new THREE.Float32BufferAttribute(clearance, 1);
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  const relative = new THREE.Matrix4();
  const eyes: THREE.Box3[] = [];
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    if (materialsOf(o).some((m) => m.name.startsWith("Eyes ·")) || /eyelid/i.test(o.name)) {
      relative.multiplyMatrices(inverse, o.matrixWorld);
      eyes.push(getGeometryBounds(o.geometry).clone().applyMatrix4(relative));
    }
  });
  const v = new THREE.Vector3();
  for (const box of eyes) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const rx = size.x / 2 + 0.012 * scale;
    const ry = size.y / 2 + 0.012 * scale;
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      if (v.z < box.min.z - 0.15 * scale || v.z > box.max.z + 0.05 * scale) continue;
      const t = Math.max(0, Math.min(1, (Math.hypot((v.x - center.x) / rx, (v.y - center.y) / ry) - 1) / 0.35));
      clearance[i] = Math.min(clearance[i], t * t * (3 - 2 * t));
    }
  }
  return new THREE.Float32BufferAttribute(clearance, 1);
}

export const MAX_CARDS = 8192;

/** How many cards to draw for a body that is `pixels` tall on screen. */
export function getCardBudget(pixels: number, density: number) {
  if (!Number.isFinite(pixels) || pixels <= 0) return 0;
  const d = Number.isFinite(density) ? Math.max(20, Math.min(320, density)) : 180;
  const fadeIn = Math.min(1, Math.max(0, (pixels - 12) / 48));
  return Math.min(MAX_CARDS, ((160 + pixels * pixels * 0.027) * d) / 180) * fadeIn;
}

// Cache key: the body plus every eye/accessory placed relative to it.
function groomKey(mesh: AnyMesh, root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  const relative = new THREE.Matrix4();
  const parts = [mesh.name];
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || o === mesh) return;
    if (!materialsOf(o).some((m) => /^(Eyes|Accessories) ·/.test(m.name))) return;
    relative.multiplyMatrices(inverse, o.matrixWorld);
    parts.push(`${o.geometry.uuid}:${relative.elements.map((e) => Math.round(1e4 * e) / 1e4).join(",")}`);
  });
  return parts.join("|");
}

// Tangential push away from eyes/accessories so cards comb around them.
function computeGroom(mesh: AnyMesh, root: THREE.Object3D, scale: number) {
  const position = mesh.geometry.getAttribute("position");
  const normal = mesh.geometry.getAttribute("normal");
  const groom = new THREE.Float32BufferAttribute(new Float32Array(3 * position.count), 3);
  const cellSize = 0.075 * scale;
  const lift = 0.025 * scale;
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  const relative = new THREE.Matrix4();
  const bounds = getGeometryBounds(mesh.geometry).clone().expandByScalar(cellSize + lift);
  const size = bounds.getSize(new THREE.Vector3());
  const nx = Math.ceil(size.x / cellSize) + 1;
  const ny = Math.ceil(size.y / cellSize) + 1;
  const cell = (value: number, min: number) => Math.floor((value - min) / cellSize);
  const key = (x: number, y: number, z: number) => x + nx * (y + ny * z);
  const grid = new Map<number, THREE.Triangle[]>();
  const triBox = new THREE.Box3();

  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || o === mesh) return;
    if (!materialsOf(o).some((m) => /^(Eyes|Accessories) ·/.test(m.name))) return;
    relative.multiplyMatrices(inverse, o.matrixWorld);
    const p = o.geometry.getAttribute("position");
    const points = Array.from({ length: p.count }, (_, i) =>
      new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(relative),
    );
    const index = o.geometry.index;
    for (let i = 0; i < (index?.count ?? p.count); i += 3) {
      const [a, b, c] = [0, 1, 2].map((j) => points[index ? index.getX(i + j) : i + j]);
      const tri = new THREE.Triangle(a, b, c);
      triBox.setFromPoints([tri.a, tri.b, tri.c]).expandByScalar(cellSize).intersect(bounds);
      if (triBox.isEmpty()) continue;
      const min = triBox.min;
      const max = triBox.max;
      for (let z = cell(min.z, bounds.min.z); z <= cell(max.z, bounds.min.z); z++)
        for (let y = cell(min.y, bounds.min.y); y <= cell(max.y, bounds.min.y); y++)
          for (let x = cell(min.x, bounds.min.x); x <= cell(max.x, bounds.min.x); x++) {
            const k = key(x, y, z);
            const list = grid.get(k);
            if (list) list.push(tri);
            else grid.set(k, [tri]);
          }
    }
  });

  const vertex = new THREE.Vector3();
  const n = new THREE.Vector3();
  const probe = new THREE.Vector3();
  const closest = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const push = new THREE.Vector3();
  const smooth = (x: number) => {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  };
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    n.fromBufferAttribute(normal, i).normalize();
    probe.copy(vertex).addScaledVector(n, lift);
    const list = grid.get(key(cell(probe.x, bounds.min.x), cell(probe.y, bounds.min.y), cell(probe.z, bounds.min.z)));
    if (!list) continue;
    let best = cellSize * cellSize;
    push.set(0, 0, 0);
    for (const tri of list) {
      tri.closestPointToPoint(probe, closest);
      offset.subVectors(probe, closest);
      const d2 = offset.lengthSq();
      if (d2 >= best || offset.dot(n) > lift + 0.015 * scale) continue;
      best = d2;
      push.copy(offset);
    }
    push.addScaledVector(n, -push.dot(n));
    const len = push.length();
    if (len < 1e-4 * scale) continue;
    const strength = (1 - smooth(Math.sqrt(best) / cellSize)) * smooth(len / (0.012 * scale));
    push.multiplyScalar(strength / len);
    groom.setXYZ(i, push.x, push.y, push.z);
  }
  return groom;
}

type BakedCards = {
  scale: number;
  attributes: Record<string, { array: Float32Array; itemSize: number }>;
  bounds: number[];
};

const CARD_INDEX = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4];

// Scatter MAX_CARDS roots uniformly by area with a fixed-seed LCG.
function bakeCards(mesh: AnyMesh, root: THREE.Object3D) {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const index = geometry.index;
  const triangles = Math.floor((index?.count ?? position.count) / 3);
  const vertexAt = (i: number) => (index ? index.getX(i) : i);
  const bounds = getGeometryBounds(geometry);
  const scale = Math.max(bounds.getSize(new THREE.Vector3()).y, 0.001);
  const clearance = createEyeClearance(mesh, root, scale);
  const groom = computeGroom(mesh, root, scale);

  const areaPrefix = new Float64Array(triangles);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let area = 0;
  for (let t = 0; t < triangles; t++) {
    a.fromBufferAttribute(position, vertexAt(3 * t));
    b.fromBufferAttribute(position, vertexAt(3 * t + 1));
    c.fromBufferAttribute(position, vertexAt(3 * t + 2));
    area += 0.5 * b.sub(a).cross(c.sub(a)).length();
    areaPrefix[t] = area;
  }

  const cards = new THREE.InstancedBufferGeometry();
  cards.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, 1, 0, 0.5, 1, 0], 3),
  );
  cards.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  cards.setIndex(CARD_INDEX);

  const roots = new Float32Array(MAX_CARDS * 3);
  const normals = new Float32Array(MAX_CARDS * 3);
  const seeds = new Float32Array(MAX_CARDS * 4);
  const grooms = new Float32Array(MAX_CARDS * 3);
  const skinIndices = new Float32Array(MAX_CARDS * 4);
  const skinWeights = new Float32Array(MAX_CARDS * 4);
  const skinIndex = geometry.getAttribute("skinIndex");
  const skinWeight = geometry.getAttribute("skinWeight");

  let seed = 84291;
  const random = () => (seed = (Math.imul(seed, 1664525) + 0x3c6ef35f) >>> 0) / 0x100000000;
  const p = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const grm = new THREE.Vector3();

  for (let card = 0; card < MAX_CARDS; card++) {
    const target = random() * area;
    let lo = 0;
    let hi = triangles - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (areaPrefix[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const corners = [vertexAt(3 * lo), vertexAt(3 * lo + 1), vertexAt(3 * lo + 2)];
    const r1 = Math.sqrt(random());
    const r2 = random();
    const weights = [1 - r1, r1 * (1 - r2), r1 * r2];
    p.set(0, 0, 0);
    nrm.set(0, 0, 0);
    grm.set(0, 0, 0);
    let clear = 0;
    const skin = new Map<number, number>();
    for (let k = 0; k < 3; k++) {
      const v = corners[k];
      const w = weights[k];
      for (let axis = 0; axis < 3; axis++) {
        p.setComponent(axis, p.getComponent(axis) + position.getComponent(v, axis) * w);
        nrm.setComponent(axis, nrm.getComponent(axis) + normal.getComponent(v, axis) * w);
        grm.setComponent(axis, grm.getComponent(axis) + groom.getComponent(v, axis) * w);
      }
      clear += clearance.getX(v) * w;
      if (skinIndex && skinWeight)
        for (let j = 0; j < 4; j++) {
          const bone = skinIndex.getComponent(v, j);
          skin.set(bone, (skin.get(bone) ?? 0) + skinWeight.getComponent(v, j) * w);
        }
    }
    p.toArray(roots, 3 * card);
    nrm.normalize().toArray(normals, 3 * card);
    grm.toArray(grooms, 3 * card);
    const top = [...skin].sort((x, y) => y[1] - x[1]).slice(0, 4);
    const total = top.reduce((sum, entry) => sum + entry[1], 0) || 1;
    top.forEach(([bone, weight], j) => {
      skinIndices[4 * card + j] = bone;
      skinWeights[4 * card + j] = weight / total;
    });
    seeds.set([random(), 0.72 + 0.56 * random(), Math.floor(16 * random()), clear], 4 * card);
  }

  cards.setAttribute("plushRoot", new THREE.InstancedBufferAttribute(roots, 3));
  cards.setAttribute("plushNormal", new THREE.InstancedBufferAttribute(normals, 3));
  cards.setAttribute("plushSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  cards.setAttribute("plushGroom", new THREE.InstancedBufferAttribute(grooms, 3));
  if (skinIndex && skinWeight) {
    cards.setAttribute("skinIndex", new THREE.InstancedBufferAttribute(skinIndices, 4));
    cards.setAttribute("skinWeight", new THREE.InstancedBufferAttribute(skinWeights, 4));
  }
  cards.boundingBox = bounds.clone().expandByScalar(0.1 * scale);
  cards.boundingSphere = cards.boundingBox.getBoundingSphere(new THREE.Sphere());
  return { geometry: cards, scale };
}

function serializeCards(geometry: THREE.InstancedBufferGeometry, scale: number): BakedCards {
  const attributes: BakedCards["attributes"] = {};
  for (const [name, attribute] of Object.entries(geometry.attributes))
    attributes[name] = { array: attribute.array as Float32Array, itemSize: attribute.itemSize };
  const box = geometry.boundingBox ?? getGeometryBounds(geometry);
  return { scale, attributes, bounds: [...box.min.toArray(), ...box.max.toArray()] };
}

function restoreCards(baked: BakedCards) {
  const geometry = new THREE.InstancedBufferGeometry();
  for (const [name, { array, itemSize }] of Object.entries(baked.attributes))
    geometry.setAttribute(
      name,
      name === "position" || name === "normal"
        ? new THREE.Float32BufferAttribute(array, itemSize)
        : new THREE.InstancedBufferAttribute(array, itemSize),
    );
  geometry.setIndex(CARD_INDEX);
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(baked.bounds),
    new THREE.Vector3().fromArray(baked.bounds, 3),
  );
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  return { geometry, scale: baked.scale };
}

type LiveCards = { geometry: THREE.InstancedBufferGeometry; scale: number; references: number };
const liveCards = new WeakMap<THREE.BufferGeometry, Map<string, LiveCards>>();
const bakedCards = new WeakMap<THREE.BufferGeometry, Map<string, BakedCards>>();

// Ref-counted so StrictMode remounts and character switches never re-bake.
function acquireCardGeometry(mesh: AnyMesh, root: THREE.Object3D) {
  const source = mesh.geometry;
  const key = groomKey(mesh, root);
  let live = liveCards.get(source);
  if (!live) liveCards.set(source, (live = new Map()));
  let entry = live.get(key);
  if (!entry) {
    const baked = bakedCards.get(source)?.get(key);
    const { geometry, scale } = baked ? restoreCards(baked) : bakeCards(mesh, root);
    if (!baked) {
      let map = bakedCards.get(source);
      if (!map) bakedCards.set(source, (map = new Map()));
      map.set(key, serializeCards(geometry, scale));
    }
    entry = { geometry, scale, references: 0 };
    live.set(key, entry);
  }
  const held = entry;
  const owner = live;
  held.references++;
  let released = false;
  return {
    geometry: held.geometry,
    scale: held.scale,
    release() {
      if (released) return;
      released = true;
      if (--held.references === 0) {
        held.geometry.dispose();
        owner.delete(key);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Procedural fiber textures (512x512 RGBA each)
// ---------------------------------------------------------------------------

const TAU = 2 * Math.PI;

function lcg(seed: number) {
  let s = seed;
  return () => (s = (Math.imul(s, 1664525) + 0x3c6ef35f) >>> 0) / 0x100000000;
}

function dataTexture(data: Uint8Array, repeat: boolean) {
  const texture = new THREE.DataTexture(data, 512, 512, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.colorSpace = THREE.NoColorSpace;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

// Pile: R = fiber height, GB = pre-baked slope for normal relief. Tiles.
function bakePile() {
  const random = lcg(0x70696c65);
  const height = new Float32Array(512 * 512).fill(0.3);
  const stroke = (x0: number, y0: number, x1: number, y1: number, radius: number, value: number) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const invLen = 1 / Math.max(dx * dx + dy * dy, 1e-5);
    const reach = radius + 0.6;
    const minX = Math.floor(Math.min(x0, x1) - reach);
    const maxX = Math.ceil(Math.max(x0, x1) + reach);
    const minY = Math.floor(Math.min(y0, y1) - reach);
    const maxY = Math.ceil(Math.max(y0, y1) + reach);
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const t = Math.max(0, Math.min(1, ((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) * invLen));
        const ox = x + 0.5 - x0 - dx * t;
        const oy = y + 0.5 - y0 - dy * t;
        const cover = Math.max(0, Math.min(1, reach - Math.sqrt(ox * ox + oy * oy)));
        if (cover === 0) continue;
        const i = (511 & y) * 512 + (511 & x);
        height[i] += (value - height[i]) * cover;
      }
  };
  for (let n = 0; n < 12500; n++) {
    const x = 512 * random();
    const y = 512 * random();
    const u = (x / 512) * TAU;
    const v = (y / 512) * TAU;
    const angle = 1.05 + 0.52 * Math.sin(u + Math.sin(v)) + 0.24 * Math.cos(2 * v - u) + (random() - 0.5) * 0.8;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const length = 10 + 21 * random();
    const bow = (random() - 0.5) * 5;
    const curl = (random() - 0.5) * 7;
    const width = 0.25 + 0.33 * random();
    const value = 0.38 + 0.54 * random();
    let px = x;
    let py = y;
    for (let s = 1; s <= 7; s++) {
      const t = s / 7;
      const side = curl * t * t + bow * Math.sin(t * Math.PI);
      const nx = x + cos * length * t - sin * side;
      const ny = y + sin * length * t + cos * side;
      stroke(px, py, nx, ny, width * (1 - 0.6 * t), value * (0.79 + 0.21 * t));
      px = nx;
      py = ny;
    }
  }
  const data = new Uint8Array(512 * 512 * 4);
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      const i = 512 * y + x;
      const gx = height[512 * y + ((x + 1) & 511)] - height[512 * y + ((x - 1) & 511)];
      const gy = height[((y + 1) & 511) * 512 + x] - height[((y - 1) & 511) * 512 + x];
      const nx = -(1.8 * gx);
      const ny = -(1.8 * gy);
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      data[4 * i] = Math.round(255 * height[i]);
      data[4 * i + 1] = Math.round((nx * inv * 0.5 + 0.5) * 255);
      data[4 * i + 2] = Math.round((ny * inv * 0.5 + 0.5) * 255);
      data[4 * i + 3] = 255;
    }
  return data;
}

// Card atlas: 4x4 tiles of hair strands. R/B = brightness, A = long hairs,
// G = dense short root fibers.
function bakeCardAtlas() {
  const random = lcg(0x68616972);
  const data = new Uint8Array(512 * 512 * 4);
  for (let y = 0; y < 512; y++) {
    const shade = Math.round((0.72 + ((y % 128) / 128) * 0.25) * 255);
    for (let x = 0; x < 512; x++) {
      const i = (512 * y + x) * 4;
      data[i] = data[i + 2] = shade;
    }
  }
  for (let tile = 0; tile < 16; tile++) {
    const tx = (tile % 4) * 128;
    const ty = 128 * Math.floor(tile / 4);
    const strands = 11 + Math.floor(6 * random());
    const lean = (random() - 0.5) * 12;
    for (let s = 0; s < strands; s++) {
      const base = 15 + ((s + 0.15 + 0.7 * random()) / strands) * 95;
      const start = 4 + 3 * random();
      const length = 73 + 43 * random();
      const sway = lean + (random() - 0.5) * 15;
      const bend = (random() - 0.5) * 8;
      const width = 0.48 + 0.38 * random();
      const bright = 0.83 + 0.17 * random();
      for (let row = Math.floor(start); row <= Math.min(123, Math.ceil(start + length)); row++) {
        const t = (row + 0.5 - start) / length;
        if (t < 0 || t > 1) continue;
        const center = base + sway * t * t + bend * Math.sin(t * Math.PI);
        const half = width * (1 - 0.86 * t);
        const tip = Math.min(1, (1 - t) * length);
        const value = Math.round(bright * (0.73 + 0.27 * t) * 255);
        const from = Math.max(4, Math.floor(center - half - 1));
        const to = Math.min(123, Math.ceil(center + half + 1));
        for (let col = from; col <= to; col++) {
          const cover = Math.max(0, Math.min(1, half + 0.5 - Math.abs(col + 0.5 - center))) * tip;
          const i = ((ty + row) * 512 + tx + col) * 4;
          const alpha = Math.round(255 * cover);
          if (alpha <= data[i + 3]) continue;
          data[i] = data[i + 2] = value;
          data[i + 3] = alpha;
        }
      }
    }
  }
  const rootRandom = lcg(0x726f6f74);
  for (let tile = 0; tile < 16; tile++) {
    const tx = (tile % 4) * 128;
    const ty = 128 * Math.floor(tile / 4);
    const lean = (rootRandom() - 0.5) * 10;
    for (let s = 0; s < 112; s++) {
      const base = 7 + ((s + rootRandom()) / 112) * 114;
      const start = 4 + 7 * rootRandom();
      const length = 39 + 46 * rootRandom();
      const sway = lean + (rootRandom() - 0.5) * 15;
      const bend = (rootRandom() - 0.5) * 5;
      const width = 0.8 + 0.7 * rootRandom();
      const strength = 0.4 + 0.25 * rootRandom();
      for (let row = Math.floor(start); row <= Math.ceil(start + length); row++) {
        const t = (row + 0.5 - start) / length;
        if (t < 0 || t > 1) continue;
        const center = base + sway * t * t + bend * Math.sin(t * Math.PI);
        const half = width * (1 - 0.75 * t);
        const h = Math.max(0, Math.min(1, (t - 0.32) / 0.68));
        const fade = 1 - h * h * (3 - 2 * h);
        const rootIn = Math.min(1, (row + 0.5 - start) / 2);
        const from = Math.max(4, Math.floor(center - half - 1));
        const to = Math.min(123, Math.ceil(center + half + 1));
        for (let col = from; col <= to; col++) {
          const cover =
            Math.max(0, Math.min(1, half + 0.5 - Math.abs(col + 0.5 - center))) *
            strength *
            fade *
            rootIn *
            Math.min(1, Math.min(col - 3.5, 123.5 - col) / 9);
          const i = ((ty + row) * 512 + tx + col) * 4 + 1;
          data[i] = Math.round(255 * Math.min(0.8, 1 - (1 - data[i] / 255) * (1 - cover)));
        }
      }
    }
  }
  return data;
}

let furData: { pile: Uint8Array; cards: Uint8Array } | undefined;
let furTextures: { pile: THREE.DataTexture; cards: THREE.DataTexture; users: number } | undefined;

function acquireFurTextures() {
  furData ??= { pile: bakePile(), cards: bakeCardAtlas() };
  const shared = (furTextures ??= {
    pile: dataTexture(furData.pile, true),
    cards: dataTexture(furData.cards, false),
    users: 0,
  });
  shared.users++;
  let released = false;
  return {
    pile: shared.pile,
    cards: shared.cards,
    release() {
      if (released) return;
      released = true;
      shared.users--;
      if (shared.users === 0) {
        shared.pile.dispose();
        shared.cards.dispose();
        if (furTextures === shared) furTextures = undefined;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Shader chunks (verbatim)
// ---------------------------------------------------------------------------

const BRUSH = /* glsl */ `
uniform sampler2D plushBrushField;
uniform bool plushBrushActive;
vec3 plushBrushAt(vec4 clip, vec3 surfaceNormal) {
  if (!plushBrushActive) return vec3(0.);
  vec2 uv = clip.xy / clip.w * .5 + .5;
  vec2 force = (texture2D(plushBrushField, uv).rg * 255. - 128.) / 63.;
  vec3 bend = vec3(force, 0.);
  bend -= surfaceNormal * dot(bend, surfaceNormal);
  return bend * smoothstep(-.1, .5, surfaceNormal.z);
}
`;

const PILE_VERTEX_HEAD = /* glsl */ `
${BRUSH}
uniform float plushFiberScale;
varying vec3 vPilePosition;
varying vec3 vPileNormal;
varying vec3 vPileBrush;
`;

const PILE_BEGIN_VERTEX = /* glsl */ `
#include <begin_vertex>
vPilePosition = position / plushFiberScale;
vPileNormal = normal;
`;

const PILE_PROJECT_VERTEX = /* glsl */ `
#include <project_vertex>
vPileBrush = plushBrushAt(gl_Position, normalize(transformedNormal));
`;

const PILE_FRAGMENT_HEAD = /* glsl */ `
uniform sampler2D plushPile;
uniform float plushDensity;
uniform float plushShading;
uniform float plushComb;
varying vec3 vPilePosition;
varying vec3 vPileNormal;
varying vec3 vPileBrush;
vec3 pilePerturb(vec2 uv, vec2 slope, vec3 n, vec3 dx, vec3 dy) {
  vec2 ux = dFdx(uv), uy = dFdy(uv);
  vec3 u = cross(dy, n) * ux.x + cross(n, dx) * uy.x;
  vec3 v = cross(dy, n) * ux.y + cross(n, dx) * uy.y;
  float basis = inversesqrt(max(max(dot(u, u), dot(v, v)), .00000001));
  return (u * slope.x + v * slope.y) * basis;
}
`;

const PILE_COLOR_FRAGMENT = /* glsl */ `
#include <color_fragment>
vec3 pileWeights = pow(abs(normalize(vPileNormal)), vec3(6.));
pileWeights /= max(dot(pileWeights, vec3(1.)), .0001);
vec3 pileP = vPilePosition * (1.2 + plushDensity * .006);
pileP.x += .10 * sin(pileP.y * 1.8 + pileP.z);
vec4 pileX = texture2D(plushPile, pileP.zy);
vec4 pileY = texture2D(plushPile, pileP.xz);
vec4 pileZ = texture2D(plushPile, pileP.xy);
float pileValue = dot(vec3(pileX.r, pileY.r, pileZ.r), pileWeights);
diffuseColor.rgb *= mix(.48, 1.28, pileValue) * (1. - plushShading * .28);
`;

const PILE_NORMAL_FRAGMENT = /* glsl */ `
#include <normal_fragment_maps>
vec3 pileT = dFdx(-vViewPosition);
vec3 pileB = dFdy(-vViewPosition);
vec3 pileRelief = pilePerturb(pileP.zy, pileX.gb * 2. - 1., normal, pileT, pileB) * pileWeights.x
  + pilePerturb(pileP.xz, pileY.gb * 2. - 1., normal, pileT, pileB) * pileWeights.y
  + pilePerturb(pileP.xy, pileZ.gb * 2. - 1., normal, pileT, pileB) * pileWeights.z;
normal = normalize(normal + pileRelief * .7 + vPileBrush * (.38 + pileValue * .22));
`;

const CARD_VERTEX_HEAD = /* glsl */ `
${BRUSH}
uniform float plushScale;
uniform float plushLength;
uniform float plushWidth;
uniform float plushRimWidth;
uniform float plushComb;
uniform float plushBudget;
attribute vec3 plushRoot;
attribute vec3 plushNormal;
attribute vec4 plushSeed;
attribute vec3 plushGroom;
varying vec2 vPlushUv;
varying float vPlushFade;
varying float vPlushHeight;
varying float vPlushVariation;
varying float vPlushRim;
`;

const CARD_BEGIN_VERTEX = /* glsl */ `
float cardT = position.y;
vec3 cardN = normalize(plushNormal);
vec3 cardU = normalize(cross(abs(cardN.y) < .95 ? vec3(0., 1., 0.) : vec3(1., 0., 0.), cardN));
vec3 cardV = cross(cardN, cardU);
float cardAngle = plushSeed.x * 6.2831853;
vec3 cardSide = cardU * cos(cardAngle) + cardV * sin(cardAngle);
vec3 cardP = plushRoot / plushScale;
vec3 cardDown = vec3(0., -1., 0.) + cardN * cardN.y;
vec3 cardGroom = plushGroom - cardN * dot(plushGroom, cardN);
float cardPart = clamp(length(cardGroom), 0., 1.);
vec3 cardFlow = cardU * sin(cardP.y * 19. + cardP.z * 24.) + cardV * sin(cardP.x * 17. - cardP.z * 15.);
vec3 cardBend = (cardDown * plushComb + cardFlow * .3 + cardSide * .15) * (1. - cardPart) + cardGroom * 1.4;
float cardLength = plushLength * plushSeed.y * plushSeed.w;
vec3 transformed = plushRoot + cardLength * (cardN * cardT * (1. - .22 * cardPart * cardT) + cardBend * cardT * cardT)
  + cardSide * position.x * plushWidth * plushSeed.w;
vPlushUv = (vec2(mod(plushSeed.z, 4.), floor(plushSeed.z / 4.)) + vec2(position.x + .5, cardT)) * .25;
vPlushHeight = cardT;
vPlushVariation = .9 + .2 * plushSeed.x;
vPlushFade = clamp((plushBudget - float(gl_InstanceID)) / 96., 0., 1.);
#ifdef USE_ALPHAHASH
vPosition = transformed;
#endif
`;

const CARD_PROJECT_VERTEX = /* glsl */ `
#include <project_vertex>
mat4 cardDeform = mat4(1.);
#ifdef USE_SKINNING
  cardDeform = skinMatrix;
#endif
mat4 cardToView = modelViewMatrix * cardDeform;
vec3 cardRootView = (cardToView * vec4(plushRoot, 1.)).xyz;
vec3 cardView = isOrthographic ? vec3(0., 0., 1.) : normalize(-cardRootView);
vec3 cardNormalView = normalize(transformedNormal);
float cardFacing = dot(cardNormalView, cardView);
vPlushRim = 1. - smoothstep(.12, .6, abs(cardFacing));
vec3 cardSideView = (cardToView * vec4(cardSide, 0.)).xyz;
vec3 cardScreenSide = cross(cardView, cardNormalView);
cardScreenSide /= max(length(cardScreenSide), .0001);
if (dot(cardScreenSide, cardSideView) < 0.) cardScreenSide = -cardScreenSide;
float cardWorldScale = length(cardToView[1].xyz);
float cardRimWidth = max(plushWidth, plushRimWidth);
mvPosition.xyz += (cardScreenSide * cardRimWidth * cardWorldScale - cardSideView * plushWidth)
  * position.x * plushSeed.w * vPlushRim;
float cardInset = min(plushScale * .0015, cardLength * .12);
mvPosition.xyz -= cardNormalView * cardWorldScale * cardInset * (1. - cardT) * vPlushRim;
vec3 cardBrush = plushBrushAt(projectionMatrix * vec4(cardRootView, 1.), cardNormalView);
mvPosition.xyz += cardBrush * cardLength * cardWorldScale * cardT * cardT;
gl_Position = projectionMatrix * mvPosition;
vPlushFade *= smoothstep(-.50, -.32, cardFacing);
if (vPlushFade <= 0.) gl_Position = vec4(2., 2., 2., 1.);
`;

const CARD_FRAGMENT_HEAD = /* glsl */ `
uniform sampler2D plushCards;
uniform float plushShading;
uniform float plushThickness;
varying vec2 vPlushUv;
varying float vPlushFade;
varying float vPlushHeight;
varying float vPlushVariation;
varying float vPlushRim;
`;

const CARD_COLOR_FRAGMENT = /* glsl */ `
#include <color_fragment>
vec4 fibers = texture2D(plushCards, vPlushUv);
float shortPile = fibers.g * vPlushRim * .65 * (1. - smoothstep(.38, .72, vPlushHeight));
float transmittance = (1. - fibers.a) * (1. - shortPile);
float coverage = 1. - pow(max(transmittance, 0.), (.6 + plushThickness * 1.8) * (1. + vPlushRim * 1.5));
coverage *= vPlushFade;
if (coverage < .012) discard;
diffuseColor.a *= coverage;
float rootShade = mix(1. - plushShading * .85, 1. + plushShading * .65, smoothstep(0., .75, vPlushHeight));
diffuseColor.rgb *= mix(.78, 1.15, fibers.r) * rootShade * vPlushVariation;
`;

// ---------------------------------------------------------------------------
// Attaching fur to a character
// ---------------------------------------------------------------------------

const FUR_SETTINGS = { length: 3.2, density: 202, thickness: 0.35, comb: 0.65, shading: 0.3 };

function attachFur(mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>, root: THREE.Object3D) {
  const original = mesh.material;
  const originalBeforeRender = mesh.onBeforeRender;
  const cards = acquireCardGeometry(mesh, root);

  // Fiber scale: tallest fur body in this character, in this surface's space.
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  const relative = new THREE.Matrix4();
  let tallest = 0;
  root.traverse((o) => {
    if (!isFurBody(o)) return;
    const bounds = getGeometryBounds(o.geometry);
    relative.multiplyMatrices(inverse, o.matrixWorld);
    const e = relative.elements;
    tallest = Math.max(tallest, (bounds.max.y - bounds.min.y) * Math.hypot(e[4], e[5], e[6]));
  });
  const fiberScale = (Number.isFinite(tallest) && tallest > 1e-4 ? tallest : cards.scale) * (original.name === "Hat" ? 0.3 : 1);
  const isTodd = /^Todd_/.test(mesh.name);
  const budgetBoost = isTodd ? 1 / 0.55 : 1;
  const textures = acquireFurTextures();

  const uniforms = {
    plushPile: new THREE.Uniform(textures.pile),
    plushCards: new THREE.Uniform(textures.cards),
    plushScale: new THREE.Uniform(cards.scale),
    plushFiberScale: new THREE.Uniform(fiberScale),
    plushLength: new THREE.Uniform(0.018 * fiberScale),
    plushWidth: new THREE.Uniform(0.013 * fiberScale),
    plushComb: new THREE.Uniform(0.65),
    plushRimWidth: new THREE.Uniform(cards.scale * (isTodd ? 0.032 : 0.055)),
    plushDensity: new THREE.Uniform(180),
    plushThickness: new THREE.Uniform(0.35),
    plushShading: new THREE.Uniform(0.3),
    plushBudget: new THREE.Uniform(MAX_CARDS),
    plushBrushField: new THREE.Uniform<THREE.Texture | null>(null),
    plushBrushActive: new THREE.Uniform(false),
  };

  const pile = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, alphaHash: true, side: original.side });
  pile.name = original.name;
  pile.color = original.color;
  pile.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      PILE_VERTEX_HEAD +
      shader.vertexShader
        .replace("#include <begin_vertex>", PILE_BEGIN_VERTEX)
        .replace("#include <project_vertex>", PILE_PROJECT_VERTEX);
    shader.fragmentShader =
      PILE_FRAGMENT_HEAD +
      shader.fragmentShader
        .replace("#include <color_fragment>", PILE_COLOR_FRAGMENT)
        .replace("#include <normal_fragment_maps>", PILE_NORMAL_FRAGMENT);
  };
  pile.customProgramCacheKey = () => "dots-optimized-pile-v2";

  const cardMaterial = new THREE.MeshStandardMaterial({
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    forceSinglePass: true,
  });
  cardMaterial.name = "Optimized fur cards";
  cardMaterial.color = original.color;
  cardMaterial.emissive = original.color;
  cardMaterial.emissiveIntensity = 0.1;
  cardMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      CARD_VERTEX_HEAD +
      shader.vertexShader
        .replace("#include <beginnormal_vertex>", "vec3 objectNormal = plushNormal;")
        .replace("#include <begin_vertex>", CARD_BEGIN_VERTEX)
        .replace("#include <project_vertex>", CARD_PROJECT_VERTEX);
    shader.fragmentShader =
      CARD_FRAGMENT_HEAD +
      shader.fragmentShader
        .replace("#include <color_fragment>", CARD_COLOR_FRAGMENT)
        .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\nnormal = normalize(vNormal);");
  };
  cardMaterial.customProgramCacheKey = () => "dots-optimized-cards-v4";

  const cardMesh =
    mesh instanceof THREE.SkinnedMesh
      ? new THREE.SkinnedMesh(cards.geometry, cardMaterial)
      : new THREE.Mesh(cards.geometry, cardMaterial);
  if (cardMesh instanceof THREE.SkinnedMesh && mesh instanceof THREE.SkinnedMesh) {
    cardMesh.bindMode = mesh.bindMode;
    cardMesh.bind(mesh.skeleton, mesh.bindMatrix);
  }
  cardMesh.name = "Optimized fur cards";
  cardMesh.frustumCulled = false;
  cardMesh.layers.mask = mesh.layers.mask;
  cardMesh.raycast = () => {};

  const drawingBuffer = new THREE.Vector2();
  const rootView = new THREE.Vector3();
  cardMesh.onBeforeRender = (renderer, _scene, camera) => {
    renderer.getDrawingBufferSize(drawingBuffer);
    const e = cardMesh.matrixWorld.elements;
    const worldScale = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
    rootView.setFromMatrixPosition(cardMesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    const perspective = camera instanceof THREE.OrthographicCamera ? 1 : 1 / Math.max(0.001, -rootView.z);
    const pixels = cards.scale * worldScale * Math.abs(camera.projectionMatrix.elements[5]) * drawingBuffer.y * 0.5 * perspective;
    const budget = getCardBudget(pixels * budgetBoost, uniforms.plushDensity.value);
    uniforms.plushBudget.value = budget;
    cards.geometry.instanceCount = Math.min(MAX_CARDS, Math.ceil(budget));
    cardMaterial.opacity = original.opacity;
  };

  // Settings pass (same as the original's `update(settings)`).
  uniforms.plushLength.value = (FUR_SETTINGS.length * fiberScale) / 100;
  uniforms.plushWidth.value = fiberScale * (0.009 + 0.0022 * FUR_SETTINGS.length);
  uniforms.plushDensity.value = FUR_SETTINGS.density;
  uniforms.plushThickness.value = FUR_SETTINGS.thickness;
  uniforms.plushComb.value = FUR_SETTINGS.comb;
  uniforms.plushShading.value = FUR_SETTINGS.shading;

  mesh.material = pile;
  mesh.add(cardMesh);
  mesh.onBeforeRender = function (...args) {
    originalBeforeRender.apply(this, args);
    pile.opacity = original.opacity;
  };

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    mesh.remove(cardMesh);
    mesh.material = original;
    mesh.onBeforeRender = originalBeforeRender;
    cardMaterial.dispose();
    pile.dispose();
    cards.release();
    textures.release();
  };
}

/** Adds pile + card fur to every fur surface in `root`. Returns a cleanup. */
export function applyFur(root: THREE.Object3D) {
  const surfaces: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
  root.traverse((o) => {
    if (isFurSurface(o)) surfaces.push(o);
  });
  const cleanups = surfaces.map((mesh) => attachFur(mesh, root));
  return () => cleanups.forEach((cleanup) => cleanup());
}
