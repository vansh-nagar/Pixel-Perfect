/**
 * Imperative port of igloo.inc's hero scene (their class `F3`) and everything it owns:
 * sky, smoke, igloo base, cage, outline, mountains, terrain, terrain patches, intro
 * particles, snow, the shattered igloo itself and its hover "plexus".
 *
 * LOCAL STUDY COPY: the geometry and textures are igloo.inc's and are served from the
 * gitignored `public/_study/igloo/`. Never commit those assets or promote this.
 *
 * Structure mirrors the original so it can be diffed against the bundle:
 *  - every part is a `create*` function returning its meshes/uniforms (one per class);
 *  - `CameraRig` is their camera class `Jo` (mouse parallax + sine-noise shake);
 *  - `buildIntroTimeline` is `createIntroTimeline` with the same targets, times and eases;
 *  - lerps use their frame-rate-independent helpers (`lerpFPS`, 60fps-normalised).
 * Deliberate differences are marked `PORT:`.
 */

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { BloomEffect, Effect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from "postprocessing";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { falloff, lut } from "./chunks";
import { loadDrc } from "./draco";
import * as S from "./shaders";

const ASSETS = "/_study/igloo";
const DEG = 3.14 / 180;
const HALF_PI = Math.PI * 0.5;

const HERO_PROGRESS = 0.495;
const INITIAL_SCROLL_AUTOCENTER = 0.495;

type Clock = { time: number; ratio: number };

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a: number, b: number, t: number) => (1 - t) * a + t * b;
const fit = (x: number, a1: number, a2: number, b1: number, b2: number) =>
  clamp(b1 + ((x - a1) * (b2 - b1)) / (a2 - a1), Math.min(b1, b2), Math.max(b1, b2));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const lerpCoef = (t: number, ratio: number) => 1 - Math.exp(Math.log(1 - t) * ratio);
const lerpFPS = (a: number, b: number, t: number, ratio: number) => mix(a, b, lerpCoef(t, ratio));
const ease = (x: number, name: string) => gsap.parseEase(name)(x);

const NOISE_DIRS = [
  new THREE.Vector3(1.5, 3.4598, 1.234),
  new THREE.Vector3(3.12, -3.234, 4.221),
  new THREE.Vector3(0.355, 2.3, -1.375),
  new THREE.Vector3(-0.156, -3.34, -0.4566),
  new THREE.Vector3(-4.1235, -0.485, -1.45),
  new THREE.Vector3(2.54, -0.879, -2.123),
];
const noiseInput = new THREE.Vector3();
function sineNoise1(a: number, b: number, c: number) {
  noiseInput.set(a, b, c);
  return NOISE_DIRS.reduce((s, d) => s + Math.sin(noiseInput.dot(d)), 0) / 6;
}

let easesRegistered = false;
function registerEases() {
  if (easesRegistered) return;
  gsap.registerPlugin(CustomEase);
  CustomEase.create("inOut1", "M0,0 C0.5,0 0.1,1 1,1");
  CustomEase.create("inOut3", "M0,0 C0.6,0 0,1 1,1");
  CustomEase.create("inOut4", "M0,0 C0.4,0 -0.06,1 1,1");
  CustomEase.create("igloo_ease_1", "M0,0 C0.662,0.073 0.047,1 1,1");
  easesRegistered = true;
}

function createGlobals() {
  return {
    resolution: { value: new THREE.Vector2(1, 1) },
    resolutionUI: { value: new THREE.Vector2(1, 1) },
    aspect: { value: 1 },
    time: { value: 0 },
    dtRatio: { value: 1 },
  };
}
type Globals = ReturnType<typeof createGlobals>;
type Uniforms = Record<string, THREE.IUniform>;

function applyMode(texture: THREE.Texture, mode: string) {
  if (mode.includes("repeat")) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  if (mode.includes("data")) texture.magFilter = texture.minFilter = THREE.LinearFilter;
  else if (mode.includes("nearest")) texture.magFilter = texture.minFilter = THREE.NearestFilter;
  if (mode.includes("nearest") || mode.includes("data")) texture.generateMipmaps = false;
  if (mode.includes("luttetrahedral")) texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = mode.includes("srgb") ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

async function loadTextures(ktx2: KTX2Loader) {
  const entries = {
    groundColor: ["igloo/ground_color.ktx2", "srgb"],
    groundGlow: ["igloo/ground_glow.ktx2", "srgb"],
    groundSansIgloo: ["igloo/ground_sansigloo_color.ktx2", "srgb"],
    mountainColor: ["igloo/mountain_color.ktx2", "srgb"],
    triangles: ["igloo/triangles_tiling.ktx2", "srgb-repeat"],
    mosaic: ["mosaic.ktx2", "srgb-repeat-nearest"],
    windSrgb: ["wind_noise.ktx2", "srgb-repeat"],
    numbers: ["igloo/numbers.ktx2", "srgb-repeat"],
    iglooColor: ["igloo/igloo_color.ktx2", "srgb"],
    iglooExploded: ["igloo/igloo_exploded_color.ktx2", "srgb"],
    perlin: ["perlin-datatexture.ktx2", "srgb-repeat"],
    lut: ["igloo/igloo_scene.ktx2", "luttetrahedral"],
    plexusNumbers: ["numbers-datatexture.ktx2", "data"],
  } as const;
  const keys = Object.keys(entries) as (keyof typeof entries)[];
  const textures = await Promise.all(
    keys.map(async (k) => {
      const [file, mode] = entries[k];
      const texture = await ktx2.loadAsync(`${ASSETS}/images/${file}`);
      return applyMode(texture, mode);
    }),
  );
  return Object.fromEntries(keys.map((k, i) => [k, textures[i]])) as Record<keyof typeof entries, THREE.Texture>;
}
type Textures = Awaited<ReturnType<typeof loadTextures>>;

const loadGeometry = (file: string) => loadDrc(`${ASSETS}/geometries/${file}`).then((g) => g.clone());

function freeze(mesh: THREE.Object3D) {
  mesh.updateMatrixWorld(true);
  mesh.matrixAutoUpdate = false;
}

function shaderMaterial(
  globals: Globals,
  uniforms: Uniforms,
  vertexShader: string,
  fragmentShader: string,
  params: THREE.ShaderMaterialParameters = {},
) {
  return new THREE.ShaderMaterial({ uniforms: { ...globals, ...uniforms }, vertexShader, fragmentShader, ...params });
}

function createSky(globals: Globals) {
  const material = shaderMaterial(
    globals,
    {
      uColor1: { value: new THREE.Color("#d1d6e3") },
      uColor2: { value: new THREE.Color("#afb6c7") },
      uIntroColor: { value: new THREE.Color("#b3bac9") },
      uProgress: { value: 0 },
    },
    S.skyVert,
    S.skyFrag,
    { side: THREE.BackSide },
  );
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(800, 12, 12), material);
  mesh.name = "sky";
  mesh.scale.x = -1;
  mesh.rotation.x = 16 * DEG;
  mesh.rotation.z = -16 * DEG;
  freeze(mesh);
  return { meshes: [mesh], material };
}

function createSmoke(globals: Globals, tex: Textures) {
  const material = shaderMaterial(globals, { tWind: { value: tex.windSrgb }, uAlpha: { value: 1 } }, S.smokeVert, S.smokeFrag, {
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(20, 5);
  const mesh1 = new THREE.Mesh(geometry, material);
  mesh1.name = "smoke1";
  mesh1.position.set(-5, 1.25, -10);
  mesh1.renderOrder = 2;
  const mesh2 = new THREE.Mesh(geometry, material);
  mesh2.name = "smoke2";
  mesh2.position.set(13.45, 3, -4);
  mesh2.rotation.y = -10 * DEG;
  mesh2.renderOrder = 2;
  [mesh1, mesh2].forEach(freeze);
  return { meshes: [mesh1, mesh2], material };
}

async function createIglooBase(globals: Globals, tex: Textures) {
  const mousePosition = new THREE.Vector3();
  const material = shaderMaterial(
    globals,
    {
      tMap: { value: tex.groundColor },
      tGroundGlow: { value: tex.groundGlow },
      tWind: { value: tex.windSrgb },
      tTriangles: { value: tex.triangles },
      tNoise: { value: tex.mosaic },
      uMousePos: { value: mousePosition },
      uProgress: { value: 0 },
      uProgress2: { value: 0 },
      uTriangleAlpha: { value: 1 },
      uAlpha: { value: 1 },
    },
    S.baseVert,
    S.baseFrag,
    { transparent: true },
  );
  const mesh = new THREE.Mesh(await loadGeometry("ground.drc"), material);
  mesh.name = "igloobase";
  mesh.renderOrder = 2;
  freeze(mesh);
  return { meshes: [mesh], material, mousePosition };
}

function createLineMaterial(globals: Globals, key: string, uniforms: Uniforms, worldPosFrom: "centr" | "position", alphaCode: string) {
  const material = new THREE.LineBasicMaterial({ color: "#a7b2d6", opacity: 0.3, transparent: true });
  material.depthTest = false;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, globals, uniforms);
    shader.vertexShader = `
      attribute vec3 color;
      attribute vec3 centr;
      varying vec3 vColor;
      varying vec3 vWorldPos;
      varying vec3 vCentr;
      ${shader.vertexShader}`.replace(
      "#include <skinning_vertex>",
      `vColor = color;
      vCentr = centr;
      vWorldPos = (modelMatrix * vec4(${worldPosFrom}, 1.0)).xyz;`,
    );
    shader.fragmentShader = `
      ${S.GLOBAL}
      ${falloff}
      varying vec3 vColor;
      varying vec3 vCentr;
      varying vec3 vWorldPos;
      ${Object.keys(uniforms)
        .map((u) => `uniform float ${u};`)
        .join("\n")}
      ${shader.fragmentShader}`.replace("#include <dithering_fragment>", alphaCode);
  };
  material.customProgramCacheKey = () => key;
  return material;
}

async function createIglooCage(globals: Globals) {
  const uniforms = { uProgress: { value: 1 }, uAlpha: { value: 0.185 } };
  const material = createLineMaterial(
    globals,
    "igloo-cage",
    uniforms,
    "centr",
    `float intro_gradientInput = length(vWorldPos);
    float intro_shockwave = falloff(intro_gradientInput, 0.0, 20.0, 5.0, uProgress);
    float alpha = uAlpha;
    alpha *= intro_shockwave;
    float idleAnimation = sin(vColor.r * 13.0 + time * 6.0) * 0.5 + 0.5;
    alpha *= idleAnimation;
    gl_FragColor.a = alpha;`,
  );
  const mesh = new THREE.LineSegments(await loadGeometry("igloo/igloo_cage.drc"), material);
  mesh.frustumCulled = false;
  mesh.name = "igloo_cage";
  mesh.renderOrder = 999;
  return { meshes: [mesh], uniforms, mesh };
}

async function createIglooOutline(globals: Globals) {
  const uniforms = {
    uProgress: { value: 1 },
    uAlpha: { value: 1 },
    uScrollAlpha: { value: 0 },
    uIntroMaterialize: { value: 0 },
  };
  const material = createLineMaterial(
    globals,
    "igloo-outline",
    uniforms,
    "position",
    `float alpha = mix(uAlpha, 1.0, uScrollAlpha);
    float idleAnimation = sin(vWorldPos.y * 6.0 + time * 5.0) * 0.5 + 0.5;
    idleAnimation *= cos(vWorldPos.z * 6.0 + time * 5.0) * 0.5 + 0.5;
    idleAnimation *= sin(vWorldPos.x * 6.0 + time * 5.0) * 0.5 + 0.5;
    idleAnimation = idleAnimation * 0.8 + 0.2;
    alpha *= idleAnimation;
    alpha *= falloffsmooth(vWorldPos.y, 3.5, 0.1, 2.0, uIntroMaterialize);
    gl_FragColor.a = alpha;`,
  );
  const mesh = new THREE.LineSegments(await loadGeometry("igloo/igloo_outline.drc"), material);
  mesh.frustumCulled = false;
  mesh.name = "igloo_outline";
  mesh.renderOrder = 999;
  uniforms.uScrollAlpha.value = ease(fit(HERO_PROGRESS, 0, 0.35, 1, 0), "sine.in") * 2;
  return { meshes: [mesh], uniforms };
}

type Placement = { name: string; position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number]; renderOrder: number };

function place(geometry: THREE.BufferGeometry, material: THREE.Material, list: Placement[]) {
  return list.map((p) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = p.name;
    mesh.position.set(...p.position);
    mesh.rotation.set(p.rotation[0] * DEG, p.rotation[1] * DEG, p.rotation[2] * DEG);
    mesh.scale.set(...p.scale);
    mesh.renderOrder = p.renderOrder;
    freeze(mesh);
    return mesh;
  });
}

async function createMountains(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    {
      uColor1: { value: new THREE.Color("#d1d6e3") },
      uColor2: { value: new THREE.Color("#afb6c7") },
      tMap: { value: tex.mountainColor },
      tTriangles: { value: tex.triangles },
      tNoise: { value: tex.mosaic },
      uProgress: { value: 1 },
      uProgress2: { value: 1 },
      uTriangleAlpha: { value: 1 },
      uAlpha: { value: 1 },
    },
    S.mountainVert,
    S.mountainFrag,
    { transparent: true },
  );
  const meshes = place(await loadGeometry("mountain.drc"), material, [
    { name: "mountain1", position: [59.53, -1, -11.84], rotation: [4.1, -42.8, 5], scale: [4, 3.14, 4], renderOrder: 1 },
    { name: "mountain2", position: [1, -2.21, -23], rotation: [3.5, 30, 0], scale: [2, 2, 2], renderOrder: 1 },
    { name: "mountain3", position: [75, 0, -90], rotation: [3.2, -16.7, -2.6], scale: [8, 8, 8], renderOrder: 1 },
    { name: "mountain4", position: [250, 11.33, -133], rotation: [13.2, 20, 5], scale: [10, 10, 10], renderOrder: 1 },
    { name: "mountain5", position: [-25.22, -1.59, -53.05], rotation: [3.5, 25, 0], scale: [2.5, 2.5, 2.5], renderOrder: 1 },
  ]);
  return { meshes, material };
}

async function createTerrain(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    {
      tMap: { value: tex.groundSansIgloo },
      tWind: { value: tex.windSrgb },
      tTriangles: { value: tex.triangles },
      tNoise: { value: tex.mosaic },
      uProgress: { value: 0 },
      uProgress2: { value: 0 },
      uTriangleAlpha: { value: 1 },
      uAlpha: { value: 1 },
    },
    S.terrainVert,
    S.terrainFrag,
    { transparent: true },
  );
  const meshes = place(await loadGeometry("ground.drc"), material, [
    { name: "terrain1", position: [-3.76, -0.58, 12.5], rotation: [-5.1, 0, 0], scale: [0.6, 0.6, 0.6], renderOrder: 1 },
    { name: "terrain2", position: [-17.63, -0.01, 2], rotation: [2.7, 0.8, 0], scale: [1, 1, 1], renderOrder: 3 },
    { name: "terrain3", position: [3.12, -0.75, -1.02], rotation: [0, 0, 0], scale: [1.5, 0.66, 1.5], renderOrder: 1 },
    { name: "terrain4", position: [6, 0.16, 15.78], rotation: [1.1, 0, 7], scale: [1, 1, 1], renderOrder: 2 },
    { name: "terrain5", position: [16.06, 0.34, 4], rotation: [0, 0, 0], scale: [1, 1, 1], renderOrder: 2 },
  ]);
  return { meshes, material };
}

async function createTerrainPatches(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    {
      tMap: { value: tex.groundSansIgloo },
      tWind: { value: tex.windSrgb },
      tTriangles: { value: tex.triangles },
      tNoise: { value: tex.mosaic },
      uProgress: { value: 0 },
      uProgress2: { value: 0 },
      uTriangleAlpha: { value: 1 },
      uAlpha: { value: 1 },
    },
    S.patchVert,
    S.patchFrag,
    { transparent: true },
  );
  const meshes = place(await loadGeometry("igloo/patch.drc"), material, [
    { name: "terrainpatch1", position: [-9.34, -1.77, 6.96], rotation: [0, 0, 0], scale: [7, 7, 7], renderOrder: 0 },
    { name: "terrainpatch2", position: [-8.82, -1.35, 11.69], rotation: [-5.5, -25.6, 0], scale: [8, 8, 8], renderOrder: 0 },
  ]);
  return { meshes, material };
}

async function createIntroParticles(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    { tNumbers: { value: tex.numbers }, uProgress: { value: 0 }, uAlpha: { value: 1 } },
    S.introParticlesVert,
    S.introParticlesFrag,
    { transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false },
  );
  const mesh = new THREE.Points(await loadGeometry("intro_particles.drc"), material);
  mesh.name = "intro_particles";
  mesh.renderOrder = 1000;
  freeze(mesh);
  return { meshes: [mesh], material, mesh };
}

function createSnow(globals: Globals) {
  const count = 1200;
  const base = new THREE.PlaneGeometry(0.075, 0.15);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.attributes.position);
  geometry.setAttribute("uv", base.attributes.uv);
  geometry.setAttribute("normal", base.attributes.normal);
  const start = new Float32Array(count * 4);
  const rand = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    start[i * 4 + 0] = Math.random() * 50 - 25;
    start[i * 4 + 1] = Math.random() * 20 - 10;
    start[i * 4 + 2] = Math.random() * 50 - 25;
    start[i * 4 + 3] = Math.random();
    for (let j = 0; j < 4; j++) rand[i * 4 + j] = Math.random();
  }
  geometry.setAttribute("snowStart", new THREE.InstancedBufferAttribute(start, 4));
  geometry.setAttribute("rand", new THREE.InstancedBufferAttribute(rand, 4));
  geometry.instanceCount = count;

  const vertexShader = S.snowVert
    .replace(
      "uniform float uCount;",
      /* glsl */ `uniform float uCount;
      attribute vec4 snowStart;
      vec3 snowOffset() {
          float w = snowStart.w;
          float phase = w * 15.6547;
          vec3 p = snowStart.xyz;
          p.x += (1.35 + 0.81 * sign(w - 0.5)) * time + 2.025 * (cos(phase) - cos(0.2 * time + phase));
          p.y -= 2.16 * mix(0.5, 0.8, fract(w * 31.342)) * time;
          p.z += 1.35 * time;
          vec3 margin = vec3(25.0, 10.0, 25.0);
          return fract((p + margin) / (2.0 * margin)) * 2.0 * margin - margin;
      }`,
    )
    .replace("vec3 offset = texture2D(tTexture1, texuv).xyz;", "vec3 offset = snowOffset();");

  const material = shaderMaterial(
    globals,
    {
      uCount: { value: count },
      uColor1: { value: new THREE.Color("#cda05e") },
      uColor2: { value: new THREE.Color("#ab8349") },
      uMousePos: { value: new THREE.Vector3() },
      uOutlineColor: { value: new THREE.Color("#904619") },
      uAlpha: { value: 0 },
    },
    vertexShader,
    S.snowFrag,
    { depthWrite: false, transparent: true },
  );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "snowparticles";
  mesh.renderOrder = 5;
  mesh.frustumCulled = false;
  freeze(mesh);
  return { meshes: [mesh], material };
}

type Piece = {
  object: THREE.Object3D;
  centroid: THREE.Vector3;
  rand: THREE.Vector3;
  index: number;
  targetDisplacement1: number;
  targetDisplacement2: number;
  targetBounce1: number;
  targetBounce2: number;
  displacement: number;
  bounce: number;
  scrollDisplacement1: number;
  scrollDisplacement2: number;
  plexusDistance: number;
  plexusDistReal: boolean;
  plexusConnections: Piece[];
  plexusAnimation: { value: number };
  plexusDistPoint: number;
  uiPos: [number, number, number];
};

const dataTextureSize = (n: number) => Math.max(Math.ceil(Math.sqrt(n) / 4) * 4, 4);

async function createIgloo(globals: Globals, tex: Textures) {
  const source = await loadGeometry("igloo.drc");
  const index = source.index!.array;
  const batchIds = source.attributes.batchId.array;
  const centr = source.attributes.centr.array;
  const randAttr = source.attributes.rand.array;

  const order = new Map<number, number>();
  const firstVertex: number[] = [];
  for (let i = 0; i < index.length; i++) {
    const v = index[i];
    const b = batchIds[v];
    if (!order.has(b)) {
      order.set(b, order.size);
      firstVertex.push(v);
    }
  }
  const pieceCount = order.size;

  const vertexCount = source.attributes.position.count;
  const position = source.attributes.position.array as Float32Array;
  const pieceId = new Float32Array(vertexCount);
  for (let v = 0; v < vertexCount; v++) {
    pieceId[v] = order.get(batchIds[v]) ?? 0;
    position[v * 3 + 0] -= centr[v * 3 + 0];
    position[v * 3 + 1] -= centr[v * 3 + 1];
    position[v * 3 + 2] -= centr[v * 3 + 2];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(source.index);
  geometry.setAttribute("position", source.attributes.position);
  geometry.setAttribute("normal", source.attributes.normal);
  geometry.setAttribute("uv", source.attributes.uv);
  geometry.setAttribute("emission", source.attributes.emission);
  geometry.setAttribute("batchId", new THREE.BufferAttribute(pieceId, 1));

  const matrixSize = Math.max(Math.ceil(Math.sqrt(pieceCount * 4) / 4) * 4, 4);
  const matrices = new THREE.DataTexture(
    new Float32Array(matrixSize * matrixSize * 4),
    matrixSize,
    matrixSize,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  const optionsSize = dataTextureSize(pieceCount);
  const options = new THREE.DataTexture(
    new Float32Array(optionsSize * optionsSize * 4),
    optionsSize,
    optionsSize,
    THREE.RGBAFormat,
    THREE.FloatType,
  );

  const pieces: Piece[] = firstVertex.map((v, i) => {
    const centroid = new THREE.Vector3(centr[v * 3], centr[v * 3 + 1], centr[v * 3 + 2]);
    const object = new THREE.Object3D();
    object.position.copy(centroid);
    return {
      object,
      centroid,
      rand: new THREE.Vector3(randAttr[v * 3], randAttr[v * 3 + 1], randAttr[v * 3 + 2]),
      index: i,
      targetDisplacement1: 0,
      targetDisplacement2: 0,
      targetBounce1: 0,
      targetBounce2: 0,
      displacement: 0,
      bounce: 0,
      scrollDisplacement1: 0,
      scrollDisplacement2: 0,
      plexusDistance: 0,
      plexusDistReal: false,
      plexusConnections: [],
      plexusAnimation: { value: 0 },
      plexusDistPoint: 0,
      uiPos: [0, 0, 0],
    };
  });

  const vertexShader = S.iglooVert;
  const material = shaderMaterial(
    globals,
    {
      batchingTexture: { value: matrices },
      tMap: { value: tex.iglooColor },
      tMapExploded: { value: tex.iglooExploded },
      tTriangles: { value: tex.triangles },
      tNoise: { value: tex.perlin },
      tOptions: { value: options },
      uProgress: { value: 0 },
      uIntroGlow: { value: 1 },
      uIntroMaterialize: { value: 0 },
    },
    vertexShader,
    S.iglooFrag,
  );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "igloo";
  mesh.frustumCulled = false;
  freeze(mesh);

  return {
    meshes: [mesh],
    mesh,
    material,
    pieces,
    matrices,
    options,
    mousePosition: new THREE.Vector3(),
    introDisplacementModulator: { value: 0 },
  };
}
type Igloo = Awaited<ReturnType<typeof createIgloo>>;

const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

function updateIgloo(igloo: Igloo, clock: Clock, mouseOnPlane: THREE.Vector3 | null, needsReset: boolean) {
  const { time, ratio } = clock;
  if (mouseOnPlane) igloo.mousePosition.lerp(mouseOnPlane, lerpCoef(0.05, ratio));

  const t = fit(HERO_PROGRESS, 0, INITIAL_SCROLL_AUTOCENTER, 0, 1);
  const s = ease(fit(HERO_PROGRESS, 0, 0.4, 1, 0), "sine.in");
  const n = needsReset ? 1 : 0.075;
  const matrixData = igloo.matrices.image.data as Float32Array;
  const optionData = igloo.options.image.data as Float32Array;

  for (const a of igloo.pieces) {
    let l = 0.4;
    l *= Math.sin(-time * 2 + a.centroid.x) * 0.5 + 0.5;
    l *= Math.cos(-time) * 0.5 + 0.5;
    l *= mix(0.5, 2, a.rand.z);
    l *= 0.5;
    l *= igloo.introDisplacementModulator.value;
    const c = Math.sin(time + a.rand.x * 12.342) * a.rand.y;
    const h = fit(smoothstep(1, 3, tmpV.copy(a.centroid).sub(igloo.mousePosition).length()), 0, 1, 0.5 + 0.3 * c, 0);
    l = Math.max(l, h * t);
    a.targetBounce1 = l;
    a.targetBounce2 = lerpFPS(a.targetBounce2, a.targetBounce1, 0.05, ratio);
    a.bounce = lerpFPS(a.bounce, a.targetBounce2, 0.05, ratio);

    l *= smoothstep(0.45, 0.7, a.centroid.y);
    l = Math.max(0, l);
    a.targetDisplacement1 = l;
    a.targetDisplacement2 = lerpFPS(a.targetDisplacement2, a.targetDisplacement1, 0.06, ratio);
    a.displacement = lerpFPS(a.displacement, a.targetDisplacement2, 0.06, ratio);
    optionData[a.index * 4 + 0] = a.displacement;
    optionData[a.index * 4 + 1] = a.bounce;
    a.object.position.copy(a.centroid).addScaledVector(a.centroid, a.displacement);

    const u = smoothstep(0.3, 1, a.centroid.y);
    const f = fit(a.rand.x, 0.4, 1, 0, 1) * 2;
    const p = s * u * f;
    a.scrollDisplacement1 = mix(a.scrollDisplacement1, p, n);
    a.scrollDisplacement2 = lerpFPS(a.scrollDisplacement2, a.scrollDisplacement1, n, ratio);
    a.object.position.addScaledVector(a.centroid, a.scrollDisplacement2);

    const A = a.scrollDisplacement2 * a.rand.x * -1.5;
    const m = a.scrollDisplacement2 * a.rand.y * -1.5;
    const g = a.scrollDisplacement2 * a.rand.z * -1.5;
    const d = a.displacement;
    a.object.quaternion.identity();
    a.object.quaternion.multiply(tmpQ.setFromAxisAngle(AXIS_Y, Math.cos(d * 2 + a.rand.z * 30) * d * 0.5 + A));
    a.object.quaternion.multiply(tmpQ.setFromAxisAngle(AXIS_Z, Math.cos(d * 2 + a.rand.x * 30) * d * 0.5 + m));
    a.object.quaternion.multiply(tmpQ.setFromAxisAngle(AXIS_X, Math.cos(d * 2 + a.rand.y * 30) * d * 0.5 + g));
    a.object.updateMatrix();
    matrixData.set(a.object.matrix.elements, a.index * 16);
  }
  igloo.matrices.needsUpdate = true;
  igloo.options.needsUpdate = true;
}

const MAX_PLEXUS_POINTS = 5;
const MAX_PLEXUS_CONNECTIONS = 2;

function createPlexus(globals: Globals, tex: Textures) {
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(MAX_PLEXUS_POINTS * MAX_PLEXUS_CONNECTIONS * 2 * 3), 3),
  );
  const lineMaterial = new THREE.LineBasicMaterial({ color: "#ffffff", opacity: 0.25, transparent: true });
  lineMaterial.depthTest = false;
  lineMaterial.depthWrite = false;
  lineMaterial.blending = THREE.AdditiveBlending;
  const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  lineMesh.frustumCulled = false;
  lineMesh.visible = false;
  lineMesh.name = "plexus lines";
  lineMesh.renderOrder = 999;

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_PLEXUS_POINTS * 3), 3));
  pointGeometry.setAttribute("progress", new THREE.BufferAttribute(new Float32Array(MAX_PLEXUS_POINTS), 1));
  const pointMesh = new THREE.Points(
    pointGeometry,
    shaderMaterial(
      globals,
      { uColor: { value: new THREE.Color("#ffffff") }, uSize: { value: 200 } },
      S.plexusPointsVert,
      S.plexusPointsFrag,
      { depthWrite: false, depthTest: false, transparent: true, blending: THREE.AdditiveBlending },
    ),
  );
  pointMesh.frustumCulled = false;
  pointMesh.name = "plexus points";
  pointMesh.renderOrder = lineMesh.renderOrder + 1;

  const left = new THREE.PlaneGeometry();
  left.scale(0.77777, 1, 1);
  left.translate(-0.5 - -0.1, 0, 0);
  const leftSide = new THREE.BufferAttribute(new Int32Array([-1, -1, -1, -1]), 1);
  leftSide.gpuType = THREE.IntType;
  left.setAttribute("side", leftSide);
  const right = new THREE.PlaneGeometry();
  right.scale(0.77777, 1, 1);
  right.translate(0.5 + -0.1, 0, 0);
  const rightSide = new THREE.BufferAttribute(new Int32Array([1, 1, 1, 1]), 1);
  rightSide.gpuType = THREE.IntType;
  right.setAttribute("side", rightSide);
  const merged = mergeGeometries([left, right])!;
  const numberGeometry = new THREE.InstancedBufferGeometry();
  numberGeometry.instanceCount = MAX_PLEXUS_POINTS;
  for (const name in merged.attributes) numberGeometry.setAttribute(name, merged.attributes[name]);
  (numberGeometry.attributes.side as THREE.BufferAttribute).gpuType = THREE.IntType;
  numberGeometry.setIndex(merged.index);
  numberGeometry.setAttribute("progress", new THREE.InstancedBufferAttribute(new Float32Array(MAX_PLEXUS_POINTS), 1));
  const nums = new THREE.InstancedBufferAttribute(new Int32Array(MAX_PLEXUS_POINTS * 2), 2);
  nums.gpuType = THREE.IntType;
  numberGeometry.setAttribute("nums", nums);
  const numberMaterial = shaderMaterial(
    globals,
    { tNums: { value: tex.plexusNumbers }, uColor: { value: new THREE.Color("#ffffff") }, uSize: { value: 1 } },
    S.plexusNumbersVert,
    S.plexusNumbersFrag,
    { transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending },
  );
  const numberMesh = new THREE.InstancedMesh(numberGeometry, numberMaterial, MAX_PLEXUS_POINTS);
  numberMesh.name = "plexus numbers";
  numberMesh.frustumCulled = false;
  numberMesh.renderOrder = lineMesh.renderOrder + 2;

  return {
    meshes: [lineMesh, pointMesh, numberMesh],
    lineMesh,
    pointMesh,
    numberMesh,
    numberMaterial,
    closest: [] as Piece[],
    lastMousePosition: new THREE.Vector3(),
    isTransitioning: false,
  };
}
type Plexus = ReturnType<typeof createPlexus>;

function removeConnections(plexus: Plexus, e: Piece) {
  e.plexusConnections.forEach((t) => {
    t.plexusConnections = t.plexusConnections.filter((s) => s !== e);
  });
  e.plexusConnections = [];
  plexus.closest.forEach((t) => {
    t.plexusConnections = t.plexusConnections.filter((s) => plexus.closest.includes(s));
  });
  if (plexus.closest.length < 2) return;
  for (const s of plexus.closest) {
    if (s.plexusConnections.length !== 0) continue;
    const others = plexus.closest.filter((r) => r !== s);
    others.forEach((r) => (r.plexusDistPoint = r.object.position.distanceTo(s.object.position)));
    others.sort((r, a) => r.plexusDistPoint - a.plexusDistPoint);
    s.plexusConnections.push(others[0]);
    others[0].plexusConnections.push(s);
    gsap.to(s.plexusAnimation, { value: 1, ease: "none", duration: 0.1, overwrite: true });
  }
}

function makeConnections(plexus: Plexus, e: Piece) {
  removeConnections(plexus, e);
  const others = plexus.closest.filter((n) => n !== e);
  others.forEach((n) => (n.plexusDistPoint = n.object.position.distanceTo(e.object.position)));
  others.sort((n, r) => n.plexusDistPoint - r.plexusDistPoint);
  for (let s = 0; s < others.length && e.plexusConnections.length < MAX_PLEXUS_CONNECTIONS; s++) {
    const n = others[s];
    if (
      n.plexusConnections.length < MAX_PLEXUS_CONNECTIONS &&
      !n.plexusConnections.includes(e) &&
      !e.plexusConnections.includes(n)
    ) {
      e.plexusConnections.push(n);
      n.plexusConnections.push(e);
    }
  }
  if (e.plexusConnections.length === 0 && others.length > 0) {
    e.plexusConnections.push(others[0]);
    others[0].plexusConnections.push(e);
  }
}

const dirToCamera = new THREE.Vector3();
const probe = new THREE.Vector3();
const scratch = new THREE.Vector3();
const instanceDummy = new THREE.Object3D();

function updatePlexus(plexus: Plexus, igloo: Igloo, camera: THREE.Camera, viewportHeight: number) {
  dirToCamera.copy(camera.position).sub(igloo.mousePosition).normalize();
  probe.copy(igloo.mousePosition).addScaledVector(dirToCamera, 1);
  const moved = plexus.lastMousePosition.distanceTo(probe) > 0.05;
  if (moved) plexus.lastMousePosition.copy(probe);

  let candidates = igloo.pieces.map((u) => {
    u.plexusDistance = u.object.position.distanceToSquared(probe);
    u.plexusDistReal = false;
    return u;
  });
  candidates.sort((u, f) => u.plexusDistance - f.plexusDistance);
  candidates = candidates.filter((u) => u.displacement > 0.1).slice(0, MAX_PLEXUS_POINTS);
  const real = (u: Piece) => {
    if (!u.plexusDistReal) {
      u.plexusDistReal = true;
      u.plexusDistance = Math.sqrt(u.plexusDistance);
    }
  };
  candidates.forEach(real);
  plexus.closest.forEach(real);
  candidates = candidates.filter((u) => u.plexusDistance < 2);
  plexus.closest.sort((u, f) => u.plexusDistance - f.plexusDistance);

  if (!plexus.isTransitioning && moved) {
    for (let u = plexus.closest.length - 1; u > -1; u--) {
      const f = plexus.closest[u];
      if (!candidates.includes(f)) {
        plexus.isTransitioning = true;
        gsap.to(f.plexusAnimation, {
          value: 0,
          ease: "none",
          duration: 0.06,
          overwrite: true,
          onComplete: () => {
            plexus.closest.splice(plexus.closest.indexOf(f), 1);
            removeConnections(plexus, f);
            plexus.isTransitioning = false;
          },
        });
        break;
      }
    }
  }
  if (!plexus.isTransitioning && plexus.closest.length < MAX_PLEXUS_POINTS) {
    for (const f of candidates) {
      if (!plexus.closest.includes(f)) {
        plexus.isTransitioning = true;
        plexus.closest.push(f);
        makeConnections(plexus, f);
        gsap.to(f.plexusAnimation, {
          value: 1,
          ease: "none",
          duration: 0.1,
          overwrite: true,
          onComplete: () => {
            plexus.isTransitioning = false;
          },
        });
        break;
      }
    }
  }

  plexus.closest.forEach((u) => {
    u.uiPos = scratch
      .copy(u.object.position)
      .addScaledVector(probe.copy(u.centroid).normalize(), 0.2)
      .toArray() as [number, number, number];
  });

  const segments: number[] = [];
  const seen: number[][] = [];
  for (const f of plexus.closest) {
    for (const A of f.plexusConnections) {
      if (seen[f.index]?.includes(A.index) || seen[A.index]?.includes(f.index)) continue;
      (seen[f.index] ??= []).push(A.index);
      (seen[A.index] ??= []).push(f.index);
      const from = f.plexusAnimation.value >= A.plexusAnimation.value ? f : A;
      const to = from === f ? A : f;
      const end = scratch.fromArray(from.uiPos).lerp(probe.fromArray(to.uiPos), to.plexusAnimation.value).toArray();
      segments.push(...from.uiPos, ...end);
    }
  }
  const lineAttr = plexus.lineMesh.geometry.attributes.position as THREE.BufferAttribute;
  const lineArray = lineAttr.array as Float32Array;
  lineArray.fill(0);
  lineArray.set(segments.slice(0, lineArray.length));
  lineAttr.needsUpdate = true;
  plexus.lineMesh.visible = segments.length > 0;

  const pointPos = plexus.pointMesh.geometry.attributes.position as THREE.BufferAttribute;
  const pointProgress = plexus.pointMesh.geometry.attributes.progress as THREE.BufferAttribute;
  for (let s = 0; s < MAX_PLEXUS_POINTS; s++) {
    const piece = plexus.closest[s];
    const [x, y, z] = piece ? piece.uiPos : [0, 0, 0];
    pointPos.setXYZ(s, x, y, z);
    pointProgress.setX(s, piece ? piece.plexusAnimation.value : 0);
  }
  pointPos.needsUpdate = true;
  pointProgress.needsUpdate = true;

  const numberGeometry = plexus.numberMesh.geometry;
  const progress = numberGeometry.attributes.progress as THREE.InstancedBufferAttribute;
  const nums = numberGeometry.attributes.nums as THREE.InstancedBufferAttribute;
  plexus.numberMesh.count = plexus.closest.length;
  for (let t = 0; t < plexus.closest.length; t++) {
    const piece = plexus.closest[t];
    instanceDummy.position.fromArray(piece.uiPos);
    progress.setX(t, piece.plexusAnimation.value);
    let digits = `${Math.floor(piece.centroid.distanceTo(piece.object.position) * 50)}`.slice(-2);
    if (digits.length < 2) digits = `0${digits}`;
    nums.setXY(t, Number(digits[0]), Number(digits[1]));
    instanceDummy.updateMatrix();
    plexus.numberMesh.setMatrixAt(t, instanceDummy.matrix);
  }
  plexus.numberMaterial.uniforms.uSize.value = Math.min(0.1, 0.08 / (viewportHeight / 1300));
  progress.needsUpdate = true;
  nums.needsUpdate = true;
  plexus.numberMesh.instanceMatrix.needsUpdate = true;
}

class CameraRig {
  camera: THREE.PerspectiveCamera;
  basePosition = new THREE.Vector3(0, 0, 6);
  baseTarget = new THREE.Vector3();
  baseUp = new THREE.Vector3(0, 1, 0);
  target = new THREE.Vector3();
  displacement = { position: new THREE.Vector2(0.07, 0.025), target: new THREE.Vector2() };
  shake = new THREE.Vector3().setScalar(0.01);
  shakeSpeed = new THREE.Vector3().setScalar(0.5);
  touchAmount = 1;
  lerpPosition = 0.035;
  lerpTarget = 0.035;
  private posTheta = 0;
  private posPhi = 0;
  private targetTheta = 0;
  private targetPhi = 0;
  private dir = new THREE.Vector3();
  private right = new THREE.Vector3();
  private up = new THREE.Vector3();
  private v = new THREE.Vector3();
  private lookMatrix = new THREE.Matrix4();

  constructor() {
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  }

  update(clock: Clock, mouse: THREE.Vector2) {
    const { ratio, time } = clock;
    const r = fit(mouse.x, -1, 1, -HALF_PI, HALF_PI) * this.touchAmount;
    const a = fit(mouse.y, 1, -1, -HALF_PI, HALF_PI) * this.touchAmount;

    this.dir.subVectors(this.basePosition, this.baseTarget);
    if (this.dir.lengthSq() === 0) this.dir.z = 1;
    this.dir.normalize();
    this.right.crossVectors(this.baseUp, this.dir).normalize();
    this.up.crossVectors(this.dir, this.right);

    this.posTheta = lerpFPS(this.posTheta, r * this.displacement.position.x, this.lerpPosition, ratio);
    this.posPhi = lerpFPS(this.posPhi, a * this.displacement.position.y, this.lerpPosition, ratio);
    this.v
      .subVectors(this.basePosition, this.baseTarget)
      .applyAxisAngle(this.right, this.posPhi)
      .applyAxisAngle(this.up, this.posTheta);
    this.camera.position.copy(this.baseTarget).add(this.v);

    this.targetTheta = lerpFPS(this.targetTheta, r * this.displacement.target.x, this.lerpTarget, ratio);
    this.targetPhi = lerpFPS(this.targetPhi, a * this.displacement.target.y, this.lerpTarget, ratio);
    const shakeX = sineNoise1(12.23, 3.44, -3.234 + time * this.shakeSpeed.x) * this.shake.x * this.touchAmount;
    const shakeY = sineNoise1(-2.45, 4.789, 7.343 + time * this.shakeSpeed.y) * this.shake.y * this.touchAmount;
    this.v
      .subVectors(this.baseTarget, this.basePosition)
      .applyAxisAngle(this.right, this.targetPhi + shakeY)
      .applyAxisAngle(this.up, this.targetTheta + shakeX);
    this.target.copy(this.basePosition).add(this.v);

    const roll = sineNoise1(23.434, -1.565, 8.454 + time * this.shakeSpeed.z) * this.shake.z * this.touchAmount;
    this.v.subVectors(this.camera.position, this.target).normalize();
    this.camera.up.copy(this.baseUp).applyAxisAngle(this.v, roll);
    this.camera.quaternion.setFromRotationMatrix(this.lookMatrix.lookAt(this.camera.position, this.target, this.camera.up));
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.zoom = Math.min(1, (width / height) * 1.25);
    this.camera.updateProjectionMatrix();
  }
}

function createLutEffect(lutTexture: THREE.Texture) {
  return new Effect(
    "IglooColorCorrection",
    /* glsl */ `
    ${lut}
    uniform sampler3D tLUT;
    uniform float uLUTSize;
    uniform float uLUTIntensity;
    uniform float uGradientAlpha;
    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 scene = inputColor.rgb;
        float gradient = mix(0.8, 1.0, (uv.x + uv.y) * 0.5);
        gradient = mix(1.0, gradient, uGradientAlpha);
        scene *= gradient;
        outputColor = vec4(apply3DLUTTetrahedral(scene, tLUT, uLUTSize, uLUTIntensity), 1.0);
    }`,
    {
      uniforms: new Map<string, THREE.Uniform>([
        ["tLUT", new THREE.Uniform(lutTexture)],
        ["uLUTSize", new THREE.Uniform((lutTexture.image as { width: number }).width)],
        ["uLUTIntensity", new THREE.Uniform(1)],
        ["uGradientAlpha", new THREE.Uniform(0)],
      ]),
    },
  );
}

function createIntroFadeEffect() {
  return new Effect(
    "IglooIntroFade",
    /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntro;
    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        outputColor = vec4(mix(uColor, inputColor.rgb, uIntro), 1.0);
    }`,
    {
      uniforms: new Map<string, THREE.Uniform>([
        ["uColor", new THREE.Uniform(new THREE.Color("#8b909d"))],
        ["uIntro", new THREE.Uniform(0)],
      ]),
    },
  );
}

export type IglooHero = {
  playIntro(): void;
  setSize(width: number, height: number): void;
  setPointer(ndcX: number, ndcY: number): void;
  render(deltaMs: number): void;
  dispose(): void;
};

export async function createIglooHero(canvas: HTMLCanvasElement, options: { reducedMotion: boolean }): Promise<IglooHero> {
  registerEases();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const pixelRatio = window.devicePixelRatio <= 2 ? Math.min(window.devicePixelRatio, 1.15) : Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(pixelRatio);

  const ktx2 = new KTX2Loader().setTranscoderPath("/_study/libs/basis/").detectSupport(renderer);
  const tex = await loadTextures(ktx2);

  const globals = createGlobals();
  const scene = new THREE.Scene();
  const rig = new CameraRig();

  const sky = createSky(globals);
  const smoke = createSmoke(globals, tex);
  const snow = createSnow(globals);
  const [base, cage, outline, mountains, terrain, patches, introParticles, igloo] = await Promise.all([
    createIglooBase(globals, tex),
    createIglooCage(globals),
    createIglooOutline(globals),
    createMountains(globals, tex),
    createTerrain(globals, tex),
    createTerrainPatches(globals, tex),
    createIntroParticles(globals, tex),
    createIgloo(globals, tex),
  ]);
  const plexus = createPlexus(globals, tex);
  for (const part of [sky, smoke, base, cage, outline, mountains, terrain, patches, igloo, plexus, introParticles, snow]) {
    part.meshes.forEach((m) => scene.add(m));
  }

  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, rig.camera));
  const lutEffect = createLutEffect(tex.lut);
  const introFade = createIntroFadeEffect();
  composer.addPass(new EffectPass(rig.camera, lutEffect, introFade));
  const bloom = new BloomEffect({ mipmapBlur: true, levels: 6, luminanceThreshold: 0.2, intensity: 1, radius: 0.85 });
  composer.addPass(new EffectPass(rig.camera, bloom));
  composer.addPass(new EffectPass(rig.camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));

  const introPosition = new THREE.Vector3(-14, 21, 14);
  const introTarget = new THREE.Vector3(0, 0.5, 0);
  const introWeight = { value: 0 };
  const timelinePosition = new THREE.Vector3(-13.25, 2.5, 13.25);
  const timelineTarget = new THREE.Vector3(0, 1, 0);
  const scrollTimeline = gsap.timeline({ paused: true });
  scrollTimeline.fromTo(timelinePosition, { y: 2.5 + 9 }, { y: 2.5, duration: 14, ease: "power2.out" }, 0);
  scrollTimeline.fromTo(timelineTarget, { y: 1 + 14 }, { y: 1, duration: 14, ease: "power2.out" }, 0);
  scrollTimeline.fromTo(timelinePosition, { x: -13.25, z: 13.25 }, { x: -15.25, z: 23.25, duration: 14, ease: "power1.inOut" }, 7);
  scrollTimeline.progress(1).progress(0).progress(HERO_PROGRESS);

  const lutUniforms = lutEffect.uniforms;
  const intro = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.inOut", duration: 0.6 },
    onStart: () => {
      introPosition.set(-14, 21, 14);
      introTarget.set(0, 0.5, 0);
    },
  });
  intro.fromTo(rig, { touchAmount: 0 }, { touchAmount: 1, duration: 5 }, 2);
  intro.fromTo(outline.uniforms.uIntroMaterialize, { value: 0 }, { value: 1, duration: 2.5, ease: "power3.inOut" }, 0);
  intro.fromTo(outline.uniforms.uAlpha, { value: 1 }, { value: 0, duration: 3, ease: "inOut4" }, 2);
  intro.fromTo(cage.uniforms.uProgress, { value: 0 }, { value: 1, duration: 4, ease: "sine.inOut" }, 0);
  intro.fromTo(cage.uniforms.uAlpha, { value: 0 }, { value: 0.4, duration: 0.1, ease: "power2.inOut" }, 0);
  intro.fromTo(cage.uniforms.uAlpha, { value: 0.4 }, { value: 0, duration: 3, ease: "power2.inOut" }, 2.1);
  intro.set(cage.mesh, { visible: true }, 0);
  intro.set(cage.mesh, { visible: false }, 2.1 + 3);
  intro.fromTo(igloo.material.uniforms.uIntroMaterialize, { value: 0 }, { value: 1, duration: 2.25, ease: "igloo_ease_1" }, 1.1);
  intro.set(igloo.mesh, { visible: false }, 0);
  intro.set(igloo.mesh, { visible: true }, 1.1);
  intro.fromTo(igloo.introDisplacementModulator, { value: 0 }, { value: 1, duration: 2, ease: "none" }, 2);
  for (const m of [base.material, terrain.material, patches.material]) {
    intro.set(m.uniforms.uAlpha, { value: 0 }, 0);
    intro.set(m.uniforms.uAlpha, { value: 1 }, 2.1);
  }
  intro.fromTo(mountains.material.uniforms.uAlpha, { value: 0 }, { value: 1, duration: 3 }, 0.7);
  for (const m of [base.material, terrain.material, patches.material, mountains.material]) {
    intro.fromTo(m.uniforms.uProgress, { value: 0 }, { value: 1, duration: 7.5, ease: "inOut1" }, 0.7);
    intro.fromTo(m.uniforms.uProgress2, { value: 0 }, { value: 1, duration: 7.5, ease: "inOut3" }, 0.7);
  }
  intro.fromTo(introParticles.material.uniforms.uProgress, { value: 0 }, { value: 1, duration: 4, ease: "sine.out" }, 0.5);
  intro.fromTo(introParticles.material.uniforms.uAlpha, { value: 1 }, { value: 0, duration: 2, ease: "none" }, 1.75);
  intro.set(introParticles.mesh, { visible: true }, 0);
  intro.set(introParticles.mesh, { visible: false }, 1.75 + 2);
  intro.fromTo(smoke.material.uniforms.uAlpha, { value: 0 }, { value: 1, duration: 3, ease: "power2.inOut" }, 2);
  intro.fromTo(snow.material.uniforms.uAlpha, { value: 0 }, { value: 1, duration: 4, ease: "power2.inOut" }, 2);
  intro.fromTo(sky.material.uniforms.uProgress, { value: 0 }, { value: 1, duration: 3, ease: "power2.inOut" }, 1.5);
  intro.fromTo(igloo.material.uniforms.uProgress, { value: 0 }, { value: 1, duration: 1, ease: "power2.inOut" }, 1);
  intro.fromTo(bloom, { intensity: 1.5 }, { intensity: 1, duration: 2, ease: "sine.inOut" }, 2.5);
  intro.fromTo(lutUniforms.get("uGradientAlpha")!, { value: 0 }, { value: 1, duration: 4, ease: "sine.inOut" }, 1);
  intro.fromTo(introWeight, { value: 0 }, { value: 1, duration: 5.5, ease: "inOut1" }, 2);

  const introFadeUniform = introFade.uniforms.get("uIntro")!;
  let introStarted = false;
  let needsReset = true;

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const planeNormal = new THREE.Vector3();
  const planePoint = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const iglooPointer = new THREE.Vector3();
  const pointerOnPlane = (distance: number) => {
    planeNormal.copy(rig.camera.position).sub(rig.target).normalize();
    planePoint.copy(planeNormal).negate().multiplyScalar(distance).add(rig.camera.position);
    plane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    raycaster.setFromCamera(pointer, rig.camera);
    return raycaster.ray.intersectPlane(plane, hit);
  };

  const clock: Clock = { time: 0, ratio: 1 };
  let viewportHeight = 1;

  return {
    playIntro() {
      if (introStarted) return;
      introStarted = true;
      if (options.reducedMotion) {
        intro.progress(1);
        introFadeUniform.value = 1;
        return;
      }
      gsap.fromTo(introFadeUniform, { value: 0 }, { value: 1, duration: 1, ease: "inOut3" });
      intro.play(0);
    },

    setSize(width, height) {
      viewportHeight = height;
      renderer.setSize(width, height, false);
      composer.setSize(width, height, false);
      const buffer = renderer.getDrawingBufferSize(new THREE.Vector2());
      globals.resolution.value.copy(buffer);
      globals.resolutionUI.value.copy(buffer);
      globals.aspect.value = width / height;
      rig.resize(width, height);
    },

    setPointer(x, y) {
      pointer.set(x, y);
    },

    render(deltaMs) {
      clock.ratio = Math.min(6, deltaMs / (1000 / 60));
      clock.time += deltaMs / 1000;
      globals.time.value = clock.time;
      globals.dtRatio.value = clock.ratio;

      rig.camera.updateMatrixWorld();
      rig.basePosition.lerpVectors(introPosition, timelinePosition, introWeight.value);
      rig.baseTarget.lerpVectors(introTarget, timelineTarget, introWeight.value);

      const glowTarget = pointerOnPlane(19.25);
      if (glowTarget) base.mousePosition.lerp(glowTarget, lerpCoef(0.03, clock.ratio));

      const iglooTarget = pointerOnPlane(19.25);
      updateIgloo(igloo, clock, iglooTarget ? iglooPointer.copy(iglooTarget) : null, needsReset);
      if (igloo.introDisplacementModulator.value === 1) updatePlexus(plexus, igloo, rig.camera, viewportHeight);
      needsReset = false;

      rig.update(clock, pointer);
      composer.render(deltaMs / 1000);
    },

    dispose() {
      intro.kill();
      scrollTimeline.kill();
      gsap.killTweensOf(introFadeUniform);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => m.dispose());
      });
      Object.values(tex).forEach((t) => t.dispose());
      igloo.matrices.dispose();
      igloo.options.dispose();
      composer.dispose();
      ktx2.dispose();
      renderer.dispose();
    },
  };
}
