"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import InfiniteCarousel from "registry/new-york/carousel/infinite-carousel";
import ScrollDirectionCarousel from "registry/new-york/carousel/scroll-direction-carousel";
import RadialCarousel from "registry/new-york/carousel/radial-carousel";
import CardsSlider from "registry/new-york/carousel/cards-slider";
import PerspectiveDeckCarousel from "registry/new-york/carousel/perspective-deck-carousel";
import FannedDeckCarousel from "registry/new-york/carousel/fanned-deck-carousel";
import CoverFlowCarousel from "registry/new-york/carousel/cover-flow-carousel";
import SlicedRevealCarousel from "registry/new-york/carousel/sliced-reveal-carousel";
import AccordionCarousel from "registry/new-york/carousel/accordion-carousel";
import OrbitCarousel from "registry/new-york/carousel/orbit-carousel";
import CubeCarousel from "registry/new-york/carousel/cube-carousel";
import SlatFlipCarousel from "registry/new-york/carousel/slat-flip-carousel";
import TossDeckCarousel from "registry/new-york/carousel/toss-deck-carousel";
import FerrisWheelCarousel from "registry/new-york/carousel/ferris-wheel-carousel";
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
  {
    name: "Cover Flow Carousel",
    description:
      "A classic cover-flow: the centre cover faces you while side covers angle inward with depth and a floor reflection. Drag to scrub with snap, click a side cover to bring it front, or let it auto-advance.",
    component: <CoverFlowCarousel />,
    registryName: "cover-flow-carousel",
  },
  {
    name: "Sliced Reveal Carousel",
    description:
      "Slide transitions slice the photo into vertical strips that cascade in one column at a time — the new image sweeps up while the old sweeps away, offset by a per-strip stagger.",
    component: <SlicedRevealCarousel />,
    registryName: "sliced-reveal-carousel",
  },
  {
    name: "Accordion Carousel",
    description:
      "An accordion of vertical image panels — the active panel springs wide to reveal its photo and caption while the rest compress into slim slivers with sideways titles. Click to expand; auto-advances until hovered.",
    component: <AccordionCarousel />,
    registryName: "accordion-carousel",
  },
  {
    name: "Orbit Carousel",
    description:
      "Cards orbit an ellipse in faux-3D — swinging to the front they scale up and stack forward; passing behind they shrink, dim and blur. Drag to spin with momentum; it drifts on its own when idle.",
    component: <OrbitCarousel />,
    registryName: "orbit-carousel",
  },
  {
    name: "Cube Carousel",
    description:
      "Slides live on the faces of a 3D prism that rotates to advance, dipping back in scale mid-turn like it needs room to swing. Drag to spin it freely with snap, or let it auto-rotate — faces are reassigned on the fly so any number of slides fits on four faces.",
    component: <CubeCarousel />,
    registryName: "cube-carousel",
  },
  {
    name: "Slat Flip Carousel",
    description:
      "The image is split into horizontal louver slats that flip 180° about their own axis in a stagger — the new slide rides in on the back of each slat like rotating window blinds.",
    component: <SlatFlipCarousel />,
    registryName: "slat-flip-carousel",
  },
  {
    name: "Toss Deck Carousel",
    description:
      "A messy pile of polaroids — flick the top one away and it flies off with your throw while the pile shuffles up and a new photo slips in underneath. Tosses itself when idle; the pile never runs out.",
    component: <TossDeckCarousel />,
    registryName: "toss-deck-carousel",
  },
  {
    name: "Ferris Wheel Carousel",
    description:
      "Gondola cards hang from a slowly turning ferris wheel — they stay upright as the wheel rotates and swing like pendulums when it speeds up or brakes. Drag anywhere to spin it with momentum.",
    component: <FerrisWheelCarousel />,
    registryName: "ferris-wheel-carousel",
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
