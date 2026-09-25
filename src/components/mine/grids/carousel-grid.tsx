"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { RefreshCcw } from "lucide-react";
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
import SlatFlipCarousel from "registry/new-york/carousel/slat-flip-carousel";
import TossDeckCarousel from "registry/new-york/carousel/toss-deck-carousel";
import FerrisWheelCarousel from "registry/new-york/carousel/ferris-wheel-carousel";
import CylinderCarousel from "registry/new-york/carousel/cylinder-carousel";
import CopyDropdown from "../copy-dropdown";
import GridPagination from "./_shared/grid-pagination";

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
      "A seamless infinite carousel: drifts on its own, speeds up and reverses with scroll velocity, and can be dragged to scrub. One GSAP timeline drives all three.",
    component: <InfiniteCarousel />,
    registryName: "infinite-carousel",
  },
  {
    name: "Cards Slider",
    description:
      "An infinite deck of product cards: the active card sits front-and-centre while the rest fan out behind with less scale and a soft blur. Drag, click a peeking card, or let it auto-advance; the index wraps forever.",
    component: <CardsSlider />,
    registryName: "cards-slider",
  },
  {
    name: "Perspective Deck Carousel",
    description:
      "Flat colour cards fanned along a 3D diagonal that recedes up-and-to-the-right. It auto-slides and loops infinitely with no seam, and can be dragged to scrub through the deck.",
    component: <PerspectiveDeckCarousel />,
    registryName: "perspective-deck-carousel",
  },
  {
    name: "Fanned Deck Carousel",
    description:
      "Flat colour cards fanned along a flat diagonal (no depth recede), each angled about Y. Auto-slides, loops infinitely with no seam, and can be dragged to scrub.",
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
      "Slide transitions cut the slide into vertical strips that cascade in one column at a time: the new slide sweeps up while the old sweeps away, offset by a per-strip stagger.",
    component: <SlicedRevealCarousel />,
    registryName: "sliced-reveal-carousel",
  },
  {
    name: "Accordion Carousel",
    description:
      "An accordion of flat colour panels: the active panel springs wide to reveal its pattern and caption while the rest compress into slim slivers with sideways titles. Click to expand; auto-advances until hovered.",
    component: <AccordionCarousel />,
    registryName: "accordion-carousel",
  },
  {
    name: "Orbit Carousel",
    description:
      "Cards orbit an ellipse in faux-3D. Swinging to the front they scale up and stack forward; passing behind they shrink, dim and blur. Drag to spin with momentum; it drifts on its own when idle.",
    component: <OrbitCarousel />,
    registryName: "orbit-carousel",
  },
  {
    name: "Slat Flip Carousel",
    description:
      "The slide is split into horizontal louver slats that flip 180° about their own axis in a stagger: the new slide rides in on the back of each slat like rotating window blinds.",
    component: <SlatFlipCarousel />,
    registryName: "slat-flip-carousel",
  },
  {
    name: "Toss Deck Carousel",
    description:
      "A messy pile of polaroids with flat colour prints: flick the top one away and it flies off with your throw while the pile shuffles up and a new one slips in underneath. Tosses itself when idle; the pile never runs out.",
    component: <TossDeckCarousel />,
    registryName: "toss-deck-carousel",
  },
  {
    name: "Ferris Wheel Carousel",
    description:
      "Gondola cards hang from a slowly turning ferris wheel: they stay upright as the wheel rotates and swing like pendulums when it speeds up or brakes. Drag anywhere to spin it with momentum.",
    component: <FerrisWheelCarousel />,
    registryName: "ferris-wheel-carousel",
  },
  {
    name: "Cylinder Carousel",
    description:
      "Flat, high-contrast discs line the inside wall of a 3D cylinder, seen from its rim: they fly in from a wide spin, bob gently in place, and the ring turns as you drag. The whole scene leans toward the cursor.",
    component: <CylinderCarousel />,
    registryName: "cylinder-carousel",
  },
];

const CarouselGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const itemsPerPage = 4;
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
              aria-label={`Restart ${item.name}`}
              className="absolute left-1.5 top-1.5 z-40 h-6 w-6 rounded-none border border-dashed border-transparent bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:border-border hover:bg-background/90 hover:text-foreground"
              onClick={() => handleRefresh(startIndex + index)}
            >
              <RefreshCcw className="size-3" />
            </Button>

            <div className="absolute bottom-0 left-0 z-40 max-w-md px-2.5 py-2">
              <p className="text-xs font-medium tracking-tight text-foreground">
                {item.name}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-pretty text-muted-foreground">
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

      <GridPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onChange={setCurrentPage}
      />
    </div>
  );
};

export default CarouselGrid;
