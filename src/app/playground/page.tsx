"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Group } from "three";

const MODEL_URL = "/model/polify.glb";

// Logo path normalised to M/L only (the original used H commands).
const LOGO_PATH =
  "M726.5 0L840.5 66.5L633.5 389L491 389L420 497.5L110 497.5L0 431L278 0L726.5 0ZM398 84.5L182.5 416.5L302.5 416.5L372 306L514 306L655.5 84.5L398 84.5Z";

// easeOutBack: overshoots then settles with slope 0 — float takes over cleanly.
const easeOutBack = (x: number, s = 1.70158) => {
  const c1 = s;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const INTRO_DUR = 1.3;

const Model = ({ play }: { play: boolean }) => {
  const { scene } = useGLTF(MODEL_URL);
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);

  const hovered = useRef(false);
  // Screen-space cursor (0..1) so the bleed is one continuous mask across every
  // face from the camera's view — not a separate spot per face.
  const mouseTarget = useRef(new THREE.Vector2(0.5, 0.5));
  const uMouse = useRef({ value: new THREE.Vector2(0.5, 0.5) });
  const uReveal = useRef({ value: 0 });
  const uRadius = useRef({ value: 0.17 }); // fraction of the viewport
  const uResolution = useRef({ value: new THREE.Vector2(1, 1) });

  // Glossy piano-black + white feature edges, patched with a screen-space
  // ink-bleed reveal (cursor-reveal idea) — colourful gradient + soft glow.
  useEffect(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: "#070707",
      metalness: 0.5,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.6,
    });
    const colA = new THREE.Color("#a855f7");
    const colB = new THREE.Color("#22d3ee");

    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const added: THREE.LineSegments[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = mat;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(m.geometry, 30),
        edgeMat,
      );
      m.add(edges);
      added.push(edges);
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMouse = uMouse.current;
      shader.uniforms.uReveal = uReveal.current;
      shader.uniforms.uRadius = uRadius.current;
      shader.uniforms.uResolution = uResolution.current;
      shader.uniforms.uColorA = { value: colA };
      shader.uniforms.uColorB = { value: colB };

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform vec2 uMouse; uniform float uReveal; uniform float uRadius;
          uniform vec2 uResolution; uniform vec3 uColorA; uniform vec3 uColorB;
          float gAmt; vec3 gCol;
          float prHash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
          float prNoise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
            return mix(mix(prHash(i),prHash(i+vec2(1.0,0.0)),u.x), mix(prHash(i+vec2(0.0,1.0)),prHash(i+vec2(1.0,1.0)),u.x), u.y); }
          float prFbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*prNoise(p); p*=2.0; a*=0.5;} return v; }`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          {
            vec2 sc = gl_FragCoord.xy / uResolution;
            float aspect = uResolution.x / uResolution.y;
            float d = length(vec2((sc.x - uMouse.x) * aspect, sc.y - uMouse.y));
            // strong, low-freq fbm warps the edge so the bleed is blobby/random
            float warp = (prFbm(sc * 4.0) - 0.5) * uRadius * 2.2;
            float spot = smoothstep(uRadius, uRadius * 0.1, d + warp);
            gAmt = spot * uReveal;
            gCol = mix(uColorA, uColorB, clamp(sc.y, 0.0, 1.0));
            diffuseColor.rgb = mix(diffuseColor.rgb, gCol, gAmt);
          }`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.45, gAmt);`,
        )
        .replace(
          "#include <metalnessmap_fragment>",
          `#include <metalnessmap_fragment>
          metalnessFactor = mix(metalnessFactor, 0.0, gAmt);`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          totalEmissiveRadiance += gCol * gAmt * 0.85;`,
        );
    };
    mat.customProgramCacheKey = () => "ink-bleed-screen-v1";
    mat.needsUpdate = true;

    return () => {
      mat.dispose();
      edgeMat.dispose();
      added.forEach((l) => {
        l.geometry.dispose();
        l.parent?.remove(l);
      });
    };
  }, [scene]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;

    // ease reveal in/out + smoothly follow the cursor in screen space
    const target = hovered.current ? 1 : 0;
    uReveal.current.value += (target - uReveal.current.value) * 0.08;
    mouseTarget.current.set(
      state.pointer.x * 0.5 + 0.5,
      state.pointer.y * 0.5 + 0.5,
    );
    uMouse.current.value.lerp(mouseTarget.current, 0.18);
    uResolution.current.value.set(
      state.gl.domElement.width,
      state.gl.domElement.height,
    );
    const reveal = uReveal.current.value;

    if (!play) {
      g.position.y = -8;
      g.scale.setScalar(0.7);
      return;
    }
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    let base: number;
    if (t < INTRO_DUR) {
      const p = t / INTRO_DUR;
      g.position.y = -8 * (1 - easeOutBack(p));
      g.rotation.z = 0;
      base = 0.7 + 0.3 * easeOutBack(p, 2.2);
    } else {
      const ft = t - INTRO_DUR;
      const ramp = Math.min(ft / 1.2, 1);
      g.position.y = Math.sin(ft * 1.6) * 0.5 * ramp;
      g.rotation.z = Math.sin(ft * 1.1) * 0.06 * ramp;
      base = 1;
    }
    // barely-there "breathing" scale on hover
    g.scale.setScalar(base * (1 + 0.025 * reveal));
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = true;
  };
  const onOut = () => {
    hovered.current = false;
  };

  return (
    <group ref={ref}>
      <Center>
        <primitive object={scene} onPointerOver={onOver} onPointerOut={onOut} />
      </Center>
    </group>
  );
};

useGLTF.preload(MODEL_URL);

/* ---------------------------------------------------------------------------
 * Distorted-pixels background (technique from akella/DistortedPixels, MIT).
 *
 * The logo + POLIFY are drawn to a canvas texture. A small grid DataTexture
 * holds per-cell RG offsets; the cursor pushes nearby cells (scaled by its
 * velocity) and every cell relaxes back each frame. The display shader samples
 * the texture at `uv - k * offset.rg`, so the pixels smear/distort along the
 * cursor trail and settle when it stops.
 * ------------------------------------------------------------------------- */
const GRID = 36; // fewer cells = bigger "pixels"

const DistortedPixels = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10, 10);
    camera.position.z = 1;

    // --- content texture: logo mark + POLIFY drawn to a square canvas --------
    const TS = 2048;
    const tcan = document.createElement("canvas");
    tcan.width = TS;
    tcan.height = TS;
    const ctx = tcan.getContext("2d")!;
    const texture = new THREE.CanvasTexture(tcan);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;

    const draw = () => {
      ctx.clearRect(0, 0, TS, TS);
      ctx.fillStyle = "rgba(217,217,217,0.18)"; // solid (filled), subtle

      // POLIFY, auto-fit to ~80% width, centred, with refined letter-spacing
      const c2d = ctx as CanvasRenderingContext2D & { letterSpacing: string };
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 100px 'Space Grotesk', sans-serif";
      c2d.letterSpacing = "8px";
      const w100 = ctx.measureText("POLIFY").width || 600;
      const fs = ((TS * 0.8) / w100) * 100;
      ctx.font = `700 ${fs}px 'Space Grotesk', sans-serif`;
      c2d.letterSpacing = `${(8 / 100) * fs}px`;
      ctx.fillText("POLIFY", TS / 2, TS / 2);
      texture.needsUpdate = true;
    };
    draw();
    if (document.fonts?.ready) document.fonts.ready.then(draw);

    // --- offset grid DataTexture --------------------------------------------
    const data = new Float32Array(GRID * GRID * 4);
    const dataTexture = new THREE.DataTexture(
      data,
      GRID,
      GRID,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    dataTexture.needsUpdate = true;

    const uniforms = {
      uTexture: { value: texture },
      uDataTexture: { value: dataTexture },
      resolution: { value: new THREE.Vector4(1, 1, 1, 1) },
    };

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTexture;
          uniform sampler2D uDataTexture;
          uniform vec4 resolution;
          varying vec2 vUv;
          void main() {
            vec2 newUV = (vUv - 0.5) * resolution.zw + 0.5;
            vec4 offset = texture2D(uDataTexture, vUv);
            gl_FragColor = texture2D(uTexture, newUV - 0.01 * offset.rg);
          }
        `,
      }),
    );
    scene.add(mesh);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      // cover-fit the square texture into the viewport
      const imgAspect = 1;
      let a1 = 1;
      let a2 = 1;
      if (h / w > imgAspect) {
        a1 = (w / h) * imgAspect;
      } else {
        a2 = h / w / imgAspect;
      }
      uniforms.resolution.value.set(w, h, a1, a2);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // --- pointer (tracked on the window so the model canvas on top is fine) --
    const mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0 };
    const onMove = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
      mouse.vx = mouse.x - mouse.px;
      mouse.vy = mouse.y - mouse.py;
      mouse.px = mouse.x;
      mouse.py = mouse.y;
    };
    window.addEventListener("pointermove", onMove);

    const RELAX = 0.86;
    const RADIUS = GRID / 6;
    const updateGrid = () => {
      for (let i = 0; i < GRID * GRID; i++) {
        data[i * 4] *= RELAX;
        data[i * 4 + 1] *= RELAX;
      }
      const gx = GRID * mouse.x;
      const gy = GRID * (1 - mouse.y);
      const r2 = RADIUS * RADIUS;
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const dist = (gx - i) ** 2 + (gy - j) ** 2;
          if (dist < r2) {
            const idx = 4 * (i + GRID * j);
            const power = Math.min(RADIUS / Math.sqrt(dist + 0.0001), 8);
            data[idx] += 20 * mouse.vx * power;
            data[idx + 1] -= 20 * mouse.vy * power;
          }
        }
      }
      mouse.vx *= 0.9;
      mouse.vy *= 0.9;
      dataTexture.needsUpdate = true;
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      updateGrid();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      texture.dispose();
      dataTexture.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden />;
};

const Page = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [play, setPlay] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-900">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');`}</style>

      {/* Distorted-pixels background: logo + POLIFY, smear along the cursor. */}
      <DistortedPixels />

      {/* Transparent canvas with the floating model, over the distorted bg. */}
      <Canvas
        style={{ position: "absolute", inset: 0, zIndex: 10 }}
        dpr={[1, 2]}
        camera={{ position: [12.4, -1.6, 0.6], fov: 50 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Model play={play} />
        </Suspense>
      </Canvas>

      {/* Intro: draw the logo stroke, then fade the cover out. */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-20 grid place-items-center bg-neutral-900"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <svg
              width="240"
              viewBox="0 0 841 498"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d={LOGO_PATH}
                fill="none"
                stroke="#D9D9D9"
                strokeWidth={6}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                onAnimationComplete={() => {
                  setPlay(true);
                  setShowIntro(false);
                }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Page;
