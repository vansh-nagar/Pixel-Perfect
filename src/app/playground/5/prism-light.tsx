"use client";

/**
 * A glass prism splitting a beam of white light into a spectrum.
 *
 *  Aim    the beam enters from the left; moving the pointer up and down slides it across
 *         the prism's face
 *  Turn   drag sideways to turn the prism (with inertia). At rest it sways gently, so the
 *         fan breathes on its own; turn it far enough and the light hits total internal
 *         reflection and bounces out of another face
 *
 * The prism is an extruded triangle turned only about z, so the light is traced exactly in
 * its cross-section: per wavelength, Snell's law at every face and total internal
 * reflection when the angle is too steep. Dispersion is exaggerated (Cauchy,
 * n = A + B / λ²) so the fan opens wide. Paths are drawn as soft ribbons on top of a
 * transmissive three.js mesh: additive on the dark backdrop, plain alpha on the pale one.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Kōbō's glass, dark part and stickers, from the exp hub (public/playground/kobo).
const KOBO = "/playground/kobo";

type V2 = [number, number];

const RADIUS = 1.9;
const DEPTH = 1.8;
// Equilateral triangle, apex up, nudged down so the beam meets the faces near the middle.
const OUTLINE: V2[] = [90, 210, 330].map((d) => {
  const a = (d * Math.PI) / 180;
  return [Math.cos(a) * RADIUS, Math.sin(a) * RADIUS - 0.2];
});
const WAVES = 28;
const MAX_EVENTS = 10;
// The beam rises at ~23° and meets the left face at ~50°: close to minimum deviation, the
// cleanest and widest fan, which then leaves heading slightly down and to the right.
const REST_ANGLE = 0.05;
const BEAM_DIR: V2 = (() => {
  const l = Math.hypot(1, 0.42);
  return [1 / l, 0.42 / l];
})();
const BEAM_W = 0.065;

/** Exaggerated Cauchy dispersion, λ in µm. */
const iorAt = (um: number) => 1.4 + 0.042 / (um * um);

/** Approximate visible spectrum colour for λ in nm. */
function spectrum(nm: number): THREE.Color {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) [r, g, b] = [-(nm - 440) / 60, 0, 1];
  else if (nm < 490) [r, g, b] = [0, (nm - 440) / 50, 1];
  else if (nm < 510) [r, g, b] = [0, 1, -(nm - 510) / 20];
  else if (nm < 580) [r, g, b] = [(nm - 510) / 70, 1, 0];
  else if (nm < 645) [r, g, b] = [1, -(nm - 645) / 65, 0];
  else [r, g, b] = [1, 0, 0];
  const edge = nm < 420 ? 0.35 + (0.65 * (nm - 390)) / 30 : nm > 680 ? 0.35 + (0.65 * (710 - nm)) / 30 : 1;
  return new THREE.Color(r * edge, g * edge, b * edge);
}

const WAVE_NM = Array.from({ length: WAVES }, (_, i) => 395 + (310 * i) / (WAVES - 1));
const WAVE_IOR = WAVE_NM.map((nm) => iorAt(nm / 1000));
const WAVE_RGB = WAVE_NM.map((nm) => spectrum(nm));

// Counter-clockwise outline, so edge normals (ey, -ex) point outward.
const POLY: V2[] = (() => {
  const area = OUTLINE.reduce((acc, p, k) => {
    const q = OUTLINE[(k + 1) % OUTLINE.length];
    return acc + p[0] * q[1] - q[0] * p[1];
  }, 0);
  return area < 0 ? [...OUTLINE].reverse() : OUTLINE;
})();
const NORMALS: V2[] = POLY.map((p, k) => {
  const q = POLY[(k + 1) % POLY.length];
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
  return [(q[1] - p[1]) / l, -(q[0] - p[0]) / l];
});

/** Nearest face the ray crosses, with that face's outward normal. */
function cast(o: V2, d: V2): { t: number; n: V2 } | null {
  let best: { t: number; n: V2 } | null = null;
  for (let i = 0; i < POLY.length; i++) {
    const a = POLY[i];
    const b = POLY[(i + 1) % POLY.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const ax = a[0] - o[0];
    const ay = a[1] - o[1];
    const t = (ax * ey - ay * ex) / den;
    const u = (ax * d[1] - ay * d[0]) / den;
    if (t > 1e-5 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, n: NORMALS[i] };
  }
  return best;
}

type Seg = { a: V2; b: V2; w0: number; w1: number; a0: number; a1: number; color: THREE.Color };

export default function PrismLight() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.className = "absolute inset-0 size-full";
    box.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    const canvasTex = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      draw(c.getContext("2d")!, w, h);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };

    // Backdrop: a screen-space gradient, so the prism's transmission pass refracts it too.
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = bgCanvas.height = 512;
    const bgTex = new THREE.CanvasTexture(bgCanvas);
    bgTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTex;

    // Glass: the same recipe as Kōbō's shell in the exp hub.
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbf6f9,
      attenuationColor: 0xf1c7eb,
      attenuationDistance: 8,
      roughness: 0,
      transmission: 1,
      ior: 1.5,
      thickness: 0.85,
      dispersion: 3,
      clearcoat: 0.1,
      clearcoatRoughness: 0.03,
      specularIntensity: 0.1,
      specularColor: 0xc8c2cf,
      anisotropy: 0.1,
      envMapIntensity: 2.25,
    });
    // Kōbō's dark part: near-black chrome with a soft clearcoat.
    const darkMat = new THREE.MeshPhysicalMaterial({
      color: 0x101214,
      roughness: 0,
      metalness: 1,
      envMapIntensity: 0.06,
      clearcoat: 0.19,
      clearcoatRoughness: 0.46,
      specularIntensity: 0.43,
      specularColor: 0xf7f9fc,
      emissive: 0x101214,
      emissiveIntensity: 0.032,
    });
    // Same light rig: a cool key from low front-left plus a lavender ambient.
    const key = new THREE.DirectionalLight(0xe6e0e4, 2);
    key.position.set(-3, -20, 40);
    scene.add(key, new THREE.AmbientLight(0xd8bcdb, 2));
    const edgeMat = new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5 });

    // The light plane: tilted so the prism shows its depth, while the trace stays exact in
    // the plane's own x/y.
    const world = new THREE.Group();
    world.rotation.set(-0.42, 0.38, 0.04);
    scene.add(world);
    const pivot = new THREE.Group();
    world.add(pivot);

    const shape = new THREE.Shape(POLY.map(([x, y]) => new THREE.Vector2(x, y)));
    const glassGeo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 1 });
    glassGeo.translate(0, 0, -DEPTH / 2);
    glassGeo.computeVertexNormals();
    const edgeGeo = new THREE.EdgesGeometry(glassGeo, 25);
    pivot.add(new THREE.Mesh(glassGeo, glassMat), new THREE.LineSegments(edgeGeo, edgeMat));

    // Kōbō's stickers on the prism's faces, sized to each texture.
    const front = DEPTH / 2 + 0.036; // just outside the 0.03 bevel
    const texLoader = new THREE.TextureLoader();
    const stickers: { file: string; w: number; h: number; x: number; y: number; back?: boolean }[] = [
      { file: "E", w: 0.36, h: 0.146, x: -0.78, y: -0.88 },
      { file: "kobo-word", w: 0.36, h: 0.154, x: 0.8, y: -0.9 },
      { file: "label", w: 0.2, h: 0.2, x: 0.02, y: -0.82 },
      { file: "signature", w: 0.5, h: 0.2, x: 0, y: -0.75, back: true },
    ];
    const stickerParts: { dispose: () => void }[] = [];
    // The art is black ink on transparent; dark mode swaps in a white copy so it reads on
    // the dark glass.
    const stickerMats: { mat: THREE.MeshBasicMaterial; ink: THREE.Texture; light: THREE.CanvasTexture }[] = [];
    for (const st of stickers) {
      const lightCanvas = document.createElement("canvas");
      const light = new THREE.CanvasTexture(lightCanvas);
      const tex = texLoader.load(`${KOBO}/textures/${st.file}.webp`, (t) => {
        const img = t.image as HTMLImageElement;
        lightCanvas.width = img.width;
        lightCanvas.height = img.height;
        const g = lightCanvas.getContext("2d")!;
        g.drawImage(img, 0, 0);
        g.globalCompositeOperation = "source-in";
        g.fillStyle = "#f4f2f8";
        g.fillRect(0, 0, img.width, img.height);
        light.needsUpdate = true;
      });
      for (const t of [tex, light]) {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
      }
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });
      stickerMats.push({ mat, ink: tex, light });
      stickerParts.push(light);
      const geo = new THREE.PlaneGeometry(st.w, st.h);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(st.x, st.y, st.back ? -front : front);
      if (st.back) m.rotation.y = Math.PI;
      pivot.add(m);
      stickerParts.push(tex, mat, geo);
    }

    // Kōbō's dark part floats in the upper half of the prism, clear of the beam's usual path.
    const fitting = new THREE.Group();
    fitting.position.set(0, 0.42, 0);
    pivot.add(fitting);
    let gltfScene: THREE.Object3D | null = null;
    new GLTFLoader().load(`${KOBO}/kobo.gltf`, (gltf) => {
      const part = gltf.scene.getObjectByName("Cylinder");
      if (!part || disposed) return;
      part.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = darkMat;
      });
      part.scale.multiplyScalar(0.44 / 89);
      fitting.add(part);
      gltfScene = gltf.scene;
    });
    let disposed = false;

    // Beams: one buffer of soft ribbons, rebuilt every frame.
    const MAX_QUADS = 2 + WAVES * (MAX_EVENTS + 1);
    const pos = new Float32Array(MAX_QUADS * 4 * 3);
    const col = new Float32Array(MAX_QUADS * 4 * 4);
    const across = new Float32Array(MAX_QUADS * 4);
    const idx = new Uint32Array(MAX_QUADS * 6);
    for (let q = 0; q < MAX_QUADS; q++) {
      idx.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4 + 2, q * 4 + 1, q * 4 + 3], q * 6);
      across.set([-1, 1, -1, 1], q * 4);
    }
    const beamGeo = new THREE.BufferGeometry();
    beamGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    beamGeo.setAttribute("color", new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
    beamGeo.setAttribute("across", new THREE.BufferAttribute(across, 1));
    beamGeo.setIndex(new THREE.BufferAttribute(idx, 1));
    const beamMat = new THREE.ShaderMaterial({
      uniforms: { uDark: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec4 color;
        attribute float across;
        varying vec4 vColor;
        varying float vAcross;
        void main() {
          vColor = color;
          vAcross = across;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uDark;
        varying vec4 vColor;
        varying float vAcross;
        void main() {
          float x = vAcross * vAcross;
          float core = exp(-x * 9.0);
          float halo = exp(-x * 2.2) * 0.45;
          float a = (core + halo) * vColor.a;
          vec3 c = mix(vColor.rgb, vec3(1.0), core * 0.3);
          // Additive on dark (premultiplied), plain alpha on the pale backdrop.
          gl_FragColor = uDark > 0.5 ? vec4(c * a, a) : vec4(c, min(1.0, a * 1.3));
        }`,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beams = new THREE.Mesh(beamGeo, beamMat);
    beams.frustumCulled = false;
    beams.renderOrder = 10;
    world.add(beams);

    // Flares where light meets a face.
    const flareTex = canvasTex(
      (g, w) => {
        const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        r.addColorStop(0, "rgba(255,255,255,1)");
        r.addColorStop(0.15, "rgba(255,255,255,0.7)");
        r.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = r;
        g.fillRect(0, 0, w, w);
      },
      128,
      128,
    );
    const flareMat = new THREE.SpriteMaterial({ map: flareTex, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true });
    const flares = Array.from({ length: 4 }, () => {
      const s = new THREE.Sprite(flareMat);
      s.renderOrder = 11;
      world.add(s);
      return s;
    });

    const disposables: { dispose: () => void }[] = [
      glassMat, darkMat, edgeMat, glassGeo, edgeGeo, ...stickerParts,
      beamGeo, beamMat, flareTex, flareMat, bgTex, env, pmrem,
    ];

    let dark: boolean | null = null;
    const paintBackdrop = () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark === dark) return;
      dark = isDark;
      const g = bgCanvas.getContext("2d")!;
      if (isDark) {
        const r = g.createRadialGradient(220, 240, 10, 256, 256, 420);
        r.addColorStop(0, "#17151e");
        r.addColorStop(1, "#040405");
        g.fillStyle = r;
        g.fillRect(0, 0, 512, 512);
      } else {
        g.fillStyle = "#c6c1d0";
        g.fillRect(0, 0, 512, 512);
        // The hub's blue oval, low and wide, fading up into the lavender.
        g.save();
        g.translate(256, 512 - 0.02 * 512);
        g.scale(1, 0.17 / 0.98);
        const r = g.createRadialGradient(0, 0, 0, 0, 0, 0.98 * 512);
        r.addColorStop(0, "rgba(57,77,254,0.55)");
        r.addColorStop(0.55, "rgba(57,77,254,0.12)");
        r.addColorStop(1, "rgba(57,77,254,0)");
        g.fillStyle = r;
        g.fillRect(-512, -1024, 1024, 2048);
        g.restore();
      }
      bgTex.needsUpdate = true;
      beamMat.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
      beamMat.uniforms.uDark.value = isDark ? 1 : 0;
      flareMat.blending = beamMat.blending;
      flareMat.opacity = isDark ? 1 : 0.85;
      edgeMat.opacity = isDark ? 0.4 : 0.7;
      for (const s of stickerMats) {
        s.mat.map = isDark ? s.light : s.ink;
        s.mat.needsUpdate = true;
      }
      beamMat.needsUpdate = flareMat.needsUpdate = true;
    };

    // State: `angle` is where the prism rests, the idle sway is added on top.
    const state = { angle: REST_ANGLE, vel: 0, aimY: -0.6, aimTarget: -0.6, px: 0, py: 0 };

    const drag = { on: false, x: 0, lastV: 0 };
    const onDown = (e: PointerEvent) => {
      box.setPointerCapture(e.pointerId);
      drag.on = true;
      drag.x = e.clientX;
      drag.lastV = 0;
      state.vel = 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      state.px = ((e.clientX - r.left) / r.width) * 2 - 1;
      state.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      state.aimTarget = THREE.MathUtils.clamp(-0.6 - state.py * 1.3, -1.6, 0.4);
      if (!drag.on) return;
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      state.angle -= dx * 0.008;
      drag.lastV = -dx * 0.008 * 60;
    };
    const onUp = () => {
      if (!drag.on) return;
      drag.on = false;
      state.vel = reduce ? 0 : THREE.MathUtils.clamp(drag.lastV, -5, 5);
    };
    box.addEventListener("pointerdown", onDown);
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerup", onUp);
    box.addEventListener("pointercancel", onUp);

    let camZ = 13;
    const center = new THREE.Vector3(-1.2, 0, 0);
    const resize = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      // Keep the prism and a good stretch of the fan in frame on narrow screens.
      camZ = 13 * Math.max(1, 1.5 / camera.aspect);
      center.x = camera.aspect < 1 ? -0.5 : -1.2;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    // Trace and ribbon build.
    const segs: Seg[] = [];
    const white = new THREE.Color(1, 1, 1);
    const flarePts: { p: V2; s: number }[] = [];

    const trace = (angle: number) => {
      segs.length = 0;
      flarePts.length = 0;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const toLocal = (p: V2): V2 => {
        const x = p[0] - center.x;
        const y = p[1] - center.y;
        return [x * ca + y * sa, -x * sa + y * ca];
      };
      const toWorld = (p: V2): V2 => [center.x + p[0] * ca - p[1] * sa, center.y + p[0] * sa + p[1] * ca];
      const rotL = (d: V2): V2 => [d[0] * ca + d[1] * sa, -d[0] * sa + d[1] * ca];
      const rotW = (d: V2): V2 => [d[0] * ca - d[1] * sa, d[0] * sa + d[1] * ca];

      const aim: V2 = [center.x - 2.6, state.aimY];
      const origin: V2 = [aim[0] - BEAM_DIR[0] * 30, aim[1] - BEAM_DIR[1] * 30];
      const lo = toLocal(origin);
      const ld = rotL(BEAM_DIR);
      const first = cast(lo, ld);

      if (!first) {
        // Missed the prism: one white beam straight across.
        segs.push({ a: origin, b: [origin[0] + BEAM_DIR[0] * 70, origin[1] + BEAM_DIR[1] * 70], w0: BEAM_W, w1: BEAM_W, a0: 0.9, a1: 0.9, color: white });
        return;
      }
      const entryL: V2 = [lo[0] + ld[0] * first.t, lo[1] + ld[1] * first.t];
      const entry = toWorld(entryL);
      segs.push({ a: origin, b: entry, w0: BEAM_W, w1: BEAM_W, a0: 0.95, a1: 0.95, color: white });
      flarePts.push({ p: entry, s: 0.75 });

      // A faint mirror reflection off the first face.
      {
        const n = first.n;
        const dn = ld[0] * n[0] + ld[1] * n[1];
        const rw = rotW([ld[0] - 2 * dn * n[0], ld[1] - 2 * dn * n[1]]);
        segs.push({ a: entry, b: [entry[0] + rw[0] * 40, entry[1] + rw[1] * 40], w0: BEAM_W * 0.8, w1: BEAM_W * 5, a0: 0.14, a1: 0, color: white });
      }

      const mid = Math.floor(WAVES / 2);
      for (let w = 0; w < WAVES; w++) {
        const ior = WAVE_IOR[w];
        const color = WAVE_RGB[w];
        let o = entryL;
        let d = ld;
        let n = first.n;
        let width = BEAM_W;
        let energy = 1;
        for (let ev = 0; ev < MAX_EVENTS; ev++) {
          // Refract, or reflect when the angle is past critical.
          const entering = d[0] * n[0] + d[1] * n[1] < 0;
          const N: V2 = entering ? n : [-n[0], -n[1]];
          const eta = entering ? 1 / ior : ior;
          const cosi = -(d[0] * N[0] + d[1] * N[1]);
          const k = 1 - eta * eta * (1 - cosi * cosi);
          let inside = !entering;
          if (k < 0) {
            d = [d[0] + 2 * cosi * N[0], d[1] + 2 * cosi * N[1]];
            energy *= 0.9;
          } else {
            const f = eta * cosi - Math.sqrt(k);
            d = [eta * d[0] + f * N[0], eta * d[1] + f * N[1]];
            inside = entering;
          }
          const hit = cast(o, d);
          const pw = toWorld(o);
          const dw = rotW(d);
          if (!inside || !hit) {
            // Out in the air: the fan. Each colour widens and fades as it travels.
            const len = 40;
            segs.push({ a: pw, b: [pw[0] + dw[0] * len, pw[1] + dw[1] * len], w0: width, w1: width + 0.07 * len, a0: energy, a1: energy * 0.35, color });
            if (w === mid) flarePts.push({ p: pw, s: 0.55 });
            break;
          }
          const nextL: V2 = [o[0] + d[0] * hit.t, o[1] + d[1] * hit.t];
          segs.push({ a: pw, b: toWorld(nextL), w0: width, w1: width + 0.006 * hit.t, a0: 0.8 * energy, a1: 0.8 * energy, color });
          width += 0.006 * hit.t;
          if (w === mid && flarePts.length < flares.length - 1 && k < 0) flarePts.push({ p: pw, s: 0.5 });
          o = nextL;
          n = hit.n;
        }
      }
    };

    const build = () => {
      let q = 0;
      // Coloured paths share the light: each carries a slice, so they sum to white where
      // they still overlap. Wider ribbons spread the same light thinner.
      const perWave = (dark ? 3.2 : 1.7) / (WAVES * 0.42);
      for (const sg of segs) {
        if (q >= MAX_QUADS) break;
        const dx = sg.b[0] - sg.a[0];
        const dy = sg.b[1] - sg.a[1];
        const l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l;
        const ny = dx / l;
        const p = q * 12;
        pos[p] = sg.a[0] - nx * sg.w0;
        pos[p + 1] = sg.a[1] - ny * sg.w0;
        pos[p + 3] = sg.a[0] + nx * sg.w0;
        pos[p + 4] = sg.a[1] + ny * sg.w0;
        pos[p + 6] = sg.b[0] - nx * sg.w1;
        pos[p + 7] = sg.b[1] - ny * sg.w1;
        pos[p + 9] = sg.b[0] + nx * sg.w1;
        pos[p + 10] = sg.b[1] + ny * sg.w1;
        pos[p + 2] = pos[p + 5] = pos[p + 8] = pos[p + 11] = 0;
        const share = sg.color === white ? 1 : perWave;
        const alpha0 = sg.a0 * share * Math.min(1, BEAM_W / sg.w0);
        const alpha1 = sg.a1 * share * Math.min(1, BEAM_W / sg.w1) ** 0.3;
        const c = q * 16;
        for (let v = 0; v < 4; v++) {
          col[c + v * 4] = sg.color.r;
          col[c + v * 4 + 1] = sg.color.g;
          col[c + v * 4 + 2] = sg.color.b;
          col[c + v * 4 + 3] = v < 2 ? alpha0 : alpha1;
        }
        q++;
      }
      beamGeo.setDrawRange(0, q * 6);
      beamGeo.attributes.position.needsUpdate = true;
      beamGeo.attributes.color.needsUpdate = true;

      flares.forEach((f, i) => {
        const fp = flarePts[i];
        f.visible = !!fp;
        if (!fp) return;
        f.position.set(fp.p[0], fp.p[1], 0.01);
        f.scale.setScalar(fp.s);
      });
    };

    let last = performance.now();
    let visible = !document.hidden;
    const onVis = () => {
      visible = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      paintBackdrop();

      if (!drag.on) {
        state.angle += state.vel * dt;
        state.vel *= Math.exp(-dt * 2.2);
      }
      state.aimY += (state.aimTarget - state.aimY) * Math.min(1, dt * 5);
      const sway = reduce ? 0 : 0.09 * Math.sin(t * 0.45) + 0.03 * Math.sin(t * 1.1);
      const angle = state.angle + sway;

      if (!reduce) {
        fitting.rotation.x = t * 0.5;
        fitting.rotation.y = t * 0.5;
        fitting.rotation.z = t * 0.5;
      }
      pivot.position.copy(center);
      pivot.rotation.z = angle;

      camera.position.set(center.x * 0.35 + state.px * 0.6, -state.py * 0.4, camZ);
      camera.lookAt(center.x * 0.35 + 1.2, 0, 0);

      trace(angle);
      build();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      box.removeEventListener("pointerdown", onDown);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", onUp);
      box.removeEventListener("pointercancel", onUp);
      disposed = true;
      disposables.forEach((d) => d.dispose());
      gltfScene?.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label="A glass prism splitting a beam of white light into a spectrum. Drag to turn it, move the pointer to aim the light."
      className="relative h-dvh w-full cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
    >
      <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm text-muted-foreground">
        Drag to turn the prism, move to aim the light
      </p>
    </div>
  );
}
