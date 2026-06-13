"use client";
import type { ReactNode } from "react";
import CopyDropdown from "../copy-dropdown";

type MaskGridItem = {
  name: string;
  description: string;
  component: ReactNode;
  registryName: string;
};

// Mask animations land here — add an entry per promoted component.
export const MaskGridArr: MaskGridItem[] = [];

const MaskGrid = () => {
  if (MaskGridArr.length === 0) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center text-sm text-muted-foreground">
        No mask animations yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {MaskGridArr.map((item, index) => (
        <div
          key={index}
          className="relative flex aspect-square w-full items-center justify-center border-b border-l border-dashed"
        >
          <div className="z-30">{item.component}</div>

          <div className="leading-1 absolute bottom-1.5 left-1.5">
            <p className="text-xs">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="absolute inset-x-0 top-0 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
            <div className="border-t border-dashed" />
            <CopyDropdown registryName={item.registryName} variant="ghost" />
            <div />
            <div className="h-full border-r border-dashed mr-[-0.5px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaskGrid;
