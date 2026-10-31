"use client";

/**
 * A draggable WebGL card shelf: cards share a centre line, grow toward the middle of the view, turn and fade to grey at the edges, and lean like paper when flung.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CELLS, createCellsMaterial } from "./_shared/voronoi-cells";

// `src` ending in .mp4/.webm plays as a muted looping video.
type Item = { title: string; src: string };

const MEDIA = "/playground/shelf-gallery";
const DEFAULT_ITEMS: Item[] = [
  { title: "Artifact 01", src: `${MEDIA}/artifact-6.mp4` },
  { title: "Ascii hand", src: `${MEDIA}/ascii-hand.jpg` },
  { title: "Artifact 02", src: `${MEDIA}/artifact-1.mp4` },
  { title: "Dot horse", src: `${MEDIA}/dot-horse.mp4` },
  { title: "Artifact 03", src: `${MEDIA}/artifact-4.mp4` },
  { title: "Dragons", src: `${MEDIA}/dragons.jpg` },
  { title: "Artifact 04", src: `${MEDIA}/artifact-2.mp4` },
  { title: "Pixel letter", src: `${MEDIA}/pixel-letter.jpg` },
  { title: "Artifact 05", src: `${MEDIA}/artifact-5.mp4` },
  { title: "Horse run", src: `${MEDIA}/horse-run.mp4` },
  { title: "Artifact 06", src: `${MEDIA}/artifact-3.mp4` },
  { title: "Spring poster", src: `${MEDIA}/foma.jpg` },
  { title: "Pixel brush", src: `${MEDIA}/pixel-brush.jpg` },
];

const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src);

// World units unless noted. A wider lens than usual so edge cards visibly turn.
const CAMERA = { fov: 28, distance: 32.7 };
const CARD = { w: 4.4, h: 6.6, gapPx: 14, radiusPx: 6, segX: 16, segY: 12 };
const CENTER_Y = 0.2;
const LABEL = { size: 0.3, gap: 0.3 };
const EMPHASIS = { minHeight: 0.62, z: 1.6 };
const EDGE = { turn: 0.42, greyFrom: 0.5, grey: 0.85, fade: 0.5 };
const IMAGE = { scale: 1.15, parallax: 1 };
const LEAN = { reference: 12, response: 7, shear: 0.9, cup: 0.35 };
const MOBILE_PX = 1024;

// One accent, used for the focused title and the reveal edge.
const THEMES = {
  light: { background: "#f2f0ec", gap: "#dbd8d2", ink: "#1d1c1a", muted: "#8a8781", accent: "#e8552f" },
  dark: { background: "#1a1a19", gap: "#0f0f0e", ink: "#ecebe8", muted: "#75736e", accent: "#f0643c" },
};

type MotionParams = {
  dragSensitivity: number;
  wheelSensitivity: number;
  wheelDriveDecay: number;
  maxWheelDrive: number;
  friction: number;
  maxDragReleaseVelocity: number;
  velocityReference: number;
  restVelocityThreshold: number;
  inertiaSpeedMultiplier: number;
};

const MOTION: Record<"desktop" | "mobile", MotionParams> = {
  desktop: {
    dragSensitivity: 0.016,
    wheelSensitivity: 0.008,
    wheelDriveDecay: 24,
    maxWheelDrive: 6e4,
    friction: 4.5,
    maxDragReleaseVelocity: 22,
    velocityReference: 10,
    restVelocityThreshold: 0.02,
    inertiaSpeedMultiplier: 0,
  },
  mobile: {
    dragSensitivity: 0.026,
    wheelSensitivity: 0.016,
    wheelDriveDecay: 60,
    maxWheelDrive: 1e4,
    friction: 9,
    maxDragReleaseVelocity: 120,
    velocityReference: 40,
    restVelocityThreshold: 0.02,
    inertiaSpeedMultiplier: 4,
  },
};

// Intro: a short glide while each card rises off the baseline and its image
// wipes up from the bottom behind an accent line, then its title fades in.
const INTRO = {
  duration: 1.6,
  distanceCards: 3,
  rise: { from: -2.4, delay: 0.1, stagger: 0.08, duration: 0.9 },
  wipe: { delay: 0.35, stagger: 0.08, duration: 0.7 },
  title: { delay: 0.9, stagger: 0.06, duration: 0.3 },
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Loop mode: a scripted back-and-forth (in cards) that ends where it starts.
// Eased moves peak in speed mid-way, which is what drives the paper lean.
const SCRIPT: { seconds: number; cards: number; ease?: (t: number) => number }[] = [
  { seconds: 0.6, cards: 0 },
  { seconds: 1.6, cards: 3, ease: easeInOutCubic },
  { seconds: 0.5, cards: 0 },
  { seconds: 2.0, cards: -5, ease: easeInOutQuart },
  { seconds: 0.4, cards: 0 },
  { seconds: 0.9, cards: 1, ease: easeInOutCubic },
  { seconds: 0.4, cards: 0 },
  { seconds: 1.8, cards: 4, ease: easeInOutQuart },
  { seconds: 0.5, cards: 0 },
  { seconds: 1.6, cards: -3, ease: easeInOutCubic },
  { seconds: 0.6, cards: 0 },
];
const SCRIPT_SECONDS = SCRIPT.reduce((sum, s) => sum + s.seconds, 0);

const scriptAt = (time: number) => {
  let t = ((time % SCRIPT_SECONDS) + SCRIPT_SECONDS) % SCRIPT_SECONDS;
  let cards = 0;
  for (const step of SCRIPT) {
    if (t < step.seconds) return cards + step.cards * (step.ease ?? (() => 0))(t / step.seconds);
    t -= step.seconds;
    cards += step.cards;
  }
  return cards;
};

// 1 at the viewport centre, 0 at its edge (both smoothstepped).
const emphasisAt = (along: number, half: number) => smooth(1 - smooth(Math.min(1, Math.abs(along) / half)));

/**
 * Scroll position with wheel "drive" (a decaying force), drag sampling and
 * exponential inertia.
 */
class GalleryMotion {
  position = 0;
  velocity = 0;
  mode: "idle" | "drag" | "wheel" | "inertial" = "idle";
  params: MotionParams;
  private wheelDrive = 0;
  private pendingWheel = 0;
  private dragClock = 0;
  private dragVelocity = 0;
  private times = new Float64Array(16);
  private positions = new Float64Array(16);
  private head = 0;
  private count = 0;

  constructor(params: MotionParams) {
    this.params = params;
  }

  get dragVelocityEstimate() {
    return this.dragVelocity;
  }

  beginDrag() {
    this.mode = "drag";
    this.velocity = 0;
    this.wheelDrive = 0;
    this.pendingWheel = 0;
    this.dragVelocity = 0;
    this.count = 0;
    this.head = 0;
    this.dragClock = 0;
    this.push(0, this.position);
  }

  applyDragDelta(dx: number) {
    if (this.mode !== "drag") return;
    this.position += -dx * this.params.dragSensitivity;
    this.push(this.dragClock, this.position);
    this.dragVelocity = this.estimate();
  }

  endDrag() {
    if (this.mode !== "drag") return;
    const { maxDragReleaseVelocity: max, restVelocityThreshold } = this.params;
    this.velocity = Math.min(max, Math.max(-max, this.dragVelocity));
    this.dragVelocity = 0;
    this.count = 0;
    this.mode = Math.abs(this.velocity) > restVelocityThreshold ? "inertial" : "idle";
  }

  addWheel(delta: number) {
    this.pendingWheel += delta * this.params.wheelSensitivity;
  }

  update(dt: number) {
    if (dt <= 0) return;
    const p = this.params;

    if (this.mode === "drag") {
      this.pendingWheel = 0;
      this.wheelDrive = 0;
      this.dragClock += dt;
      this.push(this.dragClock, this.position);
      this.dragVelocity = this.estimate();
      this.velocity = this.dragVelocity;
      return;
    }

    if (this.pendingWheel !== 0) {
      const decay = Math.max(p.wheelDriveDecay, 1e-4);
      const friction = Math.max(p.friction, 1e-4);
      this.wheelDrive = Math.min(p.maxWheelDrive, Math.max(-p.maxWheelDrive, this.wheelDrive + this.pendingWheel * decay * friction));
      this.pendingWheel = 0;
      this.mode = "wheel";
    }

    if (this.wheelDrive !== 0 || this.mode === "wheel") {
      // Closed-form integration of a velocity driven by an exponentially decaying force.
      const a = Math.max(p.wheelDriveDecay, 1e-4);
      const b = Math.max(p.friction, 1e-4);
      const d = this.wheelDrive;
      const v = this.velocity;
      const ea = Math.exp(-a * dt);
      const eb = Math.exp(-b * dt);
      let response: number;
      let integral: number;
      if (Math.abs(a - b) > 1e-6) {
        response = v * eb + (d * (ea - eb)) / (b - a);
        integral = (v * (1 - eb)) / b + (d / (b - a)) * ((1 - ea) / a - (1 - eb) / b);
      } else {
        response = (v + d * dt) * eb;
        integral = (v * (1 - eb)) / b + (d * (1 - eb * (1 + b * dt))) / (b * b);
      }
      this.wheelDrive = Math.abs(d * ea) < 1e-6 ? 0 : d * ea;
      this.position += integral;
      this.velocity = response;
      if (this.wheelDrive === 0 && Math.abs(this.velocity) <= p.restVelocityThreshold) {
        this.velocity = 0;
        this.mode = "idle";
      } else {
        this.mode = this.wheelDrive !== 0 ? "wheel" : "inertial";
      }
      return;
    }

    if (this.velocity !== 0) {
      const speed = Math.abs(this.velocity) / Math.max(p.velocityReference, 1e-4);
      const k = p.friction / (1 + Math.max(p.inertiaSpeedMultiplier, 0) * speed);
      const e = Math.exp(-k * dt);
      this.position += (this.velocity * (1 - e)) / k;
      this.velocity *= e;
      if (Math.abs(this.velocity) <= p.restVelocityThreshold) {
        this.velocity = 0;
        this.mode = "idle";
      } else {
        this.mode = "inertial";
      }
    } else {
      this.mode = "idle";
    }
  }

  private push(t: number, x: number) {
    this.times[this.head] = t;
    this.positions[this.head] = x;
    this.head = (this.head + 1) % 16;
    if (this.count < 16) this.count++;
  }

  // Least-squares slope over the last 80ms of samples.
  private estimate() {
    if (this.count < 2) return 0;
    const newest = this.times[(this.head - 1 + 16) % 16];
    let n = 0;
    let st = 0;
    let sx = 0;
    let stt = 0;
    let stx = 0;
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head - 1 - i + 32) % 16;
      const t = this.times[idx];
      if (t < newest - 0.08 && n >= 2) break;
      const x = this.positions[idx];
      n++;
      st += t;
      sx += x;
      stt += t * t;
      stx += t * x;
    }
    if (n < 2) return 0;
    const den = n * stt - st * st;
    return Math.abs(den) < 1e-12 ? 0 : (n * stx - st * sx) / den;
  }
}

const CARD_VERTEX = /* glsl */ `
  uniform float uLean;
  varying vec2 vUv;
  varying float vNdcX;

  void main() {
    vUv = uv;
    vec3 transformed = position;

    // Paper lean: the top trails behind the direction of travel and the
    // sheet cups slightly, both scaled by how hard the shelf is moving.
    transformed.x += uLean * uv.y * uv.y * ${LEAN.shear.toFixed(3)};
    transformed.z -= abs(uLean) * sin(uv.x * 3.14159265) * ${LEAN.cup.toFixed(3)};

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    vNdcX = gl_Position.x / gl_Position.w;
  }
`;

const CARD_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform vec3 uBackground;
  uniform vec3 uAccent;
  uniform vec2 uCardSize;
  uniform float uHeightScale;
  uniform float uRadius;
  uniform vec2 uCover;
  uniform float uParallax;
  uniform float uReveal;
  varying vec2 vUv;
  varying float vNdcX;

  void main() {
    vec2 size = uCardSize * vec2(1.0, uHeightScale);
    vec2 q = abs((vUv - 0.5) * size) - (size * 0.5 - uRadius);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float aa = max(fwidth(d), 1e-5);
    float shape = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);

    // Wipe from the bottom up; the unrevealed part is simply not drawn.
    float wipe = 1.0 - step(uReveal, vUv.y);
    if (shape * wipe <= 0.0) discard;

    // Zoomed, cropped evenly top and bottom as the card shortens, with parallax.
    float zoom = 1.0 / ${IMAGE.scale.toFixed(3)};
    float slack = (1.0 - zoom) * 0.5;
    vec2 coverUv = vec2(0.5 + (vUv.x - 0.5) * zoom + uParallax * slack, 0.5 + (vUv.y - 0.5) * uHeightScale * zoom);
    vec2 imageUv = clamp(0.5 + (coverUv - 0.5) * uCover, 0.0, 1.0);
    vec3 color = mix(uBackground * 0.92, texture2D(uMap, imageUv).rgb, uHasMap);

    // Toward the edges: drain colour, then sink into the background.
    float edge = smoothstep(${EDGE.greyFrom.toFixed(3)}, 1.05, abs(vNdcX));
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(color, vec3(luma), edge * ${EDGE.grey.toFixed(3)});
    color = mix(color, uBackground, edge * ${EDGE.fade.toFixed(3)});

    float line = (1.0 - step(0.012, abs(vUv.y - uReveal))) * step(uReveal, 0.999);
    color = mix(color, uAccent, line);

    gl_FragColor = vec4(color, shape);
    #include <colorspace_fragment>
  }
`;

const LABEL_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying float vNdcX;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vNdcX = gl_Position.x / gl_Position.w;
  }
`;

const LABEL_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vNdcX;
  void main() {
    float edge = smoothstep(${EDGE.greyFrom.toFixed(3)}, 1.05, abs(vNdcX));
    float a = texture2D(uMap, vUv).a * uOpacity * (1.0 - edge * 0.7);
    if (a <= 0.001) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

function drawLabel(text: string, fontFamily: string) {
  const fontPx = 96;
  const font = `500 ${fontPx}px ${fontFamily}`;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(text).width) + 8;
  canvas.height = Math.ceil(fontPx * 1.3);
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 4, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return { texture, aspect: canvas.width / canvas.height, heightRatio: canvas.height / fontPx };
}

type Card = {
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  label: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  title: string;
  src: string;
  sequence: number;
  introOrder: number;
};

/**
 * `loop` turns on a seamless recording mode: no intro, and the shelf follows
 * SCRIPT, eased back-and-forth moves that return to the start.
 */
export default function ShelfGallery({
  items = DEFAULT_ITEMS,
  className,
  loop,
}: {
  items?: Item[];
  className?: string;
  loop?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = () => window.innerWidth <= MOBILE_PX;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 200);
    camera.position.set(0, 0, CAMERA.distance);

    const scene = new THREE.Scene();
    const background = new THREE.Color();
    const accent = new THREE.Color();
    const ink = new THREE.Color();
    const muted = new THREE.Color();
    const gapColor = new THREE.Color();

    const cellsMaterial = createCellsMaterial({ cell: background, gap: gapColor });
    if (loop) cellsMaterial.uniforms.uDrift.value = (Math.PI * 2) / SCRIPT_SECONDS;
    const cells = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cellsMaterial);
    cells.frustumCulled = false;
    cells.renderOrder = -1;
    scene.add(cells);

    const applyTheme = () => {
      const theme = document.documentElement.classList.contains("dark") ? THEMES.dark : THEMES.light;
      background.set(theme.background);
      gapColor.set(theme.gap);
      accent.set(theme.accent);
      ink.set(theme.ink);
      muted.set(theme.muted);
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Enough copies of the items to always overfill even an ultra-wide viewport.
    const copies = Math.max(1, Math.ceil(16 / items.length));
    const lean = { value: 0 };
    const geometry = new THREE.PlaneGeometry(CARD.w, CARD.h, CARD.segX, CARD.segY);
    const labelGeometry = new THREE.PlaneGeometry(1, 1);
    const textureLoader = new THREE.TextureLoader();
    const mediaTextures = new Map<string, THREE.Texture>();
    const videos = new Map<string, HTMLVideoElement>();
    const labelTextures = new Map<string, ReturnType<typeof drawLabel>>();
    const cardAspect = CARD.w / CARD.h;

    const onMediaReady = (texture: THREE.Texture, width: number, height: number) => {
      const mediaAspect = width / height;
      const cover =
        mediaAspect > cardAspect ? new THREE.Vector2(cardAspect / mediaAspect, 1) : new THREE.Vector2(1, mediaAspect / cardAspect);
      cards.forEach((card) => {
        if (card.mesh.material.uniforms.uMap.value !== texture) return;
        card.mesh.material.uniforms.uCover.value.copy(cover);
        card.mesh.material.uniforms.uHasMap.value = 1;
      });
    };

    const loadMedia = (src: string) => {
      if (!isVideo(src)) {
        const texture = textureLoader.load(src, (t) => {
          const img = t.image as HTMLImageElement;
          onMediaReady(t, img.width, img.height);
        });
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
      }
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      video.addEventListener("loadedmetadata", () => onMediaReady(texture, video.videoWidth, video.videoHeight), { once: true });
      videos.set(src, video);
      return texture;
    };

    const cards: Card[] = [];
    for (let c = 0; c < copies; c++) {
      items.forEach((item, i) => {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uMap: { value: null },
            uHasMap: { value: 0 },
            uBackground: { value: background },
            uAccent: { value: accent },
            uCardSize: { value: new THREE.Vector2(CARD.w, CARD.h) },
            uHeightScale: { value: 1 },
            uRadius: { value: 0.1 },
            uCover: { value: new THREE.Vector2(1, 1) },
            uParallax: { value: 0 },
            uReveal: { value: 1 },
            uLean: lean,
          },
          vertexShader: CARD_VERTEX,
          fragmentShader: CARD_FRAGMENT,
          transparent: true,
        });

        let texture = mediaTextures.get(item.src);
        if (!texture) {
          texture = loadMedia(item.src);
          mediaTextures.set(item.src, texture);
        }
        material.uniforms.uMap.value = texture;

        const mesh = new THREE.Mesh(geometry, material);
        const label = new THREE.Mesh(
          labelGeometry,
          new THREE.ShaderMaterial({
            uniforms: { uMap: { value: null }, uColor: { value: new THREE.Color() }, uOpacity: { value: 1 } },
            vertexShader: LABEL_VERTEX,
            fragmentShader: LABEL_FRAGMENT,
            transparent: true,
            depthWrite: false,
          }),
        );

        const group = new THREE.Group();
        group.add(mesh, label);
        scene.add(group);
        cards.push({ group, mesh, label, title: item.title, src: item.src, sequence: c * items.length + i, introOrder: 0 });
      });
    }

    // Labels use the page's own font, so draw them once it has loaded.
    let disposed = false;
    const buildLabels = () => {
      if (disposed) return;
      const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
      labelTextures.forEach((l) => l.texture.dispose());
      labelTextures.clear();
      for (const card of cards) {
        let drawn = labelTextures.get(card.title);
        if (!drawn) {
          drawn = drawLabel(card.title, fontFamily);
          labelTextures.set(card.title, drawn);
        }
        const height = LABEL.size * drawn.heightRatio;
        const width = height * drawn.aspect;
        card.label.material.uniforms.uMap.value = drawn.texture;
        card.label.scale.set(width, height, 1);
        card.label.position.set(-CARD.w / 2 + width / 2 - 0.02, 0, 0.001);
      }
    };
    buildLabels();
    document.fonts?.ready.then(buildLabels);

    const motion = new GalleryMotion(isMobile() ? MOTION.mobile : MOTION.desktop);
    let viewportWidthWorld = 1;
    let pxPerWorld = 1;
    let gapWorld = 0.2;
    let stride = CARD.w + gapWorld;
    let totalLength = stride * cards.length;

    // Centre cards sit nearer the camera and project larger, so x positions
    // come from the integral of that magnification: on-screen gaps stay even.
    const INTEGRAL_STEPS = 128;
    const integralTable = new Float64Array(INTEGRAL_STEPS + 1);
    let integralSpan = 1;
    const buildIntegral = () => {
      const half = Math.max(viewportWidthWorld * 0.5, 1e-4);
      integralSpan = half + CARD.w * 2.5;
      const step = integralSpan / INTEGRAL_STEPS;
      const magnification = (x: number) => CAMERA.distance / (CAMERA.distance - EMPHASIS.z * emphasisAt(x, half));
      let prev = magnification(0);
      for (let i = 1; i <= INTEGRAL_STEPS; i++) {
        const next = magnification(i * step);
        integralTable[i] = integralTable[i - 1] + (prev + next) * 0.5 * step;
        prev = next;
      }
    };
    const projectAlong = (x: number) => {
      const sign = x < 0 ? -1 : 1;
      const ax = Math.abs(x);
      if (ax >= integralSpan) return sign * (integralTable[INTEGRAL_STEPS] + ax - integralSpan);
      const f = (ax / integralSpan) * INTEGRAL_STEPS;
      const i = Math.min(INTEGRAL_STEPS - 1, Math.floor(f));
      return sign * THREE.MathUtils.lerp(integralTable[i], integralTable[i + 1], f - i);
    };
    const wrapAlong = (x: number) => x - Math.round(x / totalLength) * totalLength;

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      cellsMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      cellsMaterial.uniforms.uViewport.value.set(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const viewportHeightWorld = 2 * Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2)) * CAMERA.distance;
      const worldPerPx = viewportHeightWorld / height;
      pxPerWorld = 1 / worldPerPx;
      viewportWidthWorld = viewportHeightWorld * camera.aspect;
      gapWorld = CARD.gapPx * worldPerPx;
      stride = CARD.w + gapWorld;
      totalLength = stride * cards.length;
      buildIntegral();
      cards.forEach((card) => (card.mesh.material.uniforms.uRadius.value = CARD.radiusPx * worldPerPx));
      motion.params = isMobile() ? MOTION.mobile : MOTION.desktop;
    };
    resize();

    // Intro order follows where each card lands, left to right.
    [...cards]
      .sort((a, b) => wrapAlong(a.sequence * stride) - wrapAlong(b.sequence * stride))
      .forEach((card, i) => (card.introOrder = i));

    let introClock = reducedMotion || loop ? Infinity : 0;
    let loopClock = 0;
    const introProgress = (phase: { delay: number; stagger: number; duration: number }, order: number) =>
      clamp01((introClock - phase.delay - phase.stagger * order) / phase.duration);

    // Decode only the videos whose card is in view.
    const onScreen = new Set<string>();
    const syncVideos = (playing: boolean) => {
      videos.forEach((video, src) => {
        const shouldPlay = playing && onScreen.has(src);
        if (shouldPlay && video.paused) video.play().catch(() => {});
        else if (!shouldPlay && !video.paused) video.pause();
      });
    };

    const layout = () => {
      const half = Math.max(viewportWidthWorld * 0.5, 1e-4);
      const glide = reducedMotion ? 0 : INTRO.distanceCards * stride * (1 - easeOutQuint(clamp01(introClock / INTRO.duration)));
      const scroll = motion.position - glide;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));
      onScreen.clear();

      for (const card of cards) {
        const along = wrapAlong(card.sequence * stride - scroll);
        const projected = projectAlong(along);
        const visible = Math.abs(projected) < half + CARD.w * 1.5;
        card.group.visible = visible;
        if (!visible) continue;
        onScreen.add(card.src);

        const emphasis = emphasisAt(along, half);
        const zOffset = EMPHASIS.z * emphasis;
        const distance = CAMERA.distance - zOffset;
        const x = (projected * distance) / CAMERA.distance;
        const rise = INTRO.rise.from * (1 - easeOutQuint(introProgress(INTRO.rise, card.introOrder)));
        card.group.position.set(x, (CENTER_Y * distance) / CAMERA.distance + rise, zOffset);

        // Cards past the centre turn to face it, like pages on an open shelf.
        const side = THREE.MathUtils.clamp(along / half, -1, 1);
        card.group.rotation.y = -Math.sign(side) * smooth(Math.abs(side)) * EDGE.turn;

        const heightScale = THREE.MathUtils.lerp(EMPHASIS.minHeight, 1, emphasis);
        card.mesh.scale.y = heightScale;
        card.mesh.position.y = 0;
        card.label.position.y = -CARD.h * heightScale * 0.5 - LABEL.gap - LABEL.size / 2;

        const u = card.mesh.material.uniforms;
        u.uHeightScale.value = heightScale;
        u.uParallax.value = THREE.MathUtils.clamp(x / (tanHalf * distance * camera.aspect), -1, 1) * IMAGE.parallax;
        u.uReveal.value = easeOutQuint(introProgress(INTRO.wipe, card.introOrder));

        const lu = card.label.material.uniforms;
        lu.uColor.value.copy(muted).lerp(ink, smooth(clamp01((emphasis - 0.5) / 0.4))).lerp(accent, smooth(clamp01((emphasis - 0.93) / 0.07)));
        lu.uOpacity.value = introProgress(INTRO.title, card.introOrder);
      }
    };

    let raf = 0;
    let last = performance.now();
    let running = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      introClock += dt;

      motion.update(dt);
      let scripted = 0;
      if (loop) {
        loopClock += dt;
        const h = 1 / 240;
        motion.position = scriptAt(loopClock) * stride;
        scripted = ((scriptAt(loopClock + h) - scriptAt(loopClock - h)) / (2 * h)) * stride;
      }
      if (!reducedMotion) cellsMaterial.uniforms.uTime.value += dt;
      cellsMaterial.uniforms.uOffset.value = reducedMotion ? 0 : motion.position * pxPerWorld * CELLS.parallax;
      const velocity = (motion.mode === "drag" ? motion.dragVelocityEstimate : motion.velocity) + scripted;
      const leanTarget = reducedMotion ? 0 : THREE.MathUtils.clamp(velocity / LEAN.reference, -1, 1);
      lean.value += (leanTarget - lean.value) * (1 - Math.exp(-LEAN.response * dt));
      layout();
      syncVideos(true);
      renderer.render(scene, camera);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      syncVideos(false);
    };

    // Pointer drag with inertia on release.
    let dragPointer: number | null = null;
    let lastX = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      dragPointer = e.pointerId;
      lastX = e.clientX;
      container.setPointerCapture(e.pointerId);
      container.style.cursor = "grabbing";
      motion.beginDrag();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragPointer) return;
      motion.applyDragDelta(e.clientX - lastX);
      lastX = e.clientX;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragPointer) return;
      dragPointer = null;
      container.style.cursor = "grab";
      motion.endDrag();
    };
    // Either wheel axis drives the shelf; the dominant one wins.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      motion.addWheel(delta * (e.deltaMode === 1 ? 16 : 1));
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    container.addEventListener("wheel", onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Only render while on screen.
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    visibility.observe(container);

    return () => {
      disposed = true;
      stop();
      visibility.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("wheel", onWheel);
      cards.forEach((card) => {
        card.mesh.material.dispose();
        card.label.material.dispose();
      });
      mediaTextures.forEach((t) => t.dispose());
      videos.forEach((video) => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      });
      labelTextures.forEach((l) => l.texture.dispose());
      geometry.dispose();
      labelGeometry.dispose();
      cells.geometry.dispose();
      cellsMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [items, loop]);

  return (
    <div
      ref={containerRef}
      className={className ?? "relative h-full w-full select-none overflow-hidden"}
      style={{ cursor: "grab", touchAction: "pan-y" }}
    />
  );
}
