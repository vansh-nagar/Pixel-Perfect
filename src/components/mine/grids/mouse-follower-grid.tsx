"use client";
import MouseFollower1 from "../../../../registry/new-york/mouse-follower/mouse-follower1";
import BendMouseFollower from "../../../../registry/new-york/mouse-follower/bend-mouse-follower";
import BendButtonFollower from "../../../../registry/new-york/mouse-follower/bend-button-follower";
import DitherCursorTrail from "../../../../registry/new-york/mouse-follower/dither-cursor-trail";
import PixelCursorTrail from "../../../../registry/new-york/mouse-follower/pixel-cursor-trail";
import GravityImageTrail from "../../../../registry/new-york/mouse-follower/gravity-image-trail";
import ScaleImageTrail from "../../../../registry/new-york/mouse-follower/scale-image-trail";
import ImageTrailEffects from "../../../../registry/new-york/mouse-follower/image-trail-effects";
import MotionTrailClassic from "../../../../registry/new-york/mouse-follower/motion-trail-classic";
import IconFall from "@/components/rune-landing/icon-fall";
import CopyDropdown from "../copy-dropdown";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const MouseFollowerArr = [
  {
    name: "Bend Follower",
    description:
      "A frame smoothly chases the cursor and warps with an air-friction bend on a WebGL plane.",
    component: <BendMouseFollower />,
    registryName: "bend-mouse-follower",
  },
  {
    name: "Bend Button",
    description:
      "A rounded button that smoothly follows the cursor and leans with its motion for an air-friction feel.",
    component: <BendButtonFollower />,
    registryName: "bend-button-follower",
  },
  {
    name: "Pixel Cursor Trail",
    description:
      "Hovered grid cells flash and fade behind the cursor for a pixelated trail.",
    component: <PixelCursorTrail />,
    registryName: "pixel-cursor-trail",
  },
  {
    name: "Image Fall",
    description: "Image trail mouse follower using GSAP.",
    component: <MouseFollower1 />,
    registryName: "mouse-follower-1",
  },
  {
    name: "Gravity Image Trail",
    description:
      "Images cascade from the cursor, fall, and bounce off the bottom edge using GSAP.",
    component: <GravityImageTrail />,
    registryName: "gravity-image-trail",
  },
  {
    name: "Scale Image Trail",
    description:
      "Images pop in with a bouncy scale behind the cursor, then shrink away using GSAP.",
    component: <ScaleImageTrail />,
    registryName: "scale-image-trail",
  },
  {
    name: "Image Trail Effects",
    description:
      "A cursor image trail with six switchable reveal effects — flame, venetian, curtain, hexagon, liquid and zoom split.",
    component: <ImageTrailEffects />,
    registryName: "image-trail-effects",
  },
  {
    name: "Motion Trail · Classic",
    description:
      "Images appear at the cursor, glide to it, then scale and fade out. (GSAP)",
    component: <MotionTrailClassic />,
    registryName: "motion-trail-classic",
  },
  {
    name: "Icon Fall",
    description: "Icon trail mouse follower using GSAP.",
    component: <IconFall />,
    registryName: "mouse-follower-2",
  },
  {
    name: "Dither Cursor Trail",
    description: "A pale blue pixel cloud follows the pointer and softly fades at rest.",
    component: (
      <DitherCursorTrail color="#818cf8" opacity={0.3} radius={0.075} />
    ),
    registryName: "dither-cursor-trail",
  },
];

const itemsPerPage = 4;

const MouseFollower = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(MouseFollowerArr.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = MouseFollowerArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {paginatedItems.map((item, index) => (
          <div
            key={startIndex + index}
            className="relative max-h-[90vh] w-full border-b border-l border-dashed aspect-square flex justify-center items-center"
          >
            {item.component}

            <div className="pointer-events-none absolute left-1.5 top-1.5 z-40 text-[10px] tabular-nums text-muted-foreground">
              {String(startIndex + index + 1).padStart(2, "0")}
            </div>

            <div className=" leading-1 absolute left-1.5  bottom-1.5">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
              <div className=" border-t border-dashed "></div>
              <CopyDropdown registryName={item.registryName} variant="ghost" />
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
                className="h-8 w-8 rounded-none border-dashed"
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

export default MouseFollower;
