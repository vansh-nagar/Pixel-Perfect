"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CommandPalette } from "@/components/ui/command-palette";
import { FlaskConical, GithubIcon, Star } from "lucide-react";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import { StarsCount } from "@/components/mine/landing-page/stars-count";

export function Navbar({ className = "" }: { className?: string }) {
  return (
    <header
      className={` font-pixelify      w-full   flex items-center justify-between  z-50   h-12     ${className}`}
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
            className="border-dashed rounded-none"
            aria-label="GitHub"
          >
            <GithubIcon />
            <StarsCount />
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

        <LightDarkMode />
      </div>
    </header>
  );
}
