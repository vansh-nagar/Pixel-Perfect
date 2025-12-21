"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import MorphButton from "../../../../registry/new-york/buttons/morph-button";
import MorphImageButton from "../../../../registry/new-york/buttons/morph-image-button";
import ThreedButton from "../../../../registry/new-york/buttons/3d-button";
import ShinyButton from "../../../../registry/new-york/buttons/shiny-button";
import { toast } from "sonner";

const Buttons = [
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <MorphButton />,
    link: "https://www.pixel-perfect.space/r/Morph%20Button.json",
  },
  {
    name: "Morph Image Button",
    description: "A button that morphs an image mask on hover using GSAP.",
    component: <MorphImageButton />,
    link: "https://www.pixel-perfect.space/r/Morph%20Image%20Button.json",
  },
  {
    name: "3D Button",
    description: "A 3D button with press and hover effects.",
    component: <ThreedButton />,
    link: "https://www.pixel-perfect.space/r/3D%20Button.json",
  },
  {
    name: "Shiny Button",
    description: "A shiny button with hover effects.",
    component: <ShinyButton />,
    link: "https://www.pixel-perfect.space/r/Shiny%20Button.json",
  },
];

const ButtonGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {Buttons.map((item, index) => (
        <div
          key={index}
          className="relative border-b border-l border-dashed  aspect-square flex items-center justify-center "
        >
          <BorderDecorator />
          <div className=" z-30">{item.component}</div>

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs ">{item.name}</p>
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
                navigator.clipboard.writeText(item.link);
                toast.success("Link copied to clipboard!");
              }}
              className="text-xs  cursor-pointer z-30 relative border  border-dashed right-1 top-1  rounded-none "
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

export default ButtonGrid;

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
