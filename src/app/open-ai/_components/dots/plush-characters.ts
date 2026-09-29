/**
 * Four original plush characters in the dots style, built from primitives in code.
 * They share everything else with the dots cast: the fur (./fur), the pose clips and
 * blending (createPosePlayer), the light rig and the colour grade.
 *
 *  - Mochi: a squishy cream bun with bead eyes, blush and a small smile.
 *  - Pip: an orange egg with one big eye and a sprout that pops off on the hop. Spins.
 *  - Bolt: a cherry rounded cube wearing headphones that jump when it does.
 *  - Nimbus: a lilac-white cloud with happy closed eyes and a floating star.
 *
 * Each character is built once as a template and cloned per use, so clones share
 * geometry and the fur is baked once per character.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createPosePlayer, type ExciteConfig } from "./characters";
import type { Character } from "./face-renderer";

export const PLUSH_NAMES = ["Mochi", "Pip", "Bolt", "Nimbus"] as const;
export type PlushName = (typeof PLUSH_NAMES)[number];

// Names follow the dots materials, which is how the fur finds bodies, eyes and accessories.
const materials = {
  body: (name: string, color: string) =>
    new THREE.MeshStandardMaterial({ name: `${name} · soft matte silicone`, color, roughness: 0.52, metalness: 0 }),
  eye: () => new THREE.MeshStandardMaterial({ name: "Eyes · deep charcoal", color: "#0c0d0d", roughness: 0.3, metalness: 0 }),
  ivory: () => new THREE.MeshStandardMaterial({ name: "Eyes · warm ivory", color: "#f1f1ea", roughness: 0.5, metalness: 0 }),
  accessory: (finish: string, color: string, roughness = 0.5) =>
    new THREE.MeshStandardMaterial({ name: `Accessories · ${finish}`, color, roughness, metalness: 0 }),
};
const charcoal = () => materials.accessory("soft charcoal", "#2d2e2f");
const blush = () => materials.accessory("blush", "#ff9db4", 0.6);

/** Smooth, seamless normals for a deformed primitive (drops the UV seam first). */
function sealed(geometry: THREE.BufferGeometry) {
  geometry.deleteAttribute("uv");
  const merged = mergeVertices(geometry, 1e-4);
  merged.computeVertexNormals();
  return merged;
}

/** Moves a geometry so its lowest point sits on y = 0. */
function standOnGround(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  geometry.translate(0, -geometry.boundingBox!.min.y, 0);
  return geometry;
}

const raycaster = new THREE.Raycaster();
const FORWARD = new THREE.Vector3(0, 0, 1);

/** Sets `part` onto the front of `body` at (x, y), facing out along the surface normal. */
function placeOn(part: THREE.Object3D, body: THREE.Mesh, x: number, y: number, embed = 0) {
  body.updateMatrixWorld(true);
  raycaster.set(new THREE.Vector3(x, y, 5), new THREE.Vector3(0, 0, -1));
  const hit = raycaster.intersectObject(body, false)[0];
  if (!hit?.face) throw new Error(`No surface at ${x}, ${y}`);
  const normal = hit.face.normal.clone().transformDirection(body.matrixWorld);
  part.position.copy(hit.point).addScaledVector(normal, -embed);
  part.quaternion.setFromUnitVectors(FORWARD, normal);
  return part;
}

const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, name = "") => {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  return m;
};

/** A group that rotates and scales about `at`; add children in character space. */
function pivot(name: string, at: THREE.Vector3) {
  const outer = new THREE.Group();
  outer.name = name;
  outer.position.copy(at);
  const inner = new THREE.Group();
  inner.position.copy(at).negate();
  outer.add(inner);
  return { outer, inner };
}

type Blueprint = {
  body: THREE.Mesh;
  face: THREE.Object3D[];
  top?: { at: THREE.Vector3; parts: THREE.Object3D[] };
  excite: ExciteConfig;
};

// ---------------------------------------------------------------------------
// The cast
// ---------------------------------------------------------------------------

function mochi(): Blueprint {
  const shape = new THREE.SphereGeometry(0.5, 72, 48);
  const p = shape.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < -0.3) p.setY(i, -0.3 + (y + 0.3) * 0.25); // sit flat
  }
  shape.scale(1.2, 0.84, 1.04);
  const body = mesh(standOnGround(sealed(shape)), materials.body("Mochi", "#fff1dc"), "Mochi_body");

  const bead = new THREE.SphereGeometry(0.05, 24, 16).scale(1, 1.18, 0.6);
  const cheek = new THREE.SphereGeometry(0.07, 24, 16).scale(1.35, 0.75, 0.22);
  const smile = new THREE.TorusGeometry(0.038, 0.011, 8, 24, Math.PI).rotateZ(Math.PI);
  const face = [
    ...[-1, 1].map((side) => {
      const eye = placeOn(mesh(bead, materials.eye(), "eye"), body, 0.2 * side, 0.46, 0.012);
      eye.userData.blink = true;
      return eye;
    }),
    ...[-1, 1].map((side) => placeOn(mesh(cheek, blush()), body, 0.34 * side, 0.37, 0.004)),
    placeOn(mesh(smile, charcoal()), body, 0, 0.385, 0.004),
  ];
  return { body, face, excite: { duration: 2.2, jump: 0.2, squash: 0.12, lean: 0.1, spin: 0 } };
}

function pip(): Blueprint {
  const profile = Array.from({ length: 49 }, (_, i) => {
    const t = i / 48;
    return new THREE.Vector2(0.37 * Math.pow(Math.sin(Math.PI * t), 0.8) * (1.1 - 0.3 * t), t);
  });
  const body = mesh(standOnGround(sealed(new THREE.LatheGeometry(profile, 72))), materials.body("Pip", "#ff7a2f"), "Pip_body");

  // One big eye: sclera, pupil and a highlight, blinking as a unit.
  const eye = new THREE.Group();
  eye.add(mesh(new THREE.SphereGeometry(0.135, 32, 24).scale(1, 1, 0.5), materials.ivory(), "sclera"));
  const pupil = mesh(new THREE.SphereGeometry(0.072, 24, 16).scale(1, 1, 0.5), materials.eye(), "pupil");
  pupil.position.z = 0.045;
  const glint = mesh(new THREE.SphereGeometry(0.02, 12, 8), materials.ivory(), "glint");
  glint.position.set(0.028, 0.032, 0.075);
  eye.add(pupil, glint);
  placeOn(eye, body, 0, 0.6, 0.02);
  eye.userData.blink = true;

  const leaf = materials.accessory("leaf green", "#3cc35a", 0.55);
  const leafShape = new THREE.SphereGeometry(0.1, 24, 12).scale(1, 0.3, 0.55);
  const stem = mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.15, 12), leaf);
  stem.position.set(0, 1.05, 0);
  const leaves = [-1, 1].map((side) => {
    const m = mesh(leafShape, leaf);
    m.position.set(0.085 * side, 1.13, 0);
    m.rotation.z = -0.5 * side;
    return m;
  });
  return {
    body,
    face: [eye],
    top: { at: new THREE.Vector3(0, 1, 0), parts: [stem, ...leaves] },
    excite: { duration: 2.4, jump: 0.25, squash: 0.09, lean: 0.1, spin: 2 * Math.PI },
  };
}

function bolt(): Blueprint {
  const body = mesh(
    standOnGround(new RoundedBoxGeometry(0.8, 0.76, 0.66, 8, 0.22)),
    materials.body("Bolt", "#ff4d5e"),
    "Bolt_body",
  );
  const pill = new THREE.CapsuleGeometry(0.036, 0.085, 8, 16);
  const face = [
    ...[-1, 1].map((side) => {
      const eye = placeOn(mesh(pill, materials.eye(), "eye"), body, 0.15 * side, 0.44, 0.02);
      eye.userData.blink = true;
      return eye;
    }),
    placeOn(mesh(new THREE.CapsuleGeometry(0.011, 0.07, 6, 12).rotateZ(Math.PI / 2), charcoal()), body, 0, 0.3, 0.004),
  ];
  const band = mesh(new THREE.TorusGeometry(0.45, 0.032, 12, 64, Math.PI), charcoal());
  band.position.set(0, 0.4, 0);
  const cups = [-1, 1].map((side) => {
    const cup = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 32).rotateZ(Math.PI / 2), charcoal());
    cup.position.set(0.445 * side, 0.4, 0);
    return cup;
  });
  return {
    body,
    face,
    top: { at: new THREE.Vector3(0, 0.76, 0), parts: [band, ...cups] },
    excite: { duration: 2.2, jump: 0.28, squash: 0.12, lean: 0.14, spin: 0 },
  };
}

function nimbus(): Blueprint {
  const puffs: [number, number, number, number][] = [
    [0, 0.36, 0, 0.32],
    [-0.3, 0.27, 0.02, 0.23],
    [0.31, 0.28, 0.02, 0.24],
    [-0.14, 0.56, 0, 0.23],
    [0.17, 0.58, -0.02, 0.25],
  ];
  const cloud = mergeGeometries(
    puffs.map(([x, y, z, r]) => {
      const puff = new THREE.SphereGeometry(r, 48, 32).translate(x, y, z);
      puff.deleteAttribute("uv");
      return puff;
    }),
  ).scale(1, 1, 0.85);
  const body = mesh(standOnGround(cloud), materials.body("Nimbus", "#f3efff"), "Nimbus_body");

  const arc = new THREE.TorusGeometry(0.046, 0.012, 8, 24, Math.PI);
  const cheek = new THREE.SphereGeometry(0.065, 24, 16).scale(1.35, 0.75, 0.22);
  const face = [
    ...[-1, 1].map((side) => {
      const eye = placeOn(mesh(arc, materials.eye(), "eye"), body, 0.12 * side, 0.41, 0.004);
      eye.userData.blink = true;
      return eye;
    }),
    ...[-1, 1].map((side) => placeOn(mesh(cheek, blush()), body, 0.25 * side, 0.34, 0.004)),
  ];

  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.04 : 0.09;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) star.moveTo(r * Math.cos(a), r * Math.sin(a));
    else star.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  const starGeometry = new THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 });
  starGeometry.center();
  const gold = mesh(starGeometry, materials.accessory("star gold", "#ffc53d", 0.45));
  gold.position.set(0.3, 0.98, 0.02);
  gold.rotation.z = -0.25;
  return {
    body,
    face,
    top: { at: new THREE.Vector3(0.22, 0.8, 0), parts: [gold] },
    excite: { duration: 2.4, jump: 0.18, squash: 0.05, lean: 0.08, spin: 0 },
  };
}

const BLUEPRINTS: Record<PlushName, () => Blueprint> = { Mochi: mochi, Pip: pip, Bolt: bolt, Nimbus: nimbus };

// ---------------------------------------------------------------------------
// Template -> character
// ---------------------------------------------------------------------------

type Template = { object: THREE.Object3D; excite: ExciteConfig };
const templates = new Map<PlushName, Template>();

/**
 * root (x, lift, z, pitch/yaw/roll)
 *   turn: body turns and bends about the body centre
 *     squash: scales from the ground up
 *       body, face (eye offsets, blink), top (hat lift/tilt)
 */
function template(name: PlushName): Template {
  const cached = templates.get(name);
  if (cached) return cached;
  const { body, face, top, excite } = BLUEPRINTS[name]();
  body.userData.eyeClearance = true;
  body.geometry.computeBoundingBox();
  const center = body.geometry.boundingBox!.getCenter(new THREE.Vector3());

  const root = new THREE.Group();
  root.name = "root";
  const turn = pivot("turn", center);
  const squash = new THREE.Group();
  squash.name = "squash";
  const faceGroup = new THREE.Group();
  faceGroup.name = "face";
  faceGroup.add(...face);
  squash.add(body, faceGroup);
  if (top) {
    const hat = pivot("top", top.at);
    hat.inner.add(...top.parts);
    squash.add(hat.outer);
  }
  turn.inner.add(squash);
  root.add(turn.outer);
  const object = new THREE.Group();
  object.add(root);
  const made = { object, excite };
  templates.set(name, made);
  return made;
}

export function buildPlush(name: PlushName): Character {
  const { object, excite } = template(name);
  const scene = object.clone(true);
  const get = (n: string) => scene.getObjectByName(n)!;
  const root = get("root");
  const turn = get("turn");
  const squash = get("squash");
  const face = get("face");
  const top = scene.getObjectByName("top");
  const topRest = top?.position.clone();
  const blinkers: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.userData.blink) blinkers.push(o);
  });
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const player = createPosePlayer("plush", excite);

  return {
    scene,
    center,
    size,
    excite: player.excite,
    update(delta, look) {
      player.update(delta);
      const p = player.values;
      root.position.set(p.x, p.lift, p.z);
      root.rotation.set(p.pitch, p.yaw, p.roll, "YXZ");
      turn.rotation.set(p.bodyPitch + 0.5 * p.bendForward, p.bodyYaw, p.bodyRoll + 0.5 * p.bendSide, "YXZ");
      const height = 1 - p.squash;
      const bulge = 1 / Math.sqrt(height);
      squash.scale.set(bulge, height, bulge);
      face.position.set(p.eyeX + look.x * size.y * 0.035, p.eyeY + look.y * size.y * 0.018, p.eyeZ);
      for (const eye of blinkers) eye.scale.y = 1 - 0.92 * p.blink;
      if (top && topRest) {
        top.position.set(topRest.x, topRest.y + p.hatLift, topRest.z);
        top.rotation.z = p.hatTilt;
      }
    },
    // Geometry and materials belong to the shared template.
    dispose() {},
  };
}
