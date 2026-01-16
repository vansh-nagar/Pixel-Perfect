"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import Gradient1 from "../../../../registry/new-york/background/gradient1";
import { toast } from "sonner";
import Gradient2 from "registry/new-york/background/gradient2";
import Gradient4 from "registry/new-york/background/gradient4";
import Gradient3 from "registry/new-york/background/gradient3";
import Gradient5 from "registry/new-york/background/gradient5";

export const BackgroudArr = [
  {
    name: "Gradient 1",
    description: "A smooth gradient background design.",
    component: <Gradient1 />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Gradient%201.json",
  },
  {
    name: "Gradient 2",
    description: "A vibrant gradient background design.",
    component: <Gradient2 />,
    link: "",
  },
  {
    name: "Gradient 3",
    description: "A colorful gradient background design.",
    component: <Gradient3 />,
    link: "",
  },
  {
    name: "Gradient 4",
    description: "A colorful gradient background design.",
    component: <Gradient4 />,
    link: "",
  },
  {
    name: "Gradient 5",
    description: "A colorful gradient background design.",
    component: <Gradient5 />,
    link: "",
  },
];

const BackgroundGrid = () => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-2 `}>
      {BackgroudArr.map((item, index) => (
        <div
          key={index}
          className={`relative border-dashed aspect-video border`}
        >
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
        </div>
      ))}
    </div>
  );
};

export default BackgroundGrid;
