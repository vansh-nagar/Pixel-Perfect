"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a list in batches: starts with `batch` items and appends the next batch
 * whenever the sentinel element scrolls within `rootMargin` of the viewport.
 */
export function useInfiniteItems<T>(
  items: T[],
  batch: number,
  rootMargin = "600px 0px",
) {
  const [count, setCount] = useState(batch);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = count < items.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!hasMore || !el) return;

    // Re-created after every batch, so if the sentinel is still in range once the
    // new items render, the initial callback loads the next batch straight away.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCount((c) => Math.min(c + batch, items.length));
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [count, hasMore, batch, items.length, rootMargin]);

  return { visible: items.slice(0, count), sentinelRef, hasMore };
}
