"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Gamepad2, GithubIcon, Menu } from "lucide-react";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import { StarsCount } from "@/components/mine/landing-page/stars-count";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/playground", label: "Playground", icon: Gamepad2 },
  { href: "/tutorial", label: "Tutorial", icon: BookOpen },
] as const;

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
            <div className="z-0 absolute inset-[1.5px] bg-foreground/95 group-hover:bg-foreground/40  backdrop-blur-lg transition-all saturate-200" />
            <span className="z-10 text-background pointer-events-none flex gap-2 justify-center items-center">
              <GithubIcon className="text-background" />
              <StarsCount />
            </span>
          </Button>
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link href={href}>
                  <Button
                    variant={"outline"}
                    className="border-dashed rounded-none"
                    size={"icon"}
                  >
                    <Icon />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="font-sans border-dashed rounded-none text-xs px-2 py-1">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={"outline"}
                className="border-dashed rounded-none"
                size={"icon"}
                aria-label="Menu"
              >
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="font-sans border-dashed rounded-none"
            >
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild className="rounded-none">
                  <Link href={href}>
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <LightDarkMode />
      </div>
    </header>
  );
}
