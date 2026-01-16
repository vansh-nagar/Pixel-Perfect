"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

// Additional gradients (reuse with different props or names)
const Gradient1 = () => (
  <div
    aria-hidden
    className="absolute z-30 inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,var(--color-blue-600),var(--color-white)_100%)]"
  />
);
const Gradient2 = () => (
  <div className="bg-[radial-gradient(circle_at_bottom,var(--color-1),var(--color-2))] absolute inset-0" />
);
const Gradient3 = () => (
  <div className="bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] h-full w-full absolute inset-0"></div>
);
const Gradient4 = () => (
  <div className="h-full w-full relative">
    {/* Light mode grid - dark lines */}
    <div
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 2px, transparent 2px), linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)`,
        backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
        backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
      }}
      className="absolute inset-0 dark:hidden"
    ></div>

    {/* Dark mode grid - white lines */}
    <div
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 2px, transparent 2px), linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
        backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
        backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
      }}
      className="absolute inset-0 hidden dark:block"
    ></div>
  </div>
);
const Gradient5 = () => (
  <div className=" absolute inset-0 after:pointer-events-none after:inset-0 after:rounded-lg after:inset-ring after:inset-ring-gray-950/5 dark:after:inset-ring-white/10 bg-[image:radial-gradient(var(--pattern-fg)_1px,_transparent_0)] bg-[size:10px_10px] bg-fixed [--pattern-fg:var(--color-gray-950)]/5 dark:[--pattern-fg:var(--color-white)]/10" />
);

export const BackgroudArr = [
  {
    name: "Gradient 1",
    description: "Radial glow fade",
    component: <Gradient1 />,
  },
  {
    name: "Gradient 2",
    description: "Bottom radial bloom",
    component: <Gradient2 />,
  },
  {
    name: "Gradient 3",
    description: "Diagonal micro pattern",
    component: <Gradient3 />,
  },
  {
    name: "Gradient 4",
    description: "Dual grid system",
    component: <Gradient4 />,
  },
  {
    name: "Gradient 5",
    description: "Dot mesh texture",
    component: <Gradient5 />,
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
            {/* Copy Background Button */}
            <Button
              size={"sm"}
              variant={"secondary"}
              className="text-xs cursor-pointer rounded-none z-30 ml-1"
              onClick={() => {
                const gridItem =
                  document.querySelectorAll(".aspect-video")[index];
                if (gridItem) {
                  // Get the first child (the background component)
                  const innerChild = gridItem.firstElementChild;
                  if (innerChild) {
                    navigator.clipboard.writeText(innerChild.outerHTML);
                    toast.success("Background HTML copied!");
                  } else {
                    toast.error("No inner child found.");
                  }
                } else {
                  toast.error("Grid item not found.");
                }
              }}
            >
              <Copy className="size-3" /> Copy Background
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BackgroundGrid;
