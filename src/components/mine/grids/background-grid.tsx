"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Moon, Star, Sun } from "lucide-react";
import Gradient1 from "../pixels/background/gradient1";
import { useState } from "react";

const Buttons = [
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <Gradient1 />,
    link: "https://arclabs.space/",
  },
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

  const toggleBg = (index: number) => {
    setBgColors((prev) => ({
      ...prev,
      [index]: prev[index] === "black" ? "white" : "black",
    }));
  };

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {Buttons.map((item, index) => (
        <div
          key={index}
          className={`relative border-dashed aspect-square flex flex-col items-center justify-center transition-colors duration-300 ${
            bgColors[index] === "white"
              ? "bg-white"
              : bgColors[index] === "black"
              ? "bg-black"
              : ""
          }`}
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
              <Button
                size={"sm"}
                variant={"secondary"}
                onClick={() => toggleBg(index)}
                className="text-xs cursor-pointer z-30 transition-all rounded-none"
                title="Toggle background color"
              >
                {bgColors[index] === "white" ? (
                  <Moon className="size-3" />
                ) : bgColors[index] === "black" ? (
                  <Sun className="size-3" />
                ) : (
                  <Moon className="size-3" />
                )}
              </Button>
            </div>
          </div>{" "}
          <div className="  bg-background backdrop-blur-sm p-2 border-x border-b ">
            <div className="leading-1 mb-2">
              <p className="text-xs">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Button size={"sm"} className=" w-full text-xs rounded-none ">
              <ArrowRight
                className="size-3"
                style={{
                  transform: `rotate(${getArrowRotation(
                    index,
                    Buttons.length
                  )}deg)`,
                }}
              />{" "}
              Star On Github
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BackgroundGrid;
