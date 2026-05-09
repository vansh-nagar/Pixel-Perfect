"use client";

import ChunkySlider from "../../../../registry/new-york/sliders/chunky-slider";
import CopyDropdown from "../copy-dropdown";
import { BorderDecorator } from "./button-grid";

const SlidersArr = [
  {
    name: "Chunky Slider",
    description:
      "Skeuomorphic notched track with glossy black fill and a pearl thumb with a dark eye.",
    component: <ChunkySlider defaultValue={35} />,
    registryName: "chunky-slider",
  },
];

const SliderGrid = () => {
  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {SlidersArr.map((item, index) => (
          <div
            key={index}
            className="relative group border-b border-l border-dashed aspect-square flex items-center justify-center"
          >
            <BorderDecorator />
            <div className="z-30">{item.component}</div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 p-0.5">
              <p className="text-xs">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
              <div className="border-t border-dashed" />
              <CopyDropdown registryName={item.registryName} />
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SliderGrid;
