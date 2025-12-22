"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

import { Model3D } from "@/components/ui/3dmodel";
import { HeroGrid } from "./canvas/hero-grid";

export function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [lastVelocity, setLastVelocity] = useState(0);
  const [fps, setFps] = useState(0);
  const [ms, setMs] = useState(0);
  const last = useRef({ x: 0, y: 0 });
  const lastFrameTime = useRef(performance.now());

  // Arrow is at bottom-left corner, calculate angle from arrow to mouse
  const arrowX = 32;
  const arrowY = typeof window !== "undefined" ? window.innerHeight - 32 : 0;
  const angle =
    Math.atan2(mousePos.y - arrowY, mousePos.x - arrowX) * (180 / Math.PI) + 90;

  const gx = Math.floor(mousePos.x / 153.5);
  const gy = Math.floor(mousePos.y / 153.5);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      const currentVelocity = parseFloat(Math.hypot(dx, dy).toFixed(1));
      setLastVelocity(velocity);
      setVelocity(currentVelocity);
      last.current = { x: e.clientX, y: e.clientY };
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [velocity]);

  const showIntersection = scrollY < 10;

  useEffect(() => {
    let animationFrameId: number;
    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastFrameTime.current;
      const currentFps = Math.round(1000 / deltaTime);
      setFps(currentFps);
      setMs(parseFloat(deltaTime.toFixed(1)));
      lastFrameTime.current = currentTime;
      animationFrameId = requestAnimationFrame(measureFrame);
    };
    animationFrameId = requestAnimationFrame(measureFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <section className="w-full h-[calc(100vh-100px)] cursor-crosshair  relative  md:overflow-clip overscroll-none flex flex-col items-center justify-center  px-4 sm:px-6 md:px-8">
      <HeroGrid />
      <>
        <div className="absolute top-8 left-8 text-xs text-muted-foreground font-mono">
          x:{mousePos.x}, y:{mousePos.y}
          <br /> fps: {fps} | ms: {ms}
        </div>
        <div className="absolute bottom-8 right-8 text-xs text-muted-foreground font-mono">
          {" "}
          cell:{gx},{gy}
        </div>
        <div className="absolute top-8 right-8 text-xs text-gray-400 font-mono">
          v:{velocity} a:{velocity - lastVelocity > 0 ? "↑" : "↓"}
        </div>
        <div className="absolute bottom-8 left-8 text-xs font-mono text-muted-foreground">
          θ:{angle.toFixed(1)}°
        </div>

        <div
          className="absolute h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none w-full transition-opacity duration-200"
          style={{
            top: `${mousePos.y - 72}px`,
            opacity: showIntersection ? 1 : 0,
          }}
        />
        <div
          className="absolute left-0 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none h-full transition-opacity duration-200"
          style={{
            left: `${mousePos.x - 77}px`,
            opacity: showIntersection ? 1 : 0,
          }}
        />
      </>

      <div className="flex flex-col justify-center items-center w-full max-w-[280px] sm:max-w-[350px] md:max-w-[550px] lg:max-w-[750px] xl:max-w-[850px] z-10 relative pointer-events-auto mb-[6vh]">
        <h1 className="text-3xl font-mono  sm:text-4xl md:text-6xl lg:text-7xl   text-center w-full justify-center items-center flex-col flex whitespace-pre leading-tight tracking-tight font-medium">
          <span> Build Stunning </span>
          <span className="flex whitespace-pre">
            <span className="flex  transition-all   duration-200">
              Websites in minutes
            </span>
          </span>
        </h1>
        <p className="text-xs  sm:text-sm md:text-md lg:text-lg text-center mt-2 sm:mt-3 md:mt-4 px-2 sm:px-4 leading-relaxed">
          A pixel-perfect React component library for{" "}
          <br className=" hidden md:block" />
          modern web apps. And
          <span className="mx-1  p-0.5 px-1 bg-muted rounded-none ">
            It's also open source.
          </span>
        </p>

        <div className="flex  flex-row flex-wrap  justify-center   gap-3 sm:gap-4 items-center mt-10 w-full ">
          <Link href="/blocks">
            <Button className="  cursor-crosshair rounded-none" size="default">
              Browse Components
            </Button>
          </Link>
          <Link href={"https://github.com/vansh-nagar/Pixel-Perfect"}>
            <Button
              variant={"secondary"}
              className="rounded-none cursor-crosshair"
              size="default"
            >
              Custom Components
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
      {/* <InfiniteImageScroller /> */}
    </section>
  );
}
