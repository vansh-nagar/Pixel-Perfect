"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, LucideGithub } from "lucide-react";
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

const links = [
  {
    group: "Resources",
    items: [
      {
        title: "Features",
        href: "#",
      },
      {
        title: "Solution",
        href: "#",
      },
      {
        title: "Customers",
        href: "#",
      },
      {
        title: "Pricing",
        href: "#",
      },
      {
        title: "Help",
        href: "#",
      },
      {
        title: "About",
        href: "#",
      },
    ],
  },
  {
    group: "Developer",
    items: [
      {
        title: "Startup",
        href: "#",
      },
      {
        title: "Freelancers",
        href: "#",
      },
      {
        title: "Organizations",
        href: "#",
      },
      {
        title: "Students",
        href: "#",
      },
      {
        title: "Collaboration",
        href: "#",
      },
      {
        title: "Design",
        href: "#",
      },
      {
        title: "Management",
        href: "#",
      },
    ],
  },
  {
    group: "Company",
    items: [
      {
        title: "About",
        href: "#",
      },
      {
        title: "Careers",
        href: "#",
      },
      {
        title: "Blog",
        href: "#",
      },
      {
        title: "Press",
        href: "#",
      },
      {
        title: "Contact",
        href: "#",
      },
      {
        title: "Help",
        href: "#",
      },
    ],
  },
];

export function Footer() {
  return (
    <>
      <footer className=" border  border-dashed p-3 shadow  relative rounded-xl z-0 overflow-hidden ">
        <div className="flex flex-col sm:flex-row w-full justify-between gap-10 z-10">
          <div className="  flex flex-col justify-between">
            <div>
              <div className="text-3xl font-pixelify flex items-center">
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

            <div className=" flex flex-col  gap-2 mt-2">
              <div className="flex gap-1.5">
                <TooltipProvider>
                  {socialLinks.map((social, index) => {
                    const IconComponent = social.icon;
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            asChild
                          >
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
          </div>

          <div className="flex gap-24 flex-wrap mx-3 z-40">
            {links.map((link, index) => (
              <div key={index} className="space-y-3">
                <span className="block font-medium font-pixelify  ">
                  {link.group}
                </span>
                {link.items.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-muted-foreground hover:text-primary block duration-150 text-xs"
                  >
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="font-pixelify  absolute bottom-0 left-0 right-0 pointer-events-none mx-auto translate-y-[5%] select-none text-center font-bold leading-none tracking-tighter text-muted text-[40px] sm:text-[60px] md:text-[80px] lg:text-[120px] xl:text-[140px] z-0">
          pixel perfect
        </div>
      </footer>{" "}
      <div className="flex flex-col items-center  -gap-2">
        <div className="w-full rounded-2xl h-2 animate-rainbow bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] blur-xl" />
      </div>
    </>
  );
}
