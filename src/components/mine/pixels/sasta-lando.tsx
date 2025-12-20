"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const SastaLando = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const isMovingRef = useRef(false);

  const vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fluidFragmentShader = `
    uniform sampler2D uPrevTrails;
    uniform vec2 uMouse;
    uniform vec2 uPrevMouse;
    uniform vec2 uResolution;
    uniform float uDecay;
    uniform bool uIsMoving;

    varying vec2 vUv;

    void main() {
      vec4 prevState = texture2D(uPrevTrails, vUv);
      float newValue = prevState.r * uDecay;

      if (uIsMoving) {
        vec2 mouseDirection = uMouse - uPrevMouse;
        float lineLength = length(mouseDirection);

        if (lineLength > 0.001) {
          vec2 mouseDir = mouseDirection / lineLength;

          vec2 toPixel = vUv - uPrevMouse;
          float projAlong = dot(toPixel, mouseDir);
          projAlong = clamp(projAlong, 0.0, lineLength);

          vec2 closestPoint = uPrevMouse + projAlong * mouseDir;
          float dist = length(vUv - closestPoint);

          float lineWidth = 0.07;
          float intensity = smoothstep(lineWidth, 0.0, dist) * 0.5;

          newValue += intensity;
        }
      }

      gl_FragColor = vec4(newValue, 0.0, 0.0, 1.0);
    }
  `;

  const displayFragmentShader = `
    uniform sampler2D uFluid;
    uniform sampler2D uTopTexture;
    uniform sampler2D uBottomTexture;
    uniform vec2 uResolution;
    uniform float uDpr;
    uniform vec2 uTopTextureSize;
    uniform vec2 uBottomTextureSize;

    varying vec2 vUv;

    vec2 getCoverUv(vec2 uv, vec2 textureSize, vec2 resolution) {
      float textureAspect = textureSize.x / textureSize.y;
      float screenAspect = resolution.x / resolution.y;
      
      vec2 coverUv = uv;
      
      if (textureAspect > screenAspect) {
        float scale = screenAspect / textureAspect;
        coverUv.y = (uv.y - 0.5) / scale + 0.5;
      } else {
        float scale = textureAspect / screenAspect;
        coverUv.x = (uv.x - 0.5) / scale + 0.5;
      }
      
      return coverUv;
    }

    void main() {
      vec4 fluid = texture2D(uFluid, vUv);
      float fluidAmount = fluid.r;

      vec2 topUv = getCoverUv(vUv, uTopTextureSize, uResolution);
      vec2 bottomUv = getCoverUv(vUv, uBottomTextureSize, uResolution);
      
      vec4 topImageColor = texture2D(uTopTexture, topUv);
      vec4 bottomImageColor = texture2D(uBottomTexture, bottomUv);

      vec4 finalColor;
      if (fluidAmount > 0.01) {
        finalColor = bottomImageColor;
      } else {
        finalColor = topImageColor;
      }

      gl_FragColor = finalColor;
    }
  `;

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      precision: "highp",
    });

    const parent = canvasRef.current.parentElement;
    const width = parent?.clientWidth || window.innerWidth;
    const height = parent?.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const mouse = new THREE.Vector2(0.5, 0.5);
    const prevMouse = new THREE.Vector2(0.5, 0.5);
    let isMoving = false;
    let lastMoveTime = 0;
    let mouseInCanvas = false;

    const size = 500;
    const pingPongTargets = [
      new THREE.WebGLRenderTarget(size, size, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      }),
      new THREE.WebGLRenderTarget(size, size, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      }),
    ];

    let currentTarget = 0;

    const topTexture = createPlaceholderTexture("#0000ff");
    const bottomTexture = createPlaceholderTexture("#ff0000");

    const topTextureSize = new THREE.Vector2(1, 1);
    const bottomTextureSize = new THREE.Vector2(1, 1);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fluidFragmentShader,
      uniforms: {
        uPrevTrails: { value: new THREE.Texture() },
        uMouse: { value: mouse },
        uPrevMouse: { value: prevMouse },
        uResolution: { value: new THREE.Vector2(size, size) },
        uDecay: { value: 0.97 },
        uIsMoving: { value: false },
      },
    });

    const trailsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPrevTrails: { value: null },
        uMouse: { value: mouse },
        uPrevMouse: { value: prevMouse },
        uResolution: { value: new THREE.Vector2(size, size) },
        uDecay: { value: 0.97 },
        uIsMoving: { value: false },
      },
      vertexShader,
      fragmentShader: fluidFragmentShader,
    });

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uFluid: { value: null },
        uTopTexture: { value: topTexture },
        uBottomTexture: { value: bottomTexture },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uDpr: { value: window.devicePixelRatio },
        uTopTextureSize: { value: topTextureSize },
        uBottomTextureSize: { value: bottomTextureSize },
      },
      vertexShader,
      fragmentShader: displayFragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    loadImage(
      "https://cdn.cosmos.so/ad0d7459-9e2e-4a31-9f70-db9b76d13792?format=jpeg",
      topTexture,
      topTextureSize,
      displayMaterial,
      true
    );
    loadImage(
      "https://cdn.cosmos.so/986835b0-8971-40aa-a8d0-9cc8d7ea42af?format=jpeg",
      bottomTexture,
      bottomTextureSize,
      displayMaterial,
      false
    );

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const displayMesh = new THREE.Mesh(planeGeometry, displayMaterial);
    scene.add(displayMesh);

    const simMesh = new THREE.Mesh(planeGeometry, trailsMaterial);
    const simScene = new THREE.Scene();
    simScene.add(simMesh);

    renderer.setRenderTarget(pingPongTargets[0]);
    renderer.clear();
    renderer.setRenderTarget(pingPongTargets[1]);
    renderer.clear();
    renderer.setRenderTarget(null);

    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();

      if (
        canvasRect &&
        e.clientX >= canvasRect.left &&
        e.clientX <= canvasRect.right &&
        e.clientY >= canvasRect.top &&
        e.clientY <= canvasRect.bottom
      ) {
        prevMouse.copy(mouse);

        mouse.x = (e.clientX - canvasRect.left) / canvasRect.width;
        mouse.y = 1 - (e.clientY - canvasRect.top) / canvasRect.height;

        isMoving = true;
        lastMoveTime = performance.now();
      } else {
        isMoving = false;
      }
    };

    function onTouchMove(event: TouchEvent) {
      if (event.touches.length > 0) {
        event.preventDefault();

        const canvasRect = canvasRef.current?.getBoundingClientRect();
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;

        if (
          canvasRect &&
          touchX >= canvasRect.left &&
          touchX <= canvasRect.right &&
          touchY >= canvasRect.top &&
          touchY <= canvasRect.bottom
        ) {
          prevMouse.copy(mouse);

          mouse.x = (touchX - canvasRect.left) / canvasRect.width;
          mouse.y = 1 - (touchY - canvasRect.top) / canvasRect.height;

          isMoving = true;
          lastMoveTime = performance.now();
        } else {
          isMoving = false;
        }
      }
    }

    const handleMouseLeave = () => {
      isMovingRef.current = false;
      if (material.uniforms) {
        material.uniforms.uIsMoving.value = false;
      }
    };

    function onWindowResize() {
      const parent = canvasRef.current?.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;

      renderer.setSize(width, height);

      displayMaterial.uniforms.uResolution.value.set(width, height);
      displayMaterial.uniforms.uDpr.value = window.devicePixelRatio;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("resize", onWindowResize);

    function animate() {
      requestAnimationFrame(animate);

      if (isMoving && performance.now() - lastMoveTime > 50) {
        isMoving = false;
      }

      const prevTarget = pingPongTargets[currentTarget];
      currentTarget = (currentTarget + 1) % 2;
      const currentRenderTarget = pingPongTargets[currentTarget];

      trailsMaterial.uniforms.uPrevTrails.value = prevTarget.texture;
      trailsMaterial.uniforms.uMouse.value.copy(mouse);
      trailsMaterial.uniforms.uPrevMouse.value.copy(prevMouse);
      trailsMaterial.uniforms.uIsMoving.value = isMoving;

      renderer.setRenderTarget(currentRenderTarget);
      renderer.render(simScene, camera);

      displayMaterial.uniforms.uFluid.value = currentRenderTarget.texture;

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onWindowResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const createPlaceholderTexture = (color: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 512, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  // Load image with callback for texture and size
  const loadImage = (
    url: string,
    texture: THREE.Texture,
    size: THREE.Vector2,
    displayMaterial: THREE.ShaderMaterial,
    isTop: boolean
  ) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fixedWidth = 512;
      const aspectRatio = img.width / img.height;
      const fixedHeight = Math.floor(fixedWidth / aspectRatio);

      size.set(fixedWidth, fixedHeight);

      const canvas = document.createElement("canvas");
      canvas.width = fixedWidth;
      canvas.height = fixedHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, fixedWidth, fixedHeight);
      }

      const newTexture = new THREE.CanvasTexture(canvas);
      newTexture.minFilter = THREE.LinearFilter;
      newTexture.magFilter = THREE.LinearFilter;

      if (isTop) {
        displayMaterial.uniforms.uTopTexture.value = newTexture;
      } else {
        displayMaterial.uniforms.uBottomTexture.value = newTexture;
      }
    };

    img.src = url;
  };

  return (
    <div className="w-full  overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default SastaLando;
