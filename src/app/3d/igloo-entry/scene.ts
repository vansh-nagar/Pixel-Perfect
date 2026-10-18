/**
 * Imperative port of igloo.inc's "entry" scene (their class `UF`): the foggy cylindrical
 * room at the bottom of the page where 150k particles crawl over a 3D volume (a penguin for
 * LinkedIn, the X logo, the Medium logo) and a link carousel switches between them.
 *
 * LOCAL STUDY COPY: geometry, textures, volumes and font are igloo.inc's, served from the
 * gitignored `public/_study/igloo/`. Never commit those assets or promote this.
 *
 * Parts, one `create*` per original class (only those visible at the resting state):
 *   roomring (oF), floor (hF), forcefield (uF), lightroom (dF), textcylinder (fF),
 *   ceilingsmoke (TF), groundsmoke (IF), ambientparticles (BF), volume particles (wF)
 *   with its fluid sim ($U) and UI (yF: arrows gF, visit box xF, link texts vF),
 *   and the scene composite pass (DF).
 * Deliberate differences are marked `PORT:`.
 */

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ShaderPass,
  SMAAEffect,
  SMAAPreset,
} from "postprocessing";
import * as THREE from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { loadDrc } from "../igloo-hero/draco";
import { GLOBAL } from "./chunks";
import { FluidSim } from "./fluid";
import { layoutText, loadMsdfFont, type MsdfFont } from "./msdf-text";
import * as S from "./shaders";

const ASSETS = "/_study/igloo";

const FINAL_PROGRESS = 0.76;
const ARRIVAL_PROGRESS = 0.58;

const LINKS = [
  {
    title: "LinkedIn",
    url: "https://www.linkedin.com/company/igloo-incorporated",
    vdb: "peachesbody_64",
    scale: 1.2,
  },
  {
    title: "X / Twitter",
    url: "https://www.twitter.com/iglooinc",
    vdb: "x_64",
    scale: 1.3,
  },
  {
    title: "Medium",
    url: "https://medium.com/@iglooinc",
    vdb: "medium_32",
    scale: 1.25,
  },
];

const BREAKPOINT_W = 1600;
const BREAKPOINT_H = 800;
const BREAKPOINT_MOBILE = 640;
const TOP_MARGIN = 90;
const TOP_MARGIN_LOW = 45;
const TOP_MARGIN_MOBILE = 25;

type Clock = { time: number; ratio: number; deltaMs: number };

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a: number, b: number, t: number) => (1 - t) * a + t * b;
const fit = (x: number, a1: number, a2: number, b1: number, b2: number) =>
  clamp(
    b1 + ((x - a1) * (b2 - b1)) / (a2 - a1),
    Math.min(b1, b2),
    Math.max(b1, b2),
  );
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const lerpCoef = (t: number, ratio: number) =>
  1 - Math.exp(Math.log(1 - t) * ratio);
const lerpFPS = (a: number, b: number, t: number, ratio: number) =>
  mix(a, b, lerpCoef(t, ratio));
const frictionFPS = (t: number, ratio: number) => Math.exp(Math.log(t) * ratio);

const NOISE_DIRS = [
  new THREE.Vector3(1.5, 3.4598, 1.234),
  new THREE.Vector3(3.12, -3.234, 4.221),
  new THREE.Vector3(0.355, 2.3, -1.375),
  new THREE.Vector3(-0.156, -3.34, -0.4566),
  new THREE.Vector3(-4.1235, -0.485, -1.45),
  new THREE.Vector3(2.54, -0.879, -2.123),
];
const noiseInput = new THREE.Vector3();
const sineNoise1 = (a: number, b: number, c: number) => {
  noiseInput.set(a, b, c);
  return NOISE_DIRS.reduce((s, d) => s + Math.sin(noiseInput.dot(d)), 0) / 6;
};

let easesRegistered = false;
function registerEases() {
  if (easesRegistered) return;
  gsap.registerPlugin(CustomEase);
  CustomEase.create(
    "entry_ease",
    "M0,0 C0.358,0 0.336,0.209 0.442,0.519 0.59,0.952 0.768,0.918 1,1",
  );
  CustomEase.create("entry_ease_2", "M0,0 C0.388,0.082 0.924,0.862 1,1");
  CustomEase.create(
    "entry_ease_3",
    "M0,0 C0.272,0 0.472,0.454 0.496,0.496 0.66,0.79 0.685,1 1,1",
  );
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

function shaderMaterial(
  globals: Globals,
  uniforms: Uniforms,
  vertexShader: string,
  fragmentShader: string,
  params: THREE.ShaderMaterialParameters = {},
) {
  return new THREE.ShaderMaterial({
    uniforms: { ...globals, ...uniforms },
    vertexShader,
    fragmentShader,
    ...params,
  });
}

function applyMode(texture: THREE.Texture, mode: string) {
  if (mode.includes("repeat"))
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  if (mode.includes("data"))
    texture.magFilter = texture.minFilter = THREE.LinearFilter;
  else if (mode.includes("nearest"))
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
  if (mode.includes("nearest") || mode.includes("data"))
    texture.generateMipmaps = false;
  texture.colorSpace = mode.includes("srgb")
    ? THREE.SRGBColorSpace
    : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

async function loadTextures(ktx2: KTX2Loader) {
  const entries = {
    windLinear: ["images/wind_noise.ktx2", "linear-repeat"],
    perlinData: ["images/perlin-datatexture.ktx2", "colordata-repeat"],
    floorColor: ["images/floor_color.ktx2", "srgb"],
    triangles: ["images/igloo/triangles_tiling.ktx2", "srgb-repeat"],
    dotPattern: ["images/cubes/dot_pattern.ktx2", "srgb-repeat"],
    blurryText: ["images/cubes/blurrytext_atlas.ktx2", "srgb-repeat"],
    visit: ["images/ui/visit-datatexture.ktx2", "data"],
    scroll: ["images/scroll-datatexture.ktx2", "data-repeat"],
    blue: ["images/noises/blue-8-128-rgb.ktx2", "data-repeat"],
    font: ["fonts/IBMPlexMono-Medium-datatexture.ktx2", "data"],
    vol0: [`images/volumes/${LINKS[0].vdb}.ktx2`, "3d-data"],
    vol1: [`images/volumes/${LINKS[1].vdb}.ktx2`, "3d-data"],
    vol2: [`images/volumes/${LINKS[2].vdb}.ktx2`, "3d-data"],
  } as const;
  const keys = Object.keys(entries) as (keyof typeof entries)[];
  const loaded = await Promise.all(
    keys.map(async (k) => {
      const [file, mode] = entries[k];
      return applyMode(await ktx2.loadAsync(`${ASSETS}/${file}`), mode);
    }),
  );
  return Object.fromEntries(keys.map((k, i) => [k, loaded[i]])) as Record<
    keyof typeof entries,
    THREE.Texture
  >;
}
type Textures = Awaited<ReturnType<typeof loadTextures>>;

const loadGeometry = (file: string) =>
  loadDrc(`${ASSETS}/geometries/${file}`).then((g) => g.clone());

function createRoomRing(globals: Globals) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.rotateX(Math.PI * 0.5);
  geometry.translate(0, 1.5, 0);
  const material = shaderMaterial(globals, {}, S.roomRingVert, S.roomRingFrag, {
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -10.26;
  mesh.scale.setScalar(0.57);
  mesh.name = "roomring";
  mesh.renderOrder = 3;
  mesh.updateMatrixWorld(true);
  return { mesh };
}

async function createFloor(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    {
      tMap: { value: tex.floorColor },
      tPerlin: { value: tex.perlinData },
      tWind: { value: tex.windLinear },
      uAlpha: { value: 0 },
      uColor1: { value: new THREE.Color("#6a6f7d") },
      uColor2: { value: new THREE.Color("#e1e6f1") },
      uRotationTime: { value: 0 },
    },
    S.floorVert,
    S.floorFrag,
    { transparent: true },
  );
  const mesh = new THREE.Mesh(await loadGeometry("floor.drc"), material);
  mesh.name = "floor";
  mesh.position.y = -10.19;
  mesh.scale.setScalar(0.73);
  mesh.rotation.y = Math.PI;
  mesh.renderOrder = 3;
  mesh.updateMatrixWorld(true);
  return { mesh, material, state: { additionalTime: 0 } };
}

function createForceField(globals: Globals, tex: Textures) {
  const geometry = new THREE.CylinderGeometry(1, 1, 3, 64, 6, true);
  geometry.translate(0, 3 * 0.5, 0);
  const material = shaderMaterial(
    globals,
    {
      uAlpha: { value: 0 },
      uHeight: { value: 3 },
      tTriangles: { value: tex.triangles },
    },
    S.forcefieldVert,
    S.forcefieldFrag,
    {
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
    },
  );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -10.13;
  mesh.scale.setScalar(0.28);
  mesh.name = "forcefield";
  mesh.renderOrder = 15;
  mesh.updateMatrixWorld(true);
  mesh.matrixAutoUpdate = false;
  return { mesh, material };
}

function createLightRoom(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    {
      uAlpha: { value: 1 },
      uColor1: { value: new THREE.Color("#6a6f7d") },
      uColor2: { value: new THREE.Color("#e1e6f1") },
      tPerlin: { value: tex.perlinData },
      tDotPattern: { value: tex.dotPattern },
    },
    S.lightroomVert,
    S.lightroomFrag,
    { side: THREE.BackSide },
  );
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 32), material);
  mesh.name = "lightroom";
  mesh.renderOrder = 2;
  mesh.position.y = -12.15;
  mesh.updateMatrixWorld(true);
  mesh.matrixAutoUpdate = false;
  return { mesh };
}

async function createTextCylinder(globals: Globals, tex: Textures) {
  const geometry = await loadGeometry("blurrytext_cylinder.drc");
  const inner = shaderMaterial(
    globals,
    { uAlpha: { value: 0 }, tMap: { value: tex.blurryText } },
    S.textCylinderVert,
    S.textCylinderFrag,
    {
      transparent: true,
      blending: THREE.AdditiveBlending,
    },
  );
  const mesh = new THREE.Mesh(geometry, inner);
  mesh.position.y = -10.33;
  mesh.scale.setScalar(1.75);
  mesh.name = "textcylinder";
  mesh.renderOrder = 1;
  mesh.updateMatrixWorld(true);
  const mesh2 = new THREE.Mesh(geometry, inner);
  mesh2.position.y = -10.33;
  mesh2.scale.setScalar(3.5);
  mesh2.rotation.y = 3.14159 * 0.5;
  mesh2.name = "textcylinder2";
  mesh2.renderOrder = 0;
  mesh2.updateMatrixWorld(true);

  const outer = shaderMaterial(
    globals,
    { uAlpha: { value: 1 }, tMap: { value: tex.blurryText } },
    S.textCylinderOuterVert,
    S.textCylinderOuterFrag,
    {
      transparent: true,
      blending: THREE.AdditiveBlending,
    },
  );
  const mesh3 = new THREE.Mesh(geometry, outer);
  mesh3.position.y = -9.5;
  mesh3.scale.set(2, 9, 2);
  mesh3.rotation.y = 3.14159;
  mesh3.name = "textcylinder3";
  mesh3.renderOrder = 0;
  const mesh4 = new THREE.Mesh(geometry, outer);
  mesh4.position.y = -9.5;
  mesh4.scale.set(3.3, 8, 3.3);
  mesh4.name = "textcylinder4";
  mesh4.renderOrder = -1;
  return {
    meshes: [mesh, mesh2, mesh3, mesh4],
    mesh,
    mesh2,
    mesh3,
    mesh4,
    material: inner,
  };
}

async function createCeilingSmoke(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    { tWind: { value: tex.windLinear } },
    S.ceilingSmokeVert,
    S.ceilingSmokeFrag,
    {
      transparent: true,
      blending: THREE.AdditiveBlending,
    },
  );
  const mesh = new THREE.Mesh(await loadGeometry("ceilingsmoke.drc"), material);
  mesh.name = "ceilingsmoke";
  mesh.position.y = -9.4;
  mesh.scale.set(2, 0.1, 2);
  mesh.updateMatrixWorld(true);
  mesh.matrixAutoUpdate = false;
  mesh.renderOrder = 2;
  return { mesh };
}

async function createGroundSmoke(globals: Globals, tex: Textures) {
  const material = shaderMaterial(
    globals,
    { tWind: { value: tex.windLinear }, uAlpha: { value: 0 } },
    S.groundSmokeVert,
    S.groundSmokeFrag,
    {
      transparent: true,
      blending: THREE.AdditiveBlending,
    },
  );
  const mesh = new THREE.Mesh(
    await loadGeometry("shattered_ring_smoke.drc"),
    material,
  );
  mesh.name = "groundsmoke";
  mesh.position.y = -10.17;
  mesh.scale.set(5, 0.1, 5);
  mesh.updateMatrixWorld(true);
  mesh.renderOrder = 0;
  return { mesh, material };
}

function createAmbientParticles(globals: Globals) {
  const count = 60;
  const scale = [2.5, 0.5, 2.5];
  const positions: number[] = [];
  const random: number[] = [];
  for (let n = 0; n < count; n++) {
    positions.push(
      Math.random() * scale[0] - scale[0] * 0.5,
      Math.random() * scale[1] - scale[1] * 0.5,
      Math.random() * scale[2] - scale[2] * 0.5,
    );
    random.push(Math.random(), Math.random(), Math.random());
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("random", new THREE.Float32BufferAttribute(random, 3));
  const material = shaderMaterial(
    globals,
    { uAlpha: { value: 1 } },
    S.ambientVert,
    S.ambientFrag,
    { transparent: true, blending: THREE.AdditiveBlending },
  );
  const mesh = new THREE.Points(geometry, material);
  mesh.name = "ambientparticles";
  mesh.renderOrder = 15;
  mesh.position.y = -9.61;
  mesh.updateMatrixWorld(true);
  mesh.frustumCulled = false;
  return { mesh, material };
}

const textureSizeParticles = (n: number) =>
  Math.max(Math.ceil(Math.sqrt(n) / 4) * 4, 4);

function createVolumeParticles(
  globals: Globals,
  tex: Textures,
  fluid: FluidSim,
  renderer: THREE.WebGLRenderer,
) {
  const count = 150 * 1000;
  const cubeSize = 0.65;
  const size = textureSizeParticles(count);
  const volumes = [tex.vol0, tex.vol1, tex.vol2];

  const start = new Float32Array(size * size * 4);
  for (let l = 0; l < count; l++) {
    start[l * 4 + 0] = fit(
      Math.random(),
      0,
      1,
      -cubeSize * 0.5,
      cubeSize * 0.5,
    );
    start[l * 4 + 1] = fit(
      Math.random(),
      0,
      1,
      -cubeSize * 0.5,
      cubeSize * 0.5,
    );
    start[l * 4 + 2] = fit(
      Math.random(),
      0,
      1,
      -cubeSize * 0.5,
      cubeSize * 0.5,
    );
    start[l * 4 + 3] = Math.random();
  }
  const dataTexture = (data: Float32Array) => {
    const t = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    t.needsUpdate = true;
    return t;
  };
  const initialPos = dataTexture(start);
  const initialVel = dataTexture(new Float32Array(size * size * 4));
  const orig = dataTexture(start.slice());
  const lightPos = new THREE.Vector3(-0.75, 1, -0.1);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(count * 3), 3),
  );
  const rand = new Float32Array(count * 4);
  const texuv = new Float32Array(count * 2);
  const half = (1 / size) * 0.5;
  for (let c = 0; c < count; c++) {
    rand.set(
      [Math.random(), Math.random(), Math.random(), Math.random()],
      c * 4,
    );
    texuv.set(
      [(c % size) / size + half, Math.floor(c / size) / size + half],
      c * 2,
    );
  }
  geometry.setAttribute("rand", new THREE.BufferAttribute(rand, 4));
  geometry.setAttribute("texuv", new THREE.BufferAttribute(texuv, 2));

  const material = shaderMaterial(
    globals,
    {
      tTexture1: { value: null },
      tTexture2: { value: null },
      uColorInitial: { value: new THREE.Color("#b5d5ff") },
      uColorLight: { value: new THREE.Color("#bdc6d4") },
      uColorDark: { value: new THREE.Color("#222b42") },
      uColorFast: { value: new THREE.Color("#d7ebfa") },
      uSize: { value: 10 },
      uLightPos: { value: lightPos },
      uVisible: { value: 0 },
      uAlpha: { value: 1 },
      uInitialGlow: { value: 0 },
    },
    S.particlesVert,
    S.particlesFrag,
    {
      depthTest: true,
      depthWrite: true,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendDst: THREE.SrcColorFactor,
      blendSrc: THREE.SrcAlphaFactor,
    },
  );
  const mesh = new THREE.Points(geometry, material);
  mesh.name = "volume particles";
  mesh.frustumCulled = false;
  mesh.position.set(0, -9.785, 0);
  mesh.updateMatrixWorld();

  const rtOptions = {
    count: 2,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthBuffer: false,
  };
  const rt1 = new THREE.WebGLRenderTarget(size, size, rtOptions);
  const rt2 = new THREE.WebGLRenderTarget(size, size, rtOptions);
  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(quadGeometry);
  quad.frustumCulled = false;
  quadScene.add(quad);

  const copy = new THREE.ShaderMaterial({
    uniforms: {
      tTexture1: { value: initialPos },
      tTexture2: { value: initialVel },
    },
    vertexShader:
      "varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position, 1.0); }",
    fragmentShader:
      "varying vec2 vUv;\n#define outTex1 pc_fragColor\nuniform sampler2D tTexture1;\nlayout(location = 1) out highp vec4 outTex2;\nuniform sampler2D tTexture2;\nvoid main() {\noutTex1 = texture2D(tTexture1, vUv);\noutTex2 = texture2D(tTexture2, vUv);\n}",
  });
  quad.material = copy;
  const prevTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(rt1);
  renderer.render(quadScene, quadCamera);
  renderer.setRenderTarget(rt2);
  renderer.render(quadScene, quadCamera);
  renderer.setRenderTarget(prevTarget);
  copy.dispose();

  const sim = shaderMaterial(
    globals,
    {
      tTexture1: { value: null },
      tTexture2: { value: null },
      tOrig: { value: orig },
      tVel: fluid.velUniform,
      uViewMatrix: { value: new THREE.Matrix4() },
      uModelMatrix: { value: new THREE.Matrix4() },
      uProjMatrix: { value: new THREE.Matrix4() },
      uRotation: { value: 0 },
      uCubeSize: { value: cubeSize },
      tVolume: { value: volumes[0] },
      uVolumeScale: { value: LINKS[0].scale },
      uLightPos: { value: lightPos },
      uInteractForce: { value: 1 },
      uAdditionalNoise: { value: 0 },
      uShowNoise: { value: 0 },
    },
    S.particlesSimVert,
    S.particlesSimFrag,
  );
  quad.material = sim;

  let current = 0;
  const clearColor = new THREE.Color();
  const compute = (camera: THREE.Camera) => {
    sim.uniforms.uModelMatrix.value.copy(mesh.matrixWorld);
    sim.uniforms.uViewMatrix.value.copy(camera.matrixWorldInverse);
    sim.uniforms.uProjMatrix.value.copy(camera.projectionMatrix);
    const write = current === 0 ? rt1 : rt2;
    const read = current === 0 ? rt2 : rt1;
    current = (current + 1) % 2;
    sim.uniforms.tTexture1.value = read.textures[0];
    sim.uniforms.tTexture2.value = read.textures[1];
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    const previous = renderer.getRenderTarget();
    renderer.getClearColor(clearColor);
    const alpha = renderer.getClearAlpha();
    renderer.setRenderTarget(write);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, false, false);
    renderer.render(quadScene, quadCamera);
    renderer.autoClear = autoClear;
    renderer.setRenderTarget(previous);
    renderer.setClearColor(clearColor, alpha);
    material.uniforms.tTexture1.value = write.textures[0];
    material.uniforms.tTexture2.value = write.textures[1];
  };

  return {
    mesh,
    material,
    sim,
    volumes,
    compute,
    currentLink: 0,
    warmupMs: 0,
    dispose() {
      [rt1, rt2].forEach((rt) => rt.dispose());
      [initialPos, initialVel, orig].forEach((t) => t.dispose());
      sim.dispose();
      quadGeometry.dispose();
    },
  };
}

function createArrows(group: THREE.Group) {
  const s = 0.065;
  const positions = [
    0,
    0,
    0,
    -s,
    0,
    0,
    -s,
    0,
    0,
    -s * 0.8,
    s * 0.2,
    0,
    0,
    0,
    0,
    s,
    0,
    0,
    s,
    0,
    0,
    s * 0.8,
    s * 0.2,
    0,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "side",
    new THREE.Float32BufferAttribute([-1, -1, -1, -1, 1, 1, 1, 1], 1),
  );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color("#ffffff") },
      uWidth: { value: 0.3 },
      uScale: { value: 1 },
      uOpacity1: { value: 0 },
      uOpacity2: { value: 0 },
    },
    vertexShader: S.arrowsVert,
    fragmentShader: S.arrowsFrag,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
  });
  const mesh = new THREE.LineSegments(geometry, material);
  mesh.name = "arrows";
  mesh.renderOrder = 999;
  mesh.frustumCulled = false;
  group.add(mesh);

  const plane = new THREE.PlaneGeometry(s, s).rotateY(Math.PI);
  const planeRight = new THREE.Mesh(plane.clone().translate(-s * 0.5, 0, 0));
  const planeLeft = new THREE.Mesh(plane.clone().translate(s * 0.5, 0, 0));
  planeRight.userData.arrow = "right";
  planeLeft.userData.arrow = "left";
  planeRight.visible = planeLeft.visible = false;
  group.add(planeLeft, planeRight);

  const show = (which: "left" | "right" | "both" = "both", t = 1) => {
    if (which === "right" || which === "both")
      gsap.fromTo(
        material.uniforms.uOpacity1,
        { value: 0 },
        { value: 1, duration: 0.2 * t, ease: "none", overwrite: true },
      );
    if (which === "left" || which === "both")
      gsap.fromTo(
        material.uniforms.uOpacity2,
        { value: 0 },
        { value: 1, duration: 0.2 * t, ease: "none", overwrite: true },
      );
  };
  const hide = () => {
    gsap.fromTo(
      material.uniforms.uOpacity1,
      { value: 1 },
      { value: 0, duration: 0.1, ease: "none", overwrite: true },
    );
    gsap.fromTo(
      material.uniforms.uOpacity2,
      { value: 1 },
      { value: 0, duration: 0.1, ease: "none", overwrite: true },
    );
  };
  const update = (portrait: boolean) => {
    material.uniforms.uWidth.value = portrait ? 0.175 : 0.3;
    material.uniforms.uScale.value = portrait ? 0.75 : 1;
    const x = portrait ? 0.185 : 0.3;
    planeLeft.position.set(x, 0, 0);
    planeRight.position.set(-x, 0, 0);
    planeLeft.updateMatrixWorld();
    planeRight.updateMatrixWorld();
  };
  return {
    mesh,
    material,
    hitTargets: [planeLeft, planeRight],
    show,
    hide,
    update,
  };
}

const uiVec = new THREE.Vector3();
const viewSize = new THREE.Vector2();
function positionUI(
  rig: CameraRig,
  mesh: THREE.Object3D,
  screen: { w: number; h: number },
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const camera = rig.camera;
  const distance = uiVec.subVectors(camera.position, rig.target).length();
  camera.getViewSize(distance, viewSize);
  const c = viewSize.y / screen.h;
  mesh.scale.set(width * c, height * c, 1);
  const h = x / screen.w;
  const d = y / screen.h;
  mesh.position
    .copy(camera.position)
    .add(
      uiVec
        .set(
          viewSize.x * -0.5 + viewSize.x * h,
          viewSize.y * 0.5 - viewSize.y * d,
          -distance,
        )
        .applyQuaternion(camera.quaternion),
    );
  mesh.quaternion.copy(camera.quaternion);
  mesh.updateMatrixWorld();
}

function createVisitBox(tex: Textures) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tMap: { value: tex.visit },
      tBlocks: { value: tex.scroll },
      uColor: { value: new THREE.Color("#ffffff") },
      uShow: { value: 1 },
      uRand: { value: Math.random() },
    },
    vertexShader: S.visitBoxVert,
    fragmentShader: S.visitBoxFrag,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const box = new THREE.Mesh(new THREE.PlaneGeometry(), material);
  box.name = "box";
  box.frustumCulled = false;
  box.renderOrder = 999;
  box.visible = false;
  return { box, material };
}

function createLinkTexts(globals: Globals, tex: Textures, font: MsdfFont) {
  const group = new THREE.Group();
  group.name = "texts";
  group.visible = false;
  const meshes = LINKS.map((link) => {
    const geometry = layoutText(font, {
      text: link.title,
      width: 10,
      align: "center",
      lineHeight: 1,
      size: 1,
      baseOffset: -0.25,
    });
    const material = shaderMaterial(
      globals,
      {
        tMap: { value: tex.font },
        uColor: { value: new THREE.Color("#ffffff") },
        uShow1: { value: 0 },
        uShow2: { value: 0 },
        uAlpha: { value: 1 },
        uFadePosition: { value: 100 },
        uFadeMargin: { value: 100 },
      },
      S.linkTextVert,
      S.linkTextFrag,
      {
        depthWrite: false,
        depthTest: false,
        transparent: true,
        blending: THREE.AdditiveBlending,
      },
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "text";
    mesh.frustumCulled = false;
    mesh.renderOrder = 9999;
    group.add(mesh);
    return mesh;
  });
  return { group, meshes };
}

class CameraRig {
  camera = new THREE.PerspectiveCamera(25, 1, 0.1, 1000);
  basePosition = new THREE.Vector3(0, 5.5, 0);
  baseTarget = new THREE.Vector3();
  baseUp = new THREE.Vector3(0, 1, 0);
  target = new THREE.Vector3();
  displacement = {
    position: new THREE.Vector2(0.07, 0.025),
    target: new THREE.Vector2(),
    rotation: 0,
  };
  lerpPosition = 0.02;
  lerpRotation = 0.02;
  lerpTarget = 0.015;
  shake = new THREE.Vector3().setScalar(0.02);
  shakeSpeed = new THREE.Vector3().setScalar(0.25);
  touchAmount = 1;
  private posTheta = 0;
  private posPhi = 0;
  private targetTheta = 0;
  private targetPhi = 0;
  private rotationUp = 0;
  private dir = new THREE.Vector3();
  private right = new THREE.Vector3();
  private up = new THREE.Vector3();
  private v = new THREE.Vector3();
  private look = new THREE.Matrix4();

  update(clock: Clock, pointer: THREE.Vector2, velocity: THREE.Vector2) {
    const { ratio, time } = clock;
    const r =
      fit(pointer.x, -1, 1, -Math.PI / 2, Math.PI / 2) * this.touchAmount;
    const a =
      fit(pointer.y, 1, -1, -Math.PI / 2, Math.PI / 2) * this.touchAmount;
    this.dir.subVectors(this.basePosition, this.baseTarget);
    if (this.dir.lengthSq() === 0) this.dir.z = 1;
    this.dir.normalize();
    this.right.crossVectors(this.baseUp, this.dir);
    if (this.right.lengthSq() === 0) {
      if (Math.abs(this.baseUp.z) === 1) this.dir.x += 1e-4;
      else this.dir.z += 1e-4;
      this.dir.normalize();
      this.right.crossVectors(this.baseUp, this.dir);
    }
    this.right.normalize();
    this.up.crossVectors(this.dir, this.right);

    if (
      this.displacement.position.x === 0 &&
      this.displacement.position.y === 0
    ) {
      this.camera.position.copy(this.basePosition);
      this.posTheta = this.posPhi = 0;
    } else {
      this.posTheta = lerpFPS(
        this.posTheta,
        r * this.displacement.position.x,
        this.lerpPosition,
        ratio,
      );
      this.posPhi = lerpFPS(
        this.posPhi,
        a * this.displacement.position.y,
        this.lerpPosition,
        ratio,
      );
      this.v
        .subVectors(this.basePosition, this.baseTarget)
        .applyAxisAngle(this.right, this.posPhi)
        .applyAxisAngle(this.up, this.posTheta);
      this.camera.position.copy(this.baseTarget).add(this.v);
    }

    this.targetTheta = lerpFPS(
      this.targetTheta,
      r * this.displacement.target.x,
      this.lerpTarget,
      ratio,
    );
    this.targetPhi = lerpFPS(
      this.targetPhi,
      a * this.displacement.target.y,
      this.lerpTarget,
      ratio,
    );
    const shakeX =
      sineNoise1(12.23, 3.44, -3.234 + time * this.shakeSpeed.x) *
      this.shake.x *
      this.touchAmount;
    const shakeY =
      sineNoise1(-2.45, 4.789, 7.343 + time * this.shakeSpeed.y) *
      this.shake.y *
      this.touchAmount;
    this.v
      .subVectors(this.baseTarget, this.basePosition)
      .applyAxisAngle(this.right, this.targetPhi + shakeY)
      .applyAxisAngle(this.up, this.targetTheta + shakeX);
    this.target.copy(this.basePosition).add(this.v);

    this.rotationUp = lerpFPS(
      this.rotationUp,
      velocity.x * this.displacement.rotation * this.touchAmount,
      this.lerpRotation,
      ratio,
    );
    const roll =
      sineNoise1(23.434, -1.565, 8.454 + time * this.shakeSpeed.z) *
      this.shake.z *
      this.touchAmount;
    this.v.subVectors(this.camera.position, this.target).normalize();
    this.camera.up
      .copy(this.baseUp)
      .applyAxisAngle(this.v, this.rotationUp + roll);
    this.camera.quaternion.setFromRotationMatrix(
      this.look.lookAt(this.camera.position, this.target, this.camera.up),
    );
    this.camera.updateMatrixWorld();
  }
}

export type IglooEntry = {
  arrive(): void;
  setSize(width: number, height: number): void;
  setPointer(clientX: number, clientY: number, rect: DOMRect): void;
  click(clientX: number, clientY: number, rect: DOMRect): void;
  key(key: string): void;
  render(deltaMs: number): void;
  cursor(): string;
  dispose(): void;
};

export async function createIglooEntry(
  canvas: HTMLCanvasElement,
  options: { reducedMotion: boolean },
): Promise<IglooEntry> {
  registerEases();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setPixelRatio(
    window.devicePixelRatio <= 2
      ? Math.min(window.devicePixelRatio, 1.15)
      : Math.min(window.devicePixelRatio, 1.5),
  );

  const ktx2 = new KTX2Loader()
    .setTranscoderPath("/_study/libs/basis/")
    .detectSupport(renderer);
  const [tex, font] = await Promise.all([
    loadTextures(ktx2),
    loadMsdfFont(`${ASSETS}/fonts/IBMPlexMono-Medium.json`),
  ]);

  const globals = createGlobals();
  const scene = new THREE.Scene();
  const rig = new CameraRig();
  const fluid = new FluidSim();

  const roomRing = createRoomRing(globals);
  const forcefield = createForceField(globals, tex);
  const lightroom = createLightRoom(globals, tex);
  const ambient = createAmbientParticles(globals);
  const [floor, textCylinder, ceilingSmoke, groundSmoke] = await Promise.all([
    createFloor(globals, tex),
    createTextCylinder(globals, tex),
    createCeilingSmoke(globals, tex),
    createGroundSmoke(globals, tex),
  ]);
  const particles = createVolumeParticles(globals, tex, fluid, renderer);

  const uiGroup = new THREE.Group();
  uiGroup.name = "ui";
  particles.mesh.add(uiGroup);
  const arrows = createArrows(uiGroup);
  const visit = createVisitBox(tex);
  const texts = createLinkTexts(globals, tex, font);

  scene.add(
    roomRing.mesh,
    floor.mesh,
    forcefield.mesh,
    lightroom.mesh,
    ...textCylinder.meshes,
    ceilingSmoke.mesh,
    groundSmoke.mesh,
    ambient.mesh,
    particles.mesh,
    visit.box,
    texts.group,
  );

  const compositeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...globals,
      tDiffuse: { value: null },
      tBlue: { value: tex.blue },
      tScroll: { value: tex.scroll },
      uBlueOffset: { value: new THREE.Vector2() },
      uGradientAlpha: { value: 0 },
      uRingProximity: { value: 0 },
      uSquareAttr: { value: new THREE.Vector3() },
    },
    vertexShader: `${GLOBAL}\nvarying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: S.compositeFrag,
    depthTest: false,
    depthWrite: false,
  });
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });
  composer.addPass(new RenderPass(scene, rig.camera));
  composer.addPass(new ShaderPass(compositeMaterial, "tDiffuse"));
  composer.addPass(
    new EffectPass(
      rig.camera,
      new BloomEffect({
        mipmapBlur: true,
        levels: 6,
        luminanceThreshold: 0.2,
        intensity: 1,
        radius: 0.85,
      }),
    ),
  );
  composer.addPass(
    new EffectPass(rig.camera, new SMAAEffect({ preset: SMAAPreset.HIGH })),
  );

  const state = {
    progress: ARRIVAL_PROGRESS,
    timelinePosition: new THREE.Vector3(0, 1.5, -2),
    timelineTarget: new THREE.Vector3(0, -2.5, -1),
    timelineDisplacement: new THREE.Vector2(),
    timelineDisplacementTar: new THREE.Vector2(),
    timelineDisplacementRot: { value: 0 },
    timelineAdditional: { upRotation: 0, upOriginal: 0 },
  };
  let fov = rig.camera.fov;
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.inOut", duration: 0.6 },
    onUpdate: () => {
      if (rig.camera.fov !== fov) {
        fov = rig.camera.fov;
        rig.camera.updateProjectionMatrix();
      }
      roomRing.mesh.visible = state.progress > 0.53;
    },
  });
  const P = state.timelinePosition;
  const T = state.timelineTarget;
  tl.to(P, { z: 0, x: 0, duration: 2.5, ease: "power2.out" }, 0);
  tl.to(T, { z: 0, x: 0, duration: 2.5, ease: "power2.out" }, 0);
  tl.to(P, { y: -9.83, duration: 7, ease: "entry_ease_3" }, 0.2);
  tl.to(T, { y: -10, duration: 3, ease: "power1.inOut" }, 0.2);
  tl.to(T, { y: -9.81, duration: 2.5, ease: "power1.inOut" }, 3.2);
  tl.to(
    state.timelineAdditional,
    { upRotation: Math.PI, duration: 5.25, ease: "power3.inOut" },
    1,
  );
  tl.to(
    state.timelineAdditional,
    { upOriginal: 1, duration: 3.7, ease: "entry_ease" },
    3.5,
  );
  tl.to(P, { z: -1.5, duration: 3.7, ease: "entry_ease" }, 3.5);
  tl.to(P, { z: -3, duration: 2, ease: "entry_ease_2" }, 7.2);
  tl.set(rig.camera, { fov: 22 }, 0);
  tl.to(rig.camera, { fov: 30, duration: 7.2, ease: "power1.inOut" }, 0);
  tl.set(state.timelineDisplacement, { x: 0.01, y: 0.005 }, 0);
  tl.set(state.timelineDisplacementRot, { value: 0 }, 0);
  tl.to(
    state.timelineDisplacement,
    { x: 0, y: 0, duration: 1, ease: "power2.inOut" },
    4,
  );
  tl.to(
    state.timelineDisplacementTar,
    { x: -0.03, y: -0.01, duration: 2, ease: "power2.inOut" },
    4,
  );
  tl.to(
    state.timelineDisplacementRot,
    { value: 0.05, duration: 2, ease: "power2.inOut" },
    4,
  );
  tl.to(T, { y: -10.35, duration: 2, ease: "power2.in" }, 7.2);
  tl.set(particles.mesh, { visible: false }, 0);
  tl.set(particles.mesh, { visible: true }, 1.5);
  tl.fromTo(
    particles.material.uniforms.uAlpha,
    { value: 0 },
    { value: 1, duration: 2.5, ease: "power2.inOut" },
    1.5,
  );
  tl.fromTo(
    particles.material.uniforms.uInitialGlow,
    { value: 1 },
    { value: 0, duration: 1, ease: "power1.inOut" },
    3.9,
  );
  tl.fromTo(
    particles.sim.uniforms.uShowNoise,
    { value: 1 },
    { value: 0, duration: 1.5, ease: "power1.inOut" },
    3.5,
  );
  tl.set(floor.mesh, { visible: false }, 0);
  tl.set(floor.mesh, { visible: true }, 3.4);
  tl.fromTo(
    floor.material.uniforms.uAlpha,
    { value: 0 },
    { value: 1, duration: 5, ease: "power2.out" },
    3.4,
  );
  for (const m of [textCylinder.mesh, textCylinder.mesh2]) {
    tl.set(m, { visible: false }, 0);
    tl.set(m, { visible: true }, 4.5);
  }
  tl.fromTo(
    textCylinder.material.uniforms.uAlpha,
    { value: 0 },
    { value: 1, duration: 2, ease: "power2.inOut" },
    4.5,
  );
  tl.fromTo(
    textCylinder.material.uniforms.uAlpha,
    { value: 0 },
    { value: 1, duration: 2, ease: "power2.inOut" },
    4.5,
  );
  tl.set(forcefield.mesh, { visible: false }, 0);
  tl.set(forcefield.mesh, { visible: true }, 4);
  tl.fromTo(
    forcefield.material.uniforms.uAlpha,
    { value: 0 },
    { value: 1, duration: 2, ease: "power2.inOut" },
    4,
  );
  tl.set(groundSmoke.mesh, { visible: false }, 0);
  tl.set(ceilingSmoke.mesh, { visible: false }, 0);
  tl.set(groundSmoke.mesh, { visible: true }, 3.4);
  tl.set(ceilingSmoke.mesh, { visible: true }, 4.5);
  tl.fromTo(
    groundSmoke.material.uniforms.uAlpha,
    { value: 0 },
    { value: 1, duration: 3, ease: "power2.out" },
    4.4,
  );
  tl.set(ambient.mesh, { visible: false }, 0);
  tl.set(ambient.mesh, { visible: true }, 3.4);
  tl.fromTo(
    ambient.material.uniforms.uAlpha,
    { value: 0 },
    { value: 1, duration: 3, ease: "power2.out" },
    4.4,
  );
  const squareAttr = (force?: number) =>
    compositeMaterial.uniforms.uSquareAttr.value.set(
      Math.random() * 25.424,
      Math.random() * 64.453,
      force ?? 0.5,
    );
  const ring = compositeMaterial.uniforms.uRingProximity;
  for (const [at, out] of [
    [2, 0.4],
    [2.95, 0.4],
    [3.8, 0.6],
  ] as const) {
    tl.call(() => squareAttr(at === 3.8 ? 0.5 : 1), undefined, at);
    tl.fromTo(
      ring,
      { value: 0 },
      { value: 1, duration: 0.5, ease: "power1.in" },
      at,
    );
    tl.fromTo(
      ring,
      { value: 1 },
      { value: 0, duration: out, ease: "power1.out" },
      at + 0.5,
    );
  }
  tl.call(() => squareAttr(0.5), undefined, 4.9);
  tl.progress(1).progress(0).progress(state.progress);

  const pointer11 = new THREE.Vector2();
  const velocity = new THREE.Vector2();
  const lastPointer01 = new THREE.Vector2(0.5, 0.5);
  const screen = { w: 1, h: 1, dpr: 1 };
  const raycaster = new THREE.Raycaster();
  let uiEnabled = false;
  let hovered: "left" | "right" | "box" | null = null;

  const setLink = (dir: 1 | -1) => {
    const n = LINKS.length;
    particles.currentLink =
      dir === -1
        ? particles.currentLink === 0
          ? n - 1
          : particles.currentLink - 1
        : (particles.currentLink + 1) % n;
    gsap.fromTo(
      particles.sim.uniforms.uAdditionalNoise,
      { value: 1 },
      { value: 0, duration: 0.5, ease: "power2.inOut", overwrite: true },
    );
    particles.sim.uniforms.tVolume.value =
      particles.volumes[particles.currentLink];
    particles.sim.uniforms.uVolumeScale.value =
      LINKS[particles.currentLink].scale;
    particles.sim.uniforms.uRotation.value = Math.PI * 1.5;
    arrows.show(dir === 1 ? "right" : "left", 0.75);
    showTexts("all", 1);
    gsap.to(floor.state, {
      additionalTime: floor.state.additionalTime + 4 * -dir,
      duration: 3,
      ease: "power4.out",
      overwrite: true,
    });
  };

  const showTexts = (which: "all" | number, speed: number) => {
    texts.group.visible = true;
    texts.meshes.forEach((m, i) => {
      if (which !== "all" && which !== i) return;
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      gsap.set(u.uAlpha, { value: 1, overwrite: true });
      gsap.fromTo(
        u.uShow1,
        { value: 0 },
        { value: 1, duration: 0.4 * speed, ease: "sine.out", overwrite: true },
      );
      gsap.fromTo(
        u.uShow2,
        { value: 0 },
        { value: 1, duration: 0.75 * speed, ease: "sine.out", overwrite: true },
      );
    });
  };
  const hideTexts = () => {
    texts.meshes.forEach((m) => {
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      gsap.to(u.uShow2, {
        value: 0,
        duration: 0.15,
        ease: "none",
        overwrite: true,
      });
      gsap.to(u.uAlpha, {
        value: 0,
        duration: 0.15,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          texts.group.visible = false;
        },
      });
    });
  };
  const showBox = (speed = 1, reshow = true) => {
    if (reshow) {
      visit.box.visible = true;
      visit.material.uniforms.uRand.value = Math.random();
      gsap.fromTo(
        visit.material.uniforms.uShow,
        { value: 0 },
        { value: 1, duration: 0.3 * speed, ease: "none", overwrite: true },
      );
    }
  };
  const enableUI = () => {
    if (uiEnabled) return;
    uiEnabled = true;
    arrows.show();
    showBox();
    showTexts("all", 1);
  };
  const disableUI = () => {
    if (!uiEnabled) return;
    uiEnabled = false;
    arrows.hide();
    gsap.fromTo(
      visit.material.uniforms.uShow,
      { value: 1 },
      {
        value: 0,
        duration: 0.15,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => void (visit.box.visible = false),
      },
    );
    hideTexts();
  };

  const pick = (): "left" | "right" | "box" | null => {
    if (!uiEnabled) return null;
    raycaster.setFromCamera(pointer11, rig.camera);
    if (raycaster.intersectObject(visit.box, false).length) return "box";
    const hit = raycaster.intersectObjects(arrows.hitTargets, false)[0];
    return hit ? (hit.object.userData.arrow as "left" | "right") : null;
  };

  const setPointer = (clientX: number, clientY: number, rect: DOMRect) => {
    const x01 = (clientX - rect.left) / rect.width;
    const y01 = 1 - (clientY - rect.top) / rect.height;
    velocity.x += (x01 - lastPointer01.x) * 2;
    velocity.y += (y01 - lastPointer01.y) * 2;
    lastPointer01.set(x01, y01);
    fluid.pointer.set(x01, y01);
    pointer11.set(x01 * 2 - 1, y01 * 2 - 1);
    const next = pick();
    if (next !== hovered) {
      if (next === "left" || next === "right") arrows.show(next, 0.75);
      if (next === "box") {
        showBox(0.75, true);
        showTexts(particles.currentLink, 0.7);
      }
      hovered = next;
    }
  };

  const clock: Clock = { time: 0, ratio: 1, deltaMs: 16 };
  let arrived = false;

  return {
    arrive() {
      if (arrived) return;
      arrived = true;
      if (options.reducedMotion) {
        state.progress = FINAL_PROGRESS;
        return;
      }
      gsap.to(state, {
        progress: FINAL_PROGRESS,
        duration: 2.5,
        ease: "power2.inOut",
      });
    },

    setSize(width, height) {
      screen.w = width;
      screen.h = height;
      renderer.setSize(width, height, false);
      composer.setSize(width, height, false);
      const buffer = renderer.getDrawingBufferSize(new THREE.Vector2());
      globals.resolution.value.copy(buffer);
      globals.resolutionUI.value.set(width, height);
      globals.aspect.value = width / height;
      rig.camera.aspect = width / height;
      rig.camera.zoom = Math.min(1, (width / height) * 1.5);
      rig.camera.updateProjectionMatrix();
    },

    setPointer,

    click(clientX, clientY, rect) {
      if (!uiEnabled) return;
      setPointer(clientX, clientY, rect);
      if (pick() === "box") {
        window.open(LINKS[particles.currentLink].url, "_blank", "noopener");
        return;
      }
      setLink(pointer11.x < 0 ? -1 : 1);
    },

    key(key) {
      if (!uiEnabled) return;
      if (key === "ArrowRight") setLink(1);
      else if (key === "ArrowLeft") setLink(-1);
    },

    cursor() {
      return hovered ? "pointer" : "default";
    },

    render(deltaMs) {
      clock.deltaMs = deltaMs;
      clock.ratio = Math.min(6, deltaMs / (1000 / 60));
      clock.time += deltaMs / 1000;
      globals.time.value = clock.time;
      globals.dtRatio.value = clock.ratio;
      velocity
        .multiplyScalar(frictionFPS(0.95, clock.ratio))
        .clampScalar(-1, 1);
      if (velocity.length() < 0.001) velocity.set(0, 0);

      tl.progress(state.progress);
      textCylinder.mesh4.rotation.y =
        state.timelineAdditional.upRotation * 0.65;
      textCylinder.mesh3.rotation.y =
        state.timelineAdditional.upRotation * 0.65 + 2;
      rig.basePosition.copy(state.timelinePosition);
      rig.baseTarget.copy(state.timelineTarget);
      rig.displacement.position.copy(state.timelineDisplacement);
      rig.displacement.target.copy(state.timelineDisplacementTar);
      rig.displacement.rotation = state.timelineDisplacementRot.value;
      rig.baseUp
        .set(0, 0, -1)
        .applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          state.timelineAdditional.upRotation,
        );
      rig.baseUp
        .lerp(new THREE.Vector3(0, 1, 0), state.timelineAdditional.upOriginal)
        .normalize();
      rig.update(clock, pointer11, velocity);

      floor.material.uniforms.uRotationTime.value =
        clock.time * 0.5 + floor.state.additionalTime;
      compositeMaterial.uniforms.uBlueOffset.value.set(
        Math.random() * 46.23,
        Math.random() * 12.5,
      );

      fluid.update(
        renderer,
        clock.time,
        clock.ratio,
        globals.resolution.value.x / globals.resolution.value.y,
      );
      particles.sim.uniforms.uRotation.value -= deltaMs * 75e-5;
      particles.sim.uniforms.uInteractForce.value =
        smoothstep(0.45, 0.65, state.progress) *
        (1 - smoothstep(0.8, 0.93, state.progress));
      if (particles.warmupMs <= 1000) {
        particles.warmupMs += deltaMs;
        particles.compute(rig.camera);
        if (particles.warmupMs > 1000)
          particles.material.uniforms.uVisible.value = 1;
      }
      particles.compute(rig.camera);

      if (state.progress > 0.64 && state.progress < 0.9) enableUI();
      else disableUI();
      const small = screen.w < BREAKPOINT_W || screen.h < BREAKPOINT_H;
      const mobile =
        screen.w < BREAKPOINT_MOBILE || screen.h < BREAKPOINT_MOBILE;
      const topMargin = mobile
        ? TOP_MARGIN_MOBILE
        : small
          ? TOP_MARGIN_LOW
          : TOP_MARGIN;
      const bottom = screen.h - topMargin - (mobile ? 80 : 20);
      arrows.update(screen.w < screen.h);
      const boxWidth = mobile ? 150 : small ? 180 : 220;
      positionUI(
        rig,
        visit.box,
        screen,
        screen.w * 0.5,
        bottom,
        boxWidth,
        boxWidth / 3.125,
      );
      positionUI(rig, texts.group, screen, screen.w * 0.5, bottom, 25, 25);
      const spacing = mobile ? 6 : small ? 7 : 10;
      const scale = mobile ? 0.75 : small ? 0.8 : 1;
      const fade =
        (globals.resolution.value.x * (mobile ? 50 : small ? 70 : 100)) /
        globals.resolutionUI.value.x;
      const fadeMargin =
        (globals.resolution.value.x * (mobile ? 110 : small ? 140 : 200)) /
        globals.resolutionUI.value.x;
      const cur = particles.currentLink;
      const next = (cur + 1) % LINKS.length;
      const prev = cur - 1 < 0 ? LINKS.length - 1 : cur - 1;
      texts.meshes.forEach((m, i) => {
        m.visible = i === cur || i === next || i === prev;
        m.scale.setScalar(scale);
        m.position.set(i === cur ? 0 : i === next ? spacing : -spacing, 0, 0);
        const u = (m.material as THREE.ShaderMaterial).uniforms;
        u.uFadePosition.value = fade;
        u.uFadeMargin.value = fadeMargin;
      });
      texts.group.updateMatrixWorld(true);

      composer.render(deltaMs / 1000);
    },

    dispose() {
      tl.kill();
      gsap.killTweensOf(state);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as
          THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) =>
          m.dispose(),
        );
      });
      Object.values(tex).forEach((t) => t.dispose());
      particles.dispose();
      fluid.dispose();
      compositeMaterial.dispose();
      composer.dispose();
      ktx2.dispose();
      renderer.dispose();
    },
  };
}
