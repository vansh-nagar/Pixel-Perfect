"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mounts its children only while the wrapper is near the viewport, and unmounts
 * them once it scrolls far away. Each WebGL shader tile creates its own GL
 * context on mount, and browsers cap the number of live contexts (~16); a grid
 * full of shader tiles would blow past that. Gating mount on visibility keeps
 * the live set bounded to what's actually on screen — offscreen tiles tear down
 * their renderer (and free the context) until they scroll back into view.
 */
const LazyVisible = ({
  children,
  className,
  rootMargin = "120px",
}: {
  children: ReactNode;
  className?: string;
  /** How early to mount before the tile enters the viewport. */
  rootMargin?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShow(entry.isIntersecting),
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {show ? children : null}
    </div>
  );
};

export default LazyVisible;
