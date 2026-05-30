"use client";

import { useEffect } from "react";

/**
 * Lets the left/right arrow keys flip through paginated grids.
 * No-op while focus is in a text field so typing isn't hijacked.
 */
export function usePaginationKeys(
  totalPages: number,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
) {
  useEffect(() => {
    if (totalPages <= 1) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
      } else {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [totalPages, setCurrentPage]);
}
