"use client";
import Border1 from "../../../../registry/new-york/borders/border1";
import Border2 from "../../../../registry/new-york/borders/border2";
import Intersection1 from "../../../../registry/new-york/borders/intersection1";
import Intersection2 from "../../../../registry/new-york/borders/intersection2";
import StarBorders from "../../../../registry/new-york/borders/star-border";
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
            <div className=" leading-1 ">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>

          <div className="absolute top-0 right-0">
            <CopyDropdown registryName={item.registryName} variant="secondary" />
          </div>
          <div />
        </div>
      ))}
    </div>
  );
};

export default BorderGrid;
