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
          <svg
            viewBox="0 0 75 8"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="pixel perfect"
            className="w-full h-auto max-w-3xl"
            fill="currentColor"
          >
            <path d="M2.93255e-05 7.71431V1.09031H1.09203V-0.001688H4.47603V1.09031H5.58003V4.45031H4.47603V5.54231H1.21203V7.71431H2.93255e-05ZM1.21203 4.33031H4.35603V1.21031H1.21203V4.33031ZM7.03128 7.71431V2.17031H8.24328V7.71431H7.03128ZM7.03128 1.21031V-0.001688H8.24328V1.21031H7.03128ZM9.69144 7.71431V6.51431H10.7834V5.42231H11.8634V4.45031H10.7834V3.37031H9.69144V2.17031H10.9034V3.26231H11.9834V4.33031H12.9674V3.26231H14.0474V2.17031H15.2714V3.37031H14.1674V4.45031H13.0874V5.42231H14.1674V6.51431H15.2714V7.71431H14.0474V6.63431H12.9674V5.54231H11.9834V6.63431H10.9034V7.71431H9.69144ZM17.217 7.71431V6.63431H16.125V3.26231H17.217V2.17031H20.601V3.26231H21.705V4.45031H20.481V3.37031H17.337V4.33031H19.521V5.54231H17.337V6.51431H20.481V5.41031H21.705V6.62231H20.601V7.71431H17.217ZM23.1563 7.71431V-0.001688H24.3683V7.71431H23.1563ZM28.2188 7.71431V1.09031H29.3108V-0.001688H32.6948V1.09031H33.7988V4.45031H32.6948V5.54231H29.4308V7.71431H28.2188ZM29.4308 4.33031H32.5748V1.21031H29.4308V4.33031ZM35.9787 7.71431V6.63431H34.8867V3.26231H35.9787V2.17031H39.3627V3.26231H40.4667V4.45031H39.2427V3.37031H36.0987V4.33031H38.2827V5.54231H36.0987V6.51431H39.2427V5.41031H40.4667V6.62231H39.3627V7.71431H35.9787ZM41.918 7.71431V3.26231H43.01V2.17031H46.394V3.26231H47.498V4.45031H46.274V3.37031H43.13V7.71431H41.918ZM48.9492 7.71431V1.09031H50.0412V-0.001688H53.4252V1.09031H54.5292V2.29031H53.3052V1.21031H50.1612V3.26231H52.3452V4.45031H50.1612V7.71431H48.9492ZM55.8772 7.71431V6.63431H54.7852V3.26231H55.8772V2.17031H59.2612V3.26231H60.3652V4.45031H59.1412V3.37031H55.9972V4.33031H58.1812V5.54231H55.9972V6.51431H59.1412V5.41031H60.3652V6.62231H59.2612V7.71431H55.8772ZM62.9084 7.71431V6.63431H61.8164V3.26231H62.9084V2.17031H66.2924V3.26231H67.3964V4.45031H66.1724V3.37031H63.0284V6.51431H66.1724V5.42231H67.3964V6.63431H66.2924V7.71431H62.9084ZM70.422 7.71431V6.63431H69.342V3.37031H68.25V2.17031H69.342V-0.001688H70.542V2.17031H73.83V3.37031H70.542V6.51431H73.71V5.42231H74.922V6.63431H73.83V7.71431H70.422Z" />
          </svg>
        </div>
      </div>
    </>
  );
}
