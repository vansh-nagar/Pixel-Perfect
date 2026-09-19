"use client";

/**
 * A pinned project showcase where each next project wipes up over the last, slicing the title and preview card along the seam.
 */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function findScroller(el: HTMLElement): HTMLElement | undefined {
  let node = el.parentElement;
  while (node) {
    if (node.hasAttribute("data-lenis-prevent")) return node;
    const oy = getComputedStyle(node).overflowY;
    if (
      (oy === "auto" || oy === "scroll") &&
      node.scrollHeight > node.clientHeight
    )
      return node;
    node = node.parentElement;
  }
  return undefined;
}

export type SliceProject = {
  title: string;
  tags: string[];
  cover: string;
  preview: string;
};

const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

const PROJECTS: SliceProject[] = [
  {
    title: "Fernwood A-Frame",
    tags: ["A-Frame", "1 Bed", "1 Bath", "520 Sqft"],
    cover: unsplash("1525113990976-399835c43838", 2000),
    preview: unsplash("1604014237800-1c9102c219da", 1200),
  },
  {
    title: "Creekside Cabin",
    tags: ["Cabin", "2 Bed", "1 Bath", "840 Sqft"],
    cover: unsplash("1587061949409-02df41d5e562", 2000),
    preview: unsplash("1600210491892-03d54c0aaf87", 1200),
  },
  {
    title: "Stillwater Boathouse",
    tags: ["Waterfront", "1 Bed", "1 Bath", "610 Sqft"],
    cover: unsplash("1518602164578-cd0074062767", 2000),
    preview: unsplash("1618221195710-dd6b41faaea6", 1200),
  },
  {
    title: "Snowline Lodge",
    tags: ["Lodge", "3 Bed", "2 Bath", "1,400 Sqft"],
    cover: unsplash("1510798831971-661eb04b3739", 2000),
    preview: unsplash("1600607687939-ce8a6c25118c", 1200),
  },
];

// How far a cover lags behind the seam, as a fraction of the stage height.
// 0 = the cover rides the seam exactly, 1 = it stays put while the seam passes.
const PARALLAX = 0.2;

export type ProjectSliceScrollProps = {
  projects?: SliceProject[];
  className?: string;
};

const ProjectSliceScroll = ({
  projects = PROJECTS,
  className = "",
}: ProjectSliceScrollProps) => {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const r = root.current;
      const tr = track.current;
      if (!r || !tr) return;

      const scroller = findScroller(r);

      // Size the pinned stage to whatever is scrolling us: the window on a
      // normal page, or an overflow container when embedded in a preview.
      const fit = () =>
        r.style.setProperty(
          "--stage-h",
          `${scroller?.clientHeight ?? window.innerHeight}px`,
        );
      fit();

      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", r);
      const covers = gsap.utils.toArray<HTMLElement>("[data-cover]", r);
      const previews = gsap.utils.toArray<HTMLElement>("[data-preview]", r);
      const lag = (1 - PARALLAX) * 100;

      // One scroll-length per wipe, so the seam moves 1:1 with the scroll.
      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: tr,
          scroller,
          // clamp() keeps progress at 0 when the track starts above scrollTop 0.
          start: "clamp(top top)",
          end: "bottom bottom",
          scrub: true,
        },
      });

      panels.forEach((panel, i) => {
        if (i === 0) return;
        const at = i - 1;

        // The incoming panel is revealed from the bottom edge up. Its title
        // and card never move, so the seam slices through them.
        tl.fromTo(
          panel,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)" },
          at,
        )
          // Its cover rises with the seam, a little slower than the scroll…
          .fromTo(covers[i], { yPercent: lag }, { yPercent: 0 }, at)
          // …while the outgoing cover drifts up and away at the same rate.
          .to(covers[i - 1], { yPercent: -lag }, at)
          // The preview photo settles from a slight zoom as it's uncovered.
          .fromTo(previews[i], { scale: 1.25 }, { scale: 1 }, at);
      });

      const ro = scroller
        ? new ResizeObserver(() => {
            fit();
            ScrollTrigger.refresh();
          })
        : null;
      if (ro && scroller) ro.observe(scroller);
      const onResize = () => fit();
      if (!scroller) window.addEventListener("resize", onResize);

      return () => {
        ro?.disconnect();
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: root, dependencies: [projects] },
  );

  return (
    <div
      ref={root}
      className={`relative w-full bg-neutral-950 [--stage-h:100svh] ${className}`}
    >
      <div
        ref={track}
        style={{ height: `calc(var(--stage-h) * ${projects.length})` }}
      >
        <div className="sticky top-0 h-[var(--stage-h)] overflow-hidden">
          {projects.map((project, i) => (
            <article
              key={project.title}
              data-panel
              aria-label={project.title}
              className="absolute inset-0 overflow-hidden"
              style={{ zIndex: i + 1 }}
            >
              <div data-cover className="absolute inset-0 will-change-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.cover}
                  alt=""
                  draggable={false}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
              </div>

              <div className="absolute inset-0 flex items-center justify-between gap-8 px-[6%] pt-[6%] max-md:flex-col max-md:items-start max-md:justify-center">
                <div className="text-white">
                  <h2 className="max-w-[9ch] font-serif text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl lg:text-[5.5rem]">
                    {project.title}
                  </h2>
                  <ul className="mt-8 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/25 bg-black/30 px-4 py-2 text-sm font-medium backdrop-blur-md"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="aspect-[16/9] w-[42%] shrink-0 overflow-hidden rounded-xl shadow-2xl shadow-black/40 max-md:w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    data-preview
                    src={project.preview}
                    alt={`${project.title} interior`}
                    draggable={false}
                    className="size-full object-cover will-change-transform"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectSliceScroll;
