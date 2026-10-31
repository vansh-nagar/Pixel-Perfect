// Optimizes the Porsche 911 GT3 R GLB for the driving playground.
//
//   node scripts/optimize-car.mjs <source.glb> [out.glb]
//
// - Drops parts you never see from a chase camera: engine, pedals, belts, window net,
//   cabin LEDs and dash displays.
// - Bakes everything into world space (Y up, metres, nose toward +Z), then regroups it:
//   BODY, WHEEL_LF/RF/LR/RR (pivot at the hub, so they can spin and steer) and
//   SUSP_LF/RF (front calipers: steer with the wheel but don't spin). Rear calipers go
//   into BODY.
// - Keeps the exterior and wheels at full resolution; only the cabin (seen through the
//   glass) is simplified. Merges each group's meshes by material (fewer draw calls),
//   caps textures at 2048 WebP and compresses geometry with meshopt.

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  clearNodeParent,
  clearNodeTransform,
  dedup,
  join,
  meshopt,
  prune,
  simplifyPrimitive,
  textureCompress,
  transformMesh,
  weld,
  weldPrimitive,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const [src, out = "public/playground/car/porsche-gt3r.glb"] = process.argv.slice(2);
if (!src) {
  console.error("usage: node scripts/optimize-car.mjs <source.glb> [out.glb]");
  process.exit(1);
}

const DROP = /Pedals|Seat_Belt|_Net|^LED_|DISPLAY|Engine_Components|COCKPIT_LR/;
const WHEEL = /^WHEEL_(LF|RF|LR|RR)$/;
const FRONT_SUSP = /^SUSP_(LF|RF)$/;
const CABIN = /^COCKPIT_HR$/;

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(src);
const root = doc.getRoot();
const scene = root.listScenes()[0];

const ancestors = (node) => {
  const names = [];
  for (let n = node; n; n = n.getParentNode()) names.push(n.getName());
  return names;
};

// Hub positions, read before anything moves.
const hubs = new Map();
for (const node of root.listNodes()) {
  if (WHEEL.test(node.getName())) hubs.set(node.getName().slice(6), node.getWorldTranslation());
}
if (hubs.size !== 4) throw new Error(`expected 4 wheels, found ${hubs.size}`);

const car = doc.createNode("CAR");
const body = doc.createNode("BODY");
car.addChild(body);
const groups = new Map();
const group = (name, at) => {
  if (!groups.has(name)) {
    const node = doc.createNode(name).setTranslation(at);
    car.addChild(node);
    groups.set(name, node);
  }
  return groups.get(name);
};

const oldRoots = scene.listChildren();
let dropped = 0;
for (const node of root.listNodes().filter((n) => n.getMesh())) {
  const names = ancestors(node);
  if (names.some((n) => DROP.test(n))) {
    node.dispose();
    dropped++;
    continue;
  }
  if (names.some((n) => CABIN.test(n))) {
    for (const prim of node.getMesh().listPrimitives()) {
      weldPrimitive(prim);
      simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: 0.35, error: 0.002 });
    }
  }
  const wheel = names.find((n) => WHEEL.test(n));
  const susp = names.find((n) => FRONT_SUSP.test(n));
  clearNodeParent(node);
  clearNodeTransform(node);
  scene.removeChild(node);
  const key = (wheel ?? susp)?.slice(-2);
  if (key) {
    const hub = hubs.get(key);
    transformMesh(node.getMesh(), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -hub[0], -hub[1], -hub[2], 1]);
    group(wheel ? `WHEEL_${key}` : `SUSP_${key}`, hub).addChild(node);
  } else {
    body.addChild(node);
  }
}
for (const n of oldRoots) n.dispose();
scene.addChild(car);
console.log(`dropped ${dropped} mesh nodes`);

await doc.transform(
  dedup(),
  prune(),
  weld(),
  join(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: "webp", quality: 88, resize: [2048, 2048] }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);

for (const n of car.listChildren()) {
  const verts = n.listChildren().reduce(
    (s, c) => s + (c.getMesh()?.listPrimitives().reduce((t, p) => t + p.getAttribute("POSITION").getCount(), 0) ?? 0),
    0,
  );
  console.log(`${n.getName().padEnd(9)} at ${n.getTranslation().map((v) => v.toFixed(3)).join(", ")}  meshes ${n.listChildren().length}  verts ${verts}`);
}
await io.write(out, doc);
console.log(`wrote ${out}`);
