"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import Svg1 from "registry/new-york/svg/svg-1";
import Svg2 from "registry/new-york/svg/svg-2";
import Svg3 from "registry/new-york/svg/svg-3";
import Svg4 from "registry/new-york/svg/svg-4";
import Svg5 from "registry/new-york/svg/svg5";
import Svg6 from "registry/new-york/svg/svg6";
import Svg7 from "registry/new-york/svg/svg7";
import Svg8 from "registry/new-york/svg/svg8";
import Svg9 from "registry/new-york/svg/svg-9";
import Svg10 from "registry/new-york/svg/svg-10";
import Svg11 from "registry/new-york/svg/svg11";

export const SvgArr = [
  {
    name: "Svg Asset 1",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg1 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg2 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg11 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg3 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg4 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg5 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg7 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg8 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg9 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg10 />,
  },
  {
    name: "Svg Asset 2",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Svg6 />,
  },
];

const SvgAssetsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {SvgArr.map((item, index) => (
        <div
          key={index}
          className="relative border-b bg-black border-l border-dashed  aspect-square flex items-center justify-center "
        >
          <BorderDecorator />
          <div className=" z-30 flex flex-col items-center gap-2">
            {item.component}
          </div>

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs text-white">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
            <div className=" border-t border-dashed "></div>
            <Button
              size={"sm"}
              variant={"copy"}
              onClick={() => {
                const svg = document.querySelectorAll(".z-30 svg")[index];
                if (svg) {
                  const serializer = new XMLSerializer();
                  const svgString = serializer.serializeToString(svg);
                  navigator.clipboard.writeText(svgString);
                  toast.success("SVG copied to clipboard!");
                } else {
                  toast.error("SVG not found.");
                }
              }}
              className="text-xs text-white cursor-pointer z-30 relative border  border-dashed right-1 top-1  rounded-none "
            >
              <Copy className=" size-3" /> Copy
              <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed "></span>
              <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2  border-dashed"></span>
            </Button>
            <div />
            <div className=" border-r border-dashed h-full -mr-[0.5px] " />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SvgAssetsGrid;

export const BorderDecorator = () => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] -top-[0px] block size-6   border-dashed border-l-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-dashed border-r-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-dashed border-b-1 border-l-1 z-30 "></span>
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b-1 border-r-1 border-dashed z-30"></span>

      <span className="absolute -top-px -right-[0.5px] z-30 border-b border-l block size-2 px-[38px] py-[20px] mt-[1px]  border-dashed"></span>

      {/* Circular border */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>

      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>

      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
