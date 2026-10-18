"use client";

/**
 * Sticker maker: drop in any image or SVG and it becomes a die-cut vinyl sticker you can fling,
 * flip and peel. The cut (white border, rounded inner corners, filled holes, background
 * knock-out) is built on the CPU in ./make-sticker.ts; the paper feel is a vertex shader on a
 * dense plane, the same technique as the repo's bend-mouse-follower, extended with:
 *  - two cylindrical bends driven by angular velocity (air drag curls the edges as it spins),
 *  - a page-curl peel around a moving fold line: grab an edge and pull to peel it from any
 *    direction, let go and it comes off and falls like paper (the
 *    peel-and-fall mechanism from GetOn's landing page, see stepPeel),
 *  - a small flutter, and a plain white backing on the reverse side.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { loadImage, makeSticker, type StickerOptions } from "./make-sticker";
import { PoleScene, type Placed, type PoleSpin } from "./pole-scene";
import type { PoleSkin } from "./pole-textures";

// ---------------------------------------------------------------------------
// Samples (inline so the tool works with nothing uploaded)
// ---------------------------------------------------------------------------

const svgUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const SAMPLES = [
  { name: "City", url: "/stickers/city.png" },
  {
    name: "Badge",
    url: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300">
      <g transform="rotate(-6 260 150)">
        <rect x="30" y="50" width="460" height="200" rx="36" fill="#e8322b"/>
        <rect x="46" y="66" width="428" height="168" rx="24" fill="none" stroke="#ffd23f" stroke-width="6" stroke-dasharray="14 10"/>
        <text x="260" y="148" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="66" fill="#ffd23f">PIXEL</text>
        <text x="260" y="212" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="58" fill="#fff">PERFECT</text>
      </g>
      <path d="M470 20 l14 30 33 4 -24 23 6 33 -29 -16 -29 16 6 -33 -24 -23 33 -4z" fill="#ffd23f" stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"/>
    </svg>`),
  },
  {
    name: "Bolt",
    url: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420">
      <path d="M180 10 40 240h100l-40 170 170-250H160l60-150z" fill="#ffe14d" stroke="#141414" stroke-width="14" stroke-linejoin="round"/>
      <path d="M170 40 80 210" stroke="#fff6b8" stroke-width="12" stroke-linecap="round"/>
    </svg>`),
  },
  {
    name: "Smile",
    url: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <circle cx="200" cy="200" r="170" fill="#3b82f6" stroke="#0b1b3a" stroke-width="12"/>
      <ellipse cx="140" cy="160" rx="22" ry="34" fill="#0b1b3a"/>
      <ellipse cx="260" cy="160" rx="22" ry="34" fill="#0b1b3a"/>
      <path d="M105 235q95 105 190 0" fill="none" stroke="#0b1b3a" stroke-width="16" stroke-linecap="round"/>
      <path d="M185 290q15 45 40 6" fill="#ff6b8b" stroke="#0b1b3a" stroke-width="8"/>
    </svg>`),
  },
];

// ---------------------------------------------------------------------------
// Shader
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  uniform float uBendX;      // curvature across x (cylinder axis = y)
  uniform float uBendY;      // curvature across y (cylinder axis = x)
  uniform float uPeel;       // 0 flat .. 1 fully rolled
  uniform float uPeelAngle;  // direction from centre towards the lifted edge
  uniform float uPeelRadius;
  uniform vec2 uHalfSize;
  uniform float uFlutter;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vViewPos;

  // Wrap one axis around a cylinder of curvature k (edges lift towards the camera).
  void bend(inout float along, inout float z, float k) {
    if (abs(k) < 1e-4) return;
    float r = 1.0 / k;
    float th = along * k;
    along = sin(th) * r;
    z += (1.0 - cos(th)) * r;
  }

  void main() {
    vUv = uv;
    vec3 p = position;

    // Page-curl peel: everything past the fold line curls over a cylinder of radius R up to
    // LIFT, then runs on straight off the sticker at that angle — a flap pulled up by its edge,
    // leaning back over the rest (GetOn's sticker-peel curl).
    const float LIFT = 2.4;
    vec2 dir = vec2(cos(uPeelAngle), sin(uPeelAngle));
    float extent = abs(dir.x) * uHalfSize.x + abs(dir.y) * uHalfSize.y;
    float fold = extent - uPeel * extent * 2.0;
    float s = dot(p.xy, dir);
    float dist = s - fold;
    if (dist > 0.0) {
      float R = uPeelRadius;
      float a = dist / R;
      float ns;
      float lift;
      if (a < LIFT) {
        ns = fold + sin(a) * R;
        lift = (1.0 - cos(a)) * R;
      } else {
        float on = dist - LIFT * R;
        ns = fold + sin(LIFT) * R + cos(LIFT) * on;
        lift = (1.0 - cos(LIFT)) * R + sin(LIFT) * on;
      }
      p.xy += dir * (ns - s);
      p.z += lift;
    }

    bend(p.x, p.z, uBendX);
    bend(p.y, p.z, uBendY);

    float edge = length(position.xy / uHalfSize);
    p.z += sin(uTime * 3.1 + position.x * 2.3 + position.y * 1.7) * 0.025 * uFlutter * edge * edge;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uBackColor;
  uniform float uGloss;
  uniform float uHolo;

  varying vec2 vUv;
  varying vec3 vViewPos;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.02) discard;

    // Normal from screen-space derivatives of the deformed surface.
    vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    vec3 v = normalize(-vViewPos);
    if (dot(n, v) < 0.0) n = -n;

    vec3 base = gl_FrontFacing ? tex.rgb : uBackColor;
    vec3 L = normalize(vec3(-0.45, 0.65, 1.0));
    float diffuse = 0.62 + 0.38 * max(dot(n, L), 0.0);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    vec3 h = normalize(L + v);
    float spec = pow(max(dot(n, h), 0.0), mix(18.0, 90.0, uGloss)) * mix(0.06, 0.55, uGloss);

    vec3 color = base * diffuse + spec + rim * 0.08;

    if (gl_FrontFacing && uHolo > 0.0) {
      float phase = dot(n, v) * 2.5 + vUv.x * 1.6 + vUv.y * 0.9;
      vec3 rainbow = 0.55 + 0.45 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
      float sheen = pow(1.0 - abs(dot(n, v)), 1.5) * 0.6 + 0.25;
      color = mix(color, color * rainbow * 1.35 + spec, uHolo * sheen);
    }

    gl_FragColor = vec4(color, tex.a);
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------------------
// Simulation state (mutated only through module-level functions)
// ---------------------------------------------------------------------------

type Sim = {
  pointer: THREE.Vector2;
  dragging: boolean;
  user: THREE.Vector2; // drag rotation (x = pitch, y = yaw)
  userVel: THREE.Vector2;
  prevRot: THREE.Euler;
  bendX: number;
  bendY: number;
  peel: number;
  peelTarget: number;
  peelAngle: number;
  // Animation channels driven by GSAP presets.
  animX: number;
  animY: number;
  animZ: number;
  animRotX: number;
  animRotY: number;
  animRotZ: number;
  animPeel: number;
  animPeelAngle: number;
  kick: number;
  idleT: number; // the idle float's clock: paused while the sticker is grabbed or falling
  // Grab-to-peel and the fall (see stepPeel).
  phase: Phase;
  phaseT: number;
  press: "none" | "pending" | "held";
  released: boolean;
  autoPeel: boolean;
  grabStart: THREE.Vector2; // pointer on the sticker at grab, its own units
  grabPlane: THREE.Plane;
  frameInv: THREE.Matrix4; // world → the sticker's frame, frozen at grab
  restPos: THREE.Vector3;
  restQuat: THREE.Quaternion;
  side: 1 | -1; // which way it falls away: towards the lifted edge
  peelFrom: number; // the curl it let go with
  fall: {
    x: number; y: number; z: number; // px off its rest place, y up
    vx: number; vy: number; vz: number;
    rx: number; ry: number; rz: number;
    tip: number;
    bend: [number, number];
    flutter: number;
  };
};

type Phase = "rest" | "peeling" | "unpeel" | "auto" | "lift" | "fall" | "gone";

const createSim = (): Sim => ({
  pointer: new THREE.Vector2(),
  dragging: false,
  user: new THREE.Vector2(),
  userVel: new THREE.Vector2(),
  prevRot: new THREE.Euler(),
  bendX: 0,
  bendY: 0,
  peel: 0,
  peelTarget: 0,
  peelAngle: -0.6,
  animX: 0,
  animY: 0,
  animZ: 0,
  animRotX: 0,
  animRotY: 0,
  animRotZ: 0,
  animPeel: 0,
  animPeelAngle: -0.6,
  kick: 0,
  idleT: 0,
  phase: "rest",
  phaseT: 0,
  press: "none",
  released: false,
  autoPeel: false,
  grabStart: new THREE.Vector2(),
  grabPlane: new THREE.Plane(),
  frameInv: new THREE.Matrix4(),
  restPos: new THREE.Vector3(),
  restQuat: new THREE.Quaternion(),
  side: 1,
  peelFrom: 0,
  fall: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, tip: 0, bend: [0, 0], flutter: 0 },
});

// ---------------------------------------------------------------------------
// Peel and fall — the mechanism from GetOn's sticker-peel.ts, driven by a grab instead of
// scroll. Grab near an edge and pull: the fold follows the pull, from any direction. Let go
// past PEEL_OFF and it lifts off by that edge, then falls like paper: a pop off the surface,
// gravity against air drag, a side-to-side sway with a rocking tilt, a slow tumble that shows
// its back, its edges bending in the air and the curl relaxing. Off screen, it slaps back on.
//
//   grab (edge zone)      fold tracks the pull; peel ≤ PEEL_MAX
//   release < PEEL_OFF    unpeels back flat
//   release ≥ PEEL_OFF    LIFT_MS: rises LIFT_Z px, tipping LIFT_TIP rad by the lifted edge
//   then                  falls (px, s) until it is below the bottom edge, then slaps back
// ---------------------------------------------------------------------------

/** Grabs closer to the centre than this (fraction of the extent) spin instead of peel */
const GRAB_EDGE = 0.4;
const PEEL_MAX = 0.72;
const PEEL_OFF = 0.16;
const PEEL_MS = 950; // the Peel preset's curl, corner to just past the middle
const PEEL_PEAK = 0.56;
const LIFT_MS = 300;
const LIFT_Z = 70;
const LIFT_TIP = 0.32;
const PEEL_LEFT = 0.14; // the curl it keeps as it falls
const SPRING_BACK = 2.2; // per s
const POP = { x: 60, y: 300, z: 300 };
const GRAVITY = 2300;
const DRAG = 1.5; // per s
const AWAY_DRAG = 3.4;
const SWAY = { accel: 420, rate: 4.6 };
const ROCK = { amp: 0.5, rate: 4.6 };
const TUMBLE = 2.2; // rad/s about its height
const SPIN = 0.8; // rad/s in its plane
const GONE_MS = 450; // off screen this long before it slaps back

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();
const axisZ = new THREE.Vector3(0, 0, 1);
const axisY = new THREE.Vector3(0, 1, 0);
const axisX = new THREE.Vector3(1, 0, 0);
const tipAxis = new THREE.Vector3();
const local = new THREE.Vector2();

/** Holds the sticker where it is, so the grab and the fall work in a still frame */
function freeze(sim: Sim, mesh: THREE.Mesh) {
  mesh.updateMatrixWorld(true);
  sim.restPos.copy(mesh.position);
  sim.restQuat.copy(mesh.quaternion);
  sim.frameInv.copy(mesh.matrixWorld).invert();
  normal.set(0, 0, 1).applyQuaternion(mesh.quaternion);
  sim.grabPlane.setFromNormalAndCoplanarPoint(normal, mesh.position);
  const f = sim.fall;
  f.x = f.y = f.z = f.vx = f.vy = f.vz = f.rx = f.ry = f.rz = f.tip = f.flutter = 0;
  f.bend = [0, 0];
}

function go(sim: Sim, phase: Phase) {
  sim.phase = phase;
  sim.phaseT = 0;
}

/** The pointer on the frozen sticker, in its own units; false if it misses the plane */
function pointerLocal(sim: Sim, camera: THREE.Camera) {
  raycaster.setFromCamera(sim.pointer, camera);
  if (!raycaster.ray.intersectPlane(sim.grabPlane, hit)) return false;
  hit.applyMatrix4(sim.frameInv);
  local.set(hit.x, hit.y);
  return true;
}

/**
 * Runs the grab, peel, lift and fall. Returns true while it owns the sticker (anything but
 * rest), in which case the idle float and hover peel are skipped this frame.
 * `pxToWorld` converts the fall's px into world units at the sticker's depth.
 */
function stepPeel(
  sim: Sim,
  mesh: THREE.Mesh,
  material: THREE.ShaderMaterial,
  camera: THREE.Camera,
  time: number,
  dt: number,
  halfSize: THREE.Vector2,
  pxToWorld: number,
  viewHeight: number,
) {
  dt = Math.min(dt, 0.05); // a long frame (tab switch, hitch) must not fling it off in one step
  const f = Math.min(dt * 60, 3);

  // A fresh press: near the edge it grabs to peel, anywhere else it spins.
  if (sim.press === "pending") {
    sim.press = "held";
    let grabbed = false;
    if (sim.phase === "rest") {
      raycaster.setFromCamera(sim.pointer, camera);
      normal.set(0, 0, 1).applyQuaternion(mesh.quaternion);
      plane.setFromNormalAndCoplanarPoint(normal, mesh.position);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        mesh.worldToLocal(hit);
        const angle = Math.atan2(hit.y, hit.x);
        const extent =
          Math.abs(Math.cos(angle)) * halfSize.x + Math.abs(Math.sin(angle)) * halfSize.y;
        const r = Math.hypot(hit.x, hit.y) / extent;
        if (r > GRAB_EDGE && r < 1.08) {
          freeze(sim, mesh);
          sim.grabStart.set(hit.x, hit.y);
          sim.peelAngle = angle;
          go(sim, "peeling");
          grabbed = true;
        }
      }
    }
    if (!grabbed && sim.phase === "rest") sim.dragging = true;
  }
  if (sim.autoPeel) {
    sim.autoPeel = false;
    if (sim.phase === "rest") {
      freeze(sim, mesh);
      sim.side = 1;
      sim.peelAngle = Math.atan2(halfSize.y, halfSize.x);
      sim.peelFrom = sim.peel;
      go(sim, "auto");
    }
  }
  if (sim.phase === "rest") {
    sim.released = false;
    return false;
  }

  sim.phaseT += dt;
  const t = sim.phaseT;
  const fall = sim.fall;

  switch (sim.phase) {
    case "peeling": {
      if (pointerLocal(sim, camera)) {
        const dx = local.x - sim.grabStart.x;
        const dy = local.y - sim.grabStart.y;
        // Pulled far enough, the fold turns to face the pull: peel from any direction.
        if (Math.hypot(dx, dy) > 0.12) {
          const want = Math.atan2(-dy, -dx);
          sim.peelAngle +=
            Math.atan2(Math.sin(want - sim.peelAngle), Math.cos(want - sim.peelAngle)) *
            Math.min(1, 0.12 * f);
        }
        const c = Math.cos(sim.peelAngle);
        const sn = Math.sin(sim.peelAngle);
        const extent = Math.abs(c) * halfSize.x + Math.abs(sn) * halfSize.y;
        const pull = Math.max(0, -(dx * c + dy * sn));
        const goal = THREE.MathUtils.clamp(0.06 + pull / (2 * extent), 0, PEEL_MAX);
        sim.peel += (goal - sim.peel) * Math.min(1, 0.35 * f);
      }
      fall.flutter = 0.3 + sim.peel * 0.6;
      if (sim.released) {
        sim.released = false;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (sim.peel >= PEEL_OFF && !reduce) {
          sim.side = Math.cos(sim.peelAngle) >= 0 ? 1 : -1;
          sim.peelFrom = sim.peel;
          go(sim, "lift");
        } else go(sim, "unpeel");
      }
      break;
    }
    case "unpeel": {
      sim.peel = Math.max(0, sim.peel - dt * 1.4);
      fall.flutter = Math.max(0, fall.flutter - dt * 3);
      if (sim.peel === 0) go(sim, "rest");
      break;
    }
    case "auto": {
      const k = Math.min(1, t / (PEEL_MS / 1000));
      sim.peel = Math.max(sim.peelFrom, PEEL_PEAK * easeInOut(k));
      fall.flutter = 0.6 * k;
      if (k >= 1) {
        sim.peelFrom = sim.peel;
        go(sim, "lift");
      }
      break;
    }
    case "lift": {
      const k = Math.min(1, t / (LIFT_MS / 1000));
      const e = 1 - Math.pow(1 - k, 3); // quick, slowing as it clears the surface
      fall.z = LIFT_Z * e;
      fall.tip = LIFT_TIP * e;
      fall.flutter = 0.6 + 0.3 * k;
      if (k >= 1) {
        go(sim, "fall");
        fall.vx = sim.side * POP.x;
        fall.vy = POP.y;
        fall.vz = POP.z;
      }
      break;
    }
    case "fall": {
      const on = Math.min(1, t * 2.2); // the air takes hold over the first half second
      sim.peel = PEEL_LEFT + (sim.peelFrom - PEEL_LEFT) * Math.exp(-t * SPRING_BACK);
      fall.vx += sim.side * SWAY.accel * Math.cos(t * SWAY.rate) * on * dt;
      fall.vy -= GRAVITY * dt;
      fall.vx *= Math.exp(-DRAG * dt);
      fall.vy *= Math.exp(-DRAG * dt);
      fall.vz *= Math.exp(-AWAY_DRAG * dt);
      fall.x += fall.vx * dt;
      fall.y += fall.vy * dt;
      fall.z += fall.vz * dt;
      fall.rx = ROCK.amp * Math.sin(t * ROCK.rate) * on;
      fall.ry += sim.side * TUMBLE * on * dt;
      fall.rz += sim.side * SPIN * dt;
      fall.tip *= Math.exp(-2 * dt);
      fall.bend = [(0.32 + 0.16 * Math.sin(t * 7.3)) * on, 0.14 * Math.sin(t * 5.1 + 1) * on];
      fall.flutter = 0.6 + 0.6 * on;
      const size = Math.hypot(halfSize.x, halfSize.y) * 2;
      if (sim.restPos.y + fall.y * pxToWorld < -viewHeight / 2 - size) go(sim, "gone");
      break;
    }
    case "gone": {
      mesh.visible = false;
      if (t >= GONE_MS / 1000) {
        mesh.visible = true;
        sim.peel = 0;
        go(sim, "rest");
        playPreset(sim, "slap");
        return false;
      }
      break;
    }
  }

  // Pose: its frozen place, then the fall's offset, turns and the tip about the lifted edge.
  mesh.position
    .copy(sim.restPos)
    .add(hit.set(fall.x * pxToWorld, fall.y * pxToWorld, fall.z * pxToWorld));
  tipAxis.set(-Math.sin(sim.peelAngle), Math.cos(sim.peelAngle), 0);
  mesh.quaternion
    .copy(sim.restQuat)
    .multiply(qa.setFromAxisAngle(axisZ, fall.rz))
    .multiply(qb.setFromAxisAngle(axisY, fall.ry))
    .multiply(qa.setFromAxisAngle(axisX, fall.rx))
    .multiply(qb.setFromAxisAngle(tipAxis, -fall.tip));
  sim.prevRot.copy(mesh.rotation);

  const u = material.uniforms;
  u.uPeel.value = sim.peel;
  u.uPeelAngle.value = sim.peelAngle;
  u.uBendX.value = fall.bend[0] / halfSize.x;
  u.uBendY.value = fall.bend[1] / halfSize.y;
  u.uFlutter.value = fall.flutter * Math.min(halfSize.x, halfSize.y) * 1.6;
  u.uTime.value = time;
  sim.bendX = u.uBendX.value;
  sim.bendY = u.uBendY.value;
  return (sim.phase as Phase) !== "rest";
}

const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane();
const hit = new THREE.Vector3();
const normal = new THREE.Vector3();

function stepSim(
  sim: Sim,
  mesh: THREE.Mesh,
  material: THREE.ShaderMaterial,
  camera: THREE.Camera,
  time: number,
  dt: number,
  curl: number,
  halfSize: THREE.Vector2,
  pxToWorld: number,
  viewHeight: number,
) {
  if (stepPeel(sim, mesh, material, camera, time, dt, halfSize, pxToWorld, viewHeight)) return;
  const f = Math.min(dt * 60, 3);
  sim.idleT += dt;
  const idle = sim.idleT;

  // Drag rotation springs home when released.
  if (!sim.dragging) {
    sim.userVel.x += -sim.user.x * 0.045 * f;
    sim.userVel.y += -sim.user.y * 0.045 * f;
    sim.userVel.multiplyScalar(Math.pow(0.86, f));
    sim.user.addScaledVector(sim.userVel, f);
  }

  const idleY = Math.sin(idle * 0.6) * 0.16;
  const idleX = Math.sin(idle * 0.43) * 0.07;
  mesh.rotation.set(
    sim.user.x + idleX + sim.animRotX,
    sim.user.y + idleY + sim.animRotY,
    sim.animRotZ + Math.sin(idle * 0.31) * 0.02,
  );
  mesh.position.set(
    sim.animX,
    sim.animY + Math.sin(idle * 0.9) * 0.04,
    sim.animZ,
  );

  // Air drag: angular velocity curls the edges opposite to the spin.
  const wy = (mesh.rotation.y - sim.prevRot.y) / Math.max(dt, 1 / 240);
  const wx = (mesh.rotation.x - sim.prevRot.x) / Math.max(dt, 1 / 240);
  sim.prevRot.copy(mesh.rotation);
  const targetX =
    THREE.MathUtils.clamp(Math.abs(wy) * 0.09, 0, 1.3) + curl + sim.kick;
  const targetY = THREE.MathUtils.clamp(Math.abs(wx) * 0.09, 0, 1.3);
  sim.bendX += (targetX - sim.bendX) * Math.min(1, 0.12 * f);
  sim.bendY += (targetY - sim.bendY) * Math.min(1, 0.12 * f);
  sim.kick *= Math.pow(0.9, f);

  sim.peelTarget = 0; // no hover reaction: it only peels when grabbed
  const peelGoal = Math.max(sim.peelTarget, sim.animPeel);
  sim.peel += (peelGoal - sim.peel) * Math.min(1, 0.1 * f);

  const u = material.uniforms;
  u.uBendX.value = sim.bendX;
  u.uBendY.value = sim.bendY;
  u.uPeel.value = sim.peel;
  u.uPeelAngle.value =
    sim.animPeel > sim.peelTarget ? sim.animPeelAngle : sim.peelAngle;
  u.uTime.value = time;
  u.uFlutter.value = 0.35 + Math.min(1.5, Math.abs(wy) * 0.2);
}

function dragSim(sim: Sim, dx: number, dy: number) {
  sim.user.y += dx * 0.009;
  sim.user.x += dy * 0.009;
  sim.userVel.set(dy * 0.009, dx * 0.009);
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

type Preset = "slap" | "toss" | "flip" | "peel";

function playPreset(sim: Sim, preset: Preset) {
  gsap.killTweensOf(sim);
  const reset = {
    animX: 0,
    animY: 0,
    animZ: 0,
    animRotX: 0,
    animRotZ: 0,
    animPeel: 0,
  };
  if (preset === "slap") {
    gsap
      .timeline()
      .set(sim, {
        ...reset,
        animZ: 3,
        animRotX: -0.7,
        animRotZ: 0.5,
        animRotY: sim.animRotY % (Math.PI * 2),
      })
      .to(sim, { animZ: 0, animRotX: 0, duration: 0.42, ease: "power3.in" })
      .call(() => void (sim.kick = 0.9))
      .to(
        sim,
        { animRotZ: -0.06, duration: 1.1, ease: "elastic.out(1, 0.45)" },
        "<",
      );
  } else if (preset === "toss") {
    gsap
      .timeline()
      .set(sim, {
        ...reset,
        animY: -3.4,
        animX: -0.6,
        animRotY: -Math.PI * 3,
        animRotX: 1.1,
        animRotZ: 0.9,
      })
      .to(sim, {
        animY: 0,
        animX: 0,
        animRotY: 0,
        animRotX: 0,
        animRotZ: 0,
        duration: 1.6,
        ease: "expo.out",
      });
  } else if (preset === "flip") {
    gsap.to(sim, {
      animRotY: `+=${Math.PI * 2}`,
      duration: 1.15,
      ease: "power3.inOut",
    });
  } else {
    // Peels off by its top-right corner and falls, then slaps back (stepPeel).
    sim.autoPeel = true;
  }
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

type Finish = "matte" | "gloss" | "holo";

function StickerMesh({
  texture,
  aspect,
  finish,
  curl,
  simRef,
  halfSizeRef,
}: {
  texture: THREE.Texture;
  aspect: number;
  finish: Finish;
  curl: number;
  simRef: RefObject<Sim>;
  halfSizeRef: RefObject<THREE.Vector2>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const camera = useThree((s) => s.camera);

  const maxSide = 2.3;
  const width = aspect >= 1 ? maxSide : maxSide * aspect;
  const height = width / aspect;
  const segX = 160;
  const segY = Math.max(16, Math.round(160 / aspect));

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uBackColor: { value: new THREE.Color("#f1f0ec") },
      uGloss: { value: 0 },
      uHolo: { value: 0 },
      uBendX: { value: 0 },
      uBendY: { value: 0 },
      uPeel: { value: 0 },
      uPeelAngle: { value: 0 },
      uPeelRadius: { value: 0.16 },
      uHalfSize: { value: new THREE.Vector2(width / 2, height / 2) },
      uFlutter: { value: 0.35 },
      uTime: { value: 0 },
    }),
    [texture, width, height],
  );

  useEffect(() => {
    halfSizeRef.current.set(width / 2, height / 2);
  }, [halfSizeRef, width, height]);

  useEffect(() => {
    const m = materialRef.current;
    if (!m) return;
    m.uniforms.uGloss.value = finish === "matte" ? 0.05 : 0.85;
    m.uniforms.uHolo.value = finish === "holo" ? 1 : 0;
  }, [finish, uniforms]);

  useFrame((state, delta) => {
    // World units per CSS px at the sticker's depth, for the fall's px constants.
    const cam = state.camera as THREE.PerspectiveCamera;
    const viewHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.position.z;
    const pxToWorld = viewHeight / state.size.height;
    if (meshRef.current && materialRef.current)
      stepSim(
        simRef.current,
        meshRef.current,
        materialRef.current,
        camera,
        state.clock.elapsedTime,
        delta,
        curl,
        halfSizeRef.current,
        pxToWorld,
        viewHeight,
      );
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height, segX, segY]} />
      <shaderMaterial
        ref={materialRef}
        key={texture.uuid}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

type Source =
  | { kind: "url"; url: string; name: string }
  | { kind: "file"; file: File; name: string };

const isImageFile = (f: File) =>
  f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".svg");

/** Fetches a remote image into a File so the canvas isn't tainted. Fails if the host blocks CORS. */
async function fileFromUrl(url: string): Promise<File> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const name = decodeURIComponent(
    new URL(url, location.href).pathname.split("/").pop() || "image",
  );
  return new File([blob], name, {
    type: blob.type || (name.endsWith(".svg") ? "image/svg+xml" : "image/png"),
  });
}

/**
 * Pulls an image out of a drop or paste, in order of reliability:
 * image files → raw `<svg>` markup → an `<img>` inside dragged/copied HTML → an image URL.
 */
async function imageFromTransfer(dt: DataTransfer): Promise<File | null> {
  const file = [...dt.files].find(isImageFile);
  if (file) return file;
  const text = dt.getData("text/plain").trim();
  const html = dt.getData("text/html");
  const svgMarkup = text.startsWith("<svg")
    ? text
    : html.match(/<svg[\s\S]*<\/svg>/i)?.[0];
  if (svgMarkup)
    return new File([svgMarkup], "pasted.svg", { type: "image/svg+xml" });
  const htmlSrc = html
    ? new DOMParser()
        .parseFromString(html, "text/html")
        .querySelector("img")
        ?.getAttribute("src")
    : null;
  const url =
    htmlSrc ||
    dt
      .getData("text/uri-list")
      .split("\n")
      .find((l) => l && !l.startsWith("#")) ||
    (/^(https?:|data:image\/)/.test(text) ? text : "");
  if (!url) return null;
  return fileFromUrl(url);
}

const segmented = "flex rounded-lg bg-white/5 p-0.5 text-xs";
const segBtn = (active: boolean) =>
  `flex-1 rounded-md px-2 py-1.5 capitalize transition-colors ${active ? "bg-white text-black" : "text-white/70 hover:text-white"}`;

export default function StickerMaker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Sim>(createSim());
  const halfSizeRef = useRef(new THREE.Vector2(1, 1));
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const resultRef = useRef<HTMLCanvasElement | null>(null);

  const [source, setSource] = useState<Source>({
    kind: "url",
    url: SAMPLES[0].url,
    name: SAMPLES[0].name,
  });
  const [border, setBorder] = useState(26);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [removeBackground, setRemoveBackground] =
    useState<StickerOptions["removeBackground"]>("auto");
  const [finish, setFinish] = useState<Finish>("matte");
  const [curl, setCurl] = useState(0);
  const [backdrop, setBackdrop] = useState<"dark" | "light">("dark");
  const [sticker, setSticker] = useState<{
    texture: THREE.CanvasTexture;
    shadow: THREE.CanvasTexture;
    aspect: number;
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "error">("working");
  const [dragOver, setDragOver] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [mode, setMode] = useState<"pole" | "studio">("pole");
  const [skin, setSkin] = useState<PoleSkin>("steel");
  const [size, setSize] = useState(0.85);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const placedRef = useRef<Placed[]>([]);
  const spinRef = useRef<PoleSpin>({ yaw: 0, vel: 0, dragging: false });
  const nextId = useRef(1);

  const updatePlaced = (next: Placed[]) => {
    placedRef.current = next;
    setPlaced(next);
  };
  const place = (angle: number, y: number) => {
    if (!sticker) return;
    updatePlaced([
      ...placedRef.current,
      {
        id: nextId.current++,
        texture: sticker.texture,
        shadow: sticker.shadow,
        aspect: sticker.aspect,
        angle,
        y,
        tilt: (Math.random() - 0.5) * 0.5,
        size,
        // Smooth it on left→right or right→left, slightly off-axis, like a real hand.
        applyAngle:
          (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.6,
      },
    ]);
  };
  /** Frees textures no longer used by the current sticker or anything on the pole. */
  const release = (removed: Placed[], keep: Placed[]) => {
    for (const r of removed) {
      if (
        r.texture !== sticker?.texture &&
        !keep.some((p) => p.texture === r.texture)
      ) {
        r.texture.dispose();
        r.shadow.dispose();
      }
    }
  };

  // Build the sticker whenever the source or cut options change (debounced for sliders).
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(async () => {
      setStatus("working");
      try {
        const img = await loadImage(
          source.kind === "url" ? source.url : source.file,
        );
        if (cancelled) return;
        const result = makeSticker(img, {
          border,
          borderColor,
          removeBackground,
        });
        if (cancelled) return;
        const texture = new THREE.CanvasTexture(result.canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        const shadow = new THREE.CanvasTexture(result.shadow);
        resultRef.current = result.canvas;
        setSticker((prev) => {
          if (
            prev &&
            !placedRef.current.some((p) => p.texture === prev.texture)
          ) {
            prev.texture.dispose();
            prev.shadow.dispose();
          }
          return { texture, shadow, aspect: result.width / result.height };
        });
        setStatus("idle");
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus("error");
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [source, border, borderColor, removeBackground]);

  // Drop or paste anywhere on the page (files, images dragged from other tabs, URLs, SVG markup).
  useEffect(() => {
    const take = async (dt: DataTransfer | null) => {
      if (!dt) return;
      try {
        const file = await imageFromTransfer(dt);
        if (!file) return;
        setTransferError(null);
        setSource({ kind: "file", file, name: file.name || "pasted image" });
        playPreset(simRef.current, "slap");
      } catch {
        setTransferError(
          "That site blocks copying its image. Save it, then drop the file.",
        );
      }
    };
    let depth = 0;
    const hasPayload = (e: DragEvent) =>
      !!e.dataTransfer &&
      [...e.dataTransfer.types].some(
        (t) => t === "Files" || t.startsWith("text/"),
      );
    const onDragEnter = (e: DragEvent) => {
      if (!hasPayload(e)) return;
      e.preventDefault();
      depth++;
      setDragOver(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!hasPayload(e)) return;
      e.preventDefault(); // otherwise the browser opens the file instead of dropping it
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDragLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setDragOver(false);
      void take(e.dataTransfer);
    };
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      void take(e.clipboardData);
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, []);

  const pickFile = (file: File | undefined) => {
    if (!file || !isImageFile(file)) return;
    setTransferError(null);
    setSource({ kind: "file", file, name: file.name });
    playPreset(simRef.current, "slap");
  };

  const download = () => {
    const canvas = resultRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${source.name.replace(/\.[a-z0-9]+$/i, "") || "sticker"}-sticker.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  };

  const ndc = (e: React.PointerEvent) => {
    const r = containerRef.current!.getBoundingClientRect();
    simRef.current.pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden select-none ${
        backdrop === "dark"
          ? "bg-[#0b0b0c] bg-[radial-gradient(ellipse_at_40%_45%,#24262b_0%,#0b0b0c_65%)]"
          : "bg-[#e9e7e2] bg-[radial-gradient(ellipse_at_40%_45%,#ffffff_0%,#d9d6cf_70%)]"
      }`}
    >
      {mode === "pole" && (
        <div
          className="absolute inset-0 cursor-crosshair touch-none"
          onPointerDown={(e) => {
            dragRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            const d = dragRef.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 2) spinRef.current.dragging = true;
            if (spinRef.current.dragging) {
              spinRef.current.yaw += dx * 0.008;
              spinRef.current.vel = dx * 0.008;
            }
            dragRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => {
            dragRef.current = null;
            spinRef.current.dragging = false;
          }}
          onPointerLeave={() => {
            dragRef.current = null;
            spinRef.current.dragging = false;
          }}
        >
          <PoleScene
            skin={skin}
            placed={placed}
            current={sticker}
            size={size}
            spinRef={spinRef}
            onPlace={place}
          />
        </div>
      )}
      {mode === "studio" && (
        <div
          className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            ndc(e);
            dragRef.current = { x: e.clientX, y: e.clientY };
            // Resolved next frame against the sticker: an edge grab peels, the middle spins.
            simRef.current.press = "pending";
          }}
          onPointerMove={(e) => {
            ndc(e);
            const d = dragRef.current;
            if (!d) return;
            if (simRef.current.dragging)
              dragSim(simRef.current, e.clientX - d.x, e.clientY - d.y);
            dragRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => {
            dragRef.current = null;
            const sim = simRef.current;
            sim.dragging = false;
            if (sim.press !== "none") sim.released = true;
            sim.press = "none";
          }}
        >
          <Canvas
            flat
            dpr={[1, 2]}
            camera={{ position: [0, 0, 5.2], fov: 32 }}
            gl={{ antialias: true, alpha: true }}
          >
            {sticker && (
              <StickerMesh
                texture={sticker.texture}
                aspect={sticker.aspect}
                finish={finish}
                curl={curl}
                simRef={simRef}
                halfSizeRef={halfSizeRef}
              />
            )}
          </Canvas>
        </div>
      )}

      {dragOver && (
        <div className="pointer-events-none fixed inset-4 z-50 grid place-items-center rounded-3xl border-2 border-dashed border-white/50 bg-black/50 text-lg text-white backdrop-blur-sm">
          Drop to make a sticker
        </div>
      )}

      {/* Controls */}
      <aside className="absolute top-4 right-4 bottom-4 flex w-72 flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-white backdrop-blur-xl">
        <div>
          <h2 className="font-medium">Sticker maker</h2>
          <p className="mt-1 text-xs text-white/50">
            Drop, paste (<kbd className="rounded bg-white/10 px-1">⌘V</kbd>) or
            upload a PNG, JPG, WebP or SVG.
          </p>
        </div>
        <div className={segmented}>
          {(["pole", "studio"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={segBtn(mode === v)}
              onClick={() => setMode(v)}
            >
              {v === "pole" ? "Street pole" : "Studio"}
            </button>
          ))}
        </div>
        {transferError && (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200">
            {transferError}
          </p>
        )}

        <label className="flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-white/20 px-3 py-4 text-xs text-white/80 hover:border-white/40">
          <input
            type="file"
            accept="image/*,.svg"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <span>
            {status === "working"
              ? "Cutting…"
              : status === "error"
                ? "Couldn't read that image"
                : "Upload image"}
          </span>
          <span className="max-w-full truncate text-white/40">
            {source.name}
          </span>
        </label>

        <div className="flex gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => {
                setSource({ kind: "url", url: s.url, name: s.name });
                playPreset(simRef.current, "slap");
              }}
              className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/60">
            <span>Border</span>
            <span>{border}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={70}
            value={border}
            onChange={(e) => setBorder(Number(e.target.value))}
            className="w-full accent-white"
          />
          <div className="flex items-center gap-2">
            {["#ffffff", "#111111", "#ffd23f"].map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Border ${c}`}
                onClick={() => setBorderColor(c)}
                className={`size-6 rounded-full border ${borderColor === c ? "border-white ring-2 ring-white/60" : "border-white/30"}`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              className="size-6 cursor-pointer rounded-full bg-transparent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-white/60">Background</span>
          <div className={segmented}>
            {(["auto", "on", "off"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={segBtn(removeBackground === v)}
                onClick={() => setRemoveBackground(v)}
              >
                {v === "auto" ? "Auto" : v === "on" ? "Remove" : "Keep"}
              </button>
            ))}
          </div>
        </div>

        {mode === "pole" && (
          <>
            <div className="space-y-1.5">
              <span className="text-xs text-white/60">Pole</span>
              <div className={segmented}>
                {(["steel", "painted", "concrete"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={segBtn(skin === v)}
                    onClick={() => setSkin(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>Size</span>
                <span>{Math.round((size / 0.85) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={1.8}
                step={0.01}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                className="rounded-lg bg-white/5 py-1.5 text-xs text-white/80 hover:bg-white/10"
                onClick={() =>
                  place(-spinRef.current.yaw, -1.4 + Math.random() * 1.5)
                }
              >
                Stick it
              </button>
              <button
                type="button"
                className="rounded-lg bg-white/5 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
                disabled={!placed.length}
                onClick={() => {
                  const keep = placedRef.current.slice(0, -1);
                  release(placedRef.current.slice(-1), keep);
                  updatePlaced(keep);
                }}
              >
                Undo
              </button>
              <button
                type="button"
                className="rounded-lg bg-white/5 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
                disabled={!placed.length}
                onClick={() => {
                  release(placedRef.current, []);
                  updatePlaced([]);
                }}
              >
                Clear
              </button>
            </div>
            <p className="text-[11px] text-white/40">
              Click the pole to stick it on. Drag sideways to spin the pole.
            </p>
          </>
        )}

        {mode === "studio" && (
          <>
            <div className="space-y-1.5">
              <span className="text-xs text-white/60">Finish</span>
              <div className={segmented}>
                {(["matte", "gloss", "holo"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={segBtn(finish === v)}
                    onClick={() => setFinish(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>Curl</span>
                <span>{curl.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-0.8}
                max={0.8}
                step={0.01}
                value={curl}
                onChange={(e) => setCurl(Number(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-white/60">Animate</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["slap", "toss", "flip", "peel"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      playPreset(simRef.current, p)
                    }
                    className="rounded-lg bg-white/5 py-1.5 text-xs capitalize text-white/80 hover:bg-white/10"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/40">
                Grab an edge and pull to peel. Let go to send it flying. Drag the middle to spin.
              </p>
            </div>
          </>
        )}

        <div className="mt-auto flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg bg-white/5 py-2 text-xs hover:bg-white/10"
            onClick={() =>
              setBackdrop((b) => (b === "dark" ? "light" : "dark"))
            }
          >
            {backdrop === "dark" ? "Light backdrop" : "Dark backdrop"}
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-white py-2 text-xs font-medium text-black hover:bg-white/90"
            onClick={download}
          >
            Download PNG
          </button>
        </div>
      </aside>
    </div>
  );
}
