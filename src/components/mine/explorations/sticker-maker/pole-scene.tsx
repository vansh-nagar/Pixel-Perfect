"use client";

/**
 * A steel street pole you slap stickers onto.
 *
 * Each sticker is a dense plane whose vertices are wrapped around the pole's cylinder in the
 * vertex shader (injected into MeshStandardMaterial, so it shares the pole's PBR lighting).
 *
 * Application is modelled the way a real sticker goes on: one edge touches first while the
 * rest is held off the surface at an angle, then a contact line sweeps across (a thumb
 * pressing it down). Behind the line the sticker is stuck to the curved surface; ahead of it
 * the free part leaves the surface tangentially, bends with a fixed curvature up to the hold
 * angle, then runs straight. A soft shadow sits under the free part and fades as it lays down.
 */

import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import {
  noStickersTexture,
  signBackTexture,
  poleTextures,
  streetBladeTexture,
  type PoleSkin,
} from "./pole-textures";

export const POLE_RADIUS = 0.42;
/** The pole runs from far below the frame up to its capped top. */
const POLE_TOP = 2.7;
const POLE_BOTTOM = -14;
/** "NO STICKERS" sign placement; its straps wrap the whole pole, so stickers must drape over them. */
const SIGN_Y = 1.02;
const SIGN_W = 0.82;
const SIGN_H = 1.12;
const STRAP_YS = [
  SIGN_Y + SIGN_H / 2 - 0.16,
  SIGN_Y - SIGN_H / 2 + 0.16,
] as const;

export type Placed = {
  id: number;
  texture: THREE.Texture;
  shadow: THREE.Texture;
  aspect: number;
  angle: number; // around the pole, radians (0 = facing +z)
  y: number;
  tilt: number;
  size: number; // long side, world units
  applyAngle: number; // direction the contact line sweeps, in the pole's tangent plane
};

export type PoleSpin = { yaw: number; vel: number; dragging: boolean };

// ---------------------------------------------------------------------------
// Wrap material
// ---------------------------------------------------------------------------

const WRAP_PARS = /* glsl */ `
  uniform float uAngle;       // where on the pole (around)
  uniform float uHeight;      // where on the pole (up)
  uniform float uRadius;
  uniform float uLift;        // stacking offset off the surface
  uniform float uTilt;
  uniform float uScale;
  uniform float uDrop;        // whole sticker held off the surface (approach)
  uniform float uFront;       // contact line progress, 0 = first edge .. 1 = fully stuck
  uniform float uHold;        // angle of the free part, radians
  uniform float uApplyAngle;  // sweep direction
  uniform vec2 uHalfSize;
  uniform vec2 uOffset;       // shadow offset in surface units
  uniform vec2 uStraps;       // heights of the sign's banding straps (pole space)

  // How far a sticker must stand off the pole at height y to ride over a strap.
  float strapBump(float y) {
    float b = 0.0;
    b = max(b, 1.0 - smoothstep(0.016, 0.055, abs(y - uStraps.x)));
    b = max(b, 1.0 - smoothstep(0.016, 0.055, abs(y - uStraps.y)));
    return b * 0.0095;
  }

  vec2 wrapRot(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  }

  // Point on the cylinder for surface coords q (x = arc length around, y = up).
  vec3 cylPoint(vec2 q, float r, out vec3 n, out vec3 tx) {
    float a = uAngle + q.x / (uRadius + uLift);
    n = vec3(sin(a), 0.0, cos(a));
    tx = vec3(cos(a), 0.0, -sin(a));
    float y = uHeight + q.y;
    r += strapBump(y);
    return vec3(sin(a) * r, y, cos(a) * r);
  }

  vec3 wrapPoint(vec3 pos, out vec3 nrm) {
    vec2 q = wrapRot(pos.xy * uScale, uTilt) + uOffset;
    // Contact grows radially from the centre: inside radius c the sticker is pressed onto
    // the pole; outside it, the rest bows away from the surface towards the viewer.
    vec2 local = q - uOffset;
    float rho = length(local);
    float ext = length(uHalfSize * uScale); // half-diagonal: the last corner to touch
    float c = uFront * ext;
    float r0 = uRadius + uLift + uDrop;
    vec3 n, tx;

    if (rho <= c || uHold < 1e-4) {
      vec3 p = cylPoint(q, r0, n, tx);
      nrm = n;
      return p;
    }

    vec2 d = local / max(rho, 1e-5);
    float s = rho;
    // Free part: leaves the surface at the contact edge, bends, then runs straight.
    vec2 qc = q - d * (s - c);
    vec3 base = cylPoint(qc, r0, n, tx);
    vec3 T = normalize(d.x * tx + vec3(0.0, d.y, 0.0));
    float dd = s - c;
    float k = 4.0;
    float L1 = uHold / k;
    float along;
    float lift;
    float phi;
    if (dd < L1) {
      phi = dd * k;
      along = sin(phi) / k;
      lift = (1.0 - cos(phi)) / k;
    } else {
      phi = uHold;
      along = sin(uHold) / k + (dd - L1) * cos(uHold);
      lift = (1.0 - cos(uHold)) / k + (dd - L1) * sin(uHold);
    }
    nrm = normalize(n * cos(phi) - T * sin(phi));
    return base + T * along + n * lift;
  }
`;

type WrapUniforms = ReturnType<typeof createWrapUniforms>;

function createWrapUniforms(p: {
  angle: number;
  y: number;
  tilt: number;
  halfW: number;
  halfH: number;
  lift: number;
  applyAngle: number;
}) {
  return {
    uAngle: { value: p.angle },
    uHeight: { value: p.y },
    uRadius: { value: POLE_RADIUS },
    uLift: { value: p.lift },
    uTilt: { value: p.tilt },
    uScale: { value: 1 },
    uDrop: { value: 0 },
    uFront: { value: 1 },
    uHold: { value: 0 },
    uApplyAngle: { value: p.applyAngle },
    uHalfSize: { value: new THREE.Vector2(p.halfW, p.halfH) },
    uOffset: { value: new THREE.Vector2() },
    uStraps: { value: new THREE.Vector2(STRAP_YS[0], STRAP_YS[1]) },
  };
}

function injectWrap(
  shader: THREE.WebGLProgramParametersWithUniforms,
  uniforms: WrapUniforms,
  withNormals: boolean,
) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = `${WRAP_PARS}\n${shader.vertexShader}`;
  if (withNormals) {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <beginnormal_vertex>",
        "vec3 wrapNormal;\nvec3 wrapPosition = wrapPoint(position, wrapNormal);\nvec3 objectNormal = wrapNormal;",
      )
      .replace("#include <begin_vertex>", "vec3 transformed = wrapPosition;");
  } else {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "vec3 wrapNormal;\nvec3 transformed = wrapPoint(position, wrapNormal);",
    );
  }
}

/** Vinyl sticker: art on the front, white backing paper on the back. */
function createStickerMaterial(
  texture: THREE.Texture,
  uniforms: WrapUniforms,
  ghost = false,
) {
  // Printed vinyl under a clear laminate: a satin base keeps the art saturated, the clearcoat
  // adds the small sharp highlights that make it read as a glossy sticker.
  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.45,
    alphaTest: ghost ? 0.02 : 0.5,
    transparent: ghost,
    opacity: ghost ? 0.5 : 1,
    depthWrite: !ghost,
    side: THREE.DoubleSide,
  });
  material.alphaToCoverage = !ghost;
  material.onBeforeCompile = (shader) => {
    injectWrap(shader, uniforms, true);
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      "#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = vec3(0.93, 0.92, 0.89);",
    );
  };
  material.customProgramCacheKey = () =>
    ghost ? "sticker-wrap-ghost" : "sticker-wrap";
  return material;
}

/** Soft contact shadow cast by the sticker while it's still in the air. */
function createShadowMaterial(shadow: THREE.Texture, uniforms: WrapUniforms) {
  // The shadow canvas is black with the silhouette in alpha, so it goes in `map` (alphaMap reads green).
  const material = new THREE.MeshBasicMaterial({
    color: "#000000",
    map: shadow,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => injectWrap(shader, uniforms, false);
  material.customProgramCacheKey = () => "sticker-shadow";
  return material;
}

/**
 * Come straight in from the front, slightly bowed with the face towards the viewer; the
 * centre touches first, then the contact spreads outward until the corners settle (~0.75s).
 */
function applySticker(
  s: WrapUniforms,
  shadow: WrapUniforms,
  shadowMaterial: THREE.MeshBasicMaterial,
) {
  s.uDrop.value = 0.9;
  s.uFront.value = 0;
  s.uHold.value = 0.42;
  s.uScale.value = 1.05;
  shadow.uOffset.value.set(0.12, -0.09);
  shadowMaterial.opacity = 0;

  const tl = gsap.timeline();
  // Approach: centre-first towards the pole.
  tl.to(s.uDrop, { value: 0, duration: 0.26, ease: "power2.in" }, 0);
  tl.to(s.uScale, { value: 1, duration: 0.26, ease: "power2.in" }, 0);
  tl.to(shadowMaterial, { opacity: 0.5, duration: 0.26, ease: "power1.in" }, 0);
  tl.to(
    shadow.uOffset.value,
    { x: 0.03, y: -0.025, duration: 0.26, ease: "power2.in" },
    0,
  );
  // Pressed from the centre out: fast at first, slowing as it reaches the corners.
  tl.to(s.uFront, { value: 1, duration: 0.42, ease: "power2.out" }, 0.25);
  tl.to(s.uHold, { value: 0.06, duration: 0.42, ease: "power1.inOut" }, 0.25);
  // Settle into a faint contact shadow that keeps the sticker grounded on the pole.
  tl.to(
    shadowMaterial,
    { opacity: 0.32, duration: 0.35, ease: "power1.out" },
    0.3,
  );
  tl.to(
    shadow.uOffset.value,
    { x: 0.006, y: -0.012, duration: 0.35, ease: "power1.out" },
    0.3,
  );
  // Corners pressed flat.
  tl.to(s.uHold, { value: 0, duration: 0.1, ease: "power2.out" }, 0.66);
  return tl;
}

function sizeFor(aspect: number, size: number) {
  const w = aspect >= 1 ? size : size * aspect;
  return { w, h: w / aspect };
}

// ---------------------------------------------------------------------------
// Stickers
// ---------------------------------------------------------------------------

function PlacedSticker({ item, layer }: { item: Placed; layer: number }) {
  const { w, h } = sizeFor(item.aspect, item.size);
  const lift = 0.004 + layer * 0.0016;
  const base = {
    angle: item.angle,
    y: item.y,
    tilt: item.tilt,
    halfW: w / 2,
    halfH: h / 2,
    applyAngle: item.applyAngle,
  };
  // Placement is fixed once a sticker is stuck, so its uniforms are created exactly once.
  const [uniforms] = useState(() => createWrapUniforms({ ...base, lift }));
  const [shadowUniforms] = useState(
    () => createWrapUniforms({ ...base, lift: lift - 0.0006 }), // above the sticker below, under this one
  );
  const material = useMemo(
    () => createStickerMaterial(item.texture, uniforms),
    [item.texture, uniforms],
  );
  const shadowMaterial = useMemo(
    () => createShadowMaterial(item.shadow, shadowUniforms),
    [item.shadow, shadowUniforms],
  );

  useEffect(() => {
    const tl = applySticker(uniforms, shadowUniforms, shadowMaterial);
    return () => {
      tl.kill();
    };
  }, [uniforms, shadowUniforms, shadowMaterial]);
  useEffect(
    () => () => {
      material.dispose();
      shadowMaterial.dispose();
    },
    [material, shadowMaterial],
  );

  return (
    <>
      <mesh material={shadowMaterial} frustumCulled={false} renderOrder={1}>
        <planeGeometry args={[w, h, 32, 32]} />
      </mesh>
      <mesh material={material} frustumCulled={false} renderOrder={2}>
        <planeGeometry args={[w, h, 96, 96]} />
      </mesh>
    </>
  );
}

/** `hiddenUntil`: ms timestamp; the preview stays hidden while a sticker is landing. */
type GhostState = {
  visible: boolean;
  angle: number;
  y: number;
  hiddenUntil: number;
};

function updateGhost(mesh: THREE.Mesh | null, u: WrapUniforms, g: GhostState) {
  if (!mesh) return;
  mesh.visible = g.visible && performance.now() > g.hiddenUntil;
  u.uAngle.value = g.angle;
  u.uHeight.value = g.y;
}

function Ghost({
  texture,
  aspect,
  size,
  ghostRef,
}: {
  texture: THREE.Texture;
  aspect: number;
  size: number;
  ghostRef: RefObject<GhostState>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { w, h } = sizeFor(aspect, size);
  const uniforms = useMemo(
    () =>
      createWrapUniforms({
        angle: 0,
        y: 0,
        tilt: 0,
        halfW: w / 2,
        halfH: h / 2,
        lift: 0.03,
        applyAngle: 0,
      }),
    [w, h],
  );
  const material = useMemo(
    () => createStickerMaterial(texture, uniforms, true),
    [texture, uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => updateGhost(meshRef.current, uniforms, ghostRef.current));
  return (
    <mesh
      ref={meshRef}
      material={material}
      frustumCulled={false}
      visible={false}
      renderOrder={10}
    >
      <planeGeometry args={[w, h, 48, 48]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Signs and hardware
// ---------------------------------------------------------------------------

const galvanised = { color: "#b4b9be", metalness: 1, roughness: 0.32 } as const;

/** Rounded aluminium plate body (the printed face is a separate decal on top). */
function plateGeometry(w: number, h: number, depth: number, r: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 8,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** A sign plate: aluminium body, printed face on the front (and back, for street blades). */
function SignPlate({
  w,
  h,
  texture,
  back,
  doubleSided = false,
}: {
  w: number;
  h: number;
  texture: THREE.Texture;
  /** Plain back face (brushed aluminium), for single-sided signs. */
  back?: THREE.Texture;
  doubleSided?: boolean;
}) {
  const depth = 0.018;
  const body = useMemo(
    () => plateGeometry(w, h, depth, Math.min(w, h) * 0.06),
    [w, h],
  );
  useEffect(() => () => body.dispose(), [body]);
  const face = (
    <meshPhysicalMaterial
      map={texture}
      roughness={0.42}
      clearcoat={0.6}
      clearcoatRoughness={0.3}
      alphaTest={0.5}
    />
  );
  return (
    <group>
      <mesh geometry={body} castShadow receiveShadow>
        <meshStandardMaterial
          color="#c9cdd1"
          metalness={0.85}
          roughness={0.38}
        />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.0008]} castShadow>
        <planeGeometry args={[w, h]} />
        {face}
      </mesh>
      {back && !doubleSided && (
        <mesh position={[0, 0, -depth / 2 - 0.0008]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial
            map={back}
            metalness={0.85}
            roughness={0.4}
            alphaTest={0.5}
          />
        </mesh>
      )}
      {doubleSided && (
        <mesh position={[0, 0, -depth / 2 - 0.0008]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[w, h]} />
          {face}
        </mesh>
      )}
    </group>
  );
}

function Bolt({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.022, 0.022, 0.014, 6]} />
      <meshStandardMaterial color="#d6d9dc" metalness={1} roughness={0.25} />
    </mesh>
  );
}

/** Stainless banding strap with a buckle, the way signs are strapped to round posts. */
function Strap({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[POLE_RADIUS + 0.006, POLE_RADIUS + 0.006, 0.032, 96, 1, true]}
        />
        <meshStandardMaterial
          color="#c3c7cb"
          metalness={1}
          roughness={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -(POLE_RADIUS + 0.012)]} castShadow>
        <boxGeometry args={[0.07, 0.045, 0.02]} />
        <meshStandardMaterial color="#c3c7cb" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** "NO STICKERS" sign strapped to the front of the pole on two brackets. */
function RegulatorySign() {
  const w = SIGN_W;
  const h = SIGN_H;
  const texture = useMemo(() => noStickersTexture(SIGN_W / SIGN_H), []);
  const back = useMemo(() => signBackTexture(SIGN_W / SIGN_H), []);
  useEffect(
    () => () => {
      texture.dispose();
      back.dispose();
    },
    [texture, back],
  );
  const standoff = POLE_RADIUS + 0.05;
  const y = SIGN_Y;
  const ys = [h / 2 - 0.16, -h / 2 + 0.16];
  return (
    <group position={[0, y, 0]} rotation={[0, 0.12, 0]}>
      {ys.map((by) => (
        <group key={by}>
          <Strap y={by} />
          {/* Bracket between strap and sign */}
          <mesh
            position={[0, by, POLE_RADIUS + 0.025]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.12, 0.07, 0.05]} />
            <meshStandardMaterial {...galvanised} />
          </mesh>
          <Bolt position={[0, by, standoff + 0.016]} />
        </group>
      ))}
      <group position={[0, 0, standoff]}>
        <SignPlate w={w} h={h} texture={texture} back={back} />
      </group>
    </group>
  );
}

/** Two crossed street-name blades on slim slotted brackets above the post's cap. */
function StreetBlades() {
  const w = 1.7;
  const h = 0.3;
  const blade1 = useMemo(
    () => streetBladeTexture("PIXEL PERFECT", "AVE", "400", w / h),
    [],
  );
  const blade2 = useMemo(
    () => streetBladeTexture("STICKER", "ST", "1200", w / h),
    [],
  );
  useEffect(
    () => () => {
      blade1.dispose();
      blade2.dispose();
    },
    [blade1, blade2],
  );
  const cast = { color: "#a9afb5", metalness: 0.9, roughness: 0.42 } as const;
  const slot = (
    <mesh castShadow>
      <boxGeometry args={[0.07, h + 0.05, 0.05]} />
      <meshStandardMaterial {...cast} />
    </mesh>
  );
  return (
    <group position={[0, POLE_TOP, 0]} rotation={[0, -0.62, 0]}>
      {/* Collar capping the pipe, and a short stub the brackets clamp to */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[POLE_RADIUS + 0.03, POLE_RADIUS + 0.03, 0.1, 64]}
        />
        <meshStandardMaterial {...cast} />
      </mesh>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry
          args={[POLE_RADIUS * 0.55, POLE_RADIUS + 0.03, 0.06, 64]}
        />
        <meshStandardMaterial {...cast} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.66, 24]} />
        <meshStandardMaterial {...cast} />
      </mesh>
      <group position={[0, 0.3, 0]}>
        <SignPlate w={w} h={h} texture={blade1} doubleSided />
        {slot}
      </group>
      <group position={[0, 0.66, 0]} rotation={[0, Math.PI / 2, 0]}>
        <SignPlate w={w} h={h} texture={blade2} doubleSided />
        {slot}
      </group>
      <mesh position={[0, 0.84, 0]} castShadow>
        <sphereGeometry
          args={[0.055, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial {...cast} />
      </mesh>
    </group>
  );
}

function stepSpin(group: THREE.Group, spin: PoleSpin, dt: number) {
  const f = Math.min(dt * 60, 3);
  if (!spin.dragging) {
    spin.yaw += spin.vel * f;
    spin.vel *= Math.pow(0.93, f);
  }
  group.rotation.y = spin.yaw;
}

/** Frame the pole left of the control panel, signs near the top of the view. */
function CameraAim() {
  const camera = useThree((s) => s.camera);
  useEffect(() => aimCamera(camera), [camera]);
  return null;
}
function aimCamera(camera: THREE.Camera) {
  camera.lookAt(1.15, 1.25, 0);
}

// ---------------------------------------------------------------------------
// Pole
// ---------------------------------------------------------------------------

type PoleProps = {
  skin: PoleSkin;
  placed: Placed[];
  current: { texture: THREE.Texture; aspect: number } | null;
  size: number;
  spinRef: RefObject<PoleSpin>;
  onPlace: (angle: number, y: number) => void;
};

function Pole({ skin, placed, current, size, spinRef, onPlace }: PoleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ghostRef = useRef<GhostState>({
    visible: false,
    angle: 0,
    y: 0,
    hiddenUntil: 0,
  });
  const local = useMemo(() => new THREE.Vector3(), []);
  const textures = useMemo(() => poleTextures(skin), [skin]);
  const length = POLE_TOP - POLE_BOTTOM;

  useFrame((_, dt) => {
    if (groupRef.current) stepSpin(groupRef.current, spinRef.current, dt);
  });

  const toPole = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const p = groupRef.current!.worldToLocal(local.copy(e.point));
    return { angle: Math.atan2(p.x, p.z), y: p.y };
  };

  return (
    <group ref={groupRef}>
      <mesh
        position={[0, (POLE_TOP + POLE_BOTTOM) / 2, 0]}
        receiveShadow
        castShadow
        onPointerMove={(e) => {
          const { angle, y } = toPole(e);
          Object.assign(ghostRef.current, {
            visible: !spinRef.current.dragging,
            angle,
            y,
          });
        }}
        onPointerOut={() => (ghostRef.current.visible = false)}
        onClick={(e) => {
          if (e.delta > 6) return;
          const { angle, y } = toPole(e);
          ghostRef.current.hiddenUntil = performance.now() + 900;
          onPlace(angle, y);
        }}
      >
        <cylinderGeometry
          args={[POLE_RADIUS, POLE_RADIUS, length, 160, 1, true]}
        />
        <meshPhysicalMaterial
          map={textures.color}
          roughnessMap={textures.orm}
          metalnessMap={skin === "steel" ? null : textures.orm}
          bumpMap={textures.orm}
          bumpScale={skin === "steel" ? 0.25 : 2.2}
          roughness={1}
          metalness={skin === "steel" ? 1 : 1}
          anisotropy={skin === "steel" ? 0.2 : 0}
          anisotropyRotation={Math.PI / 2}
        />
      </mesh>
      <StreetBlades />
      <RegulatorySign />
      {placed.map((item, i) => (
        <PlacedSticker key={item.id} item={item} layer={i} />
      ))}
      {current && (
        <Ghost
          texture={current.texture}
          aspect={current.aspect}
          size={size}
          ghostRef={ghostRef}
        />
      )}
    </group>
  );
}

export function PoleScene(props: PoleProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [1.15, 1.6, 10.8], fov: 30 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
      }}
    >
      <CameraAim />
      {/* Studio lighting baked into the reflections: big warm softbox left, cool strip rim
          right, soft top, faint front fill. This is what makes the steel read as metal. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#16181b"]} />
        {/* Broad dim bounce all around, so the steel's shadow side reads as satin grey, not dirt */}
        <Lightformer form="ring" intensity={0.35} position={[0, 1, 0]} scale={14} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#fff3e4"
          position={[-5, 2, 3]}
          scale={[5, 11, 1]}
          target={[0, 0.5, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#d4e4ff"
          position={[5, 1.5, -3.5]}
          scale={[1.2, 10, 1]}
          target={[0, 0.5, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[0, 7, 1]}
          scale={[8, 4, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          position={[1, 0.5, 8]}
          scale={[6, 4, 1]}
          target={[0, 0.5, 0]}
        />
      </Environment>
      <ambientLight intensity={0.05} />
      <directionalLight
        position={[-3.5, 5.5, 4.5]}
        intensity={2.1}
        color="#fff6ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <directionalLight
        position={[5, 1.5, -3]}
        intensity={0.9}
        color="#c8dbff"
      />
      <Pole {...props} />
    </Canvas>
  );
}
