"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import CardAnimation from "registry/new-york/motion-framer/card-animation";
import { toast } from "sonner";

const MotionComponentArr = [
  {
    name: "Simple Card",
    description: "A simple card animation using Framer Motion.",
    component: <CardAnimation />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Motion%20Card%201.json",
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
