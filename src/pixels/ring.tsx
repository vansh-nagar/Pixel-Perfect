"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

interface WheelScroll {
  target: number;
  current: number;
  delta: number;
}

const Ring = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ringsRef = useRef<THREE.Group[]>([]);
  const linesRef = useRef<THREE.Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  gsap.registerPlugin(ScrollTrigger);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 16);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0c0c0c, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const circleCount = 2;
    const circleImgCountUnit = 12;
    const sumFormula = (n: number) => (n * (n + 1)) / 2;
    const totalCount = circleImgCountUnit * sumFormula(circleCount);
    const isOdd = (n: number) => n % 2 === 1;

    let loadedCount = 0;
    const textures: THREE.Texture[] = [];

    const loadTextures = () => {
      for (let i = 1; i <= totalCount; i++) {
        textureLoader.load(
          `https://picsum.photos/id/${i}/320/400`,
          (texture) => {
            textures.push(texture);
            loadedCount++;

            if (loadedCount === totalCount) {
              createScene();
            }
          },
          undefined,
          () => {
            // Fallback: create placeholder texture
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 400;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
            ctx.fillRect(0, 0, 320, 400);
            const texture = new THREE.CanvasTexture(canvas);
            textures.push(texture);
            loadedCount++;

            if (loadedCount === totalCount) {
              createScene();
            }
          }
        );
      }
    };

    const createScene = () => {
      const material = new THREE.MeshBasicMaterial();
      const r = 6.4;
      const scale = 0.8;
      const rings: THREE.Group[] = [];
      const lines: THREE.Group[] = [];
      ringsRef.current = rings;
      linesRef.current = lines;

      for (let i = 0; i < circleCount; i++) {
        const c1 = sumFormula(i) * circleImgCountUnit;
        const c2 = sumFormula(i + 1) * circleImgCountUnit;
        const ringTextures = textures.slice(c1, c2);

        const ring = new THREE.Group();
        scene.add(ring);
        rings.push(ring);

        ringTextures.forEach((tex, j) => {
          const line = new THREE.Group();
          ring.add(line);
          lines.push(line);

          const imgScale = 0.005 * scale * (i * 0.36 + 1);
          const width = 320 * imgScale;
          const height = 400 * imgScale;

          const geometry = new THREE.PlaneGeometry(width, height);
          const mat = material.clone();
          mat.map = tex;
          mat.needsUpdate = true;

          const mesh = new THREE.Mesh(geometry, mat);
          const r2 = r * (i + 1);
          const ratio = j / ringTextures.length;
          const angle = ratio * Math.PI * 2;

          mesh.position.x = r2;
          mesh.rotation.z = -Math.PI / 2;
          line.rotation.z = angle;
          line.add(mesh);
        });
      }

      const params = {
        transitionProgress: 0,
        enterProgress: 1,
        rotateSpeed: 1,
      };

      const wheelScroll: WheelScroll = {
        target: 0,
        current: 0,
        delta: 0,
      };

      // Wheel scroll listener
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        wheelScroll.target += e.deltaY * 0.01;
      };

      window.addEventListener("wheel", handleWheel, { passive: false });

      // Drag listener
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;

      const handlePointerDown = (e: PointerEvent) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        wheelScroll.target -= (deltaX || deltaY) * 2;
        lastX = e.clientX;
        lastY = e.clientY;
      };

      const handlePointerUp = () => {
        isDragging = false;
      };

      window.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      // Animation loop
      const clock = new THREE.Clock();

      const animate = () => {
        requestAnimationFrame(animate);

        // Sync scroll
        wheelScroll.delta = wheelScroll.target - wheelScroll.current;
        wheelScroll.current += wheelScroll.delta * 0.1;

        // Update rings
        rings.forEach((ring, i) => {
          ring.rotation.z +=
            0.0025 *
            (isOdd(i) ? -1 : 1) *
            (1 + wheelScroll.delta) *
            params.rotateSpeed;
        });

        // Update lines depth
        lines.forEach((line) => {
          const depthValue = Math.min(Math.max(wheelScroll.delta / 1000, 0), 1);
          line.position.z =
            -THREE.MathUtils.lerp(0, 100, depthValue) +
            THREE.MathUtils.lerp(10, 0, params.enterProgress);
        });

        renderer.render(scene, camera);
      };

      animate();

      // Handle window resize
      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener("resize", handleResize);

      // Set hero visible immediately
      document.querySelector(".hero-dom")?.classList.add("visible");

      // Scroll animation - converge images to center and fade
      gsap.to(ringsRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "bottom center",
          scrub: 1,
          markers: false,
        },
        scale: 0.1,
        opacity: 0,
        duration: 1,
      });

      // Fade hero text on scroll
      gsap.to(".hero-dom", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "bottom center",
          scrub: 1,
        },
        opacity: 0,
      });

      // Cleanup
      return () => {
        window.removeEventListener("wheel", handleWheel);
        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("resize", handleResize);
        renderer.dispose();
      };
    };

    loadTextures();

    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default Ring;
