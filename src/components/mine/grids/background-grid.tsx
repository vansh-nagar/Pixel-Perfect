"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Copy } from "lucide-react";
import Gradient1 from "../pixels/background/gradient1";
import { useState } from "react";

const Buttons = [
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
];

const BackgroundGrid = () => {
  const [bgColors, setBgColors] = useState<Record<number, "black" | "white">>(
    {}
  );

  // Calculate angle from each box to top-right corner
  const getArrowRotation = (index: number, totalItems: number) => {
    const cols = 5; // xl:grid-cols-5
    const col = index % cols;
    const row = Math.floor(index / cols);

    // Position of box center
    const boxX = col;
    const boxY = row;

    // Calculate angle to top-right (assuming top-right is at col=4, row=-1)
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
