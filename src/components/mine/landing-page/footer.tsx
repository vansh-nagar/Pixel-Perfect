"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideGithub } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaDiscord, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

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
      <footer className=" border  border-dashed p-2 shadow-inner relative z-0 h-52 overflow-hidden ">
        <div className="flex flex-col  h-full w-full justify-between gap-10 z-10">
          <div>
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
            </div>{" "}
          </div>

          <div className="flex justify-end gap-1.5">
            <TooltipProvider>
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" asChild>
                        <Link href={social.href}>
                          <IconComponent />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{social.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>

        <div className="font-pixelify  text-shadow-2xs  absolute bottom-10  inset-x-0 pointer-events-none mx-auto translate-y-[5%] select-none text-center font-bold leading-none tracking-tighter text-muted text-[40px] sm:text-[60px] md:text-[80px] lg:text-[120px] xl:text-[140px] z-0">
          pixel perfect
        </div>
      </footer>{" "}
    </>
  );
}
