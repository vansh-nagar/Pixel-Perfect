"use client";
import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import FlipTextReveal from "registry/new-york/gsap/flip-text-reveal";
import Stagger1 from "registry/new-york/gsap/stagger1";
import BendZoomReveal from "registry/new-york/gsap/bend-zoom-reveal";
import TextAlongPath from "registry/new-york/gsap/text-along-path";
import ColorFlairButton from "registry/new-york/motion-framer/color-flair-button";
import InertiaArrowCard from "registry/new-york/motion-framer/inertia-arrow-card";
import CopyDropdown from "../copy-dropdown";

type GridItem = {
  name: string;
  description: string;
  component: ReactNode;
  registryName: string;
  span?: 1 | 2; // how many columns the card covers (default 1)
};

const GsapStaggerGridArr: GridItem[] = [
  {
    name: "Bend Zoom",
    description:
      "A frame flies in, then zooms to fill the box as you scroll inside it, warping with an air-friction bend on a WebGL plane.",
    component: <BendZoomReveal columns={2} />,
    registryName: "bend-zoom-reveal",
    span: 2,
  },
  {
    name: "Text Along Path",
    description:
      "Repeated text glides endlessly around a curved SVG path, looped seamlessly with a GSAP timeline.",
    component: <TextAlongPath />,
    registryName: "text-along-path",
    span: 2,
  },
  {
    name: "Inertia Arrow Card",
    description:
      "A notched card whose magnetic pill button flings with GSAP InertiaPlugin in the direction and speed of the cursor.",
    component: <InertiaArrowCard />,
    registryName: "inertia-arrow-card",
  },
  {
    name: "Color Flair Button",
    description:
      "Concentric color circles bloom from the cursor's entry point, trail it, and peel back on exit.",
    component: <ColorFlairButton />,
    registryName: "color-flair-button",
  },
  {
    name: "Streak counter",
    description: "A Streak counter ripple animation using GSAP.",
    component: <Stagger1 />,
    registryName: "stagger-1",
  },
  {
    name: "Flip text reveal",
    description:
      "A GSAP Flip orb transition followed by a staggered text reveal.",
    component: <FlipTextReveal />,
    registryName: "flip-text-reveal",
  },
];

const GsapGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const itemsPerPage = 6;
  const totalPages = Math.ceil(GsapStaggerGridArr.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = GsapStaggerGridArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {paginatedItems.map((item, index) => (
          <div
            key={startIndex + index}
            className={`relative w-full border-b border-l border-dashed flex justify-center items-center ${
              item.span === 2 ? "sm:col-span-2 aspect-2/1" : "aspect-square"
            }`}
          >
            <div
              className={`z-30 ${item.span === 2 ? "h-full w-full p-6" : ""}`}
              key={refreshKeys[startIndex + index] || 0}
            >
              {item.component}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1.5 top-1.5 z-40 h-6 w-6 rounded-none text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => handleRefresh(startIndex + index)}
            >
              <RefreshCcw className="size-3" />
            </Button>

            <div className=" leading-1 absolute left-1.5  bottom-1.5">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
              <div className="border-t border-dashed" />
              <CopyDropdown registryName={item.registryName} variant="ghost" />
              <div />
              <div className="h-full border-r border-dashed -mr-[0.5px]" />
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
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 rounded-none border-dashed"
                >
                  {page}
                </Button>
              ),
            )}
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

export default GsapGrid;
