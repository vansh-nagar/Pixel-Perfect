"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GithubIcon, LucideGithub, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaDiscord, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import StarBorder from "./star-border";
import { StarsCount } from "./stars-count";
import { LightDarkMode } from "@/components/ui/light-dark-mode";

const socialLinks = [
  {
    icon: LucideGithub,
    label: "GitHub",
    href: "#",
  },
  {
    icon: FaXTwitter,
    label: "Twitter",
    href: "#",
  },
  {
    icon: FaLinkedinIn,
    label: "LinkedIn",
    href: "#",
  },
  {
    icon: FaDiscord,
    label: "Discord",
    href: "#",
  },
];

export function Footer() {
  return (
    <>
      <footer className="relative overflow-hidden">
        <div className="flex-col  h-full w-full justify-between grid grid-cols-[auto_1fr_auto] ">
          <div className="border-r border-muted overflow-hidden grid grid-rows-[1fr_auto]">
            <div className="border-b  border-muted grid grid-rows-[auto_1fr]">
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
              <div className=" border-t border-muted  relative overflow-hidden flex flex-col p-3 gap-2">
                <StarBorder />
                <div className="text-xs flex gap-1">
                  GITHUB REPO STAR : ★ : [<StarsCount />]
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
          </div>

          <div className="col-start-2 border-b border-r border-muted ">
            <div className="grid grid-rows-[auto_1fr_auto] font-pixelify ">
              <div className=" relative overflow-hidden w-full border-b border-muted px-3">
                MADE WITH LOVE BY : VANSH NAGAR ✿
                <StarBorder />
              </div>
              <div className="text-9xl relative text-muted flex justify-center items-center overflow-hidden w-full">
                pixel perfect <StarBorder />
              </div>
              <div className=" relative overflow-hidden border-t border-muted p-3">
                <StarBorder />
                <Link href={"https://vanshnagar.me/"}>
                  <Button
                    variant={"ghost"}
                    className=" rounded-none text-xs border border-muted w-full"
                  >
                    PORTFOLIO
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className=" gap-1 flex flex-col relative overflow-hidden p-1  col-start-3 ">
            <StarBorder />
            <TooltipProvider>
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className=" rounded-none "
                      >
                        <Link href={social.href}>
                          <IconComponent />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className=" rounded-none">
                      <p>{social.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
            <LightDarkMode />
          </div>
        </div>
        <data value=""></data>
      </footer>
    </>
  );
}
