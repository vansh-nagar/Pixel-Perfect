"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import { RefreshCcw } from "lucide-react";
import CircleCredits from "registry/new-york/typography/circle-credits";
import CopyDropdown from "../copy-dropdown";
import GridPagination from "./_shared/grid-pagination";

const TypographyComponentArr: {
  name: string;
  description: string;
  Component: React.ComponentType;
  registryName: string;
}[] = [
  {
    name: "Circle Credits",
    description:
      "Two credit columns wrapping a round hole; names ease out of it and scramble into symbols on hover.",
    Component: CircleCredits,
    registryName: "circle-credits",
  },
];

const TypographyGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const itemsPerPage = 6;
  const totalPages = Math.ceil(TypographyComponentArr.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = TypographyComponentArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (TypographyComponentArr.length === 0) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center border border-dashed text-xs text-muted-foreground">
        Coming soon
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
        {paginatedItems.map((item, index) => {
          const Component = item.Component;
          return (
            <div
              key={startIndex + index}
              className="relative w-full border-b border-l border-dashed aspect-square flex justify-center items-center"
            >
              <div
                className="z-30 flex h-full w-full items-center justify-center"
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

              <div className=" leading-tight absolute left-1.5  bottom-1.5">
                <p className="text-xs ">{item.name}</p>
                <p className="text-[8px] text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="absolute inset-x-0 top-0 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
                <div className="border-t border-dashed" />
                <CopyDropdown
                  registryName={item.registryName}
                  variant="ghost"
                />
                <div />
                <div className="h-full border-r border-dashed -mr-[0.5px]" />
              </div>
            </div>
          );
        })}
      </div>

      <GridPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onChange={setCurrentPage}
      />
    </div>
  );
};

export default TypographyGrid;
