/**
 * Photos sweep across a pinned stage on scroll, blooming to full size at random heights before collapsing back to nothing, with a live count of what is on screen.
 */
"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type SweepImage = { src: string; alt: string };
export type PhotoSweepConveyorProps = {
  images?: SweepImage[];
  className?: string;
  /** Scroll length of the pinned sequence, as a multiple of the stage height. */
  length?: number;
  /** Width of each photo as a share of the stage. */
  size?: number;
  /** Timeline offset between consecutive photos. */
  stagger?: number;
  /** How many photos ride the conveyor; the set repeats to fill it. */
  count?: number;
};

const DEMO_IMAGES: SweepImage[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/image-animations/photo-${i + 1}.jpg`,
  alt: `Photo ${i + 1}`,
}));

export default function PhotoSweepConveyor({
  images = DEMO_IMAGES,
  className = "",
  length = 7,
  size = 0.2,
  stagger = 0.1,
  count = 18,
}: PhotoSweepConveyorProps) {
  // The reference keeps dozens of items on the plane, so one pass of six photos
  // would read as a thin trickle — cycle the set until the belt is full.
  const belt = Array.from({ length: Math.max(count, images.length) }, (_, i) => images[i % images.length]);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(0);

  useGSAP(
    () => {
      const scrollEl = scroller.current;
      const trackEl = track.current;
      const stageEl = stage.current;
      if (!scrollEl || !trackEl || !stageEl) return;

      const media = gsap.utils.toArray<HTMLElement>("[data-media]", stageEl);
      if (!media.length) return;

      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Every photo starts collapsed and stacked at the stage's right edge; the
      // sweep is what spreads them out.
      gsap.set(media, { scale: 0, xPercent: 0, x: 0, yPercent: 0 });

      // How many photos currently overlap the stage — the badge's number.
      const count = () => {
        const box = stageEl.getBoundingClientRect();
        let n = 0;
        for (const el of media) {
          const r = el.getBoundingClientRect();
          if (r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom && r.width > 4) n++;
        }
        setOnScreen(n);
      };

      if (reduced) {
        // Settled mid-sweep: spread across the stage, no scroll-driven motion.
        media.forEach((el, i) => {
          const t = (i + 1) / (media.length + 1);
          gsap.set(el, { scale: 1, x: -stageEl.clientWidth * t, yPercent: (i % 2 ? 40 : -40) });
        });
        count();
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: trackEl,
          scroller: scrollEl,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: count,
        },
        defaults: { stagger },
      });

      // 1. The whole run sweeps right to left across the stage, linear with scroll.
      timeline
        .to(media, {
          xPercent: 100,
          x: () => -stageEl.clientWidth,
          ease: "none",
          duration: 1,
        })
        // 2. On the way in, each photo blooms to full size and drifts to its own height.
        .to(
          media,
          {
            yPercent: () => 160 * (Math.random() - 0.5),
            scale: 1,
            duration: 0.5,
            ease: "power1.inOut",
          },
          "<",
        )
        // 3. On the way out it returns to the centre line and collapses again.
        .to(
          media,
          { yPercent: 0, scale: 0, duration: 0.5, ease: "power1.inOut" },
          "<+=0.5",
        );

      // At progress 0 every photo is still collapsed, which would leave the card
      // blank until someone scrolls it. Start a little way in so it reads at rest.
      scrollEl.scrollTop = (scrollEl.scrollHeight - scrollEl.clientHeight) * 0.12;

      const onResize = () => ScrollTrigger.refresh();
      const observer = new ResizeObserver(onResize);
      observer.observe(scrollEl);
      count();

      return () => {
        observer.disconnect();
        gsap.killTweensOf(media);
      };
    },
    { scope: root, dependencies: [images, length, size, stagger, count] },
  );

  return (
    <div
      ref={root}
      className={`relative aspect-square w-full overflow-hidden bg-background text-foreground ${className}`}
    >
      <div
        ref={scroller}
        data-lenis-prevent
        className="h-full w-full overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={track} style={{ height: `${length * 100}%` }}>
          {/* The stage stays put while the track scrolls past it. */}
          <div
            ref={stage}
            className="sticky top-0 flex h-[calc(100%/var(--len))] items-center justify-end overflow-hidden"
            style={{ ["--len" as string]: length }}
          >
            {belt.map((image, i) => (
              <img
                key={`${image.src}-${i}`}
                data-media
                src={image.src}
                alt={image.alt}
                loading="lazy"
                draggable={false}
                className="absolute aspect-square object-cover"
                style={{ width: `${size * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Live count of the photos overlapping the stage. */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex h-8 items-center gap-2 rounded-full bg-foreground px-3 text-background">
        <span className="text-[10px] uppercase tracking-wider opacity-70">On screen</span>
        <span className="size-1.5 rounded-full bg-background" />
        <span className="font-mono text-xs tabular-nums">
          {String(onScreen).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}
