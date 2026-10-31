"use client";

/**
 * A Porsche 911 GT3 R on an endless winding road over rolling hills at golden hour, through
 * towns and countryside.
 *
 *  W / ↑      throttle            S / ↓   brake, then reverse
 *  A D / ← →  steer               Space   handbrake
 *  R          back on the road    drag    look around (springs back)
 *
 * Physics is Rapier (WASM). The chassis is a 1300 kg rigid body with a low, slightly
 * rear-biased centre of mass and real inertia, carried by Rapier's raycast vehicle
 * controller: four spring-damper suspensions and tyre friction, so the body squats,
 * dives, rolls and bounces on its own. On top: an engine torque curve, a six-speed
 * automatic gearbox, aero drag and downforce, front-biased brakes and a handbrake that
 * locks the rears and cuts their side grip.
 *
 * The world (terrain, road, buildings, shops, trees) streams in around the car; see
 * world.ts. Speed reads through a post pass (radial blur, chromatic split, speed lines,
 * vignette; see speed-fx.ts), a wider field of view, and a camera that shakes with speed,
 * rough ground and hard landings, and leans into corners.
 *
 * Smoothness: physics runs at a fixed 120 Hz and rendering interpolates between the last
 * two steps; the floating origin moves with the car every few hundred metres so positions
 * stay small and f32 physics never jitters. No shadow maps: they cost too much here.
 *
 * The GLB is pre-optimized by scripts/optimize-car.mjs: the four wheels are separate
 * nodes pivoted at the hub, so they follow the suspension, spin and steer.
 */

import RAPIER from "@dimforge/rapier3d-compat";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { Hud, type HudHandle } from "./hud";
import { SpeedShader } from "./speed-fx";
import { ROAD, createWorld } from "./world";

const CAR_URL = "/playground/car/porsche-gt3r.glb";

// SI units, in the model's frame: +Z forward, +Y up, metres.
const CAR = {
  mass: 1300,
  // Centre of mass, relative to the model origin.
  com: { x: 0, y: 0.43, z: -0.106 },
  inertia: { x: 2150, y: 2500, z: 550 }, // pitch, yaw, roll
  wheelRadius: 0.353,
  // Hub positions (from the GLB), front-left, front-right, rear-left, rear-right.
  hubs: [
    [0.821, 1.314],
    [-0.821, 1.314],
    [0.809, -1.202],
    [-0.809, -1.202],
  ] as [number, number][],
  suspension: { rest: 0.25, travel: 0.12, stiffness: 60, compression: 4.5, relaxation: 5.5, maxForce: 100000 },
  frictionSlip: 2.1,
  downforce: 2.4, // ½ρ·ClA
  drag: 0.52, // ½ρ·CdA
  brakeForce: 36000, // Rapier brake units at full pedal, all four wheels (≈1.4 g)
  brakeFront: 0.64,
  maxSteer: 0.5,
  steerRate: 2.6,
  idle: 1100,
  redline: 9000,
  gears: [3.15, 2.27, 1.79, 1.45, 1.21, 1.03],
  finalDrive: 3.6,
  efficiency: 0.9,
  shiftUp: 8600,
  shiftDown: 4300,
  shiftTime: 0.09,
};
// Suspension tops sit above the hubs by the rest length minus the static sag.
const STATIC_SAG = 9.81 / (4 * CAR.suspension.stiffness);
const CONNECT_Y = CAR.wheelRadius + CAR.suspension.rest - STATIC_SAG;
const STEP = 1 / 120;
// The floating origin follows the car once it is this far out, in steps of the terrain cell.
const REBASE = { reach: 400, step: 8 };
const CAMERA = { distance: 5.6, height: 1.75, fov: 55, fovBoost: 24 };

// Torque (N·m) against rpm, linear in between.
const TORQUE: [number, number][] = [
  [0, 260],
  [1000, 300],
  [3000, 400],
  [6000, 470],
  [8000, 450],
  [9000, 400],
  [9400, 0],
];
const torqueAt = (rpm: number) => {
  for (let i = 1; i < TORQUE.length; i++) {
    if (rpm <= TORQUE[i][0]) {
      const [r0, t0] = TORQUE[i - 1];
      const [r1, t1] = TORQUE[i];
      return t0 + ((t1 - t0) * (rpm - r0)) / (r1 - r0);
    }
  }
  return 0;
};

const random = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const canvasTexture = (size: number, draw: (c: CanvasRenderingContext2D, size: number) => void, anisotropy: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

// One 12 m stretch of two-lane road: asphalt grain, edge lines, a 3 m centre dash.
const drawRoad = (c: CanvasRenderingContext2D, size: number) => {
  const px = size / ROAD.width;
  c.fillStyle = "#38383a";
  c.fillRect(0, 0, size, size);
  const rand = random(5);
  for (let i = 0; i < 26000; i++) {
    const v = rand() < 0.5 ? 255 : 0;
    c.fillStyle = `rgba(${v},${v},${v},${0.025 + rand() * 0.05})`;
    c.fillRect(rand() * size, rand() * size, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  // Darker wear where the tyres run, two per lane.
  for (const lane of [-1, 1]) {
    for (const track of [-0.85, 0.85]) {
      const x = size / 2 + lane * 1.85 * px + track * px;
      const g = c.createLinearGradient(x - 0.5 * px, 0, x + 0.5 * px, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.5, "rgba(0,0,0,0.16)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(x - 0.5 * px, 0, px, size);
    }
  }
  c.fillStyle = "#e9e7e1";
  for (const side of [-1, 1]) c.fillRect(size / 2 + side * 5.6 * px - 0.08 * px, 0, 0.16 * px, size);
  c.fillStyle = "#f1f0ea";
  // Tile is 12 m long but the canvas is square: scale the dash along the length.
  const along = size / ROAD.tile;
  c.fillRect(size / 2 - 0.07 * px, 0, 0.14 * px, 3 * along);
  // Gravel shoulders past the edge lines.
  c.fillStyle = "rgba(120,104,84,0.55)";
  c.fillRect(0, 0, 0.4 * px, size);
  c.fillRect(size - 0.4 * px, 0, 0.4 * px, size);
};

type Pose = { p: THREE.Vector3; q: THREE.Quaternion };

export default function StreetDrive() {
  const hostRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HudHandle>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.domElement.className = "absolute inset-0 size-full";
    host.prepend(renderer.domElement);
    const anisotropy = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    // Far plane at the end of the fog: nothing past it can be seen, so nothing past it is drawn.
    const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.3, 1000);
    const disposables: { dispose: () => void }[] = [];

    // Sky, also baked into the environment map for the car's reflections.
    const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(58), THREE.MathUtils.degToRad(150));
    const makeSky = () => {
      const sky = new Sky();
      sky.scale.setScalar(5000);
      const u = sky.material.uniforms;
      u.turbidity.value = 5;
      u.rayleigh.value = 1.4;
      u.mieCoefficient.value = 0.005;
      u.mieDirectionalG.value = 0.82;
      u.sunPosition.value.copy(sun);
      disposables.push(sky.geometry, sky.material);
      return sky;
    };
    scene.add(makeSky());
    const pmrem = new THREE.PMREMGenerator(renderer);
    const skyScene = new THREE.Scene();
    skyScene.add(makeSky());
    const env = pmrem.fromScene(skyScene);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.55;
    scene.fog = new THREE.Fog(0xcfb79a, 160, 950);
    disposables.push(pmrem, env);

    scene.add(new THREE.HemisphereLight(0xffe6cc, 0x4a3e30, 0.35));
    const sunLight = new THREE.DirectionalLight(0xffd6a6, 4.2);
    scene.add(sunLight, sunLight.target);

    // Road texture; the ribbon itself is built by the world, its v running in road tiles.
    const roadMap = canvasTexture(1024, drawRoad, anisotropy);
    disposables.push(roadMap);

    // Post: the scene into an MSAA HDR target, the speed pass, then tone mapping.
    const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    const speedPass = new ShaderPass(SpeedShader);
    composer.addPass(speedPass);
    composer.addPass(new OutputPass());
    disposables.push(composer);

    const rig = new THREE.Group();
    scene.add(rig);
    const wheelNodes: (THREE.Object3D | null)[] = [null, null, null, null];
    const caliperNodes: (THREE.Object3D | null)[] = [null, null];
    const WHEEL_NAMES = ["WHEEL_LF", "WHEEL_RF", "WHEEL_LR", "WHEEL_RR"];

    // Physics state, created once Rapier's WASM is ready.
    let world: RAPIER.World | null = null;
    let body: RAPIER.RigidBody | null = null;
    let vehicle: RAPIER.DynamicRayCastVehicleController | null = null;
    let land: ReturnType<typeof createWorld> | null = null;
    const drive = { steer: 0, throttle: 0, gear: 0, shift: 0, rpm: CAR.idle, reverse: false, distance: 0, time: 0 };
    const prev: Pose = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
    const curr: Pose = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
    const wheelState = CAR.hubs.map(() => ({ susp: CAR.suspension.rest, spin: 0, steer: 0, prevSusp: CAR.suspension.rest, prevSpin: 0 }));

    const readPose = (target: Pose) => {
      const t = body!.translation();
      const r = body!.rotation();
      target.p.set(t.x, t.y, t.z);
      target.q.set(r.x, r.y, r.z, r.w);
    };

    const loadCar = new Promise<THREE.Group>((resolve) => {
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(CAR_URL, (gltf) => resolve(gltf.scene), (e) => e.total && setProgress(e.loaded / e.total));
    });

    Promise.all([RAPIER.init(), loadCar]).then(([, model]) => {
      if (cancelled) return;
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          for (const mat of ([] as THREE.Material[]).concat(mesh.material)) {
            const std = mat as THREE.MeshStandardMaterial;
            for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"] as const) {
              if (std[key]) std[key]!.anisotropy = anisotropy;
            }
          }
        }
        const w = WHEEL_NAMES.indexOf(o.name);
        if (w >= 0) {
          wheelNodes[w] = o;
          o.rotation.order = "YXZ";
        }
        if (o.name === "SUSP_LF") caliperNodes[0] = o;
        if (o.name === "SUSP_RF") caliperNodes[1] = o;
      });
      rig.add(model);

      world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
      world.timestep = STEP;
      land = createWorld({ scene, physics: world, anisotropy, roadMap });
      const spot = land.laneSpot(6);
      land.update(spot.x, spot.z);

      body = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(spot.x, spot.y + 0.05, spot.z)
          .setRotation({ x: 0, y: Math.sin(spot.heading / 2), z: 0, w: Math.cos(spot.heading / 2) })
          .setCanSleep(false),
      );
      // A box for the body shell; mass, centre of mass and inertia set explicitly.
      const shellY = 0.66;
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.92, 0.32, 2.15)
          .setTranslation(0, shellY, 0)
          .setFriction(0.3)
          .setMassProperties(CAR.mass, { x: CAR.com.x, y: CAR.com.y - shellY, z: CAR.com.z }, CAR.inertia, { x: 0, y: 0, z: 0, w: 1 }),
        body,
      );

      vehicle = world.createVehicleController(body);
      vehicle.indexUpAxis = 1;
      vehicle.setIndexForwardAxis = 2;
      const s = CAR.suspension;
      CAR.hubs.forEach(([x, z], i) => {
        vehicle!.addWheel({ x, y: CONNECT_Y, z }, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, s.rest, CAR.wheelRadius);
        vehicle!.setWheelSuspensionStiffness(i, s.stiffness);
        vehicle!.setWheelSuspensionCompression(i, s.compression);
        vehicle!.setWheelSuspensionRelaxation(i, s.relaxation);
        vehicle!.setWheelMaxSuspensionTravel(i, s.travel);
        vehicle!.setWheelMaxSuspensionForce(i, s.maxForce);
        vehicle!.setWheelFrictionSlip(i, CAR.frictionSlip);
        vehicle!.setWheelSideFrictionStiffness(i, 1);
      });

      readPose(prev);
      readPose(curr);
      setReady(true);
    });

    // Input.
    const keys = new Set<string>();
    const reset = () => {
      if (!body || !land) return;
      const spot = land.laneSpot();
      body.setTranslation({ x: spot.x, y: spot.y + 0.05, z: spot.z }, true);
      body.setRotation({ x: 0, y: Math.sin(spot.heading / 2), z: 0, w: Math.cos(spot.heading / 2) }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      Object.assign(drive, { steer: 0, gear: 0, rpm: CAR.idle, reverse: false, distance: 0, time: 0 });
      readPose(prev);
      readPose(curr);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "r") reset();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onBlur = () => keys.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    const held = (...names: string[]) => names.some((n) => keys.has(n));

    const look = { yaw: 0, pitch: 0, dragging: false, lastX: 0, lastY: 0 };
    const onDown = (e: PointerEvent) => {
      Object.assign(look, { dragging: true, lastX: e.clientX, lastY: e.clientY });
      host.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!look.dragging) return;
      look.yaw -= (e.clientX - look.lastX) * 0.006;
      look.pitch = THREE.MathUtils.clamp(look.pitch + (e.clientY - look.lastY) * 0.004, -0.25, 0.9);
      look.lastX = e.clientX;
      look.lastY = e.clientY;
    };
    const onUp = () => (look.dragging = false);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);

    const quat = new THREE.Quaternion();
    const step = () => {
      const b = body!;
      const v = vehicle!;
      const throttleIn = held("w", "arrowup") ? 1 : 0;
      const brakeIn = held("s", "arrowdown") ? 1 : 0;
      const handbrake = held(" ");
      const steerIn = (held("a", "arrowleft") ? 1 : 0) - (held("d", "arrowright") ? 1 : 0);
      const lin = b.linvel();
      const speed = Math.hypot(lin.x, lin.z);
      const fwdSpeed = v.currentVehicleSpeed();

      // Steering: ramps toward the input, with less lock as speed rises.
      const lock = CAR.maxSteer / (1 + speed / 9);
      const rate = (CAR.steerRate * (steerIn ? 1 : 1.6)) / (1 + speed / 30);
      drive.steer += THREE.MathUtils.clamp(steerIn * lock - drive.steer, -rate * STEP, rate * STEP);
      v.setWheelSteering(0, drive.steer);
      v.setWheelSteering(1, drive.steer);

      // Reverse: hold brake once stopped; throttle brings you back to drive.
      if (brakeIn && !throttleIn && speed < 0.5) drive.reverse = true;
      if (throttleIn && drive.reverse && fwdSpeed > -0.5) drive.reverse = false;
      const driveIn = drive.reverse ? brakeIn : throttleIn;
      const brake = drive.reverse ? throttleIn : brakeIn;
      drive.throttle += (driveIn - drive.throttle) * (1 - Math.exp(-12 * STEP));

      // Engine and gearbox.
      const wheelOmega = fwdSpeed / CAR.wheelRadius;
      let force = 0;
      if (!drive.reverse) {
        const ratio = CAR.gears[drive.gear] * CAR.finalDrive;
        const wheelRpm = (Math.abs(wheelOmega) * ratio * 60) / (2 * Math.PI);
        // The clutch slips at launch, so revs don't drop to idle.
        drive.rpm = Math.max(wheelRpm, CAR.idle + drive.throttle * (drive.gear === 0 ? 4200 : 0) * Math.max(0, 1 - wheelRpm / 4500));
        if (drive.shift > 0) drive.shift -= STEP;
        else if (drive.rpm > CAR.shiftUp && drive.gear < CAR.gears.length - 1) {
          drive.gear++;
          drive.shift = CAR.shiftTime;
        } else if (drive.rpm < CAR.shiftDown && drive.gear > 0) {
          drive.gear--;
          drive.shift = CAR.shiftTime;
        }
        const limiter = drive.rpm > CAR.redline ? 0 : 1;
        if (drive.shift <= 0) force = (torqueAt(drive.rpm) * ratio * CAR.efficiency * drive.throttle * limiter) / CAR.wheelRadius;
      } else {
        drive.rpm = CAR.idle + Math.abs(wheelOmega) * 3.4 * CAR.finalDrive * 9.55;
        force = fwdSpeed > -9 ? -4200 * drive.throttle : 0;
      }
      v.setWheelEngineForce(2, force / 2);
      v.setWheelEngineForce(3, force / 2);

      // Rapier's brake is an impulse per step; front-biased.
      const pedal = brake * CAR.brakeForce * STEP;
      v.setWheelBrake(0, (pedal * CAR.brakeFront) / 2);
      v.setWheelBrake(1, (pedal * CAR.brakeFront) / 2);
      const rear = handbrake ? 6000 * STEP : (pedal * (1 - CAR.brakeFront)) / 2;
      v.setWheelBrake(2, rear);
      v.setWheelBrake(3, rear);
      v.setWheelSideFrictionStiffness(2, handbrake ? 0.45 : 1);
      v.setWheelSideFrictionStiffness(3, handbrake ? 0.45 : 1);

      // Aero: drag against the velocity, downforce split 42/58 over the axles.
      // Both: forces applied at a point also leave a torque, which would pile up.
      b.resetForces(true);
      b.resetTorques(true);
      const v3 = Math.hypot(lin.x, lin.y, lin.z);
      b.addForce({ x: -CAR.drag * v3 * lin.x, y: -CAR.drag * v3 * lin.y, z: -CAR.drag * v3 * lin.z }, true);
      const down = CAR.downforce * speed * speed;
      const r = b.rotation();
      quat.set(r.x, r.y, r.z, r.w);
      const t = b.translation();
      for (const [share, z] of [
        [0.42, CAR.hubs[0][1]],
        [0.58, CAR.hubs[2][1]],
      ]) {
        const point = new THREE.Vector3(0, CAR.com.y, z).applyQuaternion(quat);
        b.addForceAtPoint({ x: 0, y: -down * share, z: 0 }, { x: t.x + point.x, y: t.y + point.y, z: t.z + point.z }, true);
      }

      v.updateVehicle(STEP);
      world!.step();

      drive.distance += speed * STEP;
      if (speed > 0.5 || drive.time > 0) drive.time += STEP;

      // Keep coordinates small: move the floating origin to the car now and then.
      const p = b.translation();
      if (Math.abs(p.x) > REBASE.reach || Math.abs(p.z) > REBASE.reach) {
        const dx = Math.round(p.x / REBASE.step) * REBASE.step;
        const dz = Math.round(p.z / REBASE.step) * REBASE.step;
        b.setTranslation({ x: p.x - dx, y: p.y, z: p.z - dz }, true);
        prev.p.x -= dx;
        prev.p.z -= dz;
        land!.rebase(dx, dz);
      }

      wheelState.forEach((w, i) => {
        w.prevSusp = w.susp;
        w.prevSpin = w.spin;
        w.susp = v.wheelSuspensionLength(i) ?? CAR.suspension.rest;
        w.spin = v.wheelRotation(i) ?? 0;
        w.steer = v.wheelSteering(i) ?? 0;
      });
    };

    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const heading = new THREE.Vector3();
    let camHeading = 0;
    let camY = 0;
    // Vibration: `trauma` spikes on hard hits and decays; shake grows with its square.
    const fx = { trauma: 0, lastVy: 0, accelY: 0, lean: 0, pitch: 0, lastSpeed: 0 };
    const noise = (t: number, seed: number) => Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 3.1 + seed * 2.3) * 0.3 + Math.sin(t * 7.3 + seed * 5.1) * 0.2;

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      composer.setSize(width, height);
      speedPass.uniforms.uAspect.value = width / Math.max(1, height);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    };

    const lerpAngle = (p: number, q: number, t: number) => p + Math.atan2(Math.sin(q - p), Math.cos(q - p)) * t;

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let visible = true;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (body) {
        acc += dt;
        while (acc >= STEP) {
          prev.p.copy(curr.p);
          prev.q.copy(curr.q);
          step();
          readPose(curr);
          acc -= STEP;
        }
        const t = acc / STEP;
        rig.position.lerpVectors(prev.p, curr.p, t);
        rig.quaternion.slerpQuaternions(prev.q, curr.q, t);
        wheelNodes.forEach((node, i) => {
          if (!node) return;
          const w = wheelState[i];
          const [x, z] = CAR.hubs[i];
          const susp = w.prevSusp + (w.susp - w.prevSusp) * t;
          node.position.set(x, CONNECT_Y - susp, z);
          node.rotation.x = w.prevSpin + (w.spin - w.prevSpin) * t;
          node.rotation.y = w.steer;
          if (i < 2 && caliperNodes[i]) {
            caliperNodes[i]!.position.set(x, CONNECT_Y - susp, z);
            caliperNodes[i]!.rotation.y = w.steer;
          }
        });
      }

      const lx = rig.position.x;
      const lz = rig.position.z;
      land?.update(lx, lz);

      const lin = body?.linvel() ?? { x: 0, y: 0, z: 0 };
      const speed = Math.hypot(lin.x, lin.z);
      const speedK = Math.min(1, speed / 85);
      const now_s = now / 1000;

      // Hard hits (landing off a crest, kerbs) add trauma; rough ground rumbles.
      if (dt > 0) {
        // Vertical acceleration, smoothed. Hills at speed sit around 1-3 g, so only a real
        // landing (well past that) adds trauma.
        const accelY = Math.abs(lin.y - fx.lastVy) / dt;
        fx.accelY += (accelY - fx.accelY) * (1 - Math.exp(-20 * dt));
        if (fx.accelY > 50) fx.trauma = Math.min(1, fx.trauma + (fx.accelY - 50) * 0.004);
      }
      fx.lastVy = lin.y;
      const off = land ? Math.max(0, Math.min(1, land.offRoad(lx, lz) / 2)) : 0;
      fx.trauma = Math.max(0, fx.trauma - dt * 1.3);
      // A faint hum at top speed; the real rumble is for rough ground.
      const rumble = speedK * speedK * 0.18 + off * Math.min(1, speed / 15) * 0.9;

      // The body buzzes a little at speed, on top of the physics.
      const buzz = (0.0025 * speedK + 0.006 * off * Math.min(1, speed / 10)) * Math.sin(now_s * 61) * Math.sin(now_s * 23.7);
      rig.position.y += buzz;

      // Chase camera: trails the direction of travel, so slides show the car sideways.
      heading.set(0, 0, 1).applyQuaternion(rig.quaternion);
      const yaw = Math.atan2(heading.x, heading.z);
      const fwd = lin.x * heading.x + lin.z * heading.z;
      const travel = speed > 4 && fwd > 0 ? lerpAngle(yaw, Math.atan2(lin.x, lin.z), 0.6) : yaw;
      camHeading = lerpAngle(camHeading, travel, 1 - Math.exp(-4 * dt));
      if (!look.dragging) {
        look.yaw *= Math.exp(-2.2 * dt);
        look.pitch *= Math.exp(-2.2 * dt);
      }
      const h = camHeading + look.yaw;
      // Lean into corners with the yaw rate, dip under braking and squat on throttle.
      const yawRate = body ? body.angvel().y : 0;
      fx.lean += (THREE.MathUtils.clamp(-yawRate * speedK * 0.09, -0.07, 0.07) - fx.lean) * (1 - Math.exp(-5 * dt));
      const accel = dt > 0 ? (speed - fx.lastSpeed) / dt : 0;
      fx.lastSpeed = speed;
      fx.pitch += (THREE.MathUtils.clamp(-accel * 0.004, -0.04, 0.04) - fx.pitch) * (1 - Math.exp(-4 * dt));

      const dist = CAMERA.distance + speedK * 1.4;
      camY += (rig.position.y - camY) * (1 - Math.exp(-9 * dt));
      const shake = fx.trauma * fx.trauma * 0.16 + rumble * 0.03;
      camPos.set(
        lx - Math.sin(h) * dist + noise(now_s * 9, 1) * shake,
        camY + CAMERA.height + look.pitch * 3.5 + noise(now_s * 11, 2) * shake,
        lz - Math.cos(h) * dist,
      );
      camLook.set(lx + Math.sin(yaw) * 1.5, camY + 0.75 + fx.pitch * 4, lz + Math.cos(yaw) * 1.5);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      camera.rotateZ(fx.lean + noise(now_s * 13, 3) * shake * 0.08);
      const fov = CAMERA.fov + CAMERA.fovBoost * speedK * speedK + fx.trauma * 3;
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      speedPass.uniforms.uSpeed.value = speedK;
      speedPass.uniforms.uImpact.value = Math.min(1, fx.trauma * 1.4);
      speedPass.uniforms.uTime.value = now_s;

      hudRef.current?.update({
        speed: speed * 3.6,
        rpm: drive.rpm,
        redline: CAR.redline,
        gear: drive.reverse ? "R" : speed < 0.5 && drive.throttle < 0.05 ? "N" : String(drive.gear + 1),
        yaw,
        x: lx,
        z: lz,
        route: land?.route() ?? null,
        distance: drive.distance,
        time: drive.time,
        roadWidth: ROAD.width,
      });
      composer.render(dt);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(host);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      land?.dispose();
      if (world && vehicle) world.removeVehicleController(vehicle);
      world?.free();
      rig.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        for (const mat of ([] as THREE.Material[]).concat(mesh.material)) {
          for (const val of Object.values(mat)) if (val instanceof THREE.Texture) val.dispose();
          mat.dispose();
        }
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="relative h-dvh w-full touch-none select-none overflow-hidden bg-[#cfb79a]">
      <span className="sr-only">A drivable Porsche 911 GT3 R on an endless winding road over hills, through towns and countryside. Use W A S D or the arrow keys.</span>
      {!ready && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#141210] text-sm text-white/70">
          <span className="tabular-nums">Loading car {Math.round(progress * 100)}%</span>
        </div>
      )}
      <Hud ref={hudRef} />
      <div className="pointer-events-none absolute top-16 right-6 flex flex-col items-end gap-0.5 text-[12px] text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
        <span>W A S D or arrows to drive</span>
        <span>Space handbrake · R reset · drag to look</span>
      </div>
    </div>
  );
}
