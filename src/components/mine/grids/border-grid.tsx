"use client";
import Border1 from "../../../../registry/new-york/borders/border1";
import Border2 from "../../../../registry/new-york/borders/border2";
import Intersection1 from "../../../../registry/new-york/borders/intersection1";
import Intersection2 from "../../../../registry/new-york/borders/intersection2";
import StarBorders from "../../../../registry/new-york/borders/star-border";
import CropMarks from "../../../../registry/new-york/borders/crop-marks";
import RulerBorder from "../../../../registry/new-york/borders/ruler-border";
import CrosshairFrame from "../../../../registry/new-york/borders/crosshair-frame";
import DimensionBorder from "../../../../registry/new-york/borders/dimension-border";
import SelectionMarquee from "../../../../registry/new-york/borders/selection-marquee";
import FocusBrackets from "../../../../registry/new-york/borders/focus-brackets";
import CopyDropdown from "../copy-dropdown";

export const BorderArr = [
  {
    name: "Square Border",
    description: "A dashed border design using CSS.",
    component: <Border1 />,
    registryName: "border-1",
  },
  {
    name: "Simple Dashed Border",
    description: "A border design using CSS.",
    component: <Border2 />,
    registryName: "border-2",
  },
  {
    name: "Intersection (Scope)",
    description: "An intersection design using CSS.",
    component: <Intersection1 />,
    registryName: "intersection-1",
  },
  {
    name: "Star Borders",
    description: "An intersection design using CSS.",
    component: (
      <Intersection2>
        <div className="m-3 text-xs">
          Your Content <br /> Here
        </div>
      </Intersection2>
    ),
    image: "",
    registryName: "intersection-2",
  },
  {
    name: "Star Border",
    description: "Star border with animated corners.",
    component: <StarBorders />,
    image: "",
    registryName: "star-border",
  },
  // The frames below wrap a box; each demo sizes it to leave room in the square cell for
  // what it draws outside (marks, labels, overhanging lines) and for the label strip.
  {
    name: "Crop Marks",
    description: "Printer's trim marks outside each corner, with registration targets.",
    component: <CropMarks className="h-2/5 w-1/2 -translate-y-3" />,
    registryName: "crop-marks",
  },
  {
    name: "Ruler Border",
    description: "Design-tool rulers on the top and left edges, numbered every 40px.",
    component: <RulerBorder className="h-3/5 w-3/4 -translate-y-3" />,
    registryName: "ruler-border",
  },
  {
    name: "Crosshair Frame",
    description: "Hairlines that run past the edges and fade, with plus marks at the corners.",
    component: <CrosshairFrame className="h-2/5 w-1/2 -translate-y-3" />,
    registryName: "crosshair-frame",
  },
  {
    name: "Dimension Border",
    description: "A redline that measures its own width and height, live.",
    component: <DimensionBorder className="h-2/5 w-1/2 -translate-x-2 -translate-y-2" />,
    registryName: "dimension-border",
  },
  {
    name: "Selection Marquee",
    description: "Marching ants with resize handles, like a selection in a design tool.",
    component: <SelectionMarquee className="h-2/5 w-1/2 -translate-y-3" />,
    registryName: "selection-marquee",
  },
  {
    name: "Focus Brackets",
    description: "Viewfinder corners that close in on hover, with a centre reticle.",
    component: <FocusBrackets className="h-2/5 w-1/2 -translate-y-3" />,
    registryName: "focus-brackets",
  },
];

const BorderGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {BorderArr.map((item, index) => (
        <div
          key={index}
          className="relative border-dashed  aspect-square flex items-center justify-center "
        >
          {item.component}

          <div className="absolute  inset-x-0   bottom-0 bg-background/10 backdrop-blur-sm p-1.5">
            <div className=" leading-tight ">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>

          <div className="absolute top-0 right-0">
            <CopyDropdown
              registryName={item.registryName}
              variant="secondary"
            />
          </div>
          <div />
        </div>
      ))}
    </div>
  );
};

export default BorderGrid;
