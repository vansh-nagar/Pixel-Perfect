"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

import LogoCloud from "@/components/ui/logo-cloud";
import { Model3D } from "@/components/ui/3dmodel";

export function HeroSection() {
  return (
    <section className="w-full h-[calc(100vh-72px)] border-dashed border relative  overflow-hidden  md:overflow-clip overscroll-none flex flex-col items-center justify-end  relative px-4 sm:px-6 md:px-8  rounded-xl">
      <div className="flex flex-col justify-center items-center w-full max-w-[280px] sm:max-w-[350px] md:max-w-[550px] lg:max-w-[750px] xl:max-w-[850px] z-10 relative pointer-events-auto mb-[6vh]">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl   text-center w-full justify-center items-center flex-col flex whitespace-pre leading-tight tracking-tight font-medium">
          <span> Build Stunning </span>
          <span className="flex whitespace-pre">
            <span className="flex  transition-all   duration-200">
              Websites in minutes
            </span>
          </span>
        </h1>
        <p className="text-xs  sm:text-sm md:text-md lg:text-lg text-center mt-2 sm:mt-3 md:mt-4 px-2 sm:px-4 leading-relaxed">
          Build beautiful, responsive interfaces in minutes. A pixel-perfect
          <br className=" hidden md:block" />
          React component library for modern web apps.
        </p>

        <div className="flex  flex-row flex-wrap  justify-center   gap-3 sm:gap-4 items-center mt-10 w-full ">
          <Link href="/docs">
            <Button className=" rounded-md" size="default">
              Browse Components
            </Button>
          </Link>
          <Link href={"https://github.com/Nexvyn/pixel-perfect"}>
            <Button variant={"secondary"} size="default">
              Custom Components
            </Button>
          </Link>
        </div>
        <LogoCloud />
      </div>
      <div className="dark:block hidden opacity-30">
        <Model3D
          path="/model/Untitled.glb"
          className=" absolute inset-0  blur-[3px]  "
        />
      </div>
      <div className="dark:hidden block opacity-20">
        <Model3D
          path="/model/Untitled-white.glb"
          className=" absolute inset-0 blur-[3px]   "
        />
      </div>
      {/* <InfiniteImageScroller /> */}
    </section>
  );
}
