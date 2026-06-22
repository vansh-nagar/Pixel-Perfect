"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { createAnimatedTexture } from "./animated-texture";

/* -------------------------------------------------------------------------- *
 * The classic GPU fluid simulation (Navier–Stokes), faithful to Pavel
 * Dobryakov's WebGL-Fluid-Simulation, ported to three.js. Unlike the sibling
 * "Fluid Distortion" (which uses the fluid as a reveal/distortion mask between
 * two images), this splats *vivid, multi-coloured dye* into the velocity field
 * and composites it as a glowing liquid over the image — drag to paint rainbow
 * fluid that swirls, bleeds and slowly dissipates.
 *
 * Each frame runs a ping-pong pipeline over float render targets:
 * splat → curl → vorticity → divergence → pressure (Jacobi) → gradient-subtract
 * → advect(velocity) → advect(dye). The display pass adds the coloured dye on
 * top of the image with an additive glow.
 * -------------------------------------------------------------------------- */

// Plain pass-through: writes vUv, draws the full-screen quad in clip space.
const BASE_VERTEX = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Same, but also precomputes the four neighbour texel coords for the finite
// difference passes (curl/divergence/pressure/gradient).
const STENCIL_VERTEX = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform vec2 texelSize;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    vUv = uv;
    vL = uv - vec2(texelSize.x, 0.0);
    vR = uv + vec2(texelSize.x, 0.0);
    vT = uv + vec2(0.0, texelSize.y);
    vB = uv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const SPLAT_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const ADVECTION_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  // Pre-normalised on the CPU to pow(base, dt * 60) so the fade is identical
  // on 60Hz and 120Hz displays.
  uniform float dissipation;
  varying vec2 vUv;
  void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    gl_FragColor = dissipation * texture2D(uSource, coord);
  }
`;

const CURL_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const VORTICITY_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = clamp(velocity, -1000.0, 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const DIVERGENCE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const CLEAR_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float value;
  varying vec2 vUv;
  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const PRESSURE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// Final composite: show the image, darken it slightly under the fluid so the
// colours pop, then add the coloured dye on top as an additive glow.
const DISPLAY_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uImage;
  uniform sampler2D uDye;
  uniform vec2 resolution;
  uniform vec2 uImageResolution;
  uniform float uIntensity;
  varying vec2 vUv;

  vec2 coverUV(vec2 uv, vec2 imageRes) {
    float screenAspect = resolution.x / resolution.y;
    float imageAspect = imageRes.x / imageRes.y;
    vec2 scale = vec2(1.0);
    if (screenAspect > imageAspect) {
      scale.y = imageAspect / screenAspect;
    } else {
      scale.x = screenAspect / imageAspect;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec3 dye = texture2D(uDye, vUv).rgb;
    float density = clamp(length(dye) * 1.4, 0.0, 1.0);

    vec3 img = texture2D(uImage, coverUV(vUv, uImageResolution)).rgb;
    // darken the image beneath the fluid so the colour reads as luminous liquid
    vec3 col = img * (1.0 - 0.55 * density) + dye * uIntensity;
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Config = {
  densityDissipation: number;
  velocityDissipation: number;
  pressureDissipation: number;
  curl: number;
  radius: number;
  intensity: number;
  splatForce: number;
};

const DEFAULTS: Config = {
  densityDissipation: 0.975,
  velocityDissipation: 0.98,
  pressureDissipation: 0.8,
  curl: 16,
  radius: 0.0025,
  intensity: 1.0,
  splatForce: 6,
};

const PRESSURE_ITERATIONS = 18;
const SIM_RESOLUTION = 160;

// HSV (0–1) → RGB (0–1); used to pick vivid, fully-saturated splat colours.
const hsvToRgb = (h: number, s: number, v: number) => {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    default:
      return [v, p, q];
  }
};

const FluidSimulation = ({
  image,
  className,
  dpr = 2,
  controls = false,
}: {
  /** Public path (or URL) of the image the fluid is painted over. */
  image: string;
  className?: string;
  /** Max pixel ratio. Use a lower value for small thumbnails. */
  dpr?: number;
  /** Show the lil-gui customization panel. */
  controls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const config: Config = { ...DEFAULTS };

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;

    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // --- Render targets ----------------------------------------------------
    const aspect = Math.max(
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.0001,
    );
    let simW: number;
    let simH: number;
    if (aspect >= 1) {
      simW = Math.round(SIM_RESOLUTION * aspect);
      simH = SIM_RESOLUTION;
    } else {
      simW = SIM_RESOLUTION;
      simH = Math.round(SIM_RESOLUTION / aspect);
    }
    const texelSize = new THREE.Vector2(1 / simW, 1 / simH);

    const rtOptions: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    };

    const makeRT = () => new THREE.WebGLRenderTarget(simW, simH, rtOptions);
    const makeDouble = () => {
      let read = makeRT();
      let write = makeRT();
      return {
        get read() {
          return read;
        },
        get write() {
          return write;
        },
        swap() {
          const tmp = read;
          read = write;
          write = tmp;
        },
        dispose() {
          read.dispose();
          write.dispose();
        },
      };
    };

    const velocity = makeDouble();
    const dye = makeDouble();
    const pressure = makeDouble();
    const divergence = makeRT();
    const curl = makeRT();

    // --- Materials ---------------------------------------------------------
    const mat = (
      vertexShader: string,
      fragmentShader: string,
      uniforms: Record<string, THREE.IUniform>,
    ) =>
      new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
      });

    const splatMat = mat(BASE_VERTEX, SPLAT_FRAG, {
      uTarget: { value: null },
      aspectRatio: { value: simW / simH },
      color: { value: new THREE.Vector3() },
      point: { value: new THREE.Vector2() },
      radius: { value: config.radius },
    });
    const advectionMat = mat(BASE_VERTEX, ADVECTION_FRAG, {
      uVelocity: { value: null },
      uSource: { value: null },
      texelSize: { value: texelSize },
      dt: { value: 0 },
      dissipation: { value: 1 },
    });
    const curlMat = mat(STENCIL_VERTEX, CURL_FRAG, {
      texelSize: { value: texelSize },
      uVelocity: { value: null },
    });
    const vorticityMat = mat(STENCIL_VERTEX, VORTICITY_FRAG, {
      texelSize: { value: texelSize },
      uVelocity: { value: null },
      uCurl: { value: null },
      curl: { value: config.curl },
      dt: { value: 0 },
    });
    const divergenceMat = mat(STENCIL_VERTEX, DIVERGENCE_FRAG, {
      texelSize: { value: texelSize },
      uVelocity: { value: null },
    });
    const clearMat = mat(BASE_VERTEX, CLEAR_FRAG, {
      uTexture: { value: null },
      value: { value: 1 },
    });
    const pressureMat = mat(STENCIL_VERTEX, PRESSURE_FRAG, {
      texelSize: { value: texelSize },
      uPressure: { value: null },
      uDivergence: { value: null },
    });
    const gradientMat = mat(STENCIL_VERTEX, GRADIENT_FRAG, {
      texelSize: { value: texelSize },
      uPressure: { value: null },
      uVelocity: { value: null },
    });
    const displayMat = mat(BASE_VERTEX, DISPLAY_FRAG, {
      uImage: { value: null },
      uDye: { value: null },
      resolution: { value: new THREE.Vector2() },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uIntensity: { value: config.intensity },
    });

    // --- Image texture (animated GIF, frame-by-frame; static fallback) -----
    const animated = createAnimatedTexture(image);
    displayMat.uniforms.uImage.value = animated.texture;

    const blit = (
      material: THREE.Material,
      target: THREE.WebGLRenderTarget | null,
    ) => {
      mesh.material = material;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    };

    // --- Pointer / auto input ---------------------------------------------
    type Splat = {
      x: number;
      y: number;
      dx: number;
      dy: number;
      color: [number, number, number];
    };
    const queue: Splat[] = [];
    let pointer: { x: number; y: number } | null = null;
    let lastInteraction = -Infinity;

    // Drift the hue so successive splats cycle through vivid rainbow colours.
    let hue = 0;
    const nextColor = (): [number, number, number] => {
      hue = (hue + 0.07) % 1;
      const [r, g, b] = hsvToRgb(hue, 1, 1);
      return [r * 0.18, g * 0.18, b * 0.18];
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      if (pointer) {
        queue.push({
          x,
          y,
          dx: x - pointer.x,
          dy: y - pointer.y,
          color: nextColor(),
        });
      }
      pointer = { x, y };
      lastInteraction = shaderTime;
    };
    const onPointerLeave = () => {
      pointer = null;
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    // Drift a splat along a Lissajous path while idle so the tile stays alive.
    let autoPrev: { x: number; y: number } | null = null;
    const pushAutoSplat = () => {
      const t = shaderTime * 0.6;
      const x = 0.5 + 0.32 * Math.sin(t * 1.1);
      const y = 0.5 + 0.28 * Math.cos(t * 1.7);
      if (autoPrev) {
        queue.push({
          x,
          y,
          dx: x - autoPrev.x,
          dy: y - autoPrev.y,
          color: nextColor(),
        });
      }
      autoPrev = { x, y };
    };

    const applySplat = (s: Splat) => {
      // velocity splat — drives the motion
      splatMat.uniforms.uTarget.value = velocity.read.texture;
      splatMat.uniforms.radius.value = config.radius;
      (splatMat.uniforms.point.value as THREE.Vector2).set(s.x, s.y);
      (splatMat.uniforms.color.value as THREE.Vector3).set(
        s.dx * config.splatForce,
        s.dy * config.splatForce,
        0,
      );
      blit(splatMat, velocity.write);
      velocity.swap();

      // dye splat — vivid colour painted into the density field
      splatMat.uniforms.uTarget.value = dye.read.texture;
      (splatMat.uniforms.color.value as THREE.Vector3).set(
        s.color[0],
        s.color[1],
        s.color[2],
      );
      blit(splatMat, dye.write);
      dye.swap();
    };

    // --- Simulation step ---------------------------------------------------
    const step = (dt: number) => {
      // Curl
      curlMat.uniforms.uVelocity.value = velocity.read.texture;
      blit(curlMat, curl);

      // Vorticity confinement
      vorticityMat.uniforms.uVelocity.value = velocity.read.texture;
      vorticityMat.uniforms.uCurl.value = curl.texture;
      vorticityMat.uniforms.curl.value = config.curl;
      vorticityMat.uniforms.dt.value = dt;
      blit(vorticityMat, velocity.write);
      velocity.swap();

      // Divergence
      divergenceMat.uniforms.uVelocity.value = velocity.read.texture;
      blit(divergenceMat, divergence);

      // Decay pressure (frame-rate normalised)
      clearMat.uniforms.uTexture.value = pressure.read.texture;
      clearMat.uniforms.value.value = Math.pow(
        config.pressureDissipation,
        dt * 60,
      );
      blit(clearMat, pressure.write);
      pressure.swap();

      // Jacobi pressure solve
      divergenceMat.uniforms.uVelocity.value = velocity.read.texture;
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        pressureMat.uniforms.uPressure.value = pressure.read.texture;
        pressureMat.uniforms.uDivergence.value = divergence.texture;
        blit(pressureMat, pressure.write);
        pressure.swap();
      }

      // Subtract pressure gradient → divergence-free velocity
      gradientMat.uniforms.uPressure.value = pressure.read.texture;
      gradientMat.uniforms.uVelocity.value = velocity.read.texture;
      blit(gradientMat, velocity.write);
      velocity.swap();

      // Advect velocity
      advectionMat.uniforms.uVelocity.value = velocity.read.texture;
      advectionMat.uniforms.uSource.value = velocity.read.texture;
      advectionMat.uniforms.dt.value = dt;
      advectionMat.uniforms.dissipation.value = Math.pow(
        config.velocityDissipation,
        dt * 60,
      );
      blit(advectionMat, velocity.write);
      velocity.swap();

      // Advect dye
      advectionMat.uniforms.uVelocity.value = velocity.read.texture;
      advectionMat.uniforms.uSource.value = dye.read.texture;
      advectionMat.uniforms.dissipation.value = Math.pow(
        config.densityDissipation,
        dt * 60,
      );
      blit(advectionMat, dye.write);
      dye.swap();
    };

    // --- Frame loop --------------------------------------------------------
    let shaderTime = 0;
    let last = performance.now();

    const renderFrame = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1 / 60);
      last = now;
      shaderTime += dt;

      animated.update(shaderTime * 1000);
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        displayMat.uniforms.uImageResolution.value.set(img.width, img.height);
      }

      if (shaderTime - lastInteraction > 1.2) pushAutoSplat();

      // Fixed substep for the advection backtrace so motion speed is
      // hardware-independent; dissipation is normalised above via pow(.., dt*60).
      const simDt = 0.016;
      while (queue.length) applySplat(queue.shift() as Splat);
      step(simDt);

      // Composite to screen
      displayMat.uniforms.uDye.value = dye.read.texture;
      displayMat.uniforms.uIntensity.value = config.intensity;
      blit(displayMat, null);
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      displayMat.uniforms.resolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
      renderFrame();
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        last = performance.now(); // avoid a huge dt after being offscreen
      },
      { rootMargin: "150px", threshold: 0 },
    );
    intersectionObserver.observe(container);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      renderFrame();
    };
    animate();

    // --- Controls ----------------------------------------------------------
    let gui: GUI | null = null;
    if (controls) {
      gui = new GUI();
      gui.domElement.style.zIndex = "10000";
      gui.add(config, "intensity", 0, 3, 0.05).name("glow");
      gui.add(config, "curl", 0, 40, 0.5).name("curl (swirl)");
      gui.add(config, "splatForce", 1, 20, 0.5).name("force");
      gui.add(config, "radius", 0.0005, 0.01, 0.0005).name("radius");
      gui
        .add(config, "densityDissipation", 0.9, 1, 0.005)
        .name("dye dissipation");
      gui
        .add(config, "velocityDissipation", 0.8, 1, 0.005)
        .name("velocity dissipation");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (canvas.parentNode === container) container.removeChild(canvas);
      velocity.dispose();
      dye.dispose();
      pressure.dispose();
      divergence.dispose();
      curl.dispose();
      animated.dispose();
      geometry.dispose();
      [
        splatMat,
        advectionMat,
        curlMat,
        vorticityMat,
        divergenceMat,
        clearMat,
        pressureMat,
        gradientMat,
        displayMat,
      ].forEach((m) => m.dispose());
      renderer.setRenderTarget(null);
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [image, dpr, controls]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ overflow: "hidden" }}
    />
  );
};

export default FluidSimulation;
