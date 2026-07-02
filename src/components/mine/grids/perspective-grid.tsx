"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import SpinningCubeMotion from "registry/new-york/perspective/spinning-cube-motion";
import TiltCardGlare from "registry/new-york/perspective/tilt-card-glare";
import RotatingRingCarousel from "registry/new-york/perspective/rotating-ring-carousel";
import HoverLayerStack from "registry/new-york/perspective/hover-layer-stack";
import HelixSpinner from "registry/new-york/perspective/helix-spinner";
import FlipTileWave from "registry/new-york/perspective/flip-tile-wave";
import FlipClockCounter from "registry/new-york/perspective/flip-clock-counter";
import GyroscopeRings from "registry/new-york/perspective/gyroscope-rings";
import AccordionFold from "registry/new-york/perspective/accordion-fold";
import DepthTunnel from "registry/new-york/perspective/depth-tunnel";
import SwingDoorReveal from "registry/new-york/perspective/swing-door-reveal";
import PageFlipBook from "registry/new-york/perspective/page-flip-book";
import ExplodingDiceCube from "registry/new-york/perspective/exploding-dice-cube";
import CoverflowMarquee from "registry/new-york/perspective/coverflow-marquee";
import DominoRun from "registry/new-york/perspective/domino-run";
import OrbitOrrery from "registry/new-york/perspective/orbit-orrery";
import PerspectiveTextCrawl from "registry/new-york/perspective/perspective-text-crawl";
import SwingingSign from "registry/new-york/perspective/swinging-sign";
import CopyDropdown from "../copy-dropdown";

const PerspectiveComponentArr: {
  name: string;
  description: string;
  Component: React.ComponentType;
  registryName: string;
}[] = [
  {
    name: "Spinning Cube",
    description:
      "3D cube spinning on its Y axis with a fixed tilt, built with CSS 3D transforms and Framer Motion.",
    Component: SpinningCubeMotion,
    registryName: "spinning-cube-motion",
  },
  {
    name: "Tilt Card",
    description:
      "Mouse-tracked 3D tilt card with parallax depth layers and a moving glare highlight.",
    Component: TiltCardGlare,
    registryName: "tilt-card-glare",
  },
  {
    name: "Ring Carousel",
    description:
      "Numbered panels arranged in a 3D ring, slowly orbiting the Y axis like a cylindrical carousel.",
    Component: RotatingRingCarousel,
    registryName: "rotating-ring-carousel",
  },
  {
    name: "Layer Stack",
    description:
      "Isometric stack of UI layers that lifts apart on hover, exploding the interface into its depth.",
    Component: HoverLayerStack,
    registryName: "hover-layer-stack",
  },
  {
    name: "Helix Spinner",
    description:
      "A column of bars offset a few degrees each, spinning together as a twisting 3D helix.",
    Component: HelixSpinner,
    registryName: "helix-spinner",
  },
  {
    name: "Flip Tile Wave",
    description:
      "A grid of two-faced tiles flipping in a diagonal 3D wave, revealing their dark side and back.",
    Component: FlipTileWave,
    registryName: "flip-tile-wave",
  },
  {
    name: "Flip Clock",
    description:
      "A split-flap clock digit that folds down every tick like a mechanical departure board.",
    Component: FlipClockCounter,
    registryName: "flip-clock-counter",
  },
  {
    name: "Gyroscope",
    description:
      "Three rings spinning on tilted axes around a pulsing core, with beads orbiting each ring.",
    Component: GyroscopeRings,
    registryName: "gyroscope-rings",
  },
  {
    name: "Accordion Fold",
    description:
      "A paper map of hinged panels that folds itself up like an accordion and flattens back out.",
    Component: AccordionFold,
    registryName: "accordion-fold",
  },
  {
    name: "Depth Tunnel",
    description:
      "Concentric frames flying toward the viewer in an endless, slowly twisting depth tunnel.",
    Component: DepthTunnel,
    registryName: "depth-tunnel",
  },
  {
    name: "Door Reveal",
    description:
      "A door that swings open on hover with a springy 3D hinge, revealing a glowing light behind.",
    Component: SwingDoorReveal,
    registryName: "swing-door-reveal",
  },
  {
    name: "Page Flip",
    description:
      "An open book lying in perspective, endlessly turning its pages with a 3D flip around the spine.",
    Component: PageFlipBook,
    registryName: "page-flip-book",
  },
  {
    name: "Exploding Dice",
    description:
      "A spinning 3D die whose six pip faces fly apart into an exploded view on hover and spring back.",
    Component: ExplodingDiceCube,
    registryName: "exploding-dice-cube",
  },
  {
    name: "Coverflow",
    description:
      "An endless coverflow: cards glide across the stage, swinging flat as they pass center, with reflections.",
    Component: CoverflowMarquee,
    registryName: "coverflow-marquee",
  },
  {
    name: "Domino Run",
    description:
      "A receding row of dominoes toppling toward the camera one by one, then standing back up in a wave.",
    Component: DominoRun,
    registryName: "domino-run",
  },
  {
    name: "Orrery",
    description:
      "A miniature orrery: planets circling a pulsing sun on a tilted orbital plane seen in perspective.",
    Component: OrbitOrrery,
    registryName: "orbit-orrery",
  },
  {
    name: "Text Crawl",
    description:
      "An opening-crawl of text scrolling up a tilted plane and fading into the distance, movie-style.",
    Component: PerspectiveTextCrawl,
    registryName: "perspective-text-crawl",
  },
  {
    name: "Swinging Sign",
    description:
      "A hanging shop sign swinging toward and away from the camera on its strings like a pendulum.",
    Component: SwingingSign,
    registryName: "swinging-sign",
  },
];

const PerspectiveGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const itemsPerPage = 6;
  const totalPages = Math.ceil(PerspectiveComponentArr.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = PerspectiveComponentArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
        {paginatedItems.map((item, index) => {
          const Component = item.Component;
          return (
            <div
              key={startIndex + index}
              className="relative w-full border-b border-l border-dashed aspect-square flex justify-center items-center"
            >
              <div className="z-30" key={refreshKeys[startIndex + index] || 0}>
                <Component />
              </div>

              <div className="absolute left-1.5 top-1.5 z-40 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-none text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => handleRefresh(startIndex + index)}
                >
                  <RefreshCcw className="size-3" />
                </Button>
              </div>

              <div className=" leading-1 absolute left-1.5  bottom-1.5">
                <p className="text-xs ">{item.name}</p>
                <p className="text-[8px] text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="absolute inset-x-0 top-0 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
                <div className="border-t border-dashed" />
                <CopyDropdown
                  registryName={item.registryName}
                  variant="ghost"
                />
                <div />
                <div className="h-full border-r border-dashed -mr-[0.5px]" />
              </div>
            </div>
          );
        })}
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

export default PerspectiveGrid;
