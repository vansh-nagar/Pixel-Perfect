"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import CardAnimation from "registry/new-york/motion-framer/card-animation";
import ImageHoverAnimation from "registry/new-york/motion-framer/image-hover-animation";
import LogoAnimation from "registry/new-york/motion-framer/logo-animation";
import TabBackgroundAnimation from "registry/new-york/motion-framer/tab-background-animation";
import { toast } from "sonner";

const MotionComponentArr = [
  {
    name: "Simple Card",
    description: "A simple card animation using Framer Motion.",
    component: <CardAnimation />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/card-animation.json",
  },
  {
    name: "Logo Animation",
    description: "Logo animation with Framer Motion and custom background.",
    component: <LogoAnimation />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/logo-animation.json",
  },
  {
    name: "Tab Background",
    description: "A tab background animation using Framer Motion.",
    component: <TabBackgroundAnimation />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/tab-background-animation.json",
  },
  {
    name: "Image Hover",
    description: "An image hover animation with scaling and opacity effects.",
    component: <ImageHoverAnimation />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/image-hover-animation.json",
  },
];

const MotionAnimationsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2  gap-0">
      {MotionComponentArr.map((item, index) => (
        <div
          key={index}
          className="w-full border relative border-b border-l border-dashed  aspect-square flex justify-center items-center"
        >
          {item.component}

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs ">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="absolute top-0 right-0">
            <Button
              size={"sm"}
              variant={"ghost"}
              className="text-xs  cursor-pointer z-30 relative border  border-dashed right-1 top-1  rounded-none "
              onClick={() => {
                navigator.clipboard.writeText(item.link);
                toast.success("Link copied to clipboard!");
              }}
            >
              <Copy className=" size-3" /> Copy
              <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed "></span>
              <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2  border-dashed"></span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MotionAnimationsGrid;
