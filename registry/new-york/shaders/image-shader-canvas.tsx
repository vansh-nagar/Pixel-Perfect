"use client";

/**
 * A reusable image-shader canvas (Three.js) that loads one or two images, exposes time/mouse/progress uniforms and runs a custom fragment shader with cover-fit sampling.
 */


import { useEffect, useRef } from "react";
import * as THREE from "three";
import GUI from "lil-gui";
import { COMMON_GLSL } from "./shader-canvas";
import { createAnimatedTexture } from "./animated-texture";

const VERTEX_SHADER = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const WRAPPER_MAIN = /* glsl */ `
  void main() {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    userMain();
    gl_FragColor = vec4(applyAdjust(fragColor.rgb), fragColor.a);
  }
`;

const IMAGE_GLSL = /* glsl */ `
  uniform sampler2D uTexture;
  // Natural pixel size of the loaded image, for aspect-correct sampling.
  uniform vec2 uImageResolution;

  // Optional second image + transition progress (0..1). For transition shaders;
  // when no second image is given, uTextureB falls back to uTexture and
  // uProgress stays 0, so single-image shaders are unaffected.
  uniform sampler2D uTextureB;
  uniform vec2 uImageResolutionB;
  uniform float uProgress;

  // Map a 0..1 screen UV to texture UV with a "cover" fit (like
  // background-size: cover) so the image is never stretched.
  vec2 coverUVRes(vec2 uv, vec2 imageRes) {
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

  vec2 coverUV(vec2 uv) { return coverUVRes(uv, uImageResolution); }

  // Sample image A / image B at a 0..1 screen UV, cover-fitted.
  vec4 texCover(vec2 uv) {
    return texture2D(uTexture, coverUV(uv));
  }
  vec4 texCoverB(vec2 uv) {
    return texture2D(uTextureB, coverUVRes(uv, uImageResolutionB));
  }

  float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }
`;

const ImageShaderCanvas = ({
  fragmentShader,
  image,
  imageB,
  className,
  dpr = 2,
  controls = false,
}: {
  fragmentShader: string;
  image: string;
  imageB?: string;
  className?: string;
  dpr?: number;
  controls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const animated = createAnimatedTexture(image);
    const isTransition = !!imageB;
    const animatedB = createAnimatedTexture(imageB ?? image);

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2() },
      mouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTexture: { value: animated.texture },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
      uTextureB: { value: animatedB.texture },
      uImageResolutionB: { value: new THREE.Vector2(1, 1) },
      uProgress: { value: 0 },
      uZoom: { value: 1 },
      uHue: { value: 0 },
      uSaturation: { value: 1 },
      uContrast: { value: 1 },
      uBrightness: { value: 1 },
    };
    const params = { speed: 1 };

    const userSrc = fragmentShader
      .replace(/\bvoid\s+main\b/, "void userMain")
      .replace(/\bgl_FragColor\b/g, "fragColor");

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: `${COMMON_GLSL}\n${IMAGE_GLSL}\n${userSrc}\n${WRAPPER_MAIN}`,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);

    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      uniforms.mouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      );
    };
    let hovered = false;
    const onPointerEnter = () => {
      hovered = true;
    };
    const onPointerLeave = () => {
      hovered = false;
      uniforms.mouse.value.set(0.5, 0.5);
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointerleave", onPointerLeave);

    let shaderTime = 0;
    let last = performance.now();
    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      shaderTime += dt * params.speed;
      uniforms.time.value = shaderTime;
      animated.update(shaderTime * 1000);
      const img = animated.texture.image as { width: number; height: number };
      if (img && img.width > 1) {
        uniforms.uImageResolution.value.set(img.width, img.height);
      }
      if (isTransition) {
        animatedB.update(shaderTime * 1000);
        const imgB = animatedB.texture.image as {
          width: number;
          height: number;
        };
        if (imgB && imgB.width > 1) {
          uniforms.uImageResolutionB.value.set(imgB.width, imgB.height);
        }
        const target = hovered ? 1 : 0;
        uniforms.uProgress.value +=
          (target - uniforms.uProgress.value) * Math.min(1, dt * 3.5);
      }
      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.resolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
      render();
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "150px", threshold: 0 },
    );
    intersectionObserver.observe(container);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      render();
    };
    animate();

    let gui: GUI | null = null;
    if (controls) {
      gui = new GUI();
      gui.domElement.style.zIndex = "10000"; // above the z-[9999] modal
      gui.add(params, "speed", 0, 3, 0.01).name("speed");
      gui.add(uniforms.uZoom, "value", 0.2, 3, 0.01).name("zoom");
      gui.add(uniforms.uHue, "value", -Math.PI, Math.PI, 0.01).name("hue");
      gui.add(uniforms.uSaturation, "value", 0, 2, 0.01).name("saturation");
      gui.add(uniforms.uContrast, "value", 0, 2, 0.01).name("contrast");
      gui.add(uniforms.uBrightness, "value", 0, 2, 0.01).name("brightness");
    }

    return () => {
      cancelAnimationFrame(raf);
      gui?.destroy();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
      animated.dispose();
      animatedB.dispose();
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [fragmentShader, image, imageB, dpr, controls]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{ overflow: "hidden" }}
    />
  );
};

export default ImageShaderCanvas;
