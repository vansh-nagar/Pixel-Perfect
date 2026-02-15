"use client";
import Stagger1 from "registry/new-york/gsap/stagger1";
import CopyDropdown from "../copy-dropdown";

const GsapStaggerGridArr = [
  {
    name: "Streak counter",
    description: "A Streak counter ripple animation using GSAP.",
    component: <Stagger1 />,
    registryName: "stagger-1",
  },
];

const GsapGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2  gap-3">
      {GsapStaggerGridArr.map((item, index) => (
        <div
          key={index}
          className="w-full border relative border-b border-l border-dashed  aspect-square flex justify-center items-center"
        >
          {item.component}

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs ">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="absolute top-0 right-0">
            <CopyDropdown registryName={item.registryName} variant="ghost" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default GsapGrid;
