"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import RaycasterShapes from "registry/new-york/three-js/raycaster-shapes";
import FloatingLogoIntro from "registry/new-york/three-js/floating-logo-intro";
import CopyDropdown from "../copy-dropdown";

const ThreeJsComponentArr: {
  name: string;
  description: string;
  Component: React.ComponentType;
  registryName: string;
}[] = [
  {
    name: "Floating Logo Intro",
    description:
      "A 3D logo draws itself in (SVG stroke), rises with an easeOutBack overshoot and floats over a cursor-distorted pixel-text background. Hover for an ink-bleed colour reveal; click for a venom takeover.",
    Component: FloatingLogoIntro,
    registryName: "floating-logo-intro",
  },
  {
    name: "Raycaster Shapes",
    description:
      "Geometries on a 3D plane. Hover to light up a shape's edges (Fresnel rim shader, raycaster-detected); click to pop it up and spin it.",
    Component: RaycasterShapes,
    registryName: "raycaster-shapes",
  },
];

const ThreeJsGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const itemsPerPage = 4;
  const totalPages = Math.ceil(ThreeJsComponentArr.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = ThreeJsComponentArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      {/* Single column — one animation per row. */}
      <div className="grid grid-cols-1 gap-0">
        {paginatedItems.map((item, index) => {
          const Component = item.Component;
          return (
            <div
              key={startIndex + index}
              className="relative h-[560px] w-full overflow-hidden border-b border-l border-dashed"
            >
              <div
                className="absolute inset-0 z-10"
                key={refreshKeys[startIndex + index] || 0}
              >
                <Component />
              </div>

              <div className="absolute left-1.5 top-1.5 z-40 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-none text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => handleRefresh(startIndex + index)}
                >
                  <RefreshCcw className="size-3" />
                </Button>
              </div>

              <div className="leading-1 absolute bottom-1.5 left-1.5 z-40">
                <p className="text-xs">{item.name}</p>
                <p className="max-w-md text-[8px] text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 z-40 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
                <div className="border-t border-dashed" />
                <div className="pointer-events-auto">
                  <CopyDropdown registryName={item.registryName} variant="ghost" />
                </div>
                <div />
                <div className="h-full border-r border-dashed -mr-[0.5px]" />
              </div>
            </div>
          );
        })}
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

export default ThreeJsGrid;
