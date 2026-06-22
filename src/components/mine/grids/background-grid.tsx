"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type JSX } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import CopyDropdown from "../copy-dropdown";

import ProgressiveBlur from "../../../../registry/new-york/backgrounds/progressive-blur";
import GradientGlowFade from "../../../../registry/new-york/backgrounds/gradient-glow-fade";
import GradientBottomBloom from "../../../../registry/new-york/backgrounds/gradient-bottom-bloom";
import GradientDiagonalPattern from "../../../../registry/new-york/backgrounds/gradient-diagonal-pattern";
import GradientDualGrid from "../../../../registry/new-york/backgrounds/gradient-dual-grid";
import GradientDotMesh from "../../../../registry/new-york/backgrounds/gradient-dot-mesh";
import GradientPurpleBlue from "../../../../registry/new-york/backgrounds/gradient-purple-blue";
import GradientConicSweep from "../../../../registry/new-york/backgrounds/gradient-conic-sweep";
import GradientSunsetGlow from "../../../../registry/new-york/backgrounds/gradient-sunset-glow";
import GradientCoralBlur from "../../../../registry/new-york/backgrounds/gradient-coral-blur";
import GradientCoolAurora from "../../../../registry/new-york/backgrounds/gradient-cool-aurora";
import GradientFieryAurora from "../../../../registry/new-york/backgrounds/gradient-fiery-aurora";
import GradientGoldSheen from "../../../../registry/new-york/backgrounds/gradient-gold-sheen";
import GradientChrome from "../../../../registry/new-york/backgrounds/gradient-chrome";
import GradientPurpleMetal from "../../../../registry/new-york/backgrounds/gradient-purple-metal";
import GradientSteelMetal from "../../../../registry/new-york/backgrounds/gradient-steel-metal";
import SilverMetallic from "../../../../registry/new-york/backgrounds/silver-metallic";
import NexvynGradient from "../../../../registry/new-york/backgrounds/nexvyn-gradient";

type BackgroundItem = {
  name: string;
  description: string;
  component: JSX.Element;
  registryName: string;
};

export const BackgroudArr: BackgroundItem[] = [
  {
    name: "Progressive Blur",
    description: "Layered backdrop-blur fade",
    component: <ProgressiveBlur />,
    registryName: "progressive-blur",
  },
  {
    name: "Gradient 1",
    description: "Radial glow fade",
    component: <GradientGlowFade />,
    registryName: "gradient-glow-fade",
  },
  {
    name: "Gradient 2",
    description: "Bottom radial bloom",
    component: <GradientBottomBloom />,
    registryName: "gradient-bottom-bloom",
  },
  {
    name: "Gradient 3",
    description: "Diagonal micro pattern",
    component: <GradientDiagonalPattern />,
    registryName: "gradient-diagonal-pattern",
  },
  {
    name: "Gradient 4",
    description: "Dual grid system",
    component: <GradientDualGrid />,
    registryName: "gradient-dual-grid",
  },
  {
    name: "Gradient 5",
    description: "Dot mesh texture",
    component: <GradientDotMesh />,
    registryName: "gradient-dot-mesh",
  },
  {
    name: "Gradient 6",
    description: "Purple-blue angled gradient",
    component: <GradientPurpleBlue />,
    registryName: "gradient-purple-blue",
  },
  {
    name: "Gradient 7",
    description: "Multi-layer conic sweep",
    component: <GradientConicSweep />,
    registryName: "gradient-conic-sweep",
  },
  {
    name: "Gradient 8",
    description: "Sunset glow with inner shadow",
    component: <GradientSunsetGlow />,
    registryName: "gradient-sunset-glow",
  },
  {
    name: "Gradient 9",
    description: "Coral blur with warm shadows",
    component: <GradientCoralBlur />,
    registryName: "gradient-coral-blur",
  },
  {
    name: "Gradient 10",
    description: "Cool aurora pill glow",
    component: <GradientCoolAurora />,
    registryName: "gradient-cool-aurora",
  },
  {
    name: "Gradient 11",
    description: "Fiery aurora radial glow",
    component: <GradientFieryAurora />,
    registryName: "gradient-fiery-aurora",
  },
  {
    name: "Gradient 12",
    description: "Gold metallic sheen",
    component: <GradientGoldSheen />,
    registryName: "gradient-gold-sheen",
  },
  {
    name: "Gradient 14",
    description: "Chrome metallic reflection",
    component: <GradientChrome />,
    registryName: "gradient-chrome",
  },
  {
    name: "Gradient 15",
    description: "Purple brushed metal",
    component: <GradientPurpleMetal />,
    registryName: "gradient-purple-metal",
  },
  {
    name: "Gradient 16",
    description: "Steel brushed metal",
    component: <GradientSteelMetal />,
    registryName: "gradient-steel-metal",
  },
  {
    name: "Silver metallic",
    description: "A simple gradient for Nexvyn",
    component: <SilverMetallic />,
    registryName: "silver-metallic",
  },
  {
    name: "Nexvyn gradient",
    description: "Soft purple-orange radial",
    component: <NexvynGradient />,
    registryName: "nexvyn-gradient",
  },
];

const BackgroundGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(BackgroudArr.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = BackgroudArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {paginatedItems.map((item, index) => (
          <div
            key={startIndex + index}
            className="relative group border-b border-l border-dashed  aspect-video flex items-center justify-center "
          >
            <div className=" z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-background/50">
                {item.component}
              </div>
            </div>

            <div className=" leading-1 absolute left-1.5  bottom-1.5 z-40">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>

            <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
              <div className=" border-t border-dashed "></div>
              <CopyDropdown registryName={item.registryName} />
              <div />
              <div className=" border-r border-dashed h-full -mr-[0.5px] " />
            </div>
          </div>
        ))}
      </div>

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
                className="w-8 h-8 rounded-none border-dashed"
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

export default BackgroundGrid;
