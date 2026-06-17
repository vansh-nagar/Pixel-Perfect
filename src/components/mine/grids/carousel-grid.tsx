"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import InfiniteCarousel from "registry/new-york/carousel/infinite-carousel";
import ScrollDirectionCarousel from "registry/new-york/carousel/scroll-direction-carousel";
import RadialCarousel from "registry/new-york/carousel/radial-carousel";
import CardsSlider from "registry/new-york/carousel/cards-slider";
import RingCarousel3D from "registry/new-york/carousel/ring-carousel-3d";
import PerspectiveDeckCarousel from "registry/new-york/carousel/perspective-deck-carousel";
import FannedDeckCarousel from "registry/new-york/carousel/fanned-deck-carousel";
import CopyDropdown from "../copy-dropdown";

const CarouselGridArr = [
  {
    name: "Radial Carousel",
    description:
      "Cards fan along a circular arc and the wheel spins around its center as you scroll, carrying velocity momentum.",
    component: <RadialCarousel />,
    registryName: "radial-carousel",
  },
  {
    name: "Scroll Direction Carousel",
    description:
      "Travel direction follows your scroll direction; speed ramps with scroll velocity, then eases back to a gentle drift.",
    component: <ScrollDirectionCarousel />,
    registryName: "scroll-direction-carousel",
  },
  {
    name: "Infinite Carousel",
    description:
      "A seamless infinite carousel: drifts on its own, speeds up and reverses with scroll velocity, and can be dragged to scrub — one GSAP timeline drives all three.",
    component: <InfiniteCarousel />,
    registryName: "infinite-carousel",
  },
  {
    name: "Cards Slider",
    description:
      "An infinite deck of product cards: the active card sits front-and-centre while the rest fan out behind with less scale and a soft blur. Drag, click a peeking card, or let it auto-advance — the index wraps forever.",
    component: <CardsSlider />,
    registryName: "cards-slider",
  },
  {
    name: "Ring Carousel 3D",
    description:
      "Image cards arranged around a circle in real 3D space: the ring drifts on its own, spins when you drag with carried momentum, and cards brighten toward the front and dim toward the back.",
    component: <RingCarousel3D />,
    registryName: "ring-carousel-3d",
  },
  {
    name: "Perspective Deck Carousel",
    description:
      "Image cards fanned along a 3D diagonal that recedes up-and-to-the-right. It auto-slides and loops infinitely with no seam, and can be dragged to scrub through the deck.",
    component: <PerspectiveDeckCarousel />,
    registryName: "perspective-deck-carousel",
  },
  {
    name: "Fanned Deck Carousel",
    description:
      "Image cards fanned along a flat diagonal (no depth recede), each angled about Y. Auto-slides, loops infinitely with no seam, and can be dragged to scrub.",
    component: <FannedDeckCarousel />,
    registryName: "fanned-deck-carousel",
  },
];

const CarouselGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const itemsPerPage = CarouselGridArr.length;
  const totalPages = Math.ceil(CarouselGridArr.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = CarouselGridArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 gap-3">
        {paginatedItems.map((item, index) => (
          <div
            key={startIndex + index}
            className="relative w-full border-b border-l border-dashed h-[80vh] flex justify-center items-center overflow-hidden"
          >
            <div
              className="z-30 w-full"
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

export default CarouselGrid;
