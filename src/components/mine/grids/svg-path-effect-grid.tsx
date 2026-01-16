"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import LegionsDev from "registry/new-york/svg-path-effects/legionsdev";
import MotionPath from "registry/new-york/svg-path-effects/motion-path";
import Guitar from "registry/new-york/svg-path-effects/guitar";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const Buttons = [
  {
    name: "Guitar",
    description: "Motion path effect using SVG.",
    component: <Guitar />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Mouse%20Follower%202.json",
  },
  {
    name: "Svg Path Effect",
    description: "",
    component: <LegionsDev />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Mouse%20Follower%201.json",
  },
  {
    name: "Beam Motion Path",
    description: "Motio n path effect using SVG.",
    component: <MotionPath />,
    link: "npx shadcn@latest add https://www.pixel-perfect.space/r/Mouse%20Follower%202.json",
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
              <Button
                size={"sm"}
                variant={"ghost"}
                className="text-xs  cursor-pointer z-30 relative border  border-dashed right-1 top-1  rounded-none "
                onClick={() => {
                  navigator.clipboard.writeText(item.link);
                  toast.success("Link copied to clipboard!");
                }}
              >
                <Copy className=" size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed "></span>
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2  border-dashed"></span>
              </Button>
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
