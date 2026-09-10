"use client";
import PhotoRingOrbit from "../../../../registry/new-york/image-animations/photo-ring-orbit";
import PhotoSphereDrift from "../../../../registry/new-york/image-animations/photo-sphere-drift";
import PhotoCoverflowCycle from "../../../../registry/new-york/image-animations/photo-coverflow-cycle";
import PhotoLemniscateFlight from "../../../../registry/new-york/image-animations/photo-lemniscate-flight";
import PhotoSpiralVortex from "../../../../registry/new-york/image-animations/photo-spiral-vortex";
import PhotoTrefoilWeave from "../../../../registry/new-york/image-animations/photo-trefoil-weave";
import CopyDropdown from "../copy-dropdown";

export const ImageAnimationsArr = [
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
  {
    name: "Trefoil Weave",
    description:
      "Photos threading a trefoil knot, weaving through their own trail as it turns.",
    component: <PhotoTrefoilWeave />,
    registryName: "photo-trefoil-weave",
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

          <div className="leading-1 absolute bottom-1.5 left-1.5 z-40">
            <p className="text-xs">{item.name}</p>
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
  );
};

export default ImageAnimationsGrid;
