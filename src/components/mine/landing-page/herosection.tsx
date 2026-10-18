"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { HeroGrid } from "./canvas/hero-grid";
import TextTypewriterGlitch from "registry/new-york/text/text-typewriter-glitch";
import { FaGithub } from "react-icons/fa6";
import dynamic from "next/dynamic";

const Model3D = dynamic(
  () => import("@/components/ui/3dmodel").then((m) => m.Model3D),
  { ssr: false },
);

function DebugOverlay({
  sectionRef,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const [pointer, setPointer] = useState({ x: 0, y: 0, v: 0, lastV: 0 });
  const [arrowY, setArrowY] = useState(0);
  const [fps, setFps] = useState<number>(0);
  const [ms, setMs] = useState<number>(0);
  const lastFrameTime = useRef<number>(0);
  const isActive = useRef<boolean>(true);
  const arrowX = 32;

  useEffect(() => {
    const id = requestAnimationFrame(() => setArrowY(window.innerHeight - 32));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setPointer((prev) => ({
          x: e.clientX,
          y: e.clientY,
          v: Math.hypot(e.clientX - prev.x, e.clientY - prev.y),
          lastV: prev.v,
        }));
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
  }, [sectionRef]);

  useEffect(() => {
    let animationFrameId: number;
    const measureFrame = () => {
      const currentTime =
        typeof performance !== "undefined" ? performance.now() : 0;
      if (lastFrameTime.current === 0) {
        lastFrameTime.current = currentTime;
        animationFrameId = requestAnimationFrame(measureFrame);
        return;
      }
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

  const angle =
    Math.atan2(pointer.y - arrowY, pointer.x - arrowX) * (180 / Math.PI) + 90;
  const gx = Math.floor(pointer.x / 153.5);
  const gy = Math.floor(pointer.y / 153.5);
  return (
    <>
      <div className="absolute sm:top-8 sm:left-8 top-4 left-4 text-xs text-muted-foreground font-mono">
        x:{pointer.x}, y:{pointer.y}
        <br /> fps: {fps} | ms: {ms}
      </div>
      <div className="absolute sm:bottom-8 sm:right-8 right-4 bottom-4 text-xs text-muted-foreground font-mono">
        cell:{gx},{gy}
      </div>
      <div className="absolute sm:top-8 sm:right-8 right-4 top-4 text-xs text-gray-400 font-mono">
        v:{pointer.v.toFixed(1)} a:
        {pointer.v - pointer.lastV > 0 ? "↑" : "↓"}
      </div>
      <div className="absolute sm:bottom-8 sm:left-8 left-4 bottom-4 text-xs font-mono text-muted-foreground">
        θ:{angle.toFixed(1)}°
      </div>
    </>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-[560px] h-[calc(100svh-100px)] relative overflow-clip overscroll-none flex flex-col items-center justify-center  px-4 sm:px-6 md:px-8"
    >
      <HeroGrid />
      <DebugOverlay sectionRef={sectionRef} />

      <div className="flex flex-col justify-center items-center w-full max-w-[1100px] z-10 relative pointer-events-auto mb-[6vh]">
        <h1 style={{ fontSize: "clamp(1.35rem, 4.8vw, 5rem)" }} className="font-mono text-center w-full flex flex-col items-center leading-[1.15] tracking-tight font-medium">
          <span>Build Stunning</span>
          <span className="flex whitespace-pre">
            <span className="flex  transition-all   duration-200">
              Websites in minutes
            </span>
          </span>
        </h1>
        <div className="text-sm md:text-base lg:text-lg text-muted-foreground text-center mt-5 sm:mt-6 px-2 sm:px-4 leading-relaxed max-w-xl">
          A pixel-perfect React component library for{" "}
          <div className=" hidden md:block" />
          <div className="flex flex-wrap justify-center items-center gap-y-1">
            modern web apps. And
            <TextTypewriterGlitch className="mx-1  p-0.5 px-1 bg-muted rounded-none ">
              It&apos;s also open source.
            </TextTypewriterGlitch>
          </div>
        </div>

        <div className="flex  flex-row flex-wrap  justify-center   gap-3 sm:gap-4 items-center mt-10 w-full ">
          <Button asChild className="rounded-none h-10 px-5" size="default">
            <Link href="/blocks">Browse Components</Link>
          </Button>
          <Button
            asChild
            variant={"secondary"}
            className="rounded-none h-10 px-5 cursor-crosshair"
            size="default"
          >
            <Link
              target="_blank"
              href={"https://github.com/vansh-nagar/Pixel-Perfect"}
            >
              Star On Github <FaGithub />
            </Link>
          </Button>
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
