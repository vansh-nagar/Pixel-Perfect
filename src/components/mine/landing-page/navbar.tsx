"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CommandPalette } from "@/components/ui/command-palette";
import { FlaskConical, GithubIcon } from "lucide-react";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import { StarsCount } from "@/components/mine/stars-count";

export function Navbar() {
  return (
    <header
      className=" font-pixelify      w-full  sm:p-2 flex items-center justify-between z-50   h-12     "
      style={{
        transformStyle: "preserve-3d",
      }}
    >
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
      </Link>

      <div className="hidden md:flex gap-1">
        <Button variant={"ghost"}>Docs</Button>
        <Button variant={"ghost"}>Components</Button>
        <Button variant={"ghost"}>Blocks</Button>
        <div className="hidden lg:block  ml-2">
          <CommandPalette />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={"https://github.com/vansh-nagar/Pixel-Perfect"}>
          <Button variant="ghost" aria-label="GitHub">
            <GithubIcon />
            <StarsCount />
          </Button>
        </Link>
        <Link href={"/playground"}>
          <Button variant={"ghost"} size={"icon"}>
            <FlaskConical />
          </Button>
        </Link>

        <LightDarkMode />
      </div>
    </header>
  );
}
