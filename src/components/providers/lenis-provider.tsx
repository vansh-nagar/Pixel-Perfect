"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import Lenis from "@studio-freight/lenis";

/**
 * Exposes the singleton Lenis instance to consumers (e.g. the scroll-typography
 * page) so they can wire `lenis.on("scroll", ScrollTrigger.update)` without
 * spinning up a second smooth-scroll driver. `null` until the instance mounts.
 */
const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      lerp: 0.12,
    });
    setLenis(instance);

    let rafId = 0;
    let stopped = false;
    const raf = (time: number) => {
      if (stopped) return;
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      instance.destroy();
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
