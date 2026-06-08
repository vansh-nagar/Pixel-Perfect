"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/src/ScrollTrigger";
import { useLenis } from "@/components/providers/lenis-provider";
import {
  ScrollTypography,
  EFFECT_ORDER,
  EFFECT_INFO,
} from "../../../registry/new-york/text/scroll-typography";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollTypographyPage() {
  const lenis = useLenis();

  // Drive ScrollTrigger from Lenis' own scroll emission (single driver — the
  // provider already owns the rAF loop), so scrub stays frame-synced and jitter-free.
  useEffect(() => {
    if (!lenis) return;
    const update = () => ScrollTrigger.update();
    lenis.on("scroll", update);
    return () => lenis.off("scroll", update);
  }, [lenis]);

  return (
    <main className="relative w-full bg-background text-foreground">
      {/* Slim fixed chrome */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-3 mix-blend-difference text-white">
        <Link
          href="/blocks?tab=text"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest opacity-80 transition-opacity hover:opacity-100"
        >
          <ArrowLeft className="size-3.5" />
          Catalog
        </Link>
        <span className="text-xs font-medium uppercase tracking-widest opacity-80">
          On-Scroll Typography
        </span>
      </header>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {EFFECT_ORDER.length} scroll-driven effects
        </p>
        <h1 className="max-w-5xl text-[11vw] font-semibold leading-[0.85] tracking-tight md:text-[8vw]">
          Type in Motion
        </h1>
        <p className="mt-6 max-w-md text-balance text-sm text-muted-foreground">
          Each heading below animates as it scrolls through the viewport. Scroll
          slowly to play every effect to completion.
        </p>
        <span className="mt-16 animate-bounce text-xs uppercase tracking-widest text-muted-foreground">
          Scroll ↓
        </span>
      </section>

      {/* Effect sections */}
      {EFFECT_ORDER.map((fx, i) => {
        const info = EFFECT_INFO[fx];
        return (
          <section
            key={fx}
            className={`relative flex items-center justify-center px-6 ${
              info.pinned ? "min-h-screen" : "min-h-[150vh]"
            }`}
          >
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-[14ch] text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 [writing-mode:vertical-rl] sm:left-8">
              {String(i + 1).padStart(2, "0")} — {info.name}
              {info.pinned ? " · pinned" : ""}
            </span>
            <ScrollTypography
              as={i === 0 ? "h2" : "h2"}
              effect={fx}
              text={info.sample}
              className="text-[13vw] font-semibold tracking-tight md:text-[10vw]"
            />
          </section>
        );
      })}

      {/* Outro */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">That’s all 29.</p>
        <Link
          href="/blocks?tab=text"
          className="inline-flex items-center gap-1.5 border border-dashed px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors hover:bg-muted/40"
        >
          <ArrowLeft className="size-3.5" />
          Back to catalog
        </Link>
      </section>
    </main>
  );
}
