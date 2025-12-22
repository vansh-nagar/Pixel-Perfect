"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import TextFade from "../../../../registry/new-york/text/text-fade";
import TextInertia from "../../../../registry/new-york/text/text-inertia";

export const TextArr = [
  {
    name: "Text Fade Effect",
    description: "Text fades in/out on scroll using GSAP.",
    component: (
      <TextFade textContent="I design and build pixel-perfect digital experiences where precision, performance, and aesthetics work together seamlessly." />
    ),
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Text%20Fade%20Effect.json",
    tag: "On Scroll",
  },
  {
    name: "Text Inertia Effect",
    description: "Text follows mouse with inertia using GSAP.",
    component: (
      <TextInertia text="Crafting refined, pixel-perfect web experiences that balance design clarity with technical excellence." />
    ),
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Text%20Inertia%20Effect.json",
    tag: "Hover me",
  },
];

const TextGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {TextArr.map((item, index) => (
        <div
          key={index}
          className="relative border-b border-l border-dashed  aspect-square flex items-center text-xs
           justify-center p-2 "
        >
          <BorderDecorator />
          <div className=" z-30   text-justify">{item.component}</div>

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs ">
              {item.name}{" "}
              {item.tag && (
                <span className="text-[8px] rounded-sm border-dashed">
                  {item.tag}
                </span>
              )}
            </p>
            <p className="text-[8px] text-muted-foreground leading-2.5">
              {item.description}
            </p>
          </div>

          <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
            <div className=" border-t border-dashed "></div>
            <Button
              size={"sm"}
              variant={"ghost"}
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

export default TextGrid;

export const BorderDecorator = () => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] -top-[0px] block size-6   border-dashed border-l-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-dashed border-r-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-dashed border-b-1 border-l-1 z-30 "></span>
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b-1 border-r-1 border-dashed z-30"></span>

      <span className="absolute -top-px -right-[0.5px] z-30 border-b border-l block size-2 px-[38px] py-[20px] mt-[1px]  border-dashed"></span>
    </>
  );
};
