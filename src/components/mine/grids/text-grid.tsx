"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import TextFade from "../../../../registry/new-york/text/text-fade";
import TextInertia from "../../../../registry/new-york/text/text-inertia";
import TextGradient from "registry/new-york/text/text-gradient";
import TextAssemble from "registry/new-york/text/text-assemble";

export const TextArr = [
  {
    name: "Text Fade Effect",
    description: "Text fades in/out on scroll using GSAP.",
    component: (
      <TextFade
        className="text-7xl"
        textContent="I design and build pixel-perfect digital experiences where precision, performance, and aesthetics work together seamlessly."
      />
    ),
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Text%20Fade%20Effect.json",
    tag: "On Scroll",
  },
  {
    name: "Text Inertia Effect",
    description: "Text follows mouse with inertia using GSAP.",
    component: (
      <TextInertia
        className="text-7xl"
        text="Crafting refined, pixel-perfect web experiences that balance design clarity with technical excellence."
      />
    ),
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Text%20Inertia%20Effect.json",
    tag: "Hover me",
  },
  {
    name: "Text Gradient Effect",
    description: "Gradient text effect using CSS.",
    component: (
      <TextGradient>
        Labore excepteur est et Lorem mollit duis ea esse officia. Irure
        incididunt incididunt nostrud esse cillum enim. Nisi excepteur dolor
        incididunt cupidatat.
      </TextGradient>
    ),
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Text%20Gradient%20Effect.json",
    tag: "Example",
  },
  {
    name: "Text Assemble Effect",
    description: "Assemble text effect using GSAP.",
    component: <TextAssemble />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Text%20Assemble%20Effect.json",
    tag: "On Scroll",
  },
];

const TextGrid = () => {
  const [selected, setSelected] = useState<number>(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 md:gap-4 h-[85vh]">
      <aside className="border-r border-dashed overflow-y-auto pr-2 -mr-[0.5px]">
        <div className="sticky top-0 bg-background z-10 py-2 md:py-3 border-dashed border mb-1 ">
          <p className="text-xs uppercase text-muted-foreground tracking-wider px-2">
            Text Effects
          </p>
        </div>
        <ul className="space-y-1 pb-8">
          {TextArr.map((item, idx) => {
            const active = idx === selected;
            return (
              <li key={idx}>
                <button
                  onClick={() => setSelected(idx)}
                  className={`w-full text-left px-2 py-2 rounded-none border border-dashed ${
                    active
                      ? "bg-muted/30 text-foreground"
                      : "hover:bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{item.name}</span>
                    {item.tag && (
                      <span className="text-[9px] border border-dashed px-1 py-0.5">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="relative h-full overflow-hidden">
        <div className="relative h-full w-full border border-dashed flex flex-col">
          <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-dashed shrink-0">
            <div>
              <h2 className="text-sm font-semibold">
                {TextArr[selected].name}
                {TextArr[selected].tag && (
                  <span className="ml-2 align-middle text-[10px] border border-dashed px-1 py-0.5">
                    {TextArr[selected].tag}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {TextArr[selected].description}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(TextArr[selected].link);
                toast.success("Link copied to clipboard!");
              }}
              className="text-xs border border-dashed rounded-none"
            >
              <Copy className="size-3 mr-1" /> Copy
            </Button>
          </div>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden"
            id="scroll-container"
          >
            {selected === 0 || selected === 3 ? (
              // For scroll-based animations, provide scrollable space
              <div className="min-h-[300vh] w-full">
                <div className="h-screen flex items-center justify-center p-4">
                  {TextArr[selected].component}
                </div>
              </div>
            ) : (
              // For other effects, just center them
              <div className="h-full flex items-center justify-center p-4">
                {TextArr[selected].component}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TextGrid;
