"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Copy } from "lucide-react";
import Gradient1 from "../../../../registry/new-york/background/gradient1";
import { useState } from "react";
import { toast } from "sonner";

const Buttons = [
  {
    name: "Gradient 1",
    description: "A simple radial gradient background.",
    component: <Gradient1 />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Gradient%201.json",
  },
];

const BackgroundGrid = () => {
  const [bgColors, setBgColors] = useState<Record<number, "black" | "white">>(
    {}
  );

  const getArrowRotation = (index: number, totalItems: number) => {
    const cols = 5;
    const col = index % cols;
    const row = Math.floor(index / cols);

    const boxX = col;
    const boxY = row;

    const dx = 4 - boxX;
    const dy = -1 - boxY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return angle;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-2">
      {Buttons.map((item, index) => (
        <div
          key={index}
          className={`relative border-dashed aspect-video border  shadow-inner flex flex-col items-center justify-center transition-colors duration-300 `}
        >
          <div>
            {item.component}

            <div className="right-1 top-1 absolute gap-1 flex">
              <Button
                size={"sm"}
                variant={"secondary"}
                className="text-xs  cursor-pointer rounded-none z-30 "
                onClick={() => {
                  navigator.clipboard.writeText(item.link);
                  toast.success("Link copied to clipboard!");
                }}
              >
                <Copy className="size-3" /> Copy
              </Button>
            </div>
          </div>{" "}
          <div className=" p-2 border">
            <div className="leading-2 mb-2">
              <p className="text-xs">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Button size={"sm"} className=" w-full text-xs rounded-none ">
              Star On Github{" "}
              <ArrowRight
                className="size-4"
                style={{
                  transform: `rotate(${getArrowRotation(
                    index,
                    Buttons.length
                  )}deg)`,
                }}
              />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BackgroundGrid;
