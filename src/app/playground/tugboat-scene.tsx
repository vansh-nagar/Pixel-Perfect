"use client";

/**
 * Tugboat: an open-water toy, a toon-shaded tug you can steer anywhere, after a stylised
 * boat game.
 *
 * The sea is endless. It's generated in 40-unit chunks around the boat (piers, rocks,
 * islands, buoys), each seeded from its coordinates, so a spot looks the same every time
 * you come back. The boat's position lives in JS doubles; the GPU only sees positions
 * relative to an origin that snaps in steps of WRAP, and every water pattern tiles at
 * WRAP, so the snap is invisible and precision never degrades however far you sail.
 *
 *  Pointer / ← →      rudder: the pointer's distance from centre sets how hard it turns
 *  Hold / Space / ↑   throttle: speed ramps up, the bow lifts, the stack puffs faster
 *  ↓ / S              slow down
 *
 * Rocks, islands, buoys and pier posts are solid. The gaps between pier posts are wide
 * enough to sail under the deck.
 *
 * Shaders, all procedural:
 *  - toon: two-band light with a cool shadow tint and a cyan bounce from the sea
 *  - water: banded colour patches, streaks, blinking glints, a fake boat shadow
 *  - wake: a ribbon rebuilt every frame along the stern's real path, two broken foam lines
 *  - ripples: hand-drawn dashed rings dropped behind the stern and wherever you hit something
 *  - foam collars: lapping rings around every post, rock and the hull's waterline
 *  - smoke: billboarded noise blobs drawn through a stencil, so overlapping puffs read
 *    as one translucent plume instead of stacking into opaque blobs
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

const PALETTE = {
  sky: "#c6ecf7",
  skyTop: "#9fdcf3",
  water: "#46cdf1",
  waterDeep: "#2db5e8",
  waterLight: "#8ae4f8",
  waterShadow: "#1f8fcb",
  foam: "#f6feff",
  ripple: "#ffa978",
  hull: "#e38b6b",
  hullDark: "#b9604b",
  strip: "#7e4436",
  deck: "#d98568",
  cabin: "#cf7458",
  door: "#a5513f",
  trim: "#eef1f8",
  glass: "#6f9fe2",
  metal: "#8f99b0",
  tire: "#383a44",
  chimney: "#aaacb8",
  soot: "#4b4d58",
  pier: "#58778a",
  pierDeck: "#7f8f9c",
  rock: "#5f6989",
  grass: "#95cb64",
  leaf: "#88a7ea",
  trunk: "#7b5a4a",
  buoy: "#e2573f",
};

const SPEED = { cruise: 5.5, full: 11, slow: 1.4, calm: 2 };
const TURN = 1.15; // max yaw rate, rad/s
const WRAP = 200; // every water pattern tiles at WRAP in x and z; the render origin snaps to it
const S_WRAP = 1000; // the same idea for the wake's emission distance
const CHUNK = 40; // world is generated in CHUNK × CHUNK cells around the boat
const VIEW_CHUNKS = 3; // cells generated in each direction, enough to reach past the fog
const LIGHT = new THREE.Vector3(0.62, 0.78, 0.32).normalize();

const HULL = { halfWidth: 1.05, stern: 1.5, bow: 1.78, bottom: -0.48, height: 0.82, bevel: 0.08 };
const DECK_Y = HULL.bottom + HULL.height + 2 * HULL.bevel; // 0.5
const RIM_TOP = DECK_Y + 0.1;
const CABIN = { w: 1.2, h: 0.8, d: 1.0, z: -0.2 };
const ROOF_TOP = DECK_Y + CABIN.h + 0.16;
const CHIMNEY = { z: -0.28, height: 0.48, top: ROOF_TOP + 0.48 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}
/** Integer hash of a cell, mixed well enough that neighbouring cells look unrelated. */
function hashCell(a: number, b: number) {
  let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
  const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Bakes a transform into a geometry and returns it, for building merged parts. */
function place(g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
  if (rx) g.rotateX(rx);
  if (rz) g.rotateZ(rz);
  if (ry) g.rotateY(ry);
  return g.translate(x, y, z);
}

function setUv(g: THREE.BufferGeometry, fn: (x: number, y: number, z: number) => [number, number]) {
  const p = g.getAttribute("position");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const [u, v] = fn(p.getX(i), p.getY(i), p.getZ(i));
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Boat-local (x, z) → world offset for a yaw, matching Object3D.rotation.y. */
const rotY = (x: number, z: number, yaw: number): [number, number] => [
  x * Math.cos(yaw) + z * Math.sin(yaw),
  -x * Math.sin(yaw) + z * Math.cos(yaw),
];

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

const NOISE = /* glsl */ `
  #define WRAP ${WRAP.toFixed(1)}
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  // Value noise whose cells repeat every \`period\`. World patterns sample it at scale s
  // with period WRAP * s, so they tile at WRAP and survive the render origin snapping.
  float vnoise(vec2 p, vec2 period) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    vec2 i0 = mod(i, period);
    vec2 i1 = mod(i + 1.0, period);
    float a = hash21(i0);
    float b = hash21(vec2(i1.x, i0.y));
    float c = hash21(vec2(i0.x, i1.y));
    float d = hash21(i1);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p, vec2 period) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p, period);
      p = p * 2.0 + vec2(17.1, 9.2);
      period *= 2.0;
      a *= 0.5;
    }
    return s;
  }
  // iq's rounded box with a radius per corner: (front-right, back-right, front-left, back-left).
  float sdRoundBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x = (p.y > 0.0) ? r.x : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
  }
  // The hull's waterline footprint in boat-local (x, forward) coordinates.
  float sdHull(vec2 p) {
    return sdRoundBox(p - vec2(0.0, 0.14), vec2(1.0, 1.6), vec4(0.95, 0.4, 0.95, 0.4));
  }
`;

const TOON_VERT = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(transpose(inverse(mat3(modelMatrix))) * normal);
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const TOON_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uShade;   // multiplies the shadow side: cool, so shadows go blue, not grey
  uniform vec3 uLight;
  uniform sampler2D uMap;
  uniform float uUseMap;
  uniform vec2 uRepeat;
  uniform float uFlat;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    vec3 n = normalize(vNormal);
    if (uFlat > 0.5) n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    float ndl = dot(n, uLight);
    float lit = smoothstep(0.0, 0.06, ndl);
    float hi = smoothstep(0.74, 0.8, ndl);
    vec3 base = uColor;
    if (uUseMap > 0.5) base *= texture2D(uMap, vUv * uRepeat).rgb;
    vec3 col = mix(base * uShade, base, lit);
    col = mix(col, col * 1.07 + 0.015, hi);
    // the sea throws cyan light up onto anything facing down
    col += vec3(0.03, 0.12, 0.16) * smoothstep(0.0, 0.8, -n.y);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const WATER_VERT = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBoat;    // x, z, yaw
  uniform vec3 uWater;
  uniform vec3 uDeep;
  uniform vec3 uLight;
  uniform vec3 uShadow;
  uniform vec3 uFoam;
  varying vec3 vWorld;
  #include <fog_pars_fragment>
  ${NOISE}

  float sdTri(vec2 p, float r) {
    const float k = 1.7320508;
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
  }

  // World point → boat-local (x, forward), after sliding by a shadow offset.
  vec2 boatLocal(vec2 w, vec2 offset) {
    vec2 rel = w - uBoat.xy - offset;
    float c = cos(uBoat.z);
    float s = sin(uBoat.z);
    return vec2(rel.x * c - rel.y * s, -(rel.x * s + rel.y * c));
  }

  void main() {
    vec2 q = vWorld.xz;

    // Big slow colour regions, then hard-edged lighter patches like painted shapes.
    vec3 col = mix(uDeep, uWater, smoothstep(0.3, 0.62, fbm(q * 0.07, vec2(WRAP * 0.07))));
    float patches = fbm(q * vec2(0.11, 0.2) + vec2(uTime * 0.03, 0.0), vec2(WRAP * 0.11, WRAP * 0.2));
    float pa = fwidth(patches);
    col = mix(col, uLight, smoothstep(0.565 - pa, 0.565 + pa, patches) * 0.42);

    // Short streaks that slide a little.
    float st = vnoise(q * vec2(0.5, 3.0) + vec2(uTime * 0.4, 0.0), vec2(WRAP * 0.5, WRAP * 3.0));
    float sa = fwidth(st);
    float streakMask = smoothstep(0.45, 0.7, vnoise(q * 0.15 + 4.0, vec2(WRAP * 0.15)));
    col = mix(col, uFoam, smoothstep(0.82 - sa, 0.82 + sa, st) * streakMask * 0.6);

    // Glints: at most one tiny triangle per cell, blinking on its own clock.
    vec2 gp = q * 0.8;
    vec2 cell = mod(floor(gp), WRAP * 0.8);
    vec2 f = fract(gp);
    float h = hash21(cell);
    vec2 c = vec2(hash21(cell + 3.7), hash21(cell + 9.1)) * 0.6 + 0.2;
    float tri = sdTri((f - c) * vec2(1.0, 1.5), 0.08);
    float blink = smoothstep(0.55, 1.0, sin(uTime * 1.7 + h * 60.0)) * step(0.84, h);
    col = mix(col, uFoam, (1.0 - smoothstep(0.0, fwidth(tri) * 1.5, tri)) * blink * 0.9);

    // Fake shadow: the hull and the taller cabin, each slid away from the light by its height.
    vec2 dir = vec2(-0.75, 0.25);
    float hull = sdHull(boatLocal(q, dir * 0.45));
    float cabin = sdRoundBox(boatLocal(q, dir * 1.35) - vec2(0.0, 0.2), vec2(0.72, 0.62), vec4(0.12));
    col = mix(col, uShadow, (1.0 - smoothstep(-0.1, 0.22, min(hull, cabin))) * 0.5);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const OVERLAY_VERT = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

/** Foam around posts and rocks: a broken collar plus rings that lap outward. */
const COLLAR_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uFoam;
  varying vec2 vUv;
  varying vec3 vWorld;
  #include <fog_pars_fragment>
  ${NOISE}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    vec2 q = vWorld.xz;
    float n = vnoise(q * 2.5, vec2(WRAP * 2.5));
    float collar = 1.0 - smoothstep(0.035, 0.06, abs(r - 0.5 + (n - 0.5) * 0.12));
    float pulse = fract(uTime * 0.45 + n * 0.35);
    float ring = 1.0 - smoothstep(0.02, 0.04, abs(r - mix(0.52, 0.95, pulse)));
    ring *= (1.0 - pulse) * step(0.42, vnoise(q * 4.0, vec2(WRAP * 4.0)));
    float a = max(collar, ring);
    if (a < 0.02) discard;
    gl_FragColor = vec4(uFoam, a * 0.95);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/** Foam hugging the hull at the waterline, thicker at the bow where the water piles up. */
const HULL_FOAM_FRAG = /* glsl */ `
  uniform float uThrottle;
  uniform vec2 uSize;
  uniform vec3 uFoam;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${NOISE}
  void main() {
    vec2 local = (vUv - 0.5) * uSize; // x, forward
    float d = sdHull(local);
    if (d < -0.02) discard;
    vec2 q = vWorld.xz;
    float n = fbm(q * 1.4, vec2(WRAP * 1.4));
    float bow = smoothstep(-0.4, 1.6, local.y);
    float width = 0.08 + 0.16 * bow + n * 0.12 + uThrottle * 0.06;
    float foam = 1.0 - smoothstep(width, width + 0.04, d);
    float far = 0.34 + 0.28 * bow + n * 0.22 + uThrottle * 0.12;
    float line = (1.0 - smoothstep(0.025, 0.045, abs(d - far))) * step(0.5, vnoise(q * 3.0, vec2(WRAP * 3.0)));
    float a = max(foam, line * bow * 0.85);
    if (a < 0.02) discard;
    gl_FragColor = vec4(uFoam, a * 0.95);
    #include <colorspace_fragment>
  }
`;

const WAKE_VERT = /* glsl */ `
  attribute float aSide;
  attribute float aDist;
  attribute float aS;
  varying float vSide;
  varying float vDist;
  varying float vS;
  void main() {
    vSide = aSide;
    vDist = aDist;
    vS = aS;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

/**
 * The wake ribbon. `vS` is the distance sailed when each slice was emitted, so the noise
 * is pinned to the water: the dashes stay put while the boat pulls away from them.
 */
const WAKE_FRAG = /* glsl */ `
  #define S_WRAP ${S_WRAP.toFixed(1)}
  uniform float uLength;
  uniform float uThrottle;
  uniform vec3 uFoam;
  varying float vSide;
  varying float vDist;
  varying float vS;
  ${NOISE}
  void main() {
    float along = vDist / uLength;
    float across = abs(vSide);
    float wob = (vnoise(vec2(vS * 1.5, vSide * 3.0), vec2(S_WRAP * 1.5, 1e4)) - 0.5) * 0.1;
    float thick = mix(0.05, 0.03, along);
    float d = abs(across + wob - 0.86);
    float line = 1.0 - smoothstep(thick, thick + fwidth(across) * 1.5, d);
    line *= step(along * 0.8, vnoise(vec2(vS * 0.9, vSide * 5.0), vec2(S_WRAP * 0.9, 1e4)) + 0.12);
    float churnN = fbm(vec2(vSide * 2.5, vS * 1.2), vec2(1e4, S_WRAP * 1.2));
    float churn = smoothstep(0.54, 0.6, churnN)
      * (1.0 - smoothstep(0.0, 0.3 + uThrottle * 0.25, along))
      * (1.0 - smoothstep(0.5, 0.8, across));
    float a = max(line, churn * 0.55);
    a *= smoothstep(0.0, 0.03, along) * (1.0 - smoothstep(0.55, 1.0, along));
    if (a < 0.02) discard;
    gl_FragColor = vec4(uFoam, a * 0.92);
    #include <colorspace_fragment>
  }
`;

/** A hand-drawn ring: wobbly radius, varying stroke width, dashes that open up as it fades. */
const RIPPLE_FRAG = /* glsl */ `
  uniform float uLife;
  uniform float uSeed;
  uniform vec3 uColor;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    vec2 dir = p / max(r, 1e-4); // sample noise on the circle, so there's no seam at ±π
    float wob = (vnoise(dir * 1.6 + uSeed * 7.0, vec2(1e4)) - 0.5) * 0.1;
    float w = mix(0.022, 0.008, uLife) * (0.5 + vnoise(dir * 2.4 + uSeed * 3.0, vec2(1e4)));
    float ring = 1.0 - smoothstep(w, w + fwidth(r) * 1.5, abs(r - 0.86 + wob));
    float dash = step(0.36 + uLife * 0.32, vnoise(dir * 3.2 + uSeed * 11.0, vec2(1e4)));
    float a = ring * dash * smoothstep(0.0, 0.08, uLife) * (1.0 - smoothstep(0.5, 1.0, uLife));
    if (a < 0.02) discard;
    gl_FragColor = vec4(uColor, a * 0.9);
    #include <colorspace_fragment>
  }
`;

const SMOKE_VERT = /* glsl */ `
  attribute float aAge;
  attribute float aSeed;
  varying vec2 vUv;
  varying float vAge;
  varying float vSeed;
  varying float vHeight;
  void main() {
    vUv = uv;
    vAge = aAge;
    vSeed = aSeed;
    float scale = length(instanceMatrix[0].xyz);
    vec4 world = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vHeight = world.y + position.y * scale;
    vec4 mv = viewMatrix * world;
    mv.xy += position.xy * scale; // billboard: expand the quad in view space
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * Each puff is a binary noise blob that erodes as it ages. The material writes 1 to the
 * stencil and only draws where the stencil is still 0, so each pixel is shaded by one
 * puff at most: the plume reads as a single translucent shape. That only works because
 * the alpha depends on world height, not on the puff, so every puff agrees on it.
 */
const SMOKE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vAge;
  varying float vSeed;
  varying float vHeight;
  ${NOISE}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float n = vnoise(p * 1.8 + vSeed * 13.7 + vec2(0.0, -uTime * 0.6), vec2(1e4));
    float edge = 0.9 - vAge * 0.55;
    if (length(p) + (n - 0.5) * (0.35 + vAge * 0.7) > edge) discard;
    float fade = 1.0 - smoothstep(2.4, 3.8, vHeight);
    gl_FragColor = vec4(uColor, uOpacity * fade);
    #include <colorspace_fragment>
  }
`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  varying vec3 vDir;
  void main() {
    gl_FragColor = vec4(mix(uHorizon, uTop, smoothstep(0.02, 0.45, vDir.y)), 1.0);
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------------------
// Materials (created once, on the client, the first time a mesh asks)
// ---------------------------------------------------------------------------

/** Uniforms shared by every material that animates; one write per frame updates all. */
const SHARED = { uTime: { value: 0 }, uThrottle: { value: 0 } };

const fogUniforms = () => ({
  fogColor: { value: new THREE.Color() },
  fogNear: { value: 1 },
  fogFar: { value: 1000 },
  fogDensity: { value: 0 },
});

function plankTexture(planks: number, seed: number, vertical = false) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const rand = seeded(seed);
  const band = size / planks;
  // Draws along the plank direction: (along, across, length, thickness).
  const draw = (a: number, b: number, len: number, th: number) =>
    vertical ? g.fillRect(b, a, th, len) : g.fillRect(a, b, len, th);
  for (let i = 0; i < planks; i++) {
    const tone = Math.round(234 + rand() * 21);
    g.fillStyle = `rgb(${tone},${tone},${tone})`;
    draw(0, i * band, size, band);
    g.fillStyle = "rgba(120,70,50,0.10)";
    for (let k = 0; k < 4; k++) draw(rand() * size, i * band + 4 + rand() * (band - 8), 30 + rand() * 90, 1.5);
    g.fillStyle = "rgba(90,40,28,0.55)";
    draw(0, i * band, size, 3);
    draw(rand() * size, i * band, 3, band);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

type ToonOptions = { map?: THREE.Texture; repeat?: [number, number]; shade?: string; flat?: boolean; fog?: boolean };

function toon(color: string, o: ToonOptions = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...fogUniforms(),
      uColor: { value: new THREE.Color(color) },
      uShade: { value: new THREE.Color(o.shade ?? "#b3b7dc") },
      uLight: { value: LIGHT },
      uMap: { value: o.map ?? null },
      uUseMap: { value: o.map ? 1 : 0 },
      uRepeat: { value: new THREE.Vector2(...(o.repeat ?? [1, 1])) },
      uFlat: { value: o.flat ? 1 : 0 },
    },
    vertexShader: TOON_VERT,
    fragmentShader: TOON_FRAG,
    fog: o.fog ?? true,
  });
}

function overlay(fragmentShader: string, uniforms: Record<string, THREE.IUniform>, fog = false) {
  return new THREE.ShaderMaterial({
    uniforms: { ...(fog ? fogUniforms() : {}), uFoam: { value: new THREE.Color(PALETTE.foam) }, ...uniforms },
    vertexShader: OVERLAY_VERT,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    fog,
  });
}

function createMaterials() {
  const planksH = plankTexture(4, 3);
  const planksV = plankTexture(5, 11, true);
  const far = (hex: string, k: number) =>
    "#" + new THREE.Color(hex).lerp(new THREE.Color(PALETTE.sky), k).getHexString();
  return {
    hull: toon(PALETTE.hull, { map: planksH, shade: "#b79bc6" }),
    deck: toon(PALETTE.deck, { map: planksH, shade: "#b79bc6" }),
    rim: toon(PALETTE.hullDark, { shade: "#a996c4" }),
    strip: toon(PALETTE.strip),
    cabin: toon(PALETTE.cabin, { map: planksV, repeat: [1.2, 1], shade: "#b39bc8" }),
    door: toon(PALETTE.door, { map: planksV, repeat: [0.8, 1] }),
    roof: toon(PALETTE.hull, { map: planksH, repeat: [1, 1.5], shade: "#b79bc6" }),
    trim: toon(PALETTE.trim, { shade: "#b7c2ea" }),
    glass: toon(PALETTE.glass, { shade: "#9fb0e0" }),
    metal: toon(PALETTE.metal),
    tire: toon(PALETTE.tire, { shade: "#8a90b4" }),
    chimney: toon(PALETTE.chimney),
    soot: toon(PALETTE.soot),
    lamp: toon("#ffd27e", { shade: "#ffffff" }),
    pier: toon(PALETTE.pier, { shade: "#a9b6da" }),
    pierDeck: toon(PALETTE.pierDeck, { map: planksH, repeat: [1, 8], shade: "#a9b6da" }),
    rock: toon(PALETTE.rock, { shade: "#a0a9da" }),
    grass: toon(PALETTE.grass, { shade: "#9fbad0" }),
    leaf: toon(PALETTE.leaf, { flat: true, shade: "#a9b4e2" }),
    trunk: toon(PALETTE.trunk),
    buoy: toon(PALETTE.buoy),
    white: toon(PALETTE.trim, { shade: "#b7c2ea" }),
    farRock: toon(far(PALETTE.rock, 0.62), { fog: false, shade: "#e2ebf6" }),
    farLeaf: toon(far(PALETTE.leaf, 0.55), { fog: false, flat: true, shade: "#e2ebf6" }),
    water: new THREE.ShaderMaterial({
      uniforms: {
        ...fogUniforms(),
        uTime: SHARED.uTime,
        uBoat: { value: new THREE.Vector3() },
        uWater: { value: new THREE.Color(PALETTE.water) },
        uDeep: { value: new THREE.Color(PALETTE.waterDeep) },
        uLight: { value: new THREE.Color(PALETTE.waterLight) },
        uShadow: { value: new THREE.Color(PALETTE.waterShadow) },
        uFoam: { value: new THREE.Color(PALETTE.foam) },
      },
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      fog: true,
    }),
    collar: overlay(COLLAR_FRAG, { uTime: SHARED.uTime }, true),
    hullFoam: overlay(HULL_FOAM_FRAG, { uThrottle: SHARED.uThrottle, uSize: { value: new THREE.Vector2(4.4, 5.6) } }),
    sky: new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color(PALETTE.skyTop) }, uHorizon: { value: new THREE.Color(PALETTE.sky) } },
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  };
}

let materialCache: ReturnType<typeof createMaterials> | null = null;
const materials = () => (materialCache ??= createMaterials());

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Top-down hull outline (x, forward), shrunk by `o` on every side. */
function hullOutline(o = 0) {
  const w = HULL.halfWidth - o;
  const s = HULL.stern - o;
  const b = HULL.bow - o;
  const r = Math.max(0.08, 0.42 - o);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -s);
  shape.lineTo(w - r, -s);
  shape.quadraticCurveTo(w, -s, w, -s + r);
  shape.lineTo(w, 0.35);
  shape.bezierCurveTo(w, 1.15 - o * 0.5, 0.48 - o * 0.3, b, 0, b);
  shape.bezierCurveTo(-0.48 + o * 0.3, b, -w, 1.15 - o * 0.5, -w, 0.35);
  shape.lineTo(-w, -s + r);
  shape.quadraticCurveTo(-w, -s, -w + r, -s);
  return shape;
}

/**
 * Extrudes a shape upward from y0, then splits the caps from the sides. Each half is
 * welded on its own so the sides shade smoothly while the cap edge stays crisp.
 */
function extrudeUp(shape: THREE.Shape, depth: number, bevel: number, y0: number, warp?: (v: THREE.Vector3) => void) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  });
  g.rotateX(-Math.PI / 2); // extrusion → +y, shape forward → -z
  g.translate(0, y0 + bevel, 0);
  const pos = g.getAttribute("position");
  if (warp) {
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      warp(v.fromBufferAttribute(pos, i));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  const part = (group: { start: number; count: number }) => {
    const out = new THREE.BufferGeometry();
    const src = pos.array as Float32Array;
    out.setAttribute(
      "position",
      new THREE.BufferAttribute(src.slice(group.start * 3, (group.start + group.count) * 3), 3),
    );
    const welded = mergeVertices(out, 1e-4);
    welded.computeVertexNormals();
    return welded;
  };
  const [caps, sides] = g.groups;
  const result = { caps: part(caps), sides: part(sides) };
  g.dispose();
  return result;
}

function railCurve(y: number) {
  const x = 0.98;
  const zs = 1.43;
  const zf = 0.38;
  const r = 0.35;
  const v = (a: number, b: number) => new THREE.Vector3(a, y, b);
  const path = new THREE.CurvePath<THREE.Vector3>();
  path.add(new THREE.LineCurve3(v(-x, zf), v(-x, zs - r)));
  path.add(new THREE.QuadraticBezierCurve3(v(-x, zs - r), v(-x, zs), v(-x + r, zs)));
  path.add(new THREE.LineCurve3(v(-x + r, zs), v(x - r, zs)));
  path.add(new THREE.QuadraticBezierCurve3(v(x - r, zs), v(x, zs), v(x, zs - r)));
  path.add(new THREE.LineCurve3(v(x, zs - r), v(x, zf)));
  return path;
}

const TIRES = [
  { x: 1.13, y: 0.2, z: 1.0, r: 0.21 },
  { x: -1.13, y: 0.2, z: 1.0, r: 0.21 },
  { x: 1.12, y: 0.25, z: -0.3, r: 0.17 },
  { x: -1.12, y: 0.25, z: -0.3, r: 0.17 },
];

function createBoatGeometry() {
  // Pull the lower hull in so it reads as a tub, not a slab.
  const hull = extrudeUp(hullOutline(HULL.bevel), HULL.height, HULL.bevel, HULL.bottom, (v) => {
    const t = smooth(HULL.bottom, 0.2, v.y);
    v.x *= 0.8 + 0.2 * t;
    v.z = (v.z + 0.14) * (0.93 + 0.07 * t) - 0.14;
  });
  setUv(hull.sides, (x, y, z) => [(x - z) * 0.6, (y - HULL.bottom) * 1.25]);
  setUv(hull.caps, (x, _y, z) => [z * 0.6, x * 1.6]);

  const rimShape = hullOutline(0);
  rimShape.holes.push(hullOutline(0.115));
  const rim = extrudeUp(rimShape, 0.07, 0.025, DECK_Y - 0.02);

  const stripPts = hullOutline(-0.025)
    .getSpacedPoints(96)
    .map((p) => new THREE.Vector3(p.x, 0.3, -p.y));
  const strip = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stripPts, true), 160, 0.05, 8, true);

  const curve = railCurve(RIM_TOP + 0.3);
  const railParts: THREE.BufferGeometry[] = [new THREE.TubeGeometry(curve, 90, 0.03, 6, false)];
  for (const p of curve.getSpacedPoints(11)) {
    railParts.push(place(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 6), p.x, RIM_TOP + 0.15, p.z));
  }
  // Short ropes from the rim down to each tyre.
  const ropeParts = TIRES.map((t) =>
    place(
      new THREE.CylinderGeometry(0.016, 0.016, RIM_TOP - t.y - t.r + 0.04, 5),
      Math.sign(t.x) * 1.07,
      (RIM_TOP + t.y + t.r) / 2,
      t.z,
    ),
  );

  return {
    hullSides: hull.sides,
    deck: hull.caps,
    rim: mergeGeometries([rim.caps, rim.sides]),
    strip,
    rail: mergeGeometries(railParts.map((g) => g.toNonIndexed())),
    ropes: mergeGeometries(ropeParts),
    tire: new THREE.TorusGeometry(1, 0.42, 10, 22),
    box: new THREE.BoxGeometry(1, 1, 1),
    roof: new RoundedBoxGeometry(1.52, 0.16, 1.32, 2, 0.05),
    stack: new THREE.CylinderGeometry(0.19, 0.22, CHIMNEY.height, 20),
    lip: new THREE.TorusGeometry(0.19, 0.045, 8, 24).rotateX(Math.PI / 2),
    collarRing: new THREE.TorusGeometry(0.23, 0.04, 8, 24).rotateX(Math.PI / 2),
    hole: new THREE.CircleGeometry(0.17, 20).rotateX(-Math.PI / 2),
    mast: new THREE.CylinderGeometry(0.02, 0.025, 0.5, 6),
    bulb: new THREE.SphereGeometry(0.055, 10, 8),
  };
}

const PIER = { halfWidth: 1.5, height: 3.6, long: 9.6, short: 5 };

/** Post positions (x, z) of a pier, shared by its geometry and its collision circles. */
function pierPosts(length: number) {
  const bents = Math.round(length / 2.4) + 1;
  const step = length / (bents - 1);
  const posts: [number, number][] = [];
  for (let b = 0; b < bents; b++) {
    for (const side of [-1, 1]) posts.push([side * PIER.halfWidth, -length / 2 + b * step]);
  }
  return { posts, bents, step };
}

function createPierGeometry(length: number) {
  const W = PIER.halfWidth;
  const H = PIER.height;
  const { posts, bents, step } = pierPosts(length);
  const frame: THREE.BufferGeometry[] = [];
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, rz = 0) =>
    frame.push(place(new THREE.BoxGeometry(w, h, d), x, y, z, rx, 0, rz));
  const diagX = Math.hypot(2 * W, H - 0.6);
  const angX = Math.atan2(H - 0.6, 2 * W);
  const diagZ = Math.hypot(step, H - 0.6);
  const angZ = Math.atan2(H - 0.6, step);
  const braceY = 0.3 + (H - 0.6) / 2;
  for (const [x, z] of posts) box(0.24, H + 1.2, 0.24, x, (H - 1.2) / 2, z);
  for (let b = 0; b < bents; b++) {
    const z = -length / 2 + b * step;
    box(diagX, 0.1, 0.08, 0, braceY, z, 0, angX);
    box(diagX, 0.1, 0.08, 0, braceY, z, 0, -angX);
    box(2 * W + 0.4, 0.18, 0.2, 0, H - 0.1, z);
    if (b < bents - 1) {
      for (const side of [-1, 1]) {
        box(0.08, 0.1, diagZ, side * W, braceY, z + step / 2, angZ);
        box(0.08, 0.1, diagZ, side * W, braceY, z + step / 2, -angZ);
      }
    }
  }
  for (const side of [-1, 1]) box(0.16, 0.22, length + 0.4, side * (W - 0.3), H, 0);
  // A handrail along one edge of the walkway.
  for (let k = 0; k <= 6; k++) box(0.08, 0.6, 0.08, W + 0.15, H + 0.6, -length / 2 + (k * length) / 6);
  box(0.08, 0.08, length, W + 0.15, H + 0.9, 0);

  return {
    frame: mergeGeometries(frame),
    deck: place(new THREE.BoxGeometry(2 * W + 0.6, 0.18, length + 0.6), 0, H + 0.2, 0),
    collars: mergeGeometries(
      posts.map(([x, z]) => place(new THREE.PlaneGeometry(0.75, 0.75), x, 0.03, z, -Math.PI / 2)),
    ),
  };
}

function createRockGeometry() {
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, 48, 32);
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g = mergeVertices(g);
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    let y = p.getY(i) * 1.3;
    const bulge = 1 + 0.14 * Math.exp(-((y - 0.45) ** 2) / 0.25); // overhang above the waterline
    const lump = 1 + 0.14 * (noise(x * 1.7 + z * 0.9 + 4, y * 1.6 + z * 1.3) - 0.5);
    if (y > 1) y = 1 + (y - 1) * 0.25; // flat top for the grass
    p.setXYZ(i, x * bulge * lump, y, z * bulge * lump);
  }
  g.computeVertexNormals();
  return g;
}

function createSceneryGeometry() {
  return {
    pierLong: createPierGeometry(PIER.long),
    pierShort: createPierGeometry(PIER.short),
    rock: createRockGeometry(),
    pillow: new THREE.SphereGeometry(1, 28, 14),
    canopy: new THREE.IcosahedronGeometry(1, 1),
    trunk: new THREE.CylinderGeometry(0.07, 0.1, 1, 6),
    buoy: new THREE.CylinderGeometry(0.17, 0.2, 0.55, 14),
    buoyBand: new THREE.CylinderGeometry(0.205, 0.205, 0.12, 14),
    plane: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  };
}

let boatGeoCache: ReturnType<typeof createBoatGeometry> | null = null;
let sceneryGeoCache: ReturnType<typeof createSceneryGeometry> | null = null;
const boatGeometry = () => (boatGeoCache ??= createBoatGeometry());
const sceneryGeometry = () => (sceneryGeoCache ??= createSceneryGeometry());

// ---------------------------------------------------------------------------
// The world: deterministic chunks of props, and their collision circles
// ---------------------------------------------------------------------------

type PropKind = "pier" | "pierShort" | "rock" | "island" | "buoy";
type Placed = { kind: PropKind; x: number; z: number; rot: number; scale: number };
type Obstacle = { x: number; z: number; r: number };
type ChunkData = { props: Placed[]; obstacles: Obstacle[] };

/** A hand-placed opening view, so the first frame isn't empty sea. */
const START_PROPS: Record<string, Placed[]> = {
  "-1,-1": [
    { kind: "rock", x: -9, z: -24, rot: 0.6, scale: 2.6 },
    { kind: "buoy", x: -4.8, z: -13, rot: 0, scale: 1 },
    { kind: "island", x: -26, z: -34, rot: 1.2, scale: 1 },
  ],
  "0,-1": [
    { kind: "pier", x: 11, z: -30, rot: 0.1, scale: 1 },
    { kind: "buoy", x: 5.2, z: -20, rot: 0, scale: 1 },
  ],
  "-1,0": [],
  "0,0": [],
};

function obstaclesFor(p: Placed): Obstacle[] {
  const at = (lx: number, lz: number, r: number): Obstacle => {
    const [dx, dz] = rotY(lx * p.scale, lz * p.scale, p.rot);
    return { x: p.x + dx, z: p.z + dz, r: r * p.scale };
  };
  switch (p.kind) {
    case "rock":
      return [at(0, 0, 1.15)];
    case "island":
      return [at(-1.1, 0, 1.45), at(1.1, 0, 1.45), at(0, 0, 2.05)];
    case "buoy":
      return [at(0, 0, 0.3)];
    case "pier":
    case "pierShort":
      return pierPosts(p.kind === "pier" ? PIER.long : PIER.short).posts.map(([x, z]) => at(x, z, 0.2));
  }
}

function buildChunk(cx: number, cz: number): ChunkData {
  const start = START_PROPS[`${cx},${cz}`];
  if (start) return { props: start, obstacles: start.flatMap(obstaclesFor) };

  const rand = seeded(hashCell(cx, cz));
  const spot = () => [(cx + 0.2 + rand() * 0.6) * CHUNK, (cz + 0.2 + rand() * 0.6) * CHUNK] as const;
  const props: Placed[] = [];
  const roll = rand();
  const [x, z] = spot();
  const rot = rand() * Math.PI * 2;
  if (roll < 0.16) props.push({ kind: "pier", x, z, rot, scale: 1 });
  else if (roll < 0.27) props.push({ kind: "pierShort", x, z, rot, scale: 1 });
  else if (roll < 0.52) props.push({ kind: "rock", x, z, rot, scale: 1.8 + rand() * 1.4 });
  else if (roll < 0.64) props.push({ kind: "island", x, z, rot, scale: 0.9 + rand() * 0.4 });
  if (rand() < 0.5) {
    const [bx, bz] = spot();
    // keep buoys clear of whatever else is in the cell
    if (!props.length || Math.hypot(bx - x, bz - z) > 9) props.push({ kind: "buoy", x: bx, z: bz, rot: 0, scale: 1 });
  }
  return { props, obstacles: props.flatMap(obstaclesFor) };
}

const chunkCache = new Map<string, ChunkData>();
function chunkData(cx: number, cz: number) {
  const key = `${cx},${cz}`;
  let data = chunkCache.get(key);
  if (!data) {
    data = buildChunk(cx, cz);
    chunkCache.set(key, data);
    if (chunkCache.size > 600) chunkCache.delete(chunkCache.keys().next().value!);
  }
  return data;
}

function nearbyObstacles(wx: number, wz: number) {
  const cx = Math.floor(wx / CHUNK);
  const cz = Math.floor(wz / CHUNK);
  const out: Obstacle[] = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) out.push(...chunkData(cx + dx, cz + dz).obstacles);
  return out;
}

// ---------------------------------------------------------------------------
// Simulation state
// ---------------------------------------------------------------------------

type Input = { x: number; active: boolean; boost: boolean; keyDir: number; keyBoost: boolean; keyBrake: boolean };

type Sim = {
  time: number;
  travel: number; // total distance sailed
  speed: number;
  throttle: number;
  wx: number; // boat position in the world, JS doubles
  wz: number;
  ox: number; // render origin: a multiple of WRAP, so tiled patterns don't jump when it moves
  oz: number;
  yaw: number;
  yawVel: number;
  camYaw: number;
  heave: number;
  pitch: number;
  roll: number;
  bump: number;
  intro: number;
  stern: THREE.Vector3; // stern at the waterline, world space
  chimney: THREE.Vector3; // mouth of the stack, world space
  splash: { t: number; x: number; z: number }; // last collision, world space
};

const createSim = (): Sim => ({
  time: 0,
  travel: 0,
  speed: SPEED.cruise,
  throttle: 0,
  wx: 0,
  wz: 0,
  ox: 0,
  oz: 0,
  yaw: 0,
  yawVel: 0,
  camYaw: 0,
  heave: 0,
  pitch: 0,
  roll: 0,
  bump: 0,
  intro: 0,
  stern: new THREE.Vector3(0, 0, HULL.stern),
  chimney: new THREE.Vector3(0, CHIMNEY.top, CHIMNEY.z),
  splash: { t: -99, x: 0, z: 0 },
});

type SimRef = React.RefObject<Sim>;

const BOAT_CIRCLES = [
  { z: -0.85, r: 0.95 },
  { z: 0.75, r: 1.0 },
];

/** Pushes the boat out of anything solid and returns the deepest contact, if any. */
function collide(s: Sim, obstacles: Obstacle[]) {
  let depth = 0;
  let hx = 0;
  let hz = 0;
  for (const c of BOAT_CIRCLES) {
    const [ox, oz] = rotY(0, c.z, s.yaw);
    for (const o of obstacles) {
      const dx = s.wx + ox - o.x;
      const dz = s.wz + oz - o.z;
      const d = Math.hypot(dx, dz);
      const overlap = o.r + c.r - d;
      if (overlap <= 0 || d < 1e-6) continue;
      s.wx += (dx / d) * overlap;
      s.wz += (dz / d) * overlap;
      if (overlap > depth) {
        depth = overlap;
        hx = o.x + (dx / d) * o.r;
        hz = o.z + (dz / d) * o.r;
      }
    }
  }
  return depth > 0 ? { x: hx, z: hz } : null;
}

/** A lazy wander that swerves away from anything in the boat's path. */
function autopilot(s: Sim, obstacles: Obstacle[]) {
  let rudder = Math.sin(s.time * 0.23) * 0.35 + Math.sin(s.time * 0.61 + 1) * 0.15;
  const [fx, fz] = rotY(0, -1, s.yaw);
  const [rx, rz] = rotY(1, 0, s.yaw);
  let nearest = Infinity;
  for (const o of obstacles) {
    const dx = o.x - s.wx;
    const dz = o.z - s.wz;
    const ahead = dx * fx + dz * fz;
    const side = dx * rx + dz * rz;
    if (ahead > 0 && ahead < 16 && Math.abs(side) < o.r + 2.4 && ahead < nearest) {
      nearest = ahead;
      rudder = side > 0 ? -1 : 1;
    }
  }
  return rudder;
}

/** Steps the boat and the camera. Mounted first, so it runs before every reader. */
function Driver({ simRef, inputRef, reduced }: { simRef: SimRef; inputRef: React.RefObject<Input>; reduced: boolean }) {
  const scratch = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(0, 0, 0, "YXZ"),
      p: new THREE.Vector3(),
      one: new THREE.Vector3(1, 1, 1),
      cam: new THREE.Vector3(),
      look: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const s = simRef.current;
    const inp = inputRef.current;
    s.time += dt;
    const t = s.time;
    const obstacles = nearbyObstacles(s.wx, s.wz);

    // Rudder: keys win, then the pointer (with a small dead zone), then the autopilot.
    let rudder: number;
    if (inp.keyDir) rudder = inp.keyDir;
    else if (inp.active)
      rudder = THREE.MathUtils.clamp(Math.sign(inp.x) * Math.max(0, Math.abs(inp.x) - 0.06) * 1.8, -1, 1);
    else rudder = autopilot(s, obstacles);

    const boosting = inp.boost || inp.keyBoost;
    s.throttle = THREE.MathUtils.damp(s.throttle, boosting ? 1 : 0, boosting ? 1.6 : 1.1, dt);
    const top = reduced ? SPEED.calm * 1.8 : SPEED.full;
    const cruise = reduced ? SPEED.calm : SPEED.cruise;
    s.speed = THREE.MathUtils.damp(s.speed, inp.keyBrake ? SPEED.slow : lerp(cruise, top, s.throttle), 1.4, dt);

    // Turn harder the faster we go, but keep some steerage when crawling.
    const steerage = 0.45 + 0.55 * Math.min(1, s.speed / SPEED.cruise);
    s.yawVel = THREE.MathUtils.damp(s.yawVel, -rudder * TURN * steerage, 4, dt);
    s.yaw += s.yawVel * dt;
    const [fx, fz] = rotY(0, -1, s.yaw);
    s.wx += fx * s.speed * dt;
    s.wz += fz * s.speed * dt;
    s.travel += s.speed * dt;

    const hit = collide(s, obstacles);
    if (hit) {
      if (t - s.splash.t > 0.5 && s.speed > 2.2) {
        s.splash.t = t;
        s.splash.x = hit.x;
        s.splash.z = hit.z;
        s.bump = Math.min(1, s.speed / SPEED.cruise);
      }
      s.speed = Math.min(s.speed, 1.8);
    }
    s.bump = THREE.MathUtils.damp(s.bump, 0, 2.5, dt);
    s.ox = Math.round(s.wx / WRAP) * WRAP;
    s.oz = Math.round(s.wz / WRAP) * WRAP;

    // Buoyancy: sines at unrelated frequencies, so the motion never visibly loops.
    const amp = reduced ? 0.35 : 1;
    const shake = s.bump * Math.sin(t * 15);
    s.heave = amp * (0.05 * Math.sin(t * 1.7) + 0.025 * Math.sin(t * 2.9 + 1.3)) + s.throttle * 0.04;
    s.pitch = amp * 0.022 * Math.sin(t * 1.25 + 0.4) + s.throttle * 0.055 + shake * 0.05;
    s.roll = amp * 0.03 * Math.sin(t * 1.05 + 2) + s.yawVel * 0.1 + shake * 0.1;

    const { m, q, e, p, one, cam, look } = scratch;
    e.set(s.pitch, s.yaw, s.roll, "YXZ");
    q.setFromEuler(e);
    m.compose(p.set(s.wx, s.heave, s.wz), q, one);
    s.stern
      .set(0, 0, HULL.stern + 0.05)
      .applyMatrix4(m)
      .setY(0);
    s.chimney.set(0, CHIMNEY.top, CHIMNEY.z).applyMatrix4(m);

    SHARED.uTime.value = t;
    SHARED.uThrottle.value = s.throttle;

    // Camera: an establishing orbit from the front-left that settles into a chase view
    // trailing the boat's heading, lagging enough in turns to show the hull's side.
    s.camYaw = THREE.MathUtils.damp(s.camYaw, s.yaw, 2.4, dt);
    s.intro = reduced ? 1 : clamp01((t - 0.2) / 2.6);
    const k = 1 - Math.pow(1 - s.intro, 4);
    const back = state.size.width < state.size.height ? 1.45 : 1;
    const angle = s.camYaw + lerp(-1.9, 0, k);
    const radius = lerp(11, (8.2 + s.throttle * 0.8) * back, k);
    const height = lerp(7.5, (4.6 - s.throttle * 0.2) * back, k);
    const bx = s.wx - s.ox;
    const bz = s.wz - s.oz;
    cam.set(bx + Math.sin(angle) * radius, height, bz + Math.cos(angle) * radius);
    state.camera.position.copy(cam);
    const ahead = lerp(0, 2.5, k);
    look.set(bx - Math.sin(s.camYaw) * ahead, lerp(0.9, 0.2, k), bz - Math.cos(s.camYaw) * ahead);
    state.camera.lookAt(look);

    const camera = state.camera as THREE.PerspectiveCamera;
    const fov = 50 + s.throttle * 6;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// Sky, sea and horizon
// ---------------------------------------------------------------------------

function Sky() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => ref.current?.position.copy(state.camera.position));
  return (
    <mesh ref={ref} material={materials().sky} renderOrder={-1}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  );
}

/** One big plane that follows the boat; its pattern is pinned to the world, not the plane. */
function Sea({ simRef }: { simRef: SimRef }) {
  const ref = useRef<THREE.Mesh>(null);
  const m = materials();
  useFrame(() => {
    const s = simRef.current;
    const bx = s.wx - s.ox;
    const bz = s.wz - s.oz;
    ref.current?.position.set(bx, 0, bz);
    (m.water.uniforms.uBoat.value as THREE.Vector3).set(bx, bz, s.yaw);
  });
  return (
    <mesh ref={ref} material={m.water} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[440, 440]} />
    </mesh>
  );
}

/** A ring of hills past the fog that travels with the camera, so it reads as infinitely far. */
function Horizon() {
  const ref = useRef<THREE.Group>(null);
  const m = materials();
  const g = sceneryGeometry();
  const hills = useMemo(() => {
    const rand = seeded(29);
    const count = 16;
    return Array.from({ length: count }, (_, i) => {
      const angle = ((i + rand() * 0.6) / count) * Math.PI * 2;
      const dist = 165 + rand() * 25;
      return {
        x: Math.sin(angle) * dist,
        z: Math.cos(angle) * dist,
        angle,
        sx: 14 + rand() * 16,
        sy: 4 + rand() * 7,
        trees: Math.floor(rand() * 4),
      };
    });
  }, []);
  useFrame((state) => ref.current?.position.set(state.camera.position.x, -1.5, state.camera.position.z));
  return (
    <group ref={ref}>
      {hills.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]} rotation-y={h.angle}>
          <mesh geometry={g.rock} material={m.farRock} scale={[h.sx, h.sy, h.sx * 0.6]} />
          {Array.from({ length: h.trees }, (_, k) => (
            <mesh
              key={k}
              geometry={g.canopy}
              material={m.farLeaf}
              position={[(k - h.trees / 2) * h.sx * 0.3, h.sy * 1.05 + 1.5, 0]}
              scale={2.4}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The tug
// ---------------------------------------------------------------------------

type BoxSpec = {
  m: "trim" | "door" | "glass" | "cabin" | "strip";
  s: [number, number, number];
  p: [number, number, number];
};

const cabinY = DECK_Y + CABIN.h / 2;
const backZ = CABIN.z + CABIN.d / 2;
const frontZ = CABIN.z - CABIN.d / 2;
const CABIN_BOXES: BoxSpec[] = [
  { m: "cabin", s: [CABIN.w, CABIN.h, CABIN.d], p: [0, cabinY, CABIN.z] },
  // white corner posts
  ...[-1, 1].flatMap((sx) =>
    [backZ, frontZ].map((z): BoxSpec => ({
      m: "trim",
      s: [0.13, CABIN.h + 0.04, 0.13],
      p: [sx * CABIN.w * 0.5, cabinY, z],
    })),
  ),
  // back door with its frame
  { m: "door", s: [0.5, 0.62, 0.05], p: [0, DECK_Y + 0.31, backZ + 0.02] },
  { m: "trim", s: [0.09, 0.68, 0.07], p: [-0.29, DECK_Y + 0.34, backZ + 0.03] },
  { m: "trim", s: [0.09, 0.68, 0.07], p: [0.29, DECK_Y + 0.34, backZ + 0.03] },
  { m: "trim", s: [0.67, 0.08, 0.07], p: [0, DECK_Y + 0.68, backZ + 0.03] },
  // side and front windows
  ...[-1, 1].flatMap((sx): BoxSpec[] => [
    { m: "trim", s: [0.03, 0.38, 0.58], p: [sx * (CABIN.w / 2 + 0.005), DECK_Y + 0.52, CABIN.z] },
    { m: "glass", s: [0.03, 0.3, 0.5], p: [sx * (CABIN.w / 2 + 0.015), DECK_Y + 0.52, CABIN.z] },
  ]),
  { m: "trim", s: [0.98, 0.38, 0.03], p: [0, DECK_Y + 0.52, frontZ - 0.005] },
  { m: "glass", s: [0.4, 0.3, 0.03], p: [-0.23, DECK_Y + 0.52, frontZ - 0.015] },
  { m: "glass", s: [0.4, 0.3, 0.03], p: [0.23, DECK_Y + 0.52, frontZ - 0.015] },
  // rudder post on the transom
  { m: "strip", s: [0.1, 0.42, 0.12], p: [0, 0.02, HULL.stern + 0.02] },
];

function Boat({ simRef }: { simRef: SimRef }) {
  const ref = useRef<THREE.Group>(null);
  const m = materials();
  const g = boatGeometry();

  useFrame(() => {
    const s = simRef.current;
    const o = ref.current;
    if (!o) return;
    o.position.set(s.wx - s.ox, s.heave, s.wz - s.oz);
    o.rotation.set(s.pitch, s.yaw, s.roll, "YXZ");
  });

  return (
    <group ref={ref}>
      <mesh geometry={g.hullSides} material={m.hull} />
      <mesh geometry={g.deck} material={m.deck} />
      <mesh geometry={g.rim} material={m.rim} />
      <mesh geometry={g.strip} material={m.strip} />
      <mesh geometry={g.rail} material={m.metal} />
      <mesh geometry={g.ropes} material={m.metal} />
      {TIRES.map((t, i) => (
        <mesh
          key={i}
          geometry={g.tire}
          material={m.tire}
          position={[t.x, t.y, t.z]}
          rotation={[0, Math.PI / 2, Math.sign(t.x) * 0.12, "ZYX"]}
          scale={t.r}
        />
      ))}
      {CABIN_BOXES.map((b, i) => (
        <mesh key={i} geometry={g.box} material={m[b.m]} position={b.p} scale={b.s} />
      ))}
      <mesh geometry={g.roof} material={m.roof} position={[0, ROOF_TOP - 0.08, CABIN.z]} />
      <group position={[0, ROOF_TOP, CHIMNEY.z]}>
        <mesh geometry={g.stack} material={m.chimney} position-y={CHIMNEY.height / 2} />
        <mesh geometry={g.lip} material={m.chimney} position-y={CHIMNEY.height} />
        <mesh geometry={g.hole} material={m.soot} position-y={CHIMNEY.height - 0.02} />
        <mesh geometry={g.collarRing} material={m.chimney} position-y={0.03} />
      </group>
      <group position={[0.5, ROOF_TOP, CABIN.z - 0.5]}>
        <mesh geometry={g.mast} material={m.metal} position-y={0.25} />
        <mesh geometry={g.bulb} material={m.lamp} position-y={0.52} />
      </group>
    </group>
  );
}

function HullFoam({ simRef }: { simRef: SimRef }) {
  const ref = useRef<THREE.Mesh>(null);
  const m = materials();
  useFrame(() => {
    const s = simRef.current;
    ref.current?.position.set(s.wx - s.ox, 0.035, s.wz - s.oz);
    ref.current?.rotation.set(0, s.yaw, 0);
  });
  // The flat unit plane scaled to the foam's footprint; uv maps straight to boat-local space.
  return <mesh ref={ref} geometry={sceneryGeometry().plane} material={m.hullFoam} scale={[4.4, 1, 5.6]} />;
}

// ---------------------------------------------------------------------------
// Wake: a ribbon rebuilt every frame along the stern's recent path
// ---------------------------------------------------------------------------

const WAKE_SAMPLES = 150;
const WAKE_STEP = 0.14; // one sample per this much travel, so resolution ignores speed
const WAKE_LENGTH = WAKE_SAMPLES * WAKE_STEP;

/** Ring buffer of the stern's path in world space, newest at `head`. */
type WakeHistory = {
  s: Float64Array;
  x: Float64Array;
  z: Float64Array;
  yaw: Float32Array;
  head: number;
  count: number;
  last: number;
};

function Wake({ simRef }: { simRef: SimRef }) {
  const historyRef = useRef<WakeHistory | null>(null);
  const { geometry, material } = useMemo(() => {
    const n = WAKE_SAMPLES + 1; // + the live point at the stern
    const geo = new THREE.BufferGeometry();
    const dynamic = (size: number, itemSize: number) =>
      new THREE.BufferAttribute(new Float32Array(size * itemSize), itemSize).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", dynamic(n * 2, 3));
    geo.setAttribute("aDist", dynamic(n * 2, 1));
    geo.setAttribute("aS", dynamic(n * 2, 1));
    geo.setAttribute(
      "aSide",
      new THREE.BufferAttribute(
        Float32Array.from({ length: n * 2 }, (_, i) => (i % 2 ? 1 : -1)),
        1,
      ),
    );
    const index: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); // wound to face up, or it's culled
    }
    geo.setIndex(index);
    geo.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uLength: { value: WAKE_LENGTH },
        uThrottle: SHARED.uThrottle,
        uFoam: { value: new THREE.Color(PALETTE.foam) },
      },
      vertexShader: WAKE_VERT,
      fragmentShader: WAKE_FRAG,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    return { geometry: geo, material: mat };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const s = simRef.current;
    const h = (historyRef.current ??= {
      s: new Float64Array(WAKE_SAMPLES),
      x: new Float64Array(WAKE_SAMPLES),
      z: new Float64Array(WAKE_SAMPLES),
      yaw: new Float32Array(WAKE_SAMPLES),
      head: -1,
      count: 0,
      last: -Infinity,
    });
    if (s.travel - h.last >= WAKE_STEP) {
      h.head = (h.head + 1) % WAKE_SAMPLES;
      h.s[h.head] = s.travel;
      h.x[h.head] = s.stern.x;
      h.z[h.head] = s.stern.z;
      h.yaw[h.head] = s.yaw;
      h.count = Math.min(h.count + 1, WAKE_SAMPLES);
      h.last = s.travel;
    }
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const dist = geometry.getAttribute("aDist") as THREE.BufferAttribute;
    const em = geometry.getAttribute("aS") as THREE.BufferAttribute;
    const write = (i: number, emitted: number, x: number, z: number, yaw: number) => {
      const d = s.travel - emitted;
      const half = 0.95 + d * 0.1 + s.throttle * 0.08;
      // spread across the boat's beam at the moment it passed, in render space
      const rx = Math.cos(yaw) * half;
      const rz = -Math.sin(yaw) * half;
      const px = x - s.ox;
      const pz = z - s.oz;
      pos.setXYZ(i * 2, px - rx, 0.03, pz - rz);
      pos.setXYZ(i * 2 + 1, px + rx, 0.03, pz + rz);
      dist.setX(i * 2, d);
      dist.setX(i * 2 + 1, d);
      em.setX(i * 2, emitted % S_WRAP);
      em.setX(i * 2 + 1, emitted % S_WRAP);
    };
    write(0, s.travel, s.stern.x, s.stern.z, s.yaw);
    for (let k = 0; k < h.count; k++) {
      const j = (h.head - k + WAKE_SAMPLES) % WAKE_SAMPLES;
      write(k + 1, h.s[j], h.x[j], h.z[j], h.yaw[j]);
    }
    pos.needsUpdate = true;
    dist.needsUpdate = true;
    em.needsUpdate = true;
    geometry.setDrawRange(0, h.count * 6);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

// ---------------------------------------------------------------------------
// Ripples: dashed rings dropped behind the stern, and a burst wherever you hit something
// ---------------------------------------------------------------------------

const RIPPLES = 12;
const RIPPLE_LIFE = 1.5;

type Ripple = {
  born: number;
  s: number;
  x: number;
  z: number;
  fx: number;
  fz: number;
  yaw: number;
  follow: number;
  size: number;
};

function Ripples({ simRef }: { simRef: SimRef }) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const poolRef = useRef<Ripple[] | null>(null);
  const clock = useRef({ last: 0, next: 0, splash: -99 });
  const mats = useMemo(
    () =>
      Array.from(
        { length: RIPPLES },
        (_, i) =>
          new THREE.ShaderMaterial({
            uniforms: {
              uLife: { value: 1 },
              uSeed: { value: i * 1.37 },
              uColor: { value: new THREE.Color(i % 3 === 1 ? PALETTE.ripple : PALETTE.foam) },
            },
            vertexShader: OVERLAY_VERT,
            fragmentShader: RIPPLE_FRAG,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
          }),
      ),
    [],
  );

  useEffect(() => () => mats.forEach((mat) => mat.dispose()), [mats]);

  useFrame(() => {
    const s = simRef.current;
    const c = clock.current;
    const pool = (poolRef.current ??= Array.from({ length: RIPPLES }, () => ({
      born: -99,
      s: 0,
      x: 0,
      z: 0,
      fx: 0,
      fz: 0,
      yaw: 0,
      follow: 0,
      size: 1,
    })));
    const spawn = (x: number, z: number, follow: number, size: number) => {
      const r = pool[c.next];
      const [fx, fz] = rotY(0, -1, s.yaw);
      Object.assign(r, { born: s.time, s: s.travel, x, z, fx, fz, yaw: s.yaw, follow, size });
      const mesh = meshes.current[c.next];
      if (mesh) (mesh.material as THREE.ShaderMaterial).uniforms.uSeed.value = Math.random() * 10;
      c.next = (c.next + 1) % RIPPLES;
    };
    if (s.time - c.last > lerp(0.55, 0.26, s.throttle)) {
      c.last = s.time;
      const [jx, jz] = rotY((Math.random() - 0.5) * 0.4, 0.25, s.yaw);
      // Carried along at most of the boat's speed, so the churn lingers near the stern.
      spawn(s.stern.x + jx, s.stern.z + jz, 0.65, 1);
    }
    if (s.splash.t !== c.splash) {
      c.splash = s.splash.t;
      spawn(s.splash.x, s.splash.z, 0, 1.6);
      spawn(s.splash.x, s.splash.z, 0, 1.1);
    }
    pool.forEach((r, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const life = (s.time - r.born) / RIPPLE_LIFE;
      mesh.visible = life < 1;
      if (!mesh.visible) return;
      const radius = (0.45 + 0.8 * (1 - Math.pow(1 - life, 3))) * r.size;
      const carried = (s.travel - r.s) * r.follow;
      mesh.scale.set(radius * 2.3, 1, radius * 2);
      mesh.rotation.y = r.yaw;
      mesh.position.set(r.x + r.fx * carried - s.ox, 0.04, r.z + r.fz * carried - s.oz);
      (mesh.material as THREE.ShaderMaterial).uniforms.uLife.value = life;
    });
  });

  const plane = sceneryGeometry().plane;
  return (
    <>
      {mats.map((mat, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={plane}
          material={mat}
          visible={false}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Smoke from the stack
// ---------------------------------------------------------------------------

const PUFFS = 36;
const PUFF_LIFE = 2.4;
/** `pos` is world space; `carry` is the boat's momentum the puff left with, fading out. */
type Puff = { born: number; pos: THREE.Vector3; vel: THREE.Vector3; carry: THREE.Vector2; size: number };

function Smoke({ simRef }: { simRef: SimRef }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const puffsRef = useRef<Puff[] | null>(null);
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute("aAge", new THREE.InstancedBufferAttribute(new Float32Array(PUFFS).fill(1), 1));
    geo.setAttribute(
      "aSeed",
      new THREE.InstancedBufferAttribute(
        Float32Array.from({ length: PUFFS }, (_, i) => (i * 0.618) % 1),
        1,
      ),
    );
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: SHARED.uTime, uOpacity: { value: 0.55 }, uColor: { value: new THREE.Color("#ffffff") } },
      vertexShader: SMOKE_VERT,
      fragmentShader: SMOKE_FRAG,
      transparent: true,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
    });
    return { geometry: geo, material: mat };
  }, []);
  const clock = useRef({ last: 0, next: 0 });
  const scratch = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), p: new THREE.Vector3() }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dt = Math.min(delta, 1 / 20);
    const s = simRef.current;
    const c = clock.current;
    const puffs = (puffsRef.current ??= Array.from({ length: PUFFS }, () => ({
      born: -99,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      carry: new THREE.Vector2(),
      size: 1,
    })));
    if (s.time - c.last > lerp(0.16, 0.07, s.throttle)) {
      c.last = s.time;
      const p = puffs[c.next];
      const [fx, fz] = rotY(0, -1, s.yaw);
      p.born = s.time;
      p.pos.copy(s.chimney);
      p.vel.set((Math.random() - 0.5) * 0.2, 0.8 + s.throttle * 0.5, 0);
      p.carry.set(fx * s.speed * 0.88, fz * s.speed * 0.88);
      p.size = 0.85 + Math.random() * 0.35;
      c.next = (c.next + 1) % PUFFS;
    }
    const age = geometry.getAttribute("aAge") as THREE.InstancedBufferAttribute;
    const { m, q, v, p: at } = scratch;
    const drag = Math.exp(-0.12 * dt);
    puffs.forEach((p, i) => {
      const life = (s.time - p.born) / PUFF_LIFE;
      if (life >= 1) {
        m.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, m);
        age.setX(i, 1);
        return;
      }
      p.vel.y = Math.max(0.2, p.vel.y - 0.45 * dt);
      p.carry.multiplyScalar(drag); // it keeps most of the boat's momentum, so the plume leans back without lying on the water
      p.pos.x += (p.vel.x + p.carry.x) * dt;
      p.pos.y += p.vel.y * dt;
      p.pos.z += (p.vel.z + p.carry.y) * dt;
      const size = p.size * lerp(0.3, 1.0, 1 - Math.pow(1 - life, 2));
      m.compose(at.set(p.pos.x - s.ox, p.pos.y, p.pos.z - s.oz), q, v.setScalar(size));
      mesh.setMatrixAt(i, m);
      age.setX(i, life);
    });
    mesh.instanceMatrix.needsUpdate = true;
    age.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geometry, material, PUFFS]} frustumCulled={false} renderOrder={10} />;
}

// ---------------------------------------------------------------------------
// Props: piers, rocks, islands, buoys, streamed in by chunk
// ---------------------------------------------------------------------------

function Pier({ short }: { short?: boolean }) {
  const m = materials();
  const g = sceneryGeometry()[short ? "pierShort" : "pierLong"];
  return (
    <>
      <mesh geometry={g.frame} material={m.pier} />
      <mesh geometry={g.deck} material={m.pierDeck} />
      <mesh geometry={g.collars} material={m.collar} />
    </>
  );
}

function Tree({ position, size = 1 }: { position: [number, number, number]; size?: number }) {
  const m = materials();
  const g = sceneryGeometry();
  return (
    <group position={position} scale={size}>
      <mesh geometry={g.trunk} material={m.trunk} position-y={0.5} />
      <mesh geometry={g.canopy} material={m.leaf} position-y={1.25} scale={0.62} />
      <mesh geometry={g.canopy} material={m.leaf} position={[0.25, 1.75, 0.1]} scale={0.42} />
    </group>
  );
}

function Rock({ wide }: { wide?: boolean }) {
  const m = materials();
  const g = sceneryGeometry();
  const sx = wide ? 2.4 : 1;
  const sy = wide ? 0.45 : 1;
  return (
    <group>
      <mesh geometry={g.rock} material={m.rock} scale={[sx, sy, sx * 0.85]} />
      <mesh geometry={g.pillow} material={m.grass} position-y={sy + 0.04} scale={[0.72 * sx, 0.17, 0.62 * sx]} />
      {wide ? (
        <>
          <Tree position={[-0.9, sy, 0.2]} size={0.75} />
          <Tree position={[0.4, sy, -0.3]} size={0.95} />
          <Tree position={[1.2, sy, 0.4]} size={0.6} />
        </>
      ) : (
        <Tree position={[0.2, 1.05, -0.1]} size={0.45} />
      )}
      <mesh geometry={g.plane} material={m.collar} position-y={0.03} scale={[2.7 * sx, 1, 2.7 * sx * 0.85]} />
    </group>
  );
}

function Buoy({ phase }: { phase: number }) {
  const ref = useRef<THREE.Group>(null);
  const m = materials();
  const g = sceneryGeometry();
  useFrame((state) => {
    const b = ref.current;
    if (!b) return;
    const t = state.clock.elapsedTime;
    b.position.y = Math.sin(t * 2.1 + phase) * 0.06;
    b.rotation.z = Math.sin(t * 1.6 + phase * 2) * 0.12;
  });
  return (
    <>
      <group ref={ref}>
        <mesh geometry={g.buoy} material={m.buoy} position-y={0.12} />
        <mesh geometry={g.buoyBand} material={m.white} position-y={0.18} />
      </group>
      <mesh geometry={g.plane} material={m.collar} position-y={0.03} scale={0.8} />
    </>
  );
}

function Chunk({ cx, cz }: { cx: number; cz: number }) {
  const { props } = chunkData(cx, cz);
  return (
    <>
      {props.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation-y={p.rot} scale={p.scale}>
          {p.kind === "pier" && <Pier />}
          {p.kind === "pierShort" && <Pier short />}
          {p.kind === "rock" && <Rock />}
          {p.kind === "island" && <Rock wide />}
          {p.kind === "buoy" && <Buoy phase={p.x * 0.37 + p.z * 0.11} />}
        </group>
      ))}
    </>
  );
}

/**
 * Mounts the chunks within VIEW_CHUNKS of the boat, at their world coordinates, inside a
 * group shifted by the render origin. React only re-renders when the boat crosses into a
 * new cell, and keyed chunks that stay in range are left alone.
 */
function Chunks({ simRef }: { simRef: SimRef }) {
  const ref = useRef<THREE.Group>(null);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  useFrame(() => {
    const s = simRef.current;
    ref.current?.position.set(-s.ox, 0, -s.oz);
    const cx = Math.floor(s.wx / CHUNK);
    const cz = Math.floor(s.wz / CHUNK);
    if (cx !== center[0] || cz !== center[1]) setCenter([cx, cz]);
  });

  const cells = useMemo(() => {
    const out: [number, number][] = [];
    const reach = (VIEW_CHUNKS + 0.5) ** 2;
    for (let dx = -VIEW_CHUNKS; dx <= VIEW_CHUNKS; dx++) {
      for (let dz = -VIEW_CHUNKS; dz <= VIEW_CHUNKS; dz++) {
        if (dx * dx + dz * dz <= reach) out.push([center[0] + dx, center[1] + dz]);
      }
    }
    return out;
  }, [center]);

  return (
    <group ref={ref}>
      {cells.map(([cx, cz]) => (
        <Chunk key={`${cx},${cz}`} cx={cx} cz={cz} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

function World({ inputRef, reduced }: { inputRef: React.RefObject<Input>; reduced: boolean }) {
  const simRef = useRef<Sim>(createSim());
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.setClearColor(PALETTE.sky);
  }, [gl]);

  return (
    <>
      <Driver simRef={simRef} inputRef={inputRef} reduced={reduced} />
      <fog attach="fog" args={[PALETTE.sky, 18, 80]} />
      <Sky />
      <Horizon />
      <Sea simRef={simRef} />
      <Chunks simRef={simRef} />
      <Boat simRef={simRef} />
      <HullFoam simRef={simRef} />
      <Wake simRef={simRef} />
      <Ripples simRef={simRef} />
      <Smoke simRef={simRef} />
    </>
  );
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

const STEER_KEYS: Record<string, number> = { ArrowLeft: -1, a: -1, ArrowRight: 1, d: 1 };
const BOOST_KEYS = new Set([" ", "ArrowUp", "w"]);
const BRAKE_KEYS = new Set(["ArrowDown", "s"]);

export default function TugboatScene({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const inputRef = useRef<Input>({ x: 0, active: false, boost: false, keyDir: 0, keyBoost: false, keyBrake: false });
  const keys = useRef(new Set<string>());
  const [running, setRunning] = useState(true);
  const [driven, setDriven] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Stop rendering entirely while the scene is off-screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const syncKeys = () => {
    const held = [...keys.current];
    inputRef.current.keyDir = held.reduce((sum, k) => sum + (STEER_KEYS[k] ?? 0), 0);
    inputRef.current.keyBoost = held.some((k) => BOOST_KEYS.has(k));
    inputRef.current.keyBrake = held.some((k) => BRAKE_KEYS.has(k));
  };
  const keyName = (e: React.KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

  const steerTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    inputRef.current.x = THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    inputRef.current.active = true;
  };
  const release = () => {
    inputRef.current.boost = false;
  };

  return (
    <div
      ref={root}
      tabIndex={0}
      aria-label="Tugboat. Steer with the pointer or arrow keys, hold to throttle, down arrow to slow."
      className={cn("relative h-full w-full touch-pan-y select-none outline-none", className)}
      onPointerMove={steerTo}
      onPointerDown={(e) => {
        steerTo(e);
        inputRef.current.boost = true;
        setDriven(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={() => {
        inputRef.current.active = false;
        release();
      }}
      onKeyDown={(e) => {
        const k = keyName(e);
        if (!(k in STEER_KEYS) && !BOOST_KEYS.has(k) && !BRAKE_KEYS.has(k)) return;
        e.preventDefault();
        keys.current.add(k);
        syncKeys();
        setDriven(true);
      }}
      onKeyUp={(e) => {
        keys.current.delete(keyName(e));
        syncKeys();
      }}
      onBlur={() => {
        keys.current.clear();
        syncKeys();
      }}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, stencil: true }}
        camera={{ fov: 50, near: 0.1, far: 500, position: [0, 4.6, 8.2] }}
        frameloop={running ? "always" : "never"}
      >
        <World inputRef={inputRef} reduced={reduced} />
      </Canvas>
      <p
        className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-slate-700/70 transition-opacity duration-500"
        style={{ opacity: driven ? 0 : 1 }}
      >
        Pointer or ← → to steer · hold to throttle · ↓ to slow
      </p>
    </div>
  );
}
