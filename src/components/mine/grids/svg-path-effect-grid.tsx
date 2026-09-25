"use client";
import Guitar from "registry/new-york/svg-path-effects/guitar";

import { useState } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import CopyDropdown from "../copy-dropdown";
import GridPagination from "./_shared/grid-pagination";

const Buttons = [
  {
    name: "Guitar",
    description: "Motion path effect using SVG.",
    component: <Guitar />,
    registryName: "guitar-svg",
  },
];

const SvgPathEffectGrid = () => {
  const itemsPerPage = 1;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(Buttons.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = Buttons.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 gap-0">
        {paginatedItems.map((item, index) => (
          <div
            key={index}
            className="h-screen w-full relative border-b border-l border-dashed  aspect-square flex justify-center items-center"
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

      <GridPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onChange={setCurrentPage}
      />
    </div>
  );
};

export default SvgPathEffectGrid;
