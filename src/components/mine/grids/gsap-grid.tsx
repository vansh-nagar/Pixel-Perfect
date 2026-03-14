"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FlipTextReveal from "registry/new-york/gsap/flip-text-reveal";
import Stagger1 from "registry/new-york/gsap/stagger1";
import CopyDropdown from "../copy-dropdown";

const GsapStaggerGridArr = [
  {
    name: "Streak counter",
    description: "A Streak counter ripple animation using GSAP.",
    component: <Stagger1 />,
    registryName: "stagger-1",
  },
  {
    name: "Flip text reveal",
    description:
      "A GSAP Flip orb transition followed by a staggered text reveal.",
    component: <FlipTextReveal />,
    registryName: "flip-text-reveal",
  },
];

const GsapGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const totalPages = Math.ceil(GsapStaggerGridArr.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = GsapStaggerGridArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {paginatedItems.map((item, index) => (
          <div
            key={startIndex + index}
            className="relative w-full border-b border-l border-dashed aspect-square flex justify-center items-center"
          >
            <div className="z-30">{item.component}</div>

            <div className=" leading-1 absolute left-1.5  bottom-1.5">
              <p className="text-xs ">{item.name}</p>
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
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 rounded-none border-dashed"
                >
                  {page}
                </Button>
              ),
            )}
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

export default GsapGrid;
