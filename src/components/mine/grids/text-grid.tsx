"use client";
import { Button } from "@/components/ui/button";
import { Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TextFade from "../../../../registry/new-york/text/text-fade";
import TextInertia from "../../../../registry/new-york/text/text-inertia";
import TextGradient from "../../../../registry/new-york/text/text-gradient";
import TextXRotate from "../../../../registry/new-york/text/text-x-rotate";
import TextYAnimation from "../../../../registry/new-york/text/text-y-animation";
import TextYAnimation2 from "../../../../registry/new-york/text/text-y-animation2";
import TextYAnimation3 from "../../../../registry/new-york/text/text-y-animation3";
import TextYAnimation4 from "../../../../registry/new-york/text/text-y-animation4";
import TextScatter from "../../../../registry/new-york/text/text-scatter";
import TextScatter1 from "../../../../registry/new-york/text/text-scatter1";
import TextZRotate from "../../../../registry/new-york/text/text-z-rotate";
import TextZRotate2 from "../../../../registry/new-york/text/text-z-rotate2";
import TextVideo from "../../../../registry/new-york/text/text-video";
import TextReveal from "../../../../registry/new-york/text/text-reveal";
import TextReveal2 from "../../../../registry/new-york/text/text-reveal2";
import TextBlackHole from "../../../../registry/new-york/text/text-black-hole";
import TextBurnNeon from "../../../../registry/new-york/text/text-burn-neon";
import TextBrokenGlass from "../../../../registry/new-york/text/text-broken-glass";
import TextMatrixRain from "../../../../registry/new-york/text/text-matrix-rain";
import TextGlitchPortal from "../../../../registry/new-york/text/text-glitch-portal";
import TextTypewriterGlitch from "../../../../registry/new-york/text/text-typewriter-glitch";

type StaggerFrom = "start" | "center" | "edges" | "random" | "end";

const BASE_URL = "https://www.pixel-perfect.space/r";

const TextGrid = () => {
  const [staggerFrom, setStaggerFrom] = useState<StaggerFrom>("start");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const TextArr = [
    {
      name: "Broken Glass Assemble",
      description: "Letters start shattered & rotated → snap into place.",
      component: (
        <TextBrokenGlass className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextBrokenGlass>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-broken-glass.json`,
      hasStagger: false,
    },
    {
      name: "Matrix Rain Decode",
      description: "Columns of random symbols fall → lock into real text.",
      component: (
        <TextMatrixRain className="text-2xl font-bold font-mono">
          JUST GIVE IT A STAR
        </TextMatrixRain>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-matrix-rain.json`,
      hasStagger: false,
    },
    {
      name: "Glitch Warp Portal",
      description: "RGB split + scale blur → collapse into clean text.",
      component: (
        <TextGlitchPortal className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextGlitchPortal>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-glitch-portal.json`,
      hasStagger: false,
    },
    {
      name: "Typewriter Malfunction",
      description: "Types → deletes → types wrong → finally correct.",
      component: (
        <TextTypewriterGlitch className="text-2xl font-bold font-mono">
          JUST GIVE IT A STAR
        </TextTypewriterGlitch>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-typewriter-glitch.json`,
      hasStagger: false,
    },
    {
      name: "Text Reveal",
      description: "Text reveal animation effect.",
      component: (
        <TextReveal className="text-xl">JUST GIVE IT A STAR</TextReveal>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-reveal.json`,
      hasStagger: false,
    },
    {
      name: "Text Video",
      description: "Video masked text effect.",
      component: <TextVideo>JUST GIVE IT A STAR</TextVideo>,
      link: `npx shadcn@latest add ${BASE_URL}/text-video.json`,
      hasStagger: false,
    },
    {
      name: "Text Z Rotate 2",
      description: "Z-axis rotation text animation variant.",
      component: <TextZRotate2 staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-z-rotate2.json`,
      hasStagger: true,
    },
    {
      name: "Text Z Rotate",
      description: "Z-axis rotation text animation.",
      component: <TextZRotate staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-z-rotate.json`,
      hasStagger: true,
    },
    {
      name: "Text Reveal 2",
      description: "Text reveal animation variant.",
      component: (
        <TextReveal2 className="text-xl">JUST GIVE IT A STAR</TextReveal2>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-reveal2.json`,
      hasStagger: false,
    },
    {
      name: "Text Scatter 1",
      description: "Text scatter variant animation.",
      component: <TextScatter1 staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-scatter1.json`,
      hasStagger: true,
    },
    {
      name: "Text Scatter",
      description: "Text scatters and assembles with animation.",
      component: <TextScatter staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-scatter.json`,
      hasStagger: true,
    },
    {
      name: "Text Fade Effect",
      description: "Text fades in/out on scroll using GSAP.",
      component: (
        <TextFade
          className="text-2xl"
          textContent="I design and build pixel-perfect digital experiences where precision, performance, and aesthetics work together seamlessly."
        />
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-fade.json`,
      hasStagger: false,
    },
    {
      name: "Text Inertia Effect",
      description: "Text follows mouse with inertia using GSAP.",
      component: (
        <TextInertia
          className="text-2xl"
          text="Crafting refined, pixel-perfect web experiences that balance design clarity with technical excellence."
        />
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-inertia.json`,
      hasStagger: false,
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
      link: `npx shadcn@latest add ${BASE_URL}/text-gradient.json`,
      hasStagger: false,
    },
    {
      name: "Text X Rotate",
      description: "3D X-axis rotation effect with stagger.",
      component: <TextXRotate staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-x-rotate.json`,
      hasStagger: true,
    },
    {
      name: "Text Y Animation",
      description: "Y-axis slide animation with stagger.",
      component: <TextYAnimation staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-y-animation.json`,
      hasStagger: true,
    },
    {
      name: "Text Y Animation 2",
      description: "Variant Y-axis animation effect.",
      component: <TextYAnimation2 staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-y-animation2.json`,
      hasStagger: true,
    },
    {
      name: "Text Y Animation 3",
      description: "Variant Y-axis animation effect.",
      component: <TextYAnimation3 staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-y-animation3.json`,
      hasStagger: true,
    },
    {
      name: "Text Y Animation 4",
      description: "Variant Y-axis animation effect.",
      component: <TextYAnimation4 staggerFrom={staggerFrom} />,
      link: `npx shadcn@latest add ${BASE_URL}/text-y-animation4.json`,
      hasStagger: true,
    },
    {
      name: "Black Hole Reveal",
      description: "Letters come from center, stretched & sucked outward.",
      component: (
        <TextBlackHole className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextBlackHole>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-black-hole.json`,
      hasStagger: false,
    },
    {
      name: "Burn-In Neon",
      description: "Random flicker → letters glow red → turn white.",
      component: (
        <TextBurnNeon className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextBurnNeon>
      ),
      link: `npx shadcn@latest add ${BASE_URL}/text-burn-neon.json`,
      hasStagger: false,
    },
  ];

  const totalPages = Math.ceil(TextArr.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = TextArr.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">
        {paginatedItems.map((item, index) => (
          <div
            key={index}
            className="relative border-b border-l p-1 border-dashed  aspect-square flex items-center justify-center"
          >
            <BorderDecorator />
            <div className=" z-30">{item.component}</div>

            <div className=" leading-1 absolute left-1.5  bottom-1.5">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>

            <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto_auto] grid-rows-[auto_1fr] h-full gap-0">
              <div className=" border-t border-dashed "></div>
              {item.hasStagger && (
                <Select
                  value={staggerFrom}
                  onValueChange={(value) =>
                    setStaggerFrom(value as StaggerFrom)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className=" z-30 border-none rounded-none absolute bottom-0 right-0 "
                  >
                    <SelectValue placeholder="Stagger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="edges">Edges</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                size={"sm"}
                variant={"copy"}
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
              <div />
              <div className=" border-r border-dashed h-full -mr-[0.5px] " />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-dashed rounded-none"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-none border-dashed ${
                  currentPage === page ? "" : ""
                }`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="border-dashed rounded-none"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
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

      {/* Circular border */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>

      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>

      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
