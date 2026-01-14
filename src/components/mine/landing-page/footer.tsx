"use client";

import { Button } from "@/components/ui/button";
import { Circle, GithubIcon, LucideGithub } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaDiscord, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import StarBorder from "./star-border";
import { StarsCount } from "./stars-count";

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
      <div className="flex justify-between relative overflow-hidden px-6 py-3 max-sm:px-3 border-b border-muted">
        <div className="flex gap-2">
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
        </div>
        <div className="text-xs text-muted-foreground/30">FOOTER</div>
        <StarBorder />
      </div>
      <div className="flex-col w-full justify-between grid grid-cols-[auto_1fr]  grid-col-1  ">
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
            <div className="text-xs flex gap-1">
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

        <div className=" border-b border-r border-muted  overflow-hidden relative flex justify-center items-center text-9xl  max-sm:text-6xl font-pixelify text-muted ">
          <StarBorder />
          pixel perfect
        </div>
      </div>
    </>
  );
}
