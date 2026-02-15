"use client";
import { Button } from "@/components/ui/button";
import LegionsDev from "registry/new-york/svg-path-effects/legionsdev";
import MotionPath from "registry/new-york/svg-path-effects/motion-path";
import Guitar from "registry/new-york/svg-path-effects/guitar";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import CopyDropdown from "../copy-dropdown";

const Buttons = [
  {
    name: "Guitar",
    description: "Motion path effect using SVG.",
    component: <Guitar />,
    registryName: "guitar-svg",
  },
  {
    name: "Svg Path Effect",
    description: "Legions Dev SVG path effect.",
    component: <LegionsDev />,
    registryName: "legionsdev-svg",
  },
  {
    name: "Beam Motion Path",
    description: "Motion path effect using SVG.",
    component: <MotionPath />,
    registryName: "motion-path",
  },
];

const SvgPathEffectGrid = () => {
  const itemsPerPage = 1;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(Buttons.length / itemsPerPage);
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-dashed rounded-none"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-none border-dashed ${
                  currentPage === page ? "" : ""
                }`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="border-dashed rounded-none"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SvgPathEffectGrid;
