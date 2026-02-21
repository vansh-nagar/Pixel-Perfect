"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, FlaskConical, GithubIcon, Rainbow } from "lucide-react";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import { StarsCount } from "@/components/mine/landing-page/stars-count";
import { ShaderAnimation } from "@/components/shader-animation";

export function Navbar({ className = "" }: { className?: string }) {
  return (
    <header
      className={` font-pixelify w-full flex items-center justify-between  z-50 h-12 ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div className=" flex">
        <Link href={"/"} className=" flex items-center gap-2 -ml-1">
          <div className="text-3xl font-pixelify  font-medium flex items-center">
            <Image
              src="/logo/static/logo.svg"
              alt="Pixel Perfect Logo"
              width={50}
              height={50}
              className="w-12 sm:w-8 aspect-square dark:invert -mr-1"
            />
            <span className="hidden sm:inline">ixel Perfect</span>
          </div>
        </Link>{" "}
      </div>
      <div className="flex items-center gap-2">
        <Link href={"https://github.com/vansh-nagar/Pixel-Perfect"}>
          <Button
            variant="outline"
            className="border-dashed rounded-none relative overflow-hidden group animate-rainbow bg-[linear-gradient(45deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] active:scale-[0.95]  group"
            aria-label="GitHub"
          >
            <div className="z-0 absolute inset-[1.5px] bg-black/95 group-hover:bg-black/40  backdrop-blur-lg transition-all saturate-200" />
            <span className="z-10 text-foreground pointer-events-none flex gap-2 justify-center items-center">
              <GithubIcon className="text-white" />
              <StarsCount />
            </span>
          </Button>
        </Link>
        <Link href={"/playground"}>
          <Button
            variant={"outline"}
            className="border-dashed rounded-none"
            size={"icon"}
          >
            <FlaskConical />
          </Button>
        </Link>
        <Link href={"/tutorial"}>
          <Button
            variant={"outline"}
            className="border-dashed rounded-none"
            size={"icon"}
          >
            <BookOpen />
          </Button>
        </Link>

        <LightDarkMode />
      </div>
    </header>
  );
}
