"use client";
import PhotoSweepConveyor from "../../../../registry/new-york/image-animations/photo-sweep-conveyor";
import CreativeSpaceGallery from "../../../../registry/new-york/image-animations/creative-space-gallery";
import PhotoMagnetGrid from "../../../../registry/new-york/image-animations/photo-magnet-grid";
import PhotoFlipWall from "../../../../registry/new-york/image-animations/photo-flip-wall";
import PhotoRingOrbit from "../../../../registry/new-york/image-animations/photo-ring-orbit";
import PhotoSphereDrift from "../../../../registry/new-york/image-animations/photo-sphere-drift";
import PhotoCoverflowCycle from "../../../../registry/new-york/image-animations/photo-coverflow-cycle";
import PhotoLemniscateFlight from "../../../../registry/new-york/image-animations/photo-lemniscate-flight";
import PhotoSpiralVortex from "../../../../registry/new-york/image-animations/photo-spiral-vortex";
import CopyDropdown from "../copy-dropdown";

export const ImageAnimationsArr = [
  {
    name: "Sweep Conveyor",
    description:
      "Photos sweep across a pinned stage on scroll, blooming at random heights before collapsing. Scroll inside the card to play.",
    component: <PhotoSweepConveyor />,
    registryName: "photo-sweep-conveyor",
  },
  {
    name: "Magnet Grid",
    description: "Move over the grid and the photos flee the cursor like same-pole magnets, then spring back.",
    component: <PhotoMagnetGrid />,
    registryName: "photo-magnet-grid",
  },
  {
    name: "Flip Wall",
    description: "Sweep across a wall of cubes and each one flips to reveal the next photo, piece by piece.",
    component: <PhotoFlipWall />,
    registryName: "photo-flip-wall",
  },
  {
    name: "Creative Space",
    description: "Drag the image field to turn it in three dimensions, then release to coast.",
    component: <CreativeSpaceGallery />,
    registryName: "creative-space-gallery",
  },
  {
    name: "Ring Orbit",
    description:
      "Photos evenly spaced on a circle that expands open, then turns forever.",
    component: <PhotoRingOrbit />,
    registryName: "photo-ring-orbit",
  },
  {
    name: "Sphere Drift",
    description:
      "Photos scattered over a sphere by the golden angle, tumbling on two axes at once.",
    component: <PhotoSphereDrift />,
    registryName: "photo-sphere-drift",
  },
  {
    name: "Coverflow Cycle",
    description:
      "A cover-flow that steps forward one card at a time, the back of the deck blurred and dimmed.",
    component: <PhotoCoverflowCycle />,
    registryName: "photo-coverflow-cycle",
  },
  {
    name: "Lemniscate Flight",
    description:
      "Photos flying a figure-eight through real depth, swapping which lobe is in front.",
    component: <PhotoLemniscateFlight />,
    registryName: "photo-lemniscate-flight",
  },
  {
    name: "Spiral Vortex",
    description:
      "Photos spiralling endlessly inward, shrinking away as they reach the centre.",
    component: <PhotoSpiralVortex />,
    registryName: "photo-spiral-vortex",
  },
];

const ImageAnimationsGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ImageAnimationsArr.map((item, index) => (
        <div
          key={index}
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-l border-dashed"
        >
          <div className="z-30 flex w-full min-w-0 items-center justify-center">
            {item.component}
          </div>

          <div className="pointer-events-none leading-1 absolute bottom-1.5 left-1.5 z-40 text-foreground">
            <p className="text-xs">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-50 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
            <div className="border-t border-dashed" />
            <div className="pointer-events-auto"><CopyDropdown registryName={item.registryName} variant="ghost" /></div>
            <div />
            <div className="h-full border-r border-dashed -mr-[0.5px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageAnimationsGrid;
