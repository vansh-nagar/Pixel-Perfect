"use client";

import { Button } from "@/components/ui/button";
import { GithubIcon, LucideGithub } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import StarBorder from "./star-border";
import { StarsCount } from "./stars-count";
import SectionChrome from "./section-chrome";
import { Wordmark3D } from "./wordmark-3d/wordmark-3d";

export function Footer() {
  return (
    <>
      <SectionChrome label="FOOTER" />
      <div className="w-full grid grid-cols-1 sm:grid-cols-[auto_1fr]">
        <div className="border-r  border-muted grid grid-rows-[auto_auto]">
          <div className="p-3 relative overflow-hidden">
            <StarBorder />
            <div className="text-3xl -ml-1 font-pixelify flex items-center">
              <Image
                src="/logo/static/logo.svg"
                alt="Pixel Perfect Logo"
                width={50}
                height={50}
                className="w-12 sm:w-8 aspect-square dark:invert -mr-1"
              />
              <span className="hidden sm:inline">ixel Perfect</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="text-xs text-muted-foreground">
                Build beautiful, responsive interfaces in minutes. <br /> A
                pixel-perfect React component library for modern web apps.
              </div>{" "}
            </div>
          </div>
          <div className=" border-t border-b border-muted  relative overflow-hidden flex flex-col p-3 gap-2">
            <StarBorder />
            <div className="text-xs text-foreground flex gap-1">
              STAR ON GITHUB [<StarsCount />]
            </div>
            <Link href={"https://github.com/vansh-nagar/Pixel-Perfect"}>
              <Button
                variant="outline"
                className="border-dashed rounded-none w-full"
                aria-label="GitHub"
              >
                <GithubIcon />
                <StarsCount />
              </Button>
            </Link>
          </div>
        </div>

        <div className=" border-b border-r border-muted  overflow-hidden relative flex justify-center items-center text-muted p-6 max-sm:p-3">
          <StarBorder />
          <Wordmark3D className="w-full" />
        </div>
      </div>
    </>
  );
}
