"use client";

import Cd from "registry/new-york/ascii/cd";
import RedFireAscii from "../../../../registry/new-york/ascii/red fire";
import CopyDropdown from "../copy-dropdown";

const asciiAnimations = [
  {
    name: "Red Fire",
    description: "ASCII flame animation in a red terminal style.",
    component: <RedFireAscii />,
    registryName: "red-fire",
  },
  {
    name: "CD Animation",
    description: "ASCII animation of a CD spinning.",
    component: <Cd />,
    registryName: "cd",
  },
];

const AsciiAnimationsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {asciiAnimations.map((item, index) => (
        <div
          key={index}
          className="relative border-b border-l border-dashed aspect-square flex items-center justify-center overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <BorderDecorator />
          <div className="z-30">{item.component}</div>

          <div className="leading-1 absolute left-1.5 bottom-1.5">
            <p className="text-xs">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>
          <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
            <div className="border-t border-dashed"></div>
            <CopyDropdown registryName={item.registryName} />
            <div />
            <div className="border-r border-dashed h-full -mr-[0.5px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AsciiAnimationsGrid;

const BorderDecorator = () => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] top-0 block size-6 border-dashed border-l border-t z-30"></span>
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-dashed border-r border-t z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-dashed border-b border-l z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b border-r border-dashed z-30"></span>

      <span className="absolute -top-px -right-[0.5px] z-30 border-b border-l block size-2 px-[38px] py-5 mt-px border-dashed"></span>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-linear-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
