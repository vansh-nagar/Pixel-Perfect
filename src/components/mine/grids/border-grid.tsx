"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import Border1 from "../../../../registry/new-york/borders/border1";
import Border2 from "../../../../registry/new-york/borders/border2";
import Intersection1 from "../../../../registry/new-york/borders/intersection1";
import Intersection2 from "../../../../registry/new-york/borders/intersection2";

const Buttons = [
  {
    name: "Border 1",
    description: "A dashed border design using CSS.",
    component: <Border1 />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Border%201.json",
  },
  {
    name: "Border 2",
    description: "A border design using CSS.",
    component: <Border2 />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Border%202.json",
  },
  {
    name: "Intersection (Scope)",
    description: "An intersection design using CSS.",
    component: <Intersection1 />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Intersection%201.json",
  },
  {
    name: "Intersection (Scope)",
    description: "An intersection design using CSS.",
    component: (
      <Intersection2>
        <div className="m-3 text-xs">
          Your Content <br /> Here
        </div>
      </Intersection2>
    ),
    image: "",
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Intersection%202.json",
  },
];

const BorderGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {Buttons.map((item, index) => (
        <div
          key={index}
          className="relative border-dashed  aspect-square flex items-center justify-center "
        >
          {item.component}

          <div className="absolute  inset-x-0   bottom-0 bg-background/10 backdrop-blur-sm p-1.5">
            <div className=" leading-1 ">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>

          <Button
            size={"sm"}
            variant={"secondary"}
            onClick={() => {
              navigator.clipboard.writeText(item.link);
              toast.success("Link copied to clipboard!");
            }}
            className="text-xs  absolute cursor-pointer z-30  right-1 top-1 active:bg-orange-500 "
          >
            <Copy className=" size-3" /> Copy
          </Button>
          <div />
        </div>
      ))}
    </div>
  );
};

export default BorderGrid;
