"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Model3D } from "@/components/ui/3dmodel";
import { HeroGrid } from "./canvas/hero-grid";
import TextMatrixRain from "registry/new-york/text/text-matrix-rain";
import TextTypewriterGlitch from "registry/new-york/text/text-typewriter-glitch";
import { FaGithub } from "react-icons/fa6";

function DebugOverlay({
  mouse,
  velocity,
  lastVelocity,
  fps,
  ms,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
  velocity: React.RefObject<number>;
  lastVelocity: React.RefObject<number>;
  fps: number;
  ms: number;
}) {
  const arrowX = 32;
  const arrowY = useRef(0);
  useEffect(() => {
    arrowY.current = window.innerHeight - 32;
  }, []);
  const angle =
    Math.atan2(mouse.current.y - arrowY.current, mouse.current.x - arrowX) *
      (180 / Math.PI) +
    90;
  const gx = Math.floor(mouse.current.x / 153.5);
  const gy = Math.floor(mouse.current.y / 153.5);
  return (
    <>
      <div className="absolute sm:top-8 sm:left-8 top-4 left-4 text-xs text-muted-foreground font-mono">
        x:{mouse.current.x}, y:{mouse.current.y}
        <br /> fps: {fps} | ms: {ms}
      </div>
      <div className="absolute sm:bottom-8 sm:right-8 right-4 bottom-4 text-xs text-muted-foreground font-mono">
        cell:{gx},{gy}
      </div>
      <div className="absolute sm:top-8 sm:right-8 right-4 top-4 text-xs text-gray-400 font-mono">
        v:{velocity.current.toFixed(1)} a:
        {velocity.current - lastVelocity.current > 0 ? "↑" : "↓"}
      </div>
      <div className="absolute sm:bottom-8 sm:left-8 left-4 bottom-4 text-xs font-mono text-muted-foreground">
        θ:{angle.toFixed(1)}°
      </div>
    </>
  );
}

export function HeroSection() {
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocity = useRef<number>(0);
  const lastVelocity = useRef<number>(0);
  const [, forceRender] = useState(0);
  const [fps, setFps] = useState<number>(0);
  const [ms, setMs] = useState<number>(0);
  const last = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastFrameTime = useRef<number>(
    typeof performance !== "undefined" ? performance.now() : 0
  );
  const sectionRef = useRef<HTMLElement | null>(null);
  const isActive = useRef<boolean>(true);

  // No longer calculate these on every render; handled in DebugOverlay

  useEffect(() => {
    let raf = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dx = e.clientX - mouse.current.x;
        const dy = e.clientY - mouse.current.y;
        lastVelocity.current = velocity.current;
        velocity.current = Math.hypot(dx, dy);
        mouse.current = { x: e.clientX, y: e.clientY };
        forceRender((v) => v + 1);
      });
    };
    const handleMouseEnter = () => {
      isActive.current = true;
    };
    const handleMouseLeave = () => {
      isActive.current = false;
    };
    const section = sectionRef.current;
    if (section) {
      section.addEventListener("mouseenter", handleMouseEnter);
      section.addEventListener("mouseleave", handleMouseLeave);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (section) {
        section.removeEventListener("mouseenter", handleMouseEnter);
        section.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const measureFrame = () => {
      const currentTime =
        typeof performance !== "undefined" ? performance.now() : 0;
      const deltaTime = currentTime - lastFrameTime.current;
      const currentFps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
      setFps(currentFps);
      setMs(parseFloat(deltaTime.toFixed(1)));
      lastFrameTime.current = currentTime;
      animationFrameId = requestAnimationFrame(measureFrame);
    };
    animationFrameId = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full h-[calc(100vh-100px)] relative  md:overflow-clip overscroll-none flex flex-col items-center justify-center  px-4 sm:px-6 md:px-8"
    >
      <HeroGrid />
      <DebugOverlay
        mouse={mouse}
        velocity={velocity}
        lastVelocity={lastVelocity}
        fps={fps}
        ms={ms}
      />

      <div className="flex flex-col justify-center items-center w-full max-w-[280px] sm:max-w-[350px] md:max-w-[550px] lg:max-w-[750px] xl:max-w-[850px] z-10 relative pointer-events-auto mb-[6vh]">
        <h1 className="text-3xl font-mono  sm:text-4xl md:text-6xl lg:text-8xl   text-center w-full justify-center items-center flex-col flex whitespace-pre leading-tight tracking-tight font-medium">
          <span> Build Stunning </span>
          <span className="flex whitespace-pre">
            <span className="flex  transition-all   duration-200">
              Websites in minutes
            </span>
          </span>
        </h1>
        <div className="text-xs  sm:text-sm md:text-md lg:text-lg xl:text-xl text-center mt-2 sm:mt-3 md:mt-4 px-2 sm:px-4 leading-relaxed">
          A pixel-perfect React component library for{" "}
          <div className=" hidden md:block" />
          <div className="flex items-center">
            modern web apps. And
            <TextTypewriterGlitch className="mx-1  p-0.5 px-1 bg-muted rounded-none ">
              It's also open source.
            </TextTypewriterGlitch>
          </div>
        </div>

        <div className="flex  flex-row flex-wrap  justify-center   gap-3 sm:gap-4 items-center mt-10 w-full ">
          <Link href="/blocks">
            <Button className="rounded-none" size="default">
              Browse Components
            </Button>
          </Link>
          <Link
            target="_blank"
            href={"https://github.com/vansh-nagar/Pixel-Perfect"}
          >
            <Button
              variant={"secondary"}
              className="rounded-none cursor-crosshair"
              size="default"
            >
              Star On Github <FaGithub />
            </Button>
          </Link>
        </div>
      </div>

      <div className=" block opacity-20">
        <Model3D
          path="/model/Untitled-white.glb"
          className=" absolute inset-0 blur-[3px]   "
        />
      </div>
    </section>
  );
}
