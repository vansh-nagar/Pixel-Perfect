"use client";
import { GridCard, GridShell } from "./_shared/grid-card";
import { GhostCursor } from "./_shared/ghost-cursor";
import { useRef } from "react";
import BendMouseFollower from "../../../../registry/new-york/mouse-follower/bend-mouse-follower";
import BendButtonFollower from "../../../../registry/new-york/mouse-follower/bend-button-follower";
import DitherCursorTrail from "../../../../registry/new-york/mouse-follower/dither-cursor-trail";
import PixelDisplaceField from "../../../../registry/new-york/mouse-follower/pixel-displace-field";
import PixelCursorTrail from "../../../../registry/new-york/mouse-follower/pixel-cursor-trail";
import MotionTrailClassic from "../../../../registry/new-york/mouse-follower/motion-trail-classic";
import IconFall from "@/components/rune-landing/icon-fall";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

export const MouseFollowerArr = [
  {
    name: "Pixel Displace Field",
    description:
      "A pixelated pink-and-violet galaxy of grid-locked squares that scatter away from the cursor and spring back.",
    component: <PixelDisplaceField />,
    registryName: "pixel-displace-field",
  },
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
    description:
      "A pale blue pixel cloud follows the pointer and softly fades at rest.",
    component: (
      <DitherCursorTrail color="#818cf8" opacity={0.3} radius={0.075} />
    ),
    registryName: "dither-cursor-trail",
  },
];

const MouseFollower = () => {
  const { visible, sentinelRef, hasMore } = useInfiniteItems(
    MouseFollowerArr,
    4,
  );

  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={gridRef}>
      <GhostCursor containerRef={gridRef} />
      <GridShell
        footer={
          hasMore && <div ref={sentinelRef} aria-hidden className="h-px" />
        }
      >
        {visible.map((item) => (
          <GridCard
            key={item.registryName}
            name={item.name}
            description={item.description}
            registryName={item.registryName}
            className="max-h-[90vh]"
            fill
          >
            {item.component}
          </GridCard>
        ))}
      </GridShell>
    </div>
  );
};

export default MouseFollower;
