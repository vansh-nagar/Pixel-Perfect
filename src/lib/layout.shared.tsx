import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex w-[235px] justify-center relative ">
          <span className="absolute  rounded-full logo-glow right-0" />
          <div className=" text-3xl font-pixelify font-medium flex items-center">
            <Image
              src="/logo/static/logo.svg"
              alt="Pixel Perfect Logo"
              width={50}
              height={50}
              className="relative z-10 w-12 sm:w-8 aspect-square dark:invert -mr-1"
            />

            <span className="hidden sm:inline">ixel Perfect</span>
          </div>
        </div>
      ),
    },

    themeSwitch: { enabled: false },
    searchToggle: {
      enabled: true,
    },
  };
}
