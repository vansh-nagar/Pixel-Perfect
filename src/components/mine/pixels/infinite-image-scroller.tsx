"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Simple wheel event normalizer
const normalizeWheel = (event: WheelEvent) => {
  let pixelY = 0;

  if (event.deltaMode === 1) {
    // lines
    pixelY = event.deltaY * 40;
  } else if (event.deltaMode === 2) {
    // pages
    pixelY = event.deltaY * window.innerHeight;
  } else {
    // pixels
    pixelY = event.deltaY;
  }

  return { pixelX: event.deltaX, pixelY };
};

const VERTEX_SHADER = `
varying vec2 vUv;
varying float vDepth;

attribute vec3 aInitialPosition;
attribute float aMeshSpeed;
attribute vec4 aTextureCoords;

uniform float uTime;
uniform vec2 uMaxXdisplacement;
uniform vec2 uDrag;
uniform float uSpeedY;
uniform float uScrollY;

varying float vVisibility;
varying vec4 vTextureCoords;

float remap(float value, float originMin, float originMax) {
    return clamp((value - originMin) / (originMax - originMin), 0., 1.);
}

void main() {
    vec3 newPosition = position + aInitialPosition;

    float maxX = uMaxXdisplacement.x;
    float maxY = uMaxXdisplacement.y;

    float maxYoffset = distance(aInitialPosition.y, maxY);
    float minYoffset = distance(aInitialPosition.y, -maxY);

    float maxXoffset = distance(aInitialPosition.x, maxX);
    float minXoffset = distance(aInitialPosition.x, -maxX);
    
    float xDisplacement = mod(minXoffset - uDrag.x + uTime * aMeshSpeed, maxXoffset + minXoffset) - minXoffset;
    float yDisplacement = mod(minYoffset - uDrag.y, maxYoffset + minYoffset) - minYoffset;

    float maxZ = 12.;
    float minZ = -30.;
    
    float maxZoffset = distance(aInitialPosition.z, maxZ);    
    float minZoffset = distance(aInitialPosition.z, minZ);    
    
    float zDisplacement = mod(uScrollY + minZoffset, maxZoffset + minZoffset) - minZoffset;    
    
    newPosition.x += xDisplacement; 
    newPosition.y += yDisplacement;
    newPosition.z += zDisplacement;

    vVisibility = remap(newPosition.z, minZ, minZ + 5.);

    vec4 modelPosition = modelMatrix * instanceMatrix * vec4(newPosition, 1.0);        
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;    

    vUv = uv;
    vTextureCoords = aTextureCoords;
    vDepth = length(viewPosition.xyz);
}
`;

const FRAGMENT_SHADER = `
varying vec2 vUv;
varying float vVisibility;
varying vec4 vTextureCoords;
varying float vDepth;

uniform sampler2D uWrapperTexture;
uniform sampler2D uAtlas;
uniform sampler2D uBlurryAtlas;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

void main() {            
    float xStart = vTextureCoords.x;
    float xEnd = vTextureCoords.y;
    float yStart = vTextureCoords.z;
    float yEnd = vTextureCoords.w;

    vec2 atlasUV = vec2(
        mix(xStart, xEnd, vUv.x),
        mix(yStart, yEnd, (1. - vUv.y) * 1.5)
    );     

    vec4 color = texture2D(uAtlas, atlasUV);
    vec4 blurryTexel = texture2D(uBlurryAtlas, atlasUV);
    
    // Blend based on distance
    color = mix(color, blurryTexel, 1.0 - vVisibility);

    color.a = max(color.a, vVisibility);
    color.rgb = clamp(color.rgb, 0.0, 1.0);

    // Apply fog
    float fogFactor = smoothstep(fogFar, fogNear, vDepth);
    color.rgb = mix(fogColor, color.rgb, fogFactor);

    gl_FragColor = color;
}
`;

interface ImageInfo {
  width: number;
  height: number;
  aspectRatio: number;
  uvs: {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  };
}

const IMAGE_URLS = [
  "https://cdn.cosmos.so/9beb0a06-e008-4b95-a5b8-15c2d255a4c4?format=jpeg",
  "https://cdn.cosmos.so/6a854a1b-5c06-45b1-b055-4a4652ba4e21?format=jpeg",
  "https://cdn.cosmos.so/3c35a1b1-717b-4219-9282-881a762724f2?format=jpeg",
  "https://cdn.cosmos.so/8a6998b4-fce7-48c4-b40c-9b90bcf0007c?format=jpeg",
  "https://cdn.cosmos.so/f798acc8-6bc8-4f2c-ace2-2440f2be4795?format=jpeg",
  "https://cdn.cosmos.so/39a80b7b-29fb-4079-a251-176df0fa15eb?format=jpeg",
  "https://cdn.cosmos.so/dfa2ba1c-97b6-44ba-a68b-7c619c9d416b?format=jpeg",
  "https://cdn.cosmos.so/97de8d7c-f9c0-4625-838f-3aaf8c286cdb?format=jpeg",
  "https://cdn.cosmos.so/71e10d8f-c92d-4761-96ce-4b6cc9eedcbe?format=jpeg",
  "https://cdn.cosmos.so/0cff1394-f353-4c9e-87f7-37c63d165bf9?format=jpeg",
  "https://cdn.cosmos.so/15a7b84c-ba74-470f-8813-25eb0a0d8ba2?format=jpeg",
  "https://cdn.cosmos.so/242c9ee5-2f96-49a6-8ac7-6058d86cf3b3?format=jpeg",
  "https://cdn.cosmos.so/0cdf2bce-81e3-47d6-b523-b1b6b06215ae?format=jpeg",
  "https://cdn.cosmos.so/b42b471c-e9ac-4b6e-a449-f7a561bab8ad?format=jpeg",
  "https://cdn.cosmos.so/55178a90-415a-4651-881b-6fbe9fb3265c?format=jpeg",
  "https://cdn.cosmos.so/0afc0da6-c103-468a-8bdb-9efbe3f5bd36?format=jpeg",
  "https://cdn.cosmos.so/d9f9e548-5904-472b-ba89-b82cc9ae541a?format=jpeg",
  "https://cdn.cosmos.so/f1e993f4-84b9-429b-8d05-4daf57e1b4ee?format=jpeg",
  "https://cdn.cosmos.so/1ceb880a-e0f5-407c-8b09-5da3fea58685?format=jpeg",
  "https://cdn.cosmos.so/4d36176f-5b42-4b3e-92c0-ff0682b4069b?format=jpeg",
  "https://cdn.cosmos.so/4326e427-15e0-47d5-8ae4-06f96e8e1835?format=jpeg",
  "https://cdn.cosmos.so/705d7f1f-cd88-44be-9dff-6041d5000742?format=jpeg",
];

const createWhiteTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 2, 2);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const InfiniteImageScroller = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const dragRef = useRef({
    xCurrent: 0,
    xTarget: 0,
    yCurrent: 0,
    yTarget: 0,
    isDown: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });
  const scrollYRef = useRef({
    target: 0,
    current: 0,
  });
  const timeRef = useRef(0);
  const imageInfosRef = useRef<ImageInfo[]>([]);
  const planePositionsRef = useRef<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Add exponential fog for far planes
    scene.fog = new THREE.FogExp2(0xffffff, 0.05);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 10;
    scene.add(camera);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setClearColor(0xffffff, 1);
    rendererRef.current = renderer;

    const clock = new THREE.Clock();
    clockRef.current = clock;

    // Calculate sizes
    const getSizes = () => {
      const fov = camera.fov * (Math.PI / 180);
      const height = camera.position.z * Math.tan(fov / 2) * 2;
      const width = height * camera.aspect;
      return { width, height };
    };

    const sizes = getSizes();

    // Setup geometry and material
    const geometry = new THREE.PlaneGeometry(1, 1.69, 1, 1);
    geometry.scale(2, 2, 2);

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uMaxXdisplacement: {
          value: new THREE.Vector2(sizes.width * 2, sizes.height * 2),
        },
        uWrapperTexture: {
          value: createWhiteTexture(),
        },
        uAtlas: new THREE.Uniform(null),
        uBlurryAtlas: new THREE.Uniform(null),
        uScrollY: { value: 0 },
        uSpeedY: { value: 0 },
        uDrag: { value: new THREE.Vector2(0, 0) },
        fogColor: { value: new THREE.Color(0xffffff) },
        fogNear: { value: 0.1 },
        fogFar: { value: 100 },
      },
    });
    materialRef.current = material;

    // Create instanced mesh
    const meshCount = 400; // 400 planes for infinite scrolling
    const mesh = new THREE.InstancedMesh(geometry, material, meshCount);
    scene.add(mesh);
    meshRef.current = mesh;

    // Disable frustum culling - planes move via shader so initial position doesn't matter
    mesh.frustumCulled = false;

    // Initialize planes in grid pattern with depth distribution
    const dummy = new THREE.Object3D();
    const gridSize = Math.ceil(Math.sqrt(meshCount));
    let index = 0;
    planePositionsRef.current = [];

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (index >= meshCount) break;

        // Distribute planes from +50 (in front) to -100 (beh depth
        const zPos = 50 - (index / meshCount) * 150; // Range from 50 to -100

        dummy.position.set(
          (x - gridSize / 2) * 5,
          (y - gridSize / 2) * 5,
          zPos
        );

        // Store original positions for respawning
        planePositionsRef.current.push(
          new THREE.Vector3(dummy.position.x, dummy.position.y, zPos)
        );

        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        index++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Load images and create atlas
    const loadTextureAtlas = async () => {
      const imagePromises = IMAGE_URLS.map(async (url) => {
        try {
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          return bitmap as CanvasImageSource;
        } catch (err) {
          return await new Promise<CanvasImageSource>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = url;
          });
        }
      });

      const images = await Promise.all(imagePromises);

      const atlasWidth = Math.max(
        ...images.map((img: any) => img.width as number)
      );
      let totalHeight = 0;

      images.forEach((img: any) => {
        totalHeight += img.height as number;
      });

      const canvas = document.createElement("canvas");
      canvas.width = atlasWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext("2d")!;

      let currentY = 0;
      imageInfosRef.current = images.map((img: any) => {
        const aspectRatio = (img.width as number) / (img.height as number);
        ctx.drawImage(img as any, 0, currentY);

        const info = {
          width: img.width,
          height: img.height,
          aspectRatio,
          uvs: {
            xStart: 0,
            xEnd: (img.width as number) / atlasWidth,
            yStart: 1 - currentY / totalHeight,
            yEnd: 1 - (currentY + (img.height as number)) / totalHeight,
          },
        };

        currentY += img.height as number;
        return info;
      });

      const atlasTexture = new THREE.Texture(canvas);
      atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
      atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
      atlasTexture.minFilter = THREE.LinearFilter;
      atlasTexture.magFilter = THREE.LinearFilter;
      atlasTexture.needsUpdate = true;
      material.uniforms.uAtlas.value = atlasTexture;

      // Create blurry atlas
      const blurryCanvas = document.createElement("canvas");
      blurryCanvas.width = atlasTexture.image.width;
      blurryCanvas.height = atlasTexture.image.height;
      const blurCtx = blurryCanvas.getContext("2d")!;
      blurCtx.filter = "blur(100px)";
      blurCtx.drawImage(atlasTexture.image, 0, 0);
      const blurryTexture = new THREE.Texture(blurryCanvas);
      blurryTexture.wrapS = THREE.ClampToEdgeWrapping;
      blurryTexture.wrapT = THREE.ClampToEdgeWrapping;
      blurryTexture.minFilter = THREE.LinearFilter;
      blurryTexture.magFilter = THREE.LinearFilter;
      blurryTexture.needsUpdate = true;
      material.uniforms.uBlurryAtlas.value = blurryTexture;

      fillMeshData();
    };

    const fillMeshData = () => {
      const initialPosition = new Float32Array(meshCount * 3);
      const meshSpeed = new Float32Array(meshCount);
      const aTextureCoords = new Float32Array(meshCount * 4);

      for (let i = 0; i < meshCount; i++) {
        initialPosition[i * 3 + 0] = (Math.random() - 0.5) * sizes.width * 4;
        initialPosition[i * 3 + 1] = (Math.random() - 0.5) * sizes.height * 4;
        initialPosition[i * 3 + 2] = Math.random() * (7 - -30) - 30;

        meshSpeed[i] = Math.random() * 0.5 + 0.5;

        const imageIndex = i % imageInfosRef.current.length;
        aTextureCoords[i * 4 + 0] =
          imageInfosRef.current[imageIndex].uvs.xStart;
        aTextureCoords[i * 4 + 1] = imageInfosRef.current[imageIndex].uvs.xEnd;
        aTextureCoords[i * 4 + 2] =
          imageInfosRef.current[imageIndex].uvs.yStart;
        aTextureCoords[i * 4 + 3] = imageInfosRef.current[imageIndex].uvs.yEnd;
      }

      geometry.setAttribute(
        "aInitialPosition",
        new THREE.InstancedBufferAttribute(initialPosition, 3)
      );
      geometry.setAttribute(
        "aMeshSpeed",
        new THREE.InstancedBufferAttribute(meshSpeed, 1)
      );
      geometry.setAttribute(
        "aTextureCoords",
        new THREE.InstancedBufferAttribute(aTextureCoords, 4)
      );
    };

    // Drag interaction
    const onPointerDown = (e: PointerEvent) => {
      dragRef.current.isDown = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.isDown) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;

      const worldPerPixelX = (sizes.width / window.innerWidth) * 1;
      const worldPerPixelY = (sizes.height / window.innerHeight) * 1;

      dragRef.current.xTarget += -dx * worldPerPixelX;
      dragRef.current.yTarget += dy * worldPerPixelY;
    };

    const onPointerUp = (e: PointerEvent) => {
      dragRef.current.isDown = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onWheel = (event: WheelEvent) => {
      const normalizedWheel = normalizeWheel(event);
      const scrollY =
        (normalizedWheel.pixelY * sizes.height) / window.innerHeight;
      scrollYRef.current.target += scrollY;
      material.uniforms.uSpeedY.value += scrollY;
    };

    const onResize = () => {
      const newSizes = getSizes();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uMaxXdisplacement.value.set(
        newSizes.width * 2,
        newSizes.height * 2
      );
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("wheel", onWheel);
    window.addEventListener("resize", onResize);

    // Load textures
    loadTextureAtlas();

    // Animation loop
    const render = () => {
      const now = clock.getElapsedTime();
      const delta = now - timeRef.current;
      timeRef.current = now;

      material.uniforms.uTime.value += delta * 0.015;

      dragRef.current.xCurrent +=
        (dragRef.current.xTarget - dragRef.current.xCurrent) * 0.1;
      dragRef.current.yCurrent +=
        (dragRef.current.yTarget - dragRef.current.yCurrent) * 0.1;

      material.uniforms.uDrag.value.set(
        dragRef.current.xCurrent,
        dragRef.current.yCurrent
      );

      scrollYRef.current.current +=
        (scrollYRef.current.target - scrollYRef.current.current) * 0.12;
      material.uniforms.uScrollY.value = scrollYRef.current.current;
      material.uniforms.uSpeedY.value *= 0.835;

      // Respawn planes that pass the camera or are too far away
      const passedCameraZ = 12; // Planes that go past camera (camera is at z=10)
      const tooFarZ = -200; // Planes that are very far back
      const dummy = new THREE.Object3D();

      if (meshRef.current && planePositionsRef.current.length > 0) {
        for (let i = 0; i < meshCount; i++) {
          const planePos = planePositionsRef.current[i];

          // Only respawn if plane passed camera (z > passedCameraZ) or is too far (z < tooFarZ)
          if (planePos.z > passedCameraZ || planePos.z < tooFarZ) {
            // Reset to original position in front of camera
            dummy.position.copy(planePos);
            dummy.position.z = 50; // Respawn in front of camera

            // Update stored position
            planePositionsRef.current[i].z = 50;

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
          }
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className=" absolute inset-0"
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
};

export default InfiniteImageScroller;
