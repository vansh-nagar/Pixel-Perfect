"use client";

/**
 * A sideways spiral of images and videos that drifts left to right forever: cards turn around a horizontal helix, curl, bow as you scroll, and darken and zoom on hover.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PINS, createPinnedDots } from "./_shared/pinned-dots";

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

// The original vertical spiral's numbers, laid on their side: the helix axis is x now,
// so the spacing that was vertical runs left to right and the cards stand portrait.
// Pulled back from the original z = 8 so the wide, sideways coil fills the screen the way
// the original column did.
const CAMERA = { fov: 35, fovMobile: 45, z: 11 };
const SPIRAL = { gap: 0.55, angleGap: 0.85, radius: 2, offset: 0.8 };
const PLANE = { w: 1, h: 1.5, seg: 8 };
// Scroll: wheel / drag feed an eased speed that decays back to a slow drift, so it
// never stops; the drift keeps your last direction.
const CONTROLS = { easing: 0.1, minSpeed: 0.002, wheel: 15e-5, drag: 0.0015, max: 2, decay: 0.9 };
const MOBILE_PX = 900;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

// Loop mode (for recording): a scripted back-and-forth, in cards, that ends where it
// starts. Eased moves peak in speed mid-way, which is what bows the cards.
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

const THEMES = {
  light: { background: "#f2f0ec", ink: "#1d1c1a", muted: "#8a8781", accent: "#e8552f" },
  dark: { background: "#1a1a19", ink: "#ecebe8", muted: "#75736e", accent: "#f0643c" },
};

const VERTEX = /* glsl */ `
  #define PI 3.14159265359
  uniform float uScrollSpeed;
  varying vec2 vUv;

  void main() {
    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 p = position;
    // Curl along the helix's turning direction (now vertical).
    p.z = sin(uv.y * PI) * 0.2;

    vec4 viewPosition = viewMatrix * modelMatrix * vec4(p, 1.0);
    // The row bows into an arc away from the centre, and cards bow with scroll speed.
    viewPosition.y -= pow(worldPosition.x, 2.0) * 0.06;
    viewPosition.y += sin(uv.x * PI) * uScrollSpeed * 2.0;
    gl_Position = projectionMatrix * viewPosition;
    vUv = uv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uHasTexture;
  uniform float uColorStrength;
  uniform float uZoom;
  uniform vec2 uPlaneSizes;
  uniform vec2 uImageSizes;
  uniform float uRevealProgress;
  uniform vec3 uBackground;
  varying vec2 vUv;

  float roundedRectSDF(vec2 uv, vec2 size, float radius) {
    vec2 d = abs(uv - 0.5) - size * 0.5 + radius;
    return length(max(d, 0.0)) - radius;
  }

  void main() {
    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );
    vec2 uv = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5);
    vec2 zoomedUv = (uv - 0.5) / uZoom + 0.5;

    vec3 color;
    if (gl_FrontFacing) {
      color = texture2D(uTexture, zoomedUv).rgb;
      // Hover sinks the card toward the page colour.
      color = mix(color, uBackground, uColorStrength);
    } else {
      // The back face is a blurred copy.
      float o = 40.0 / 1024.0;
      vec3 c = vec3(0.0);
      c += texture2D(uTexture, uv + vec2(-o, -o)).rgb;
      c += texture2D(uTexture, uv + vec2(0.0, -o)).rgb * 2.0;
      c += texture2D(uTexture, uv + vec2(o, -o)).rgb;
      c += texture2D(uTexture, uv + vec2(-o, 0.0)).rgb * 2.0;
      c += texture2D(uTexture, uv).rgb * 4.0;
      c += texture2D(uTexture, uv + vec2(o, 0.0)).rgb * 2.0;
      c += texture2D(uTexture, uv + vec2(-o, o)).rgb;
      c += texture2D(uTexture, uv + vec2(0.0, o)).rgb * 2.0;
      c += texture2D(uTexture, uv + vec2(o, o)).rgb;
      color = c / 16.0;
    }
    color = mix(uBackground * 0.92, color, uHasTexture);

    // Reveal: a rounded rect grows from the centre, its corner radius following it.
    float reveal = clamp(uRevealProgress, 0.0, 1.0);
    float sdf = roundedRectSDF(vUv, vec2(reveal), 0.05 * reveal);
    float alpha = (1.0 - smoothstep(0.0, 0.002, sdf)) * smoothstep(0.1, 1.0, uRevealProgress);
    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

type Card = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  item: Item;
  index: number;
  hover: number;
  hoverTarget: number;
  hidden: number;
  hiddenTarget: number;
};

/**
 * `loop` turns on a seamless recording mode: no reveal, and the spiral follows SCRIPT
 * instead of drifting, so it ends exactly where it starts.
 */
export default function DriftSpiral({
  items = DEFAULT_ITEMS,
  className,
  loop,
}: {
  items?: Item[];
  className?: string;
  loop?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 100);
    camera.position.set(0, 0, CAMERA.z);
    const scene = new THREE.Scene();

    const background = new THREE.Color();
    const ink = new THREE.Color();
    const muted = new THREE.Color();
    const applyTheme = () => {
      const theme = document.documentElement.classList.contains("dark") ? THEMES.dark : THEMES.light;
      background.set(theme.background);
      ink.set(theme.ink);
      muted.set(theme.muted);
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const pins = createPinnedDots({ background, dot: muted, dotStrong: ink });
    scene.add(pins.mesh);

    // Media, cached by src: one texture (and video) however many cards show it.
    const textureLoader = new THREE.TextureLoader();
    const textures = new Map<string, { texture: THREE.Texture; size: THREE.Vector2; ready: boolean }>();
    const videos = new Map<string, HTMLVideoElement>();
    const load = (src: string) => {
      const entry = { texture: null as unknown as THREE.Texture, size: new THREE.Vector2(1, 1), ready: false };
      if (isVideo(src)) {
        const video = document.createElement("video");
        video.src = src;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        entry.texture = new THREE.VideoTexture(video);
        video.addEventListener(
          "loadedmetadata",
          () => {
            entry.size.set(video.videoWidth, video.videoHeight);
            entry.ready = true;
          },
          { once: true },
        );
        videos.set(src, video);
      } else {
        entry.texture = textureLoader.load(src, (t) => {
          const img = t.image as HTMLImageElement;
          entry.size.set(img.width, img.height);
          entry.ready = true;
        });
        entry.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      entry.texture.colorSpace = THREE.SRGBColorSpace;
      textures.set(src, entry);
      return entry;
    };

    // The list is doubled so the helix wraps without a gap, as in the original.
    const geometry = new THREE.PlaneGeometry(1, 1, PLANE.seg, PLANE.seg);
    const doubled = [...items, ...items];
    const count = doubled.length;
    const center = Math.floor(count / 2);
    const scrollSpeed = { value: 0 };
    const cards: Card[] = doubled.map((item, index) => {
      const media = textures.get(item.src) ?? load(item.src);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: media.texture },
          uHasTexture: { value: 0 },
          uColorStrength: { value: 0 },
          uZoom: { value: 1 },
          uPlaneSizes: { value: new THREE.Vector2(PLANE.w, PLANE.h) },
          uImageSizes: { value: media.size },
          uRevealProgress: { value: 0 },
          uScrollSpeed: scrollSpeed,
          uBackground: { value: background },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(PLANE.w, PLANE.h, 1);
      scene.add(mesh);
      return { mesh, item, index, hover: 0, hoverTarget: 0, hidden: 1, hiddenTarget: 1 };
    });

    const timers: number[] = [];
    const reveal = () => cards.forEach((c, i) => timers.push(window.setTimeout(() => (c.hiddenTarget = 0), (i % 4) * 50)));
    const hide = () => cards.forEach((c, i) => timers.push(window.setTimeout(() => (c.hiddenTarget = 1), (i % 4) * 30)));
    if (loop) cards.forEach((c) => (c.hidden = c.hiddenTarget = 0));
    else reveal();
    let loopClock = 0;

    const controls = { offset: 0, speed: 0, target: 0, dir: 1 };
    const minSpeed = reducedMotion ? 0 : CONTROLS.minSpeed;
    const pointerNdc = new THREE.Vector2(-10, -10);
    const pointerPx = { x: -1e4, y: -1e4, inside: false, on: 0 };
    const raycaster = new THREE.Raycaster();
    let hovered: Card | null = null;

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < MOBILE_PX ? CAMERA.fovMobile : CAMERA.fov;
      camera.updateProjectionMatrix();
      pins.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      pins.material.uniforms.uViewport.value.set(width, height);
      pins.material.uniforms.uCenter.value.set(width / 2, height / 2);
      pins.material.uniforms.uCenterRadius.value = Math.min(width, height) * 0.36;
    };
    resize();

    const update = (dtMs: number) => {
      const frames = dtMs / (1000 / 60); // the original steps once per 60fps frame
      if (loop) {
        // Position and speed (per 60fps frame, as the controls use) come from the script.
        loopClock += dtMs / 1000;
        const h = 1 / 240;
        controls.offset = scriptAt(loopClock);
        controls.speed = (scriptAt(loopClock + h) - scriptAt(loopClock - h)) / (2 * h) / 60;
      } else {
        controls.speed += (controls.target - controls.speed) * (1 - Math.pow(1 - CONTROLS.easing, frames));
        controls.offset += controls.speed * frames;
        if (Math.abs(controls.target) < minSpeed) controls.target = controls.dir * minSpeed;
        controls.target *= Math.pow(CONTROLS.decay, frames);
      }
      scrollSpeed.value = reducedMotion ? 0 : controls.speed;

      // Hover: the nearest front-facing, fully shown card under the pointer.
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects(cards.map((c) => c.mesh))[0];
      let next: Card | null = null;
      if (hit?.face) {
        const card = cards.find((c) => c.mesh === hit.object)!;
        const facing = hit.face.normal.clone().transformDirection(card.mesh.matrixWorld).dot(raycaster.ray.direction) < 0;
        if (facing && card.hidden < 0.01) next = card;
      }
      if (next !== hovered) {
        hovered = next;
        container.style.cursor = hovered ? "pointer" : "grab";
        if (captionRef.current) {
          captionRef.current.textContent = hovered?.item.title ?? "";
          captionRef.current.style.opacity = hovered ? "1" : "0";
        }
      }

      for (const c of cards) {
        c.hoverTarget = c === hovered ? 1 : 0;
        const kHover = 1 - Math.pow(1 - (c.hoverTarget ? 0.09 : 0.07), dtMs * 0.2);
        c.hover += (c.hoverTarget - c.hover) * kHover;
        const kHidden = 1 - Math.pow(1 - 0.05, dtMs * 0.15);
        c.hidden += (c.hiddenTarget - c.hidden) * kHidden;

        let n = c.index - controls.offset;
        n = ((n % count) + count) % count;
        const b = n - center;
        const travel = c.hiddenTarget ? 1.5 : -1.5;
        const x = -(b * SPIRAL.gap - SPIRAL.offset - c.hidden * travel);
        const r = SPIRAL.radius * (1 - c.hidden / 2);
        const angle = b * SPIRAL.angleGap;
        c.mesh.position.set(x, Math.cos(angle) * r, Math.sin(angle) * r);
        c.mesh.rotation.set(angle - Math.PI / 2, 0, 0);

        const media = textures.get(c.item.src)!;
        const u = c.mesh.material.uniforms;
        u.uHasTexture.value = media.ready ? 1 : 0;
        u.uColorStrength.value = 0.55 * c.hover;
        u.uZoom.value = 1 + 0.05 * c.hover;
        u.uRevealProgress.value = (1 - c.hover * 0.05) * (1 - c.hidden);
      }

      // Backdrop.
      const pu = pins.material.uniforms;
      // In loop mode the loose dots' drift (rate 0.6 rad per unit time) completes one turn
      // per loop, so the backdrop is periodic too.
      if (loop) pu.uTime.value = ((loopClock % SCRIPT_SECONDS) / SCRIPT_SECONDS) * ((Math.PI * 2) / 0.6);
      else if (!reducedMotion) pu.uTime.value += dtMs / 1000;
      pu.uLean.value = reducedMotion ? 0 : THREE.MathUtils.clamp(controls.speed * 8, -1, 1);
      pu.uOffset.value = reducedMotion ? 0 : -controls.offset * PINS.spacing * PINS.parallax * 4;
      pointerPx.on += ((pointerPx.inside ? 1 : 0) - pointerPx.on) * (1 - Math.exp(-6 * (dtMs / 1000)));
      pu.uPointerOn.value = pointerPx.on;
      pu.uPointer.value.set(pointerPx.x, pointerPx.y);
    };

    let raf = 0;
    let last = performance.now();
    let running = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dtMs = Math.min(100, Math.max(1000 / 240, now - last));
      last = now;
      update(dtMs);
      renderer.render(scene, camera);
    };
    const playVideos = (on: boolean) =>
      videos.forEach((v) => (on ? v.paused && v.play().catch(() => {}) : !v.paused && v.pause()));
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      playVideos(true);
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      playVideos(false);
    };

    // Wheel and drag feed the same eased speed. Dragging right sends it right.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      controls.target = THREE.MathUtils.clamp(controls.target + delta * CONTROLS.wheel, -CONTROLS.max, CONTROLS.max);
      controls.dir = delta > 0 ? 1 : -1;
    };
    let dragId: number | null = null;
    let lastX = 0;
    let moved = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      dragId = e.pointerId;
      lastX = e.clientX;
      moved = 0;
      container.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerPx.x = e.clientX - rect.left;
      pointerPx.y = e.clientY - rect.top;
      pointerPx.inside = true;
      pointerNdc.set((pointerPx.x / rect.width) * 2 - 1, -(pointerPx.y / rect.height) * 2 + 1);
      if (e.pointerId !== dragId) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (moved > 8) {
        controls.target = THREE.MathUtils.clamp(controls.target + dx * CONTROLS.drag, -CONTROLS.max, CONTROLS.max);
        controls.dir = dx > 0 ? 1 : -1;
      }
    };
    // A click on a card folds the spiral away and reveals it again.
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return;
      dragId = null;
      if (moved <= 8 && hovered) {
        hide();
        timers.push(window.setTimeout(reveal, 900));
      }
    };
    const onPointerLeave = () => {
      pointerPx.inside = false;
      pointerNdc.set(-10, -10);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    container.addEventListener("pointerleave", onPointerLeave);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    visibility.observe(container);

    return () => {
      stop();
      timers.forEach(clearTimeout);
      visibility.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("pointerleave", onPointerLeave);
      cards.forEach((c) => c.mesh.material.dispose());
      textures.forEach((t) => t.texture.dispose());
      videos.forEach((v) => {
        v.pause();
        v.removeAttribute("src");
        v.load();
      });
      geometry.dispose();
      pins.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [items, loop]);

  return (
    <div
      ref={containerRef}
      className={className ?? "relative h-full w-full select-none overflow-hidden"}
      style={{ cursor: "grab", touchAction: "none" }}
    >
      <p
        ref={captionRef}
        aria-live="polite"
        className="pointer-events-none absolute bottom-5 left-4 text-sm font-medium text-foreground opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
