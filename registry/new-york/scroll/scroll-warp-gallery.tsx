/**
 * A gallery rendered in WebGL where scroll velocity bends each image's own vertices, smears it into an RGB-split motion blur, and the cursor lenses it outward.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import Lenis from "@studio-freight/lenis";

/**
 * Twenty tiles cycling six photos, ordered so the same shot never lands next to
 * itself in a column. Long enough that the gallery reads as a page rather than
 * something you cross in one flick.
 */
const TILES = [1, 4, 2, 6, 3, 5, 4, 1, 6, 2, 5, 3, 2, 6, 1, 4, 3, 1, 5, 2].map(
  (photo, i) => ({ id: i, src: `/image-animations/photo-${photo}.jpg` }),
);

/**
 * Effect mix — the knobs worth touching. Each scales one term on its own, so
 * the fold can run hard while the smear stays light, or the reverse.
 */
const CONFIG = {
  /**
   * Scroll velocity -> bend. Velocity arrives as px/frame, so ~5 is a nudge and
   * ~25 is a hard flick; this gain puts that whole range inside the effect.
   */
  scrollStrength: 1.4,
  /**
   * Ceiling on that bend. Without it a fast flick drives the plane so far toward
   * the camera that perspective alone tears the image apart.
   */
  maxStrength: 0.25,
  /** How far the cursor lens pushes UVs outward. */
  bulge: 0.6,
  /** Falloff of that lens: higher is a tighter, fatter dome. */
  bulgeStrength: 1,
  /**
   * Vertical red/blue separation while moving. The blur loop re-applies this on
   * every tap, so high-contrast edges pick it up hard — keep it low.
   */
  rgbShift: 0.18,
  /** Vertical smear while moving. */
  blur: 1,
};

/** Plane tessellation. The bend is per-vertex, so a flat quad cannot show it. */
const SEGMENTS = 24;

/**
 * The bend lives in view space, after the model matrix: a vertex's Z offset is a
 * function of where it sits in the *viewport*, not where it sits on its own
 * plane. So a plane crossing the middle of the screen curves toward the camera
 * while its top and bottom edges stay put — the image folds rather than tilts.
 */
const VERTEX = /* glsl */ `
  #define PI 3.1415926535897932384626433832795

  uniform float uStrength;
  uniform vec2 uViewportSizes;
  uniform float uEntrance;

  varying vec2 vUv;

  void main() {
    vec4 newPosition = modelViewMatrix * vec4(position, 1.0);

    float waveZ = sin(newPosition.y / uViewportSizes.y * PI + PI / 2.0) * -uStrength;
    newPosition.z -= waveZ * 0.8;

    if (uEntrance > 0.0) {
      newPosition.y -= uEntrance * uViewportSizes.y;

      float entranceWaveZ = sin(newPosition.y / uViewportSizes.x * PI) * uEntrance;
      newPosition.z += entranceWaveZ;

      float ripplePhase = uEntrance * PI * 4.0;
      newPosition.z += cos(uv.y * PI - ripplePhase) * uEntrance * 0.5;
    }

    vUv = uv;
    gl_Position = projectionMatrix * newPosition;
  }
`;

/**
 * Three passes over the same UV: a lens under the cursor, a vertical channel
 * split, then a vertical smear. The last two scale with uStrength, so they only
 * exist while the page is actually moving.
 */
const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform float uStrength;
  uniform float uOpacity;
  uniform vec2 uCoverScale;
  uniform vec2 uMouse;
  uniform float uBulge;
  uniform float uEntrance;
  uniform float uRGBMul;
  uniform float uBlurMul;
  uniform float uBulgeMul;
  uniform float uBulgeStrengthMul;

  varying vec2 vUv;

  vec2 bulge(vec2 uv, vec2 center) {
    float radius = 1.2;
    float strength = 1.0 + 0.1 * uBulgeStrengthMul * uBulgeStrengthMul;
    uv -= center;
    float dist = length(uv) / radius;
    float distPow = dist * dist;
    float strengthAmount = strength / (1.0 + distPow);
    uv *= mix(1.0, strengthAmount, uBulge * uBulgeMul);
    uv += center;
    return uv;
  }

  void main() {
    vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;
    coverUv = bulge(coverUv, uMouse);

    // The original scales this by scroll progress, which leaves the top of a page
    // with no separation at all. Velocity alone drives it here, so a nudge
    // anywhere in the gallery splits the channels.
    float shiftAmount = uStrength * 0.28 * uRGBMul;

    float sharpR = texture2D(uTexture, coverUv + vec2(0.0, shiftAmount * 2.0)).r;
    float sharpG = texture2D(uTexture, coverUv).g;
    float sharpB = texture2D(uTexture, coverUv + vec2(0.0, shiftAmount * -2.0)).b;
    vec3 sharp = vec3(sharpR, sharpG, sharpB);

    // Gate opens almost immediately instead of at 0.05, which ordinary scrolling
    // never reached. Dropping the extra abs(uStrength) factor keeps the ramp
    // gentle rather than quadratic, so slow scroll smears without fast scroll
    // washing the frame out.
    float entranceBlur = uEntrance * 1.5;
    float blurAmount =
      smoothstep(0.008, 0.32, abs(uStrength)) * 0.11 * uBlurMul + entranceBlur;

    if (blurAmount < 0.001) {
      gl_FragColor = vec4(sharp, uOpacity);
      return;
    }

    vec3 blurred = vec3(0.0);
    const int SAMPLES = 8;

    for (int i = 0; i < SAMPLES; i++) {
      float offset = (float(i) / float(SAMPLES - 1) - 0.5) * blurAmount;
      vec2 sampleUv = coverUv + vec2(0.0, offset);

      vec4 shifted = texture2D(uTexture, sampleUv + vec2(0.0, shiftAmount * 2.0));
      float g = texture2D(uTexture, sampleUv).g;
      blurred += vec3(shifted.r, g, shifted.b);
    }
    blurred /= float(SAMPLES);

    vec3 finalColor = mix(sharp, blurred, smoothstep(0.0, 0.15, blurAmount));
    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;

/**
 * `velocity` is a real public field on the Lenis instance — the property the
 * whole effect reads — but v1.0.42 leaves it out of its type declarations.
 */
type LenisInstance = Lenis & { velocity: number };

type Plane = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  img: HTMLImageElement;
  aspect: number;
  mouseUV: { x: number; y: number };
  targetMouseUV: { x: number; y: number };
  hovered: boolean;
};

/**
 * The nearest ancestor that actually scrolls. Inside a panelled layout that is
 * some `overflow-y: auto` div; on a plain page it is the window.
 */
const findScroller = (el: HTMLElement): HTMLElement | null => {
  let node = el.parentElement;
  while (node) {
    if (node.hasAttribute("data-lenis-prevent")) return node;
    const overflowY = getComputedStyle(node).overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const ScrollWarpGallery = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The pinned stage has to be exactly as tall as the scroll viewport, which is
  // the panel's height here and the window's height standalone.
  const [stageHeight, setStageHeight] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!root || !stage || !canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scroller = findScroller(root);

    // The effect reads scroll *velocity*, so it needs smoothed scrolling to have
    // anything to read — a native wheel notch is one huge delta then nothing.
    // A panelled scroller is marked `data-lenis-prevent`, so any page-level Lenis
    // deliberately skips it and this component brings its own. On a plain page we
    // only add one if nothing is already smoothing the window (Lenis marks that
    // with a `lenis` class on <html>).
    const pageAlreadySmooth = document.documentElement.classList.contains("lenis");
    const lenis =
      scroller && scroller.firstElementChild
        ? new Lenis({
            wrapper: scroller,
            content: scroller.firstElementChild as HTMLElement,
            lerp: 0.1,
          } as ConstructorParameters<typeof Lenis>[0]) as LenisInstance
        : pageAlreadySmooth
          ? null
          : (new Lenis({ lerp: 0.1 }) as LenisInstance);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: "high-performance",
      stencil: false,
      depth: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 1;

    const screen = { width: 0, height: 0 };
    const viewport = { width: 0, height: 0 };

    // A unit plane scaled per mesh. The bend is applied after the model matrix,
    // so scaling is identical to baking the size into the geometry — and it
    // turns a resize into a scale write instead of a geometry rebuild.
    const geometry = new THREE.PlaneGeometry(1, 1, SEGMENTS, SEGMENTS);
    const planes: Plane[] = [];

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(-2, -2);
    let hoveredPlane: Plane | null = null;
    let pointerDirty = false;

    const measure = () => {
      const viewportHeight = scroller ? scroller.clientHeight : window.innerHeight;
      setStageHeight(viewportHeight);

      screen.width = stage.clientWidth;
      screen.height = viewportHeight;
      if (!screen.width || !screen.height) return;

      camera.aspect = screen.width / screen.height;
      camera.updateProjectionMatrix();

      const fovRad = (camera.fov * Math.PI) / 180;
      viewport.height = 2 * Math.tan(fovRad / 2) * camera.position.z;
      viewport.width = viewport.height * camera.aspect;

      renderer.setSize(screen.width, screen.height, false);

      for (const plane of planes) {
        const rect = plane.img.getBoundingClientRect();
        plane.mesh.scale.set(
          (rect.width / screen.width) * viewport.width,
          (rect.height / screen.height) * viewport.height,
          1,
        );
        const box = rect.width / rect.height;
        plane.mesh.material.uniforms.uCoverScale.value =
          plane.aspect > box ? [box / plane.aspect, 1] : [1, plane.aspect / box];
        plane.mesh.material.uniforms.uViewportSizes.value = [
          viewport.width,
          viewport.height,
        ];
      }
    };

    measure();

    const loader = new THREE.TextureLoader();
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img[data-gl-img="true"]'));

    imgs.forEach((img) => {
      loader.load(img.currentSrc || img.src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const rect = img.getBoundingClientRect();
        const aspect = texture.image.width / texture.image.height;
        const box = rect.width / rect.height || 1;

        const material = new THREE.ShaderMaterial({
          vertexShader: VERTEX,
          fragmentShader: FRAGMENT,
          transparent: true,
          uniforms: {
            uTexture: { value: texture },
            uStrength: { value: 0 },
            uOpacity: { value: 0 },
            uCoverScale: { value: aspect > box ? [box / aspect, 1] : [1, aspect / box] },
            uMouse: { value: [0.5, 0.5] },
            uBulge: { value: 0 },
            uEntrance: { value: reduced ? 0 : 1 },
            uViewportSizes: { value: [viewport.width, viewport.height] },
            uRGBMul: { value: CONFIG.rgbShift },
            uBlurMul: { value: CONFIG.blur },
            uBulgeMul: { value: CONFIG.bulge },
            uBulgeStrengthMul: { value: CONFIG.bulgeStrength },
          },
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(
          (rect.width / screen.width) * viewport.width,
          (rect.height / screen.height) * viewport.height,
          1,
        );
        scene.add(mesh);

        // The DOM image only holds the layout now; the plane is what you see.
        img.style.opacity = "0";

        planes.push({
          mesh,
          img,
          aspect,
          mouseUV: { x: 0.5, y: 0.5 },
          targetMouseUV: { x: 0.5, y: 0.5 },
          hovered: false,
        });

        gsap.to(material.uniforms.uOpacity, {
          value: 1,
          duration: reduced ? 0 : 0.8,
          ease: "sine.out",
          delay: reduced ? 0 : 0.3,
        });
        gsap.to(material.uniforms.uEntrance, {
          value: 0,
          duration: reduced ? 0 : 1.5,
          ease: "power2.out",
          delay: reduced ? 0 : 0.3,
        });
      });
    });

    /**
     * Raycast for the plane under the cursor and hand it that point's UV. Runs
     * only when the pointer moved, or the page is still moving under it.
     */
    const updateBulge = () => {
      if (!planes.length || !pointerDirty) return;
      pointerDirty = false;

      raycaster.setFromCamera(pointerNDC, camera);
      const hit = raycaster.intersectObjects(planes.map((p) => p.mesh))[0];
      const plane = hit ? planes.find((p) => p.mesh === hit.object) ?? null : null;

      if (plane !== hoveredPlane) {
        if (hoveredPlane) {
          hoveredPlane.hovered = false;
          gsap.to(hoveredPlane.mesh.material.uniforms.uBulge, {
            value: 0,
            duration: 0.4,
            ease: "power2.out",
            overwrite: true,
          });
        }
        if (plane) {
          plane.hovered = true;
          gsap.to(plane.mesh.material.uniforms.uBulge, {
            value: 1,
            duration: 0.6,
            ease: "power2.out",
            overwrite: true,
          });
        }
        hoveredPlane = plane;
      }

      if (hit?.uv && plane) {
        plane.targetMouseUV.x = hit.uv.x;
        plane.targetMouseUV.y = hit.uv.y;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerDirty = true;
    };

    const onPointerLeave = () => {
      pointerNDC.set(-2, -2);
      pointerDirty = true;
    };

    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);

    // Fallback for the case where something else already smooths the window: read
    // velocity from an eased copy of the scroll offset instead.
    let easedScroll = scroller ? scroller.scrollTop : window.scrollY;
    let lastEasedScroll = easedScroll;
    let smoothedStrength = 0;
    let visible = true;
    let raf = 0;

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      lenis?.raf(time);
      if (!visible || !screen.width) return;

      let velocity: number;
      if (lenis) {
        velocity = lenis.velocity;
      } else {
        easedScroll += ((scroller ? scroller.scrollTop : window.scrollY) - easedScroll) * 0.18;
        velocity = easedScroll - lastEasedScroll;
        lastEasedScroll = easedScroll;
      }

      const raw = reduced ? 0 : 0.005 * velocity * CONFIG.scrollStrength;
      const target = Math.max(-CONFIG.maxStrength, Math.min(CONFIG.maxStrength, raw));
      smoothedStrength += (target - smoothedStrength) * 0.14;

      // A plane still settling keeps the raycast live, so the lens follows the
      // image as it slides out from under a stationary cursor.
      if (Math.abs(smoothedStrength) > 0.0001) pointerDirty = true;
      updateBulge();

      const stageRect = stage.getBoundingClientRect();

      for (const plane of planes) {
        const rect = plane.img.getBoundingClientRect();
        plane.mesh.position.set(
          ((rect.left - stageRect.left + rect.width / 2) / screen.width) * viewport.width -
            viewport.width / 2,
          viewport.height / 2 -
            ((rect.top - stageRect.top + rect.height / 2) / screen.height) * viewport.height,
          0,
        );

        const uniforms = plane.mesh.material.uniforms;
        uniforms.uStrength.value = smoothedStrength;

        const uv = plane.mouseUV;
        const to = plane.hovered ? plane.targetMouseUV : { x: 0.5, y: 0.5 };
        uv.x += (to.x - uv.x) * 0.07;
        uv.y += (to.y - uv.y) * 0.07;
        uniforms.uMouse.value = [uv.x, uv.y];
      }

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    if (scroller) resizeObserver.observe(scroller);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      for (const plane of planes) {
        gsap.killTweensOf(plane.mesh.material.uniforms.uBulge);
        gsap.killTweensOf(plane.mesh.material.uniforms.uOpacity);
        gsap.killTweensOf(plane.mesh.material.uniforms.uEntrance);
        plane.mesh.material.uniforms.uTexture.value?.dispose();
        plane.mesh.material.dispose();
      }
      geometry.dispose();
      renderer.dispose();
      lenis?.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative w-full bg-black">
      {/* Pinned to the top of the scroll viewport and pulled back out of flow, so
          the canvas covers the frame while the tiles below set the scroll length. */}
      <div
        ref={stageRef}
        className="pointer-events-none sticky top-0 z-20 w-full overflow-hidden"
        style={{ height: stageHeight || undefined, marginBottom: -(stageHeight || 0) }}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      {/* Two staggered columns: the right one starts low, so images cross the
          middle of the frame one at a time, where the fold is strongest. */}
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-x-[6%] px-[8%] pt-[16vh] pb-[24vh]">
        <div className="flex flex-col gap-[18vh]">
          {TILES.filter((_, i) => i % 2 === 0).map((tile) => (
            <Tile key={tile.id} src={tile.src} />
          ))}
        </div>
        <div className="mt-[14vh] flex flex-col gap-[18vh]">
          {TILES.filter((_, i) => i % 2 === 1).map((tile) => (
            <Tile key={tile.id} src={tile.src} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Tile = ({ src }: { src: string }) => (
  <img
    src={src}
    alt=""
    data-gl-img="true"
    draggable={false}
    className="block aspect-3/2 w-full object-cover"
  />
);

export default ScrollWarpGallery;
