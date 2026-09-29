/**
 * Character setup and procedural motion for the dots hero, ported 1:1 from openai.com.
 *
 * The GLBs ship with rigs but no animation clips. Every movement is computed here:
 *  - Alfred, Felipe and Iggy share a pose-channel rig (lift, yaw, squash, bend, eye
 *    offset, accessory tilt...) driven by two clips: "excite" (a 2.2-2.4 s hop that
 *    plays when the character is revealed) and "ambient" (a 6 s loop it settles into).
 *  - Todd has his own simpler rig and a 2.5 s look-around on reveal, then holds still.
 *  - "O" is the dots logo: a plain torus.
 */
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

export const CHARACTER_NAMES = ["Alfred", "Felipe", "Iggy", "Todd"] as const;
export const SELECTABLE_CHARACTER_NAMES = ["O", ...CHARACTER_NAMES] as const;
export type CharacterName = (typeof CHARACTER_NAMES)[number];
export type SelectableName = (typeof SELECTABLE_CHARACTER_NAMES)[number];

export const nextSelectable = (name: SelectableName): SelectableName =>
  SELECTABLE_CHARACTER_NAMES[(SELECTABLE_CHARACTER_NAMES.indexOf(name) + 1) % SELECTABLE_CHARACTER_NAMES.length];

/**
 * Saturation boost appended after tone mapping. Pushes low-saturation colours
 * outward along the HSL chroma axis: gain = (1 - (1 - s)^2) / s.
 */
export const COLOR_GRADE = /* glsl */ `
  float dotsHi = max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);
  float dotsLo = min(min(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);
  float dotsChroma = dotsHi - dotsLo;
  float dotsLightness = (dotsHi + dotsLo) * 0.5;
  if (dotsChroma > 0.00001) {
    float dotsAvailable = 1.0 - abs(2.0 * dotsLightness - 1.0);
    float dotsSaturation = clamp(dotsChroma / max(dotsAvailable, 0.00001), 0.0, 1.0);
    float dotsGain = (1.0 - pow(1.0 - dotsSaturation, 2.0)) / max(dotsSaturation, 0.00001);
    gl_FragColor.rgb = mix(vec3(dotsLightness), gl_FragColor.rgb, dotsGain);
  }
`;

// ---------------------------------------------------------------------------
// Easing / keyframe helpers
// ---------------------------------------------------------------------------

type Keys = [number, number][];

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const smoother = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return Math.max(0, Math.min(1, t * t * t * (t * (6 * t - 15) + 10)));
};
/** Damped spring settle used to hand Felipe's flip back to rest. */
const settle = (t: number, from: number, decay = 12, freq = 21) =>
  t < 0 ? from : from * Math.exp(-decay * t) * (Math.cos(freq * t) + (decay / freq) * Math.sin(freq * t));
/** 0 → 1 over [a, b], held, then 1 → 0 over [c, d]. */
const window4 = (t: number, a: number, b: number, c: number, d: number) =>
  smooth((t - a) / (b - a)) * (1 - smooth((t - c) / (d - c)));
/** Triangle-ish bump: 0 at a, 1 at b, 0 at c (smoothstep sides). */
const bump = (t: number, a: number, b: number, c: number) =>
  t < a || t > c ? 0 : t < b ? smooth((t - a) / (b - a)) : 1 - smooth((t - b) / (c - b));
/** Smoothstep between keyframes. */
const eased = (t: number, keys: Keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0));
    }
  return keys[keys.length - 1][1];
};
/** Monotone cubic Hermite (Fritsch-Carlson style harmonic tangents). */
const hermite = (t: number, keys: Keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  const tangent = (i: number) => {
    if (i === 0 || i === keys.length - 1) return 0;
    const a = (keys[i][1] - keys[i - 1][1]) / (keys[i][0] - keys[i - 1][0]);
    const b = (keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]);
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  };
  for (let i = 1; i < keys.length; i++)
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      const h = t1 - t0;
      const s = (t - t0) / h;
      const s2 = s * s;
      const s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * h * tangent(i - 1) + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * h * tangent(i);
    }
  return keys[keys.length - 1][1];
};
/** Shortest signed angle from a to b. */
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

function createMaterialCloner(character: CharacterName) {
  const cache = new Map<THREE.Material, THREE.Material>();
  return {
    clone(source: THREE.Material) {
      const cached = cache.get(source);
      if (cached) return cached;
      const material = source.clone();
      if (material instanceof THREE.MeshStandardMaterial) {
        material.metalness = 0;
        if (material instanceof THREE.MeshPhysicalMaterial) {
          material.clearcoat = 0;
          material.transmission = 0;
        }
        if (source.name.endsWith("soft matte silicone") || source.name.endsWith(" - Body")) {
          if (source.name.endsWith(" - Body")) material.name = `${character} · soft matte silicone`;
          material.roughness = 0.52;
          if (character === "Alfred") material.color.set("#ffc120");
          if (character === "Felipe") material.color.set("#35a0fd");
          if (character === "Iggy") material.color.set("#da61dc");
          if (material instanceof THREE.MeshPhysicalMaterial) material.specularIntensity = 0.9;
        }
        if (source.name === "Accessories · soft charcoal" || /^(Bowtie|Glasses|Hat|Jojo - Glasses)/.test(source.name)) {
          material.color.set("#2d2e2f");
          material.roughness = 0.5;
          if (material instanceof THREE.MeshPhysicalMaterial) material.specularIntensity = 1;
        }
        if (source.name === "Eyes · deep charcoal" || /^Eyes/.test(source.name)) material.roughness = 0.55;
        // Grade only applies when the material tone maps itself (direct-to-screen path).
        material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <colorspace_fragment>",
            `#include <colorspace_fragment>\n#ifdef TONE_MAPPING\n${COLOR_GRADE}\n#endif`,
          );
        };
        material.customProgramCacheKey = () => "dots-solid-grade-v2";
      }
      cache.set(source, material);
      return material;
    },
    dispose() {
      cache.forEach((m) => m.dispose());
    },
  };
}

const isBone = (o: THREE.Object3D): o is THREE.Bone => (o as THREE.Bone).isBone === true;
const isMesh = (o: THREE.Object3D): o is THREE.Mesh => (o as THREE.Mesh).isMesh === true;
const isSkinned = (o: THREE.Object3D): o is THREE.SkinnedMesh => (o as THREE.SkinnedMesh).isSkinnedMesh === true;

// ---------------------------------------------------------------------------
// Pose channels
// ---------------------------------------------------------------------------

const DEFAULT_POSE = Object.freeze({
  x: 0,
  z: 0,
  lift: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  bodyYaw: 0,
  bodyPitch: 0,
  bodyRoll: 0,
  squash: 0,
  bendSide: 0,
  bendForward: 0,
  eyeX: 0,
  eyeY: 0,
  eyeZ: 0,
  eyeOpen: 0,
  blink: 0,
  hatLift: 0,
  hatTilt: 0,
  glassesLift: 0,
  glassesTilt: 0,
  bowtieTilt: 0,
});
export type Pose = { -readonly [K in keyof typeof DEFAULT_POSE]: number };
type Channel = keyof Pose;
const ANGULAR = new Set<Channel>(["yaw", "pitch", "roll", "bodyYaw", "bodyPitch", "hatTilt", "glassesTilt", "bowtieTilt"]);

type RigName = "alfred" | "felipe" | "jojo";
/** Shape of the "excite" hop: seconds, jump height (model units), squash, lean, extra spin (rad). */
export type ExciteConfig = { duration: number; jump: number; squash: number; lean: number; spin: number };
const EXCITE: Record<RigName, ExciteConfig> = {
  alfred: { duration: 2.2, jump: 0.22, squash: 0.06, lean: 0.11, spin: 0 },
  felipe: { duration: 2.4, jump: 0.27, squash: 0.1, lean: 0.15, spin: 0 },
  jojo: { duration: 2.4, jump: 0.25, squash: 0.09, lean: 0.1, spin: 2 * Math.PI },
};
const BODY_BONES = ["body_base", "body_lower", "body_mid", "body_upper", "body_top"];
const BEND_WEIGHTS = [0, 0.25, 0.35, 0.25, 0.15];
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

/** Applies pose channels to the bones. Accessories and the face stay rigid. */
function createRig(root: THREE.Object3D, name: RigName) {
  root.updateWorldMatrix(true, true);
  const bonesByName = new Map<string, THREE.Bone>();
  const bones: THREE.Bone[] = [];
  const skinned: THREE.SkinnedMesh[] = [];
  root.traverse((o) => {
    if (isBone(o)) {
      bonesByName.set(o.name, o);
      bones.push(o);
    }
    if (isSkinned(o)) {
      skinned.push(o);
      o.frustumCulled = false;
    }
  });
  for (const bone of ["Root_CTRL", "Body_CTRL", ...BODY_BONES])
    if (!bonesByName.has(bone)) throw new Error(`Missing bone ${bone}`);
  const bone = (n: string) => bonesByName.get(n)!;
  const rest = new Map(bones.map((b) => [b, b.matrix.clone()]));
  bones.forEach((b) => (b.matrixAutoUpdate = false));

  const rootCtrl = bone("Root_CTRL");
  const rootInverse = root.matrixWorld.clone().invert();
  const rootCtrlRest = rootInverse.clone().multiply(rootCtrl.matrixWorld);
  const glassesBone = name === "jojo" ? "Sunglasses_CTRL" : "Glasses_CTRL";
  const pinned = new Map(
    ["Beret_CTRL", glassesBone, "BowTie_CTRL", "Face_CTRL"].filter((n) => bonesByName.has(n)).map((n) => [n, new THREE.Matrix4()]),
  );

  const bodyTwist = new THREE.Matrix4();
  const bodyCtrlLocal = new THREE.Matrix4();
  const pivot = new THREE.Vector3();
  const bodyRotation = new THREE.Matrix4();
  const bodyRotationInverse = new THREE.Matrix4();
  let bodyTurned = false;
  const offset = new THREE.Matrix4();
  const offsetInverse = new THREE.Matrix4();
  const scratch = new THREE.Matrix4();
  const world = new THREE.Matrix4();
  const accessory = new THREE.Matrix4();
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const center = new THREE.Vector3();
  const unit = new THREE.Vector3(1, 1, 1);
  const translation = new THREE.Vector3();
  const rotation = new THREE.Matrix4();
  const stretch = new THREE.Matrix4();
  const back = new THREE.Matrix4();

  // Rigid accessory placement: follow the (un-scaled) control, then nudge/tilt it.
  function placeAccessory(
    boneName: string,
    { x = 0, y = 0, z = 0, tilt = 0, height = 1 }: { x?: number; y?: number; z?: number; tilt?: number; height?: number } = {},
  ) {
    const target = bonesByName.get(boneName);
    if (!target) return;
    accessory
      .copy(offsetInverse)
      .multiply(rootInverse)
      .multiply(bodyTurned || name === "felipe" ? pinned.get(boneName)! : target.matrixWorld);
    accessory.decompose(position, quaternion, scale);
    accessory.compose(position, quaternion, unit);
    center.copy(position);
    rotation.makeRotationZ(tilt);
    stretch.makeScale(1, height, 1);
    world.makeTranslation(center.x + x, center.y + y, center.z + z).multiply(rotation).multiply(stretch);
    back.makeTranslation(-center.x, -center.y, -center.z);
    world.multiply(back).multiply(accessory);
    world.premultiply(offset).premultiply(root.matrixWorld);
    scratch.copy(target.parent!.matrixWorld).invert().multiply(world);
    target.matrix.copy(scratch);
    target.updateMatrixWorld(true);
  }

  return {
    apply(pose: Pose) {
      for (const b of bones) b.matrix.copy(rest.get(b)!);
      root.updateWorldMatrix(true, true);
      rootInverse.copy(root.matrixWorld).invert();
      quaternion.setFromEuler(euler.set(pose.pitch, pose.yaw, pose.roll, "YXZ"));
      offset.compose(translation.set(pose.x, pose.lift, pose.z), quaternion, unit);
      offsetInverse.copy(offset).invert();
      world.copy(root.matrixWorld).multiply(offset).multiply(rootCtrlRest);
      rootCtrl.matrix.copy(rootCtrl.parent!.matrixWorld).invert().multiply(world);
      rootCtrl.updateMatrixWorld(true);
      if (name === "felipe") for (const [n, m] of pinned) m.copy(bone(n).matrixWorld);

      const squash = 1 - pose.squash;
      const bulge = 1 / Math.sqrt(squash);
      const base = bone("body_base");
      if (name === "felipe") {
        pivot.setFromMatrixPosition(bone("Body_CTRL").matrixWorld).applyMatrix4(scratch.copy(base.matrixWorld).invert());
        bodyTwist
          .makeTranslation(pivot.x, pivot.y, pivot.z)
          .multiply(stretch.makeScale(bulge, squash, bulge))
          .multiply(back.makeTranslation(-pivot.x, -pivot.y, -pivot.z));
        base.matrix.multiply(bodyTwist);
      } else base.matrix.scale(scale.set(bulge, squash, bulge));

      BODY_BONES.forEach((n, i) => {
        const weight = BEND_WEIGHTS[i];
        const b = bone(n);
        quaternion.setFromEuler(euler.set(pose.bendForward * weight, 0, pose.bendSide * weight, "XYZ"));
        b.matrix.multiply(rotation.makeRotationFromQuaternion(quaternion));
        b.updateMatrixWorld(true);
      });

      bodyTurned = !!(pose.bodyYaw || pose.bodyPitch || pose.bodyRoll);
      if (bodyTurned) {
        if (name !== "felipe") for (const [n, m] of pinned) m.copy(bone(n).matrixWorld);
        bodyCtrlLocal.copy(offsetInverse).multiply(rootInverse).multiply(bone("Body_CTRL").matrixWorld);
        pivot.setFromMatrixPosition(bodyCtrlLocal);
        bodyRotation.extractRotation(bodyCtrlLocal);
        bodyRotationInverse.copy(bodyRotation).invert();
        quaternion.setFromEuler(euler.set(pose.bodyPitch, pose.bodyYaw, 0, "YXZ"));
        bodyTwist.makeTranslation(pivot.x, pivot.y, pivot.z).multiply(rotation.makeRotationFromQuaternion(quaternion));
        bodyTwist.multiply(bodyRotation).multiply(rotation.makeRotationZ(pose.bodyRoll)).multiply(bodyRotationInverse);
        bodyTwist.multiply(back.makeTranslation(-pivot.x, -pivot.y, -pivot.z));
        world
          .copy(root.matrixWorld)
          .multiply(offset)
          .multiply(bodyTwist)
          .multiply(offsetInverse)
          .multiply(rootInverse)
          .multiply(base.matrixWorld);
        base.matrix.copy(base.parent!.matrixWorld).invert().multiply(world);
        base.updateMatrixWorld(true);
      }

      placeAccessory("Beret_CTRL", { y: pose.hatLift, tilt: pose.hatTilt });
      placeAccessory(glassesBone, { y: pose.glassesLift, tilt: pose.glassesTilt });
      placeAccessory("BowTie_CTRL", { tilt: pose.bowtieTilt });
      placeAccessory("Face_CTRL", {
        x: pose.eyeX,
        y: pose.eyeY,
        z: pose.eyeZ,
        height: name === "alfred" ? 1 : 1 - (name === "felipe" ? 0.945 : 0.92) * pose.blink,
      });
      for (const mesh of skinned) {
        const eyeOpen = mesh.morphTargetDictionary?.eyeOpen;
        if (eyeOpen !== undefined && mesh.morphTargetInfluences) mesh.morphTargetInfluences[eyeOpen] = pose.eyeOpen;
      }
      root.updateWorldMatrix(true, true);
      skinned.forEach((m) => m.skeleton.update());
    },
  };
}

type Clip = {
  duration: number;
  loop: boolean;
  sample: (t: number) => Partial<Pose>;
  relative?: Channel[];
  preserve?: Channel[];
};

/** "plush" = the generic clips (no per-character overrides), used by the custom characters. */
function createClips(name: RigName | "plush", cfg: ExciteConfig): Record<"ambient" | "excite", Clip> {
  const clips: Record<"ambient" | "excite", Clip> = {
    ambient: {
      duration: 6,
      loop: true,
      sample: (t) => {
        const r = (t / 6) * Math.PI * 2;
        return {
          lift: 0.016 * Math.sin(r),
          yaw: 0.045 * Math.sin(r),
          roll: 0.016 * Math.sin(2 * r),
          bendSide: 0.018 * Math.sin(r),
          eyeX: 0.009 * Math.sin(r),
          eyeY: 0.004 * Math.sin(2 * r),
          blink: name === "alfred" ? 0 : Math.max(bump(t, 2.3, 2.4, 2.55), bump(t, 5.1, 5.2, 5.34)),
          hatTilt: 0.014 * Math.sin(2 * r),
          glassesTilt: 0.008 * Math.sin(2 * r),
          bowtieTilt: 0.014 * Math.sin(2 * r),
        };
      },
    },
    excite: {
      duration: cfg.duration,
      loop: false,
      sample: (r) => {
        const a = (r / cfg.duration) * 2.2;
        const pose: Partial<Pose> = {
          lift: cfg.jump * eased(a, [[0, 0], [0.16, 0], [0.34, -0.1], [0.62, 1], [0.82, 0.88], [1.1, 0], [1.28, 0.12], [1.58, 0], [2.2, 0]]),
          squash: cfg.squash * eased(a, [[0, 0], [0.15, 0.15], [0.34, 1], [0.49, -0.8], [0.86, -0.12], [1.1, 0.9], [1.25, 0.35], [1.52, 0], [2.2, 0]]),
          bendSide: cfg.lean * eased(a, [[0, 0], [0.34, -0.6], [0.7, 0.6], [1.1, -0.3], [1.65, 0], [2.2, 0]]),
          roll: cfg.lean * eased(a, [[0, 0], [0.34, -1], [0.68, 0.8], [1.13, -0.25], [1.65, 0], [2.2, 0]]),
          yaw: cfg.spin
            ? cfg.spin * smooth((a - 0.35) / 1.22)
            : eased(a, [[0, 0], [0.3, -0.13], [0.8, 0.2], [1.3, -0.035], [1.9, 0], [2.2, 0]]),
          pitch: eased(a, [[0, 0], [0.32, -0.06], [0.68, 0.05], [1.1, -0.025], [1.65, 0], [2.2, 0]]),
          eyeY: 0.02 * bump(a, 0.2, 0.65, 1.55),
          eyeX: 0.012 * eased(a, [[0, 0], [0.45, -1], [0.9, 1], [1.6, 0], [2.2, 0]]),
          blink: Math.max(bump(a, 0.19, 0.27, 0.4), bump(a, 1.04, 1.13, 1.26)),
          hatLift: 0.14 * bump(a, 0.37, 0.76, 1.42),
          hatTilt: 0.15 * eased(a, [[0, 0], [0.38, -0.25], [0.75, 1], [1.22, -0.3], [1.64, 0], [2.2, 0]]),
          glassesLift: 0.035 * bump(a, 0.39, 0.8, 1.55),
          glassesTilt: 0.05 * eased(a, [[0, 0], [0.5, -1], [1, 0.4], [1.65, 0], [2.2, 0]]),
          bowtieTilt: 0.15 * eased(a, [[0, 0], [0.4, -1], [0.76, 0.8], [1.18, -0.4], [1.76, 0], [2.2, 0]]),
        };
        if (name === "felipe") {
          // Felipe's reveal is a hand-keyed backflip (degrees for bodyRoll).
          pose.bodyRoll =
            (Math.PI / 180) *
            hermite(r, [[0, 0], [0.133333, 0], [0.3, -13.8789], [0.4, -8.6567], [0.5, 14.1311], [0.633333, 97.4998], [0.766667, 151.2584], [0.866667, 166.273], [1, 175.8093], [1.133333, 179.8524], [1.266667, 180.9174], [1.433333, 180.5718], [1.666667, 180], [2.4, 180]]);
          pose.roll = 0;
          pose.bendSide = 0;
          pose.lift =
            r < 1.18
              ? hermite(r, [[0, 0], [0.133333, 0], [0.3, -0.053867], [0.4, -0.012298], [0.5, 0.049576], [0.633333, 0.115897], [0.766667, 0.141992], [0.866667, 0.116539], [1, 0.040373], [1.1, -0.018902], [1.18, -0.047]])
              : settle(r - 1.18, -0.047);
          pose.squash =
            r < 1.18
              ? hermite(r, [[0, 0], [0.133333, 0.004732], [0.3, 0.074765], [0.366667, 0.07909], [0.4, 0.059084], [0.5, -0.051063], [0.633333, 0.03199], [0.766667, -0.001943], [0.866667, 0], [1, 0.002121], [1.1, 0.050232], [1.18, 0.068928]])
              : settle(r - 1.18, 0.068928);
          if (r >= 1.85) {
            pose.lift *= 1 - smooth((r - 1.85) / 0.15);
            pose.squash *= 1 - smooth((r - 1.85) / 0.15);
          }
          pose.x = hermite(r, [[0, 0], [0.133333, 0], [0.3, 0.014268], [0.4, 0.007695], [0.5, -0.008355], [0.633333, -0.027552], [0.766667, -0.033908], [0.866667, -0.025117], [1, -0.004279], [1.066667, 0]]);
          pose.z = hermite(r, [[0, 0], [0.133333, 0], [0.3, 0.017184], [0.4, 0.014543], [0.5, 0.009668], [0.633333, 0.003225], [0.766667, 0]]);
          pose.yaw =
            r < 1.433333
              ? hermite(r, [[0, 0], [0.133333, 0.18822], [0.3, 0.5538], [0.4, 0.57033], [0.5, 0.47356], [0.633333, 0.19072], [0.766667, -0.02744], [0.866667, -0.09753], [1, -0.11711], [1.133333, -0.07472], [1.266667, -8e-5], [1.433333, 0.0669]])
              : settle(r - 1.433333, 0.0669, 12, 16) * (1 - smooth((r - 2) / 0.15));
          pose.pitch = hermite(r, [[0, 0], [0.133333, 0.06358], [0.3, 0.17783], [0.4, 0.18263], [0.5, 0.15948], [0.633333, 0.09751], [0.766667, 0.02179], [0.866667, -0.01499], [1, -0.01385], [1.133333, -0.00211], [1.266667, 0]]);
          pose.bodyYaw = 0.11364;
          pose.bodyPitch = hermite(r, [[0, -0.023165], [0.133333, -0.023165], [0.3, 0.193017], [0.4, 0.110523], [0.5, -0.04268], [0.633333, -0.120791], [0.766667, -0.055441], [0.866667, -0.023165]]);
          pose.eyeX =
            hermite(r, [[0, 0], [0.133333, 0], [0.3, -0.002256], [0.4, -768e-6], [0.5, 0.002703], [0.633333, 0.007846], [0.766667, 0.010344], [0.866667, 0.007662], [1, 0.001305], [1.066667, 0]]) - pose.x;
          pose.eyeY =
            hermite(r, [[0, 0], [0.133333, 0], [0.3, -0.053882], [0.4, -0.027594], [0.5, 0.018236], [0.633333, 0.077228], [0.766667, 0.11729], [0.866667, 0.127592], [1, 0.096216], [1.1, 0.046007], [1.2, 0], [1.3, -0.015491], [1.366667, -0.010146], [1.466667, 0.002458], [1.666667, 0]]) - pose.lift;
          pose.eyeZ =
            hermite(r, [[0, 0], [0.133333, 0.001199], [0.2, 0.018093], [0.3, 0.045149], [0.366667, 0.043927], [0.4, 0.036781], [0.433333, 0.020189], [0.5, 1e-5], [0.633333, -0.006231], [0.766667, 392e-6], [0.866667, 0.001094], [1, 0.001964], [1.1, 0.014497], [1.166667, 0.019582], [1.2, 0.018714], [1.3, 0.009829], [1.466667, 0.001829], [1.666667, 0]]) - pose.z;
          pose.blink = Math.max(window4(r, 0.166667, 0.266667, 0.3, 0.433333), window4(r, 1.1, 1.2, 1.233333, 1.366667));
          pose.hatLift = hermite(r, [[0, 0], [0.133333, 0], [0.3, 0.022], [0.4, -0.006], [0.5, 0.10429], [0.633333, 0.31835], [0.766667, 0.3628], [0.866667, 0.34043], [1, 0.21451], [1.133333, -0.00278], [1.266667, -0.0017], [1.433333, -7e-5], [1.666667, 0]]);
          pose.hatTilt = hermite(r, [[0, 0], [0.3, 0.01472], [0.4, 0.01745], [0.5, -0.26054], [0.633333, -0.52484], [0.766667, -0.48741], [0.866667, -0.3229], [1, -0.05369], [1.133333, -0.01945], [1.266667, -0.05307], [1.433333, -0.0194], [1.666667, 0]]);
        }
        if (name === "alfred") {
          // Alfred's eyes are closed at rest; they pop open for the hop only.
          pose.eyeOpen = smoother((r - 0.04) / 0.28) * (1 - smoother((r - 1.52) / 0.30000000000000004));
          pose.blink = 0;
        }
        if (name === "jojo")
          pose.yaw = hermite(r, [[0, 0], [0.1, 0], [0.2, 0.086503], [0.3, 0.349829], [0.366667, 0.436332], [0.4, 0.427247], [0.5, 0.26669], [0.6, -0.197826], [0.7, -1.276099], [0.8, -3.403392], [0.9, -5.076971], [1, -5.772477], [1.1, -5.974104], [1.2, -6.031639], [1.4, -6.038839], [1.6, -6.07569], [1.8, -6.239432], [2, -6.289845], [2.2, -6.284221], [2.4, -(2 * Math.PI)]]);
        return pose;
      },
    },
  };
  if (name === "felipe")
    for (const clip of Object.values(clips)) {
      clip.relative = ["bodyRoll"];
      clip.preserve = ["bodyYaw", "bodyPitch"];
    }
  return clips;
}

/** Clip player with an 0.18 s smoothstep cross-blend between clips. Produces pose channels only. */
export function createPosePlayer(name: RigName | "plush", cfg: ExciteConfig = EXCITE[name as RigName]) {
  const clips = createClips(name, cfg);
  const values: Pose = { ...DEFAULT_POSE };
  let state = { name: "ambient" as keyof typeof clips, time: 0, playing: false, loop: true, returnTo: null as keyof typeof clips | null };
  let from: Pose = { ...values };
  let carried: Pose = { ...DEFAULT_POSE };
  let blendTime = 0;
  let blendDuration = 0;

  function play(clip: keyof typeof clips) {
    from = { ...values };
    carried = { ...values };
    blendTime = 0;
    blendDuration = 0.18;
    state = { name: clip, time: 0, playing: true, loop: clips[clip].loop, returnTo: clip === "excite" ? "ambient" : null };
  }

  return {
    values,
    get state() {
      return { playing: state.playing, blending: blendTime < blendDuration };
    },
    excite() {
      play("excite");
    },
    update(delta: number) {
      if (!Number.isFinite(delta) || delta < 0) return;
      let finished = false;
      if (state.playing) {
        state.time += delta;
        const clip = clips[state.name];
        const duration = clip.duration;
        if (state.time >= duration) {
          if (state.loop) {
            const loops = Math.floor(state.time / duration);
            const start = clip.sample(0);
            const end = clip.sample(clip.duration);
            for (const channel of clip.relative ?? []) carried[channel] += loops * ((end[channel] ?? 0) - (start[channel] ?? 0));
            state.time = Math.max(0, state.time - loops * duration);
          } else {
            state.time = duration;
            state.playing = false;
            finished = true;
          }
        }
      }
      if (state.playing || finished || blendTime < blendDuration) {
        blendTime += delta;
        const clip = clips[state.name];
        const sampled = clip.sample(state.time);
        const target: Pose = { ...DEFAULT_POSE, ...sampled };
        for (const channel of clip.preserve ?? []) if (sampled[channel] === undefined) target[channel] = carried[channel];
        for (const channel of clip.relative ?? []) target[channel] += carried[channel];
        const k = blendDuration ? smooth(blendTime / blendDuration) : 1;
        for (const channel of Object.keys(values) as Channel[])
          values[channel] =
            from[channel] + (ANGULAR.has(channel) ? angleDelta(from[channel], target[channel]) : target[channel] - from[channel]) * k;
        if (k === 1) Object.assign(values, target);
      }
      if (finished && state.returnTo) play(state.returnTo);
    },
  };
}

/** The pose player driving a GLB character's bones. */
function createMotion(root: THREE.Object3D, name: RigName) {
  const rig = createRig(root, name);
  const player = createPosePlayer(name);
  return {
    values: player.values,
    get state() {
      return player.state;
    },
    excite: player.excite,
    update: player.update,
    apply() {
      rig.apply(player.values);
    },
  };
}

// ---------------------------------------------------------------------------
// Todd: separate rig, one-shot look-around on reveal
// ---------------------------------------------------------------------------

const TODD_REST = { rootNod: 0, eyeX: 0, rootRoll: 0, rootYaw: 0, eyeOpenLeft: 1, eyeOpenRight: 1 };
type ToddPose = typeof TODD_REST;

const keyed = (keys: Keys) => (t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const s = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * s * s * (3 - 2 * s);
    }
  }
  return keys[keys.length - 1][1];
};
const TODD_REVEAL = Object.entries({
  eyeX: keyed([[0, 0], [0.08, -0.8], [0.24, -0.8], [0.3, 1], [0.52, 1], [0.62, 0], [1, 0]]),
  rootYaw: keyed([[0, 0], [0.06, 0], [0.2, -0.16], [0.29, -0.16], [0.44, 0.21], [0.55, 0.21], [0.76, 0], [1, 0]]),
  rootRoll: keyed([[0, 0], [0.22, -0.035], [0.46, 0.085], [0.59, 0.085], [0.84, 0], [1, 0]]),
  rootNod: keyed([[0, 0], [0.57, 0], [0.7, -0.035], [0.81, 0.085], [1, 0]]),
  eyeOpenLeft: keyed([[0, 1], [0.245, 1], [0.27, 0.12], [0.3, 1], [0.73, 1], [0.76, 0.12], [0.8, 1], [1, 1]]),
  eyeOpenRight: keyed([[0, 1], [0.245, 1], [0.27, 0.12], [0.3, 1], [0.73, 1], [0.76, 0.12], [0.8, 1], [1, 1]]),
}) as [keyof ToddPose, (t: number) => number][];
export const TODD_REVEAL_SECONDS = 2.5;

export function sampleToddReveal(seconds: number): ToddPose {
  const t = Math.max(0, seconds) / TODD_REVEAL_SECONDS;
  if (t >= 1) return TODD_REST;
  const pose = { ...TODD_REST };
  for (const [channel, curve] of TODD_REVEAL) pose[channel] = curve(t);
  return pose;
}

// ---------------------------------------------------------------------------
// Public character objects
// ---------------------------------------------------------------------------

type BaseCharacter = {
  scene: THREE.Object3D;
  center: THREE.Vector3;
  size: THREE.Vector3;
  dispose(): void;
};
export type MotionCharacter = BaseCharacter & {
  kind: "motion";
  motion: ReturnType<typeof createMotion>;
  poseHero(look: { x: number; y: number }): void;
};
export type PosedCharacter = BaseCharacter & {
  kind: "posed";
  pose(pose?: ToddPose, eyeX?: number, eyeY?: number): void;
};
export type LogoCharacter = BaseCharacter & { kind: "logo" };
export type StageCharacter = MotionCharacter | PosedCharacter | LogoCharacter;

function buildTodd(source: THREE.Object3D): PosedCharacter {
  const scene = cloneSkinned(source);
  const materials = createMaterialCloner("Todd");
  const bones = new Map<string, THREE.Bone>();
  scene.traverse((o) => {
    o.frustumCulled = false;
    if (isBone(o)) bones.set(o.name, o);
    if (isMesh(o)) o.material = Array.isArray(o.material) ? o.material.map(materials.clone) : materials.clone(o.material);
  });
  const snapshot = (b: THREE.Bone) => ({ bone: b, rotation: b.quaternion.clone(), position: b.position.clone(), scale: b.scale.clone() });
  const body = BODY_BONES.map((n) => bones.get(n)).filter((b): b is THREE.Bone => !!b).map(snapshot);
  const controls = [...bones.values()]
    .filter((b) => b.name.endsWith("_CTRL") && !["Root_CTRL", "Body_CTRL"].includes(b.name))
    .map(snapshot);
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  return {
    kind: "posed",
    scene,
    center,
    size,
    pose(pose = TODD_REST, eyeX = 0, eyeY = 0) {
      body.forEach(({ bone, rotation, position, scale }, i) => {
        bone.position.copy(position);
        bone.scale.copy(scale);
        qb.setFromAxisAngle(AXIS_X, i === 0 ? pose.rootNod : 0);
        bone.quaternion.copy(rotation).multiply(qb);
      });
      const first = body[0];
      if (first) {
        qa.setFromAxisAngle(AXIS_Y, pose.rootYaw);
        qb.setFromAxisAngle(AXIS_Z, pose.rootRoll);
        first.bone.quaternion.multiply(qa.multiply(qb));
      }
      const lookX = pose.eyeX + eyeX;
      controls.forEach(({ bone, rotation, position, scale }) => {
        bone.position.copy(position);
        bone.scale.copy(scale);
        bone.quaternion.copy(rotation);
        if (bone.name === "Face_CTRL") {
          bone.position.x += lookX * size.y * 0.035;
          bone.position.y += eyeY * size.y * 0.018;
        } else if (bone.name === "Eye_L_CTRL" || bone.name === "Eye_R_CTRL") {
          qa.setFromAxisAngle(AXIS_Y, 0.2 * lookX);
          qb.setFromAxisAngle(AXIS_X, -(0.12 * eyeY));
          bone.quaternion.multiply(qa.multiply(qb));
          bone.scale.y *= bone.name === "Eye_L_CTRL" ? pose.eyeOpenLeft : pose.eyeOpenRight;
        }
      });
    },
    dispose() {
      materials.dispose();
      scene.traverse((o) => {
        if (isSkinned(o)) o.skeleton.dispose();
      });
    },
  };
}

export function buildCharacter(source: THREE.Object3D, character: CharacterName): MotionCharacter | PosedCharacter {
  if (character === "Todd") return buildTodd(source);
  const scene = cloneSkinned(source);
  const materials = createMaterialCloner(character);
  const skinnedMeshes = new Set<THREE.SkinnedMesh>();
  scene.traverse((o) => {
    o.frustumCulled = false;
    if (isMesh(o)) o.material = Array.isArray(o.material) ? o.material.map(materials.clone) : materials.clone(o.material);
    if (isSkinned(o)) skinnedMeshes.add(o);
  });
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const motion = createMotion(scene, character === "Iggy" ? "jojo" : character === "Alfred" ? "alfred" : "felipe");
  const values = motion.values;
  const accessories = ["Beret_CTRL", "Glasses_CTRL", "Sunglasses_CTRL", "BowTie_CTRL"]
    .map((n) => scene.getObjectByName(n))
    .filter((o): o is THREE.Bone => !!o && isBone(o));
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  return {
    kind: "motion",
    scene,
    center,
    size,
    motion,
    // Cursor look: shift the face toward the pointer on top of the clip pose.
    poseHero(look) {
      const eyeX = values.eyeX;
      const eyeY = values.eyeY;
      values.eyeX += look.x * size.y * 0.035;
      values.eyeY += look.y * size.y * 0.018;
      motion.apply();
      for (const bone of accessories) {
        bone.matrix.decompose(p, q, s);
        bone.matrix.compose(p, q, s);
      }
      scene.updateMatrixWorld(true);
      skinnedMeshes.forEach((m) => m.skeleton.update());
      values.eyeX = eyeX;
      values.eyeY = eyeY;
    },
    dispose() {
      skinnedMeshes.forEach((m) => m.skeleton.dispose());
      materials.dispose();
    },
  };
}

/** The dots logo "O": a flat-shaded torus with the logo's ring proportions. */
export function buildLogo(): LogoCharacter {
  const thickness = (28 - 16.9227) / 56;
  const geometry = new THREE.TorusGeometry((0.5 + thickness) / 2, (0.5 - thickness) / 2, 16, 96);
  const material = new THREE.MeshBasicMaterial({ color: "#bac1d3", toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Dots logo";
  const box = new THREE.Box3().setFromObject(mesh);
  return {
    kind: "logo",
    scene: mesh,
    center: box.getCenter(new THREE.Vector3()),
    size: box.getSize(new THREE.Vector3()),
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
