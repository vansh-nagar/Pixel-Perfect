"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Prev / numbered / next pager shared by every paginated block grid. Renders
 * nothing for a single page, so callers can drop it in unconditionally.
 */
export const GridPagination = ({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous page"
        onClick={() => onChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="rounded-none border-dashed"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
            onClick={() => onChange(page)}
            className="h-8 w-8 rounded-none border-dashed"
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        aria-label="Next page"
        onClick={() => onChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="rounded-none border-dashed"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
};

export default GridPagination;
