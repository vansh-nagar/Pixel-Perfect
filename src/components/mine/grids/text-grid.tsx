"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TextFade from "../../../../registry/new-york/text/text-fade";
import TextInertia from "../../../../registry/new-york/text/text-inertia";
import TextGradient from "../../../../registry/new-york/text/text-gradient";
import TextXRotate from "../../../../registry/new-york/text/text-x-rotate";
import TextYAnimation from "../../../../registry/new-york/text/text-y-animation";
import TextYAnimation2 from "../../../../registry/new-york/text/text-y-animation2";
import TextYAnimation3 from "../../../../registry/new-york/text/text-y-animation3";
import TextYAnimation4 from "../../../../registry/new-york/text/text-y-animation4";
import TextScatter from "../../../../registry/new-york/text/text-scatter";
import TextScatter1 from "../../../../registry/new-york/text/text-scatter1";
import TextZRotate from "../../../../registry/new-york/text/text-z-rotate";
import TextZRotate2 from "../../../../registry/new-york/text/text-z-rotate2";
import TextVideo from "../../../../registry/new-york/text/text-video";
import TextReveal from "../../../../registry/new-york/text/text-reveal";
import TextReveal2 from "../../../../registry/new-york/text/text-reveal2";
import TextBlackHole from "../../../../registry/new-york/text/text-black-hole";
import TextBurnNeon from "../../../../registry/new-york/text/text-burn-neon";
import TextBrokenGlass from "../../../../registry/new-york/text/text-broken-glass";
import TextMatrixRain from "../../../../registry/new-york/text/text-matrix-rain";
import TextGlitchPortal from "../../../../registry/new-york/text/text-glitch-portal";
import TextTypewriterGlitch from "../../../../registry/new-york/text/text-typewriter-glitch";
import CopyDropdown from "../copy-dropdown";

type StaggerFrom = "start" | "center" | "edges" | "random" | "end";

type TextItem = {
  name: string;
  description: string;
  component: React.ReactNode;
  registryName: string;
  hasStagger: boolean;
};

const TextGrid = () => {
  const [staggerFrom, setStaggerFrom] = useState<StaggerFrom>("start");
  const [activeId, setActiveId] = useState<string>("text-broken-glass");
  const [panelHeight, setPanelHeight] = useState("calc(100vh - 151px)");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const TextArr: TextItem[] = [
    {
      name: "Broken Glass Assemble",
      description: "Letters start shattered & rotated → snap into place.",
      component: (
        <TextBrokenGlass className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextBrokenGlass>
      ),
      registryName: "text-broken-glass",
      hasStagger: false,
    },
    {
      name: "Matrix Rain Decode",
      description: "Columns of random symbols fall → lock into real text.",
      component: (
        <TextMatrixRain className="text-2xl font-bold font-mono">
          JUST GIVE IT A STAR
        </TextMatrixRain>
      ),
      registryName: "text-matrix-rain",
      hasStagger: false,
    },
    {
      name: "Glitch Warp Portal",
      description: "RGB split + scale blur → collapse into clean text.",
      component: (
        <TextGlitchPortal className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextGlitchPortal>
      ),
      registryName: "text-glitch-portal",
      hasStagger: false,
    },
    {
      name: "Typewriter Malfunction",
      description: "Types → deletes → types wrong → finally correct.",
      component: (
        <TextTypewriterGlitch className="text-2xl font-bold font-mono">
          JUST GIVE IT A STAR
        </TextTypewriterGlitch>
      ),
      registryName: "text-typewriter-glitch",
      hasStagger: false,
    },
    {
      name: "Text Reveal",
      description: "Text reveal animation effect.",
      component: (
        <TextReveal className="text-xl">JUST GIVE IT A STAR</TextReveal>
      ),
      registryName: "text-reveal",
      hasStagger: false,
    },
    {
      name: "Text Video",
      description: "Video masked text effect.",
      component: <TextVideo>JUST GIVE IT A STAR</TextVideo>,
      registryName: "text-video",
      hasStagger: false,
    },
    {
      name: "Text Z Rotate 2",
      description: "Z-axis rotation text animation variant.",
      component: <TextZRotate2 staggerFrom={staggerFrom} />,
      registryName: "text-z-rotate2",
      hasStagger: true,
    },
    {
      name: "Text Z Rotate",
      description: "Z-axis rotation text animation.",
      component: <TextZRotate staggerFrom={staggerFrom} />,
      registryName: "text-z-rotate",
      hasStagger: true,
    },
    {
      name: "Text Reveal 2",
      description: "Text reveal animation variant.",
      component: (
        <TextReveal2 className="text-xl">JUST GIVE IT A STAR</TextReveal2>
      ),
      registryName: "text-reveal2",
      hasStagger: false,
    },
    {
      name: "Text Scatter 1",
      description: "Text scatter variant animation.",
      component: <TextScatter1 staggerFrom={staggerFrom} />,
      registryName: "text-scatter1",
      hasStagger: true,
    },
    {
      name: "Text Scatter",
      description: "Text scatters and assembles with animation.",
      component: <TextScatter staggerFrom={staggerFrom} />,
      registryName: "text-scatter",
      hasStagger: true,
    },
    {
      name: "Text Fade Effect",
      description: "Text fades in/out on scroll using GSAP.",
      component: (
        <TextFade
          className="text-2xl"
          textContent="I design and build pixel-perfect digital experiences where precision, performance, and aesthetics work together seamlessly."
        />
      ),
      registryName: "text-fade",
      hasStagger: false,
    },
    {
      name: "Text Inertia Effect",
      description: "Text follows mouse with inertia using GSAP.",
      component: (
        <TextInertia
          className="text-2xl"
          text="Crafting refined, pixel-perfect web experiences that balance design clarity with technical excellence."
        />
      ),
      registryName: "text-inertia",
      hasStagger: false,
    },
    {
      name: "Text Gradient Effect",
      description: "Gradient text effect using CSS.",
      component: (
        <TextGradient>
          Labore excepteur est et Lorem mollit duis ea esse officia. Irure
          incididunt incididunt nostrud esse cillum enim. Nisi excepteur dolor
          incididunt cupidatat.
        </TextGradient>
      ),
      registryName: "text-gradient",
      hasStagger: false,
    },
    {
      name: "Text X Rotate",
      description: "3D X-axis rotation effect with stagger.",
      component: <TextXRotate staggerFrom={staggerFrom} />,
      registryName: "text-x-rotate",
      hasStagger: true,
    },
    {
      name: "Text Y Animation",
      description: "Y-axis slide animation with stagger.",
      component: <TextYAnimation staggerFrom={staggerFrom} />,
      registryName: "text-y-animation",
      hasStagger: true,
    },
    {
      name: "Text Y Animation 2",
      description: "Variant Y-axis animation effect.",
      component: <TextYAnimation2 staggerFrom={staggerFrom} />,
      registryName: "text-y-animation2",
      hasStagger: true,
    },
    {
      name: "Text Y Animation 3",
      description: "Variant Y-axis animation effect.",
      component: <TextYAnimation3 staggerFrom={staggerFrom} />,
      registryName: "text-y-animation3",
      hasStagger: true,
    },
    {
      name: "Text Y Animation 4",
      description: "Variant Y-axis animation effect.",
      component: <TextYAnimation4 staggerFrom={staggerFrom} />,
      registryName: "text-y-animation4",
      hasStagger: true,
    },
    {
      name: "Black Hole Reveal",
      description: "Letters come from center, stretched & sucked outward.",
      component: (
        <TextBlackHole className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextBlackHole>
      ),
      registryName: "text-black-hole",
      hasStagger: false,
    },
    {
      name: "Burn-In Neon",
      description: "Random flicker → letters glow red → turn white.",
      component: (
        <TextBurnNeon className="text-2xl font-bold">
          JUST GIVE IT A STAR
        </TextBurnNeon>
      ),
      registryName: "text-burn-neon",
      hasStagger: false,
    },
  ];

  // Size the two-pane layout to fill the viewport below the navbar + tabs, so
  // the sidebar and the content each get their own scroll region.
  useEffect(() => {
    const measure = () => {
      const top = wrapRef.current?.getBoundingClientRect().top ?? 137;
      // +14px clears the page's bottom padding so the document itself never
      // scrolls — only the two inner panes do.
      setPanelHeight(`calc(100vh - ${Math.max(0, Math.round(top) + 14)}px)`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Scroll-spy: highlight the sidebar item whose section is near the centre of
  // the content pane (the content pane is the scroll container, not the page).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.getAttribute("data-id");
          if (id) setActiveId(id);
        }
      },
      {
        root: contentRef.current,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );
    const nodes = Object.values(sectionRefs.current).filter(
      Boolean
    ) as HTMLElement[];
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  // Smart scroll: keep the active item in view inside the sidebar and reveal a
  // few upcoming items, mirroring the tabs navigation's look-ahead behaviour.
  useEffect(() => {
    const aside = asideRef.current;
    const item = itemRefs.current[activeId];
    if (!aside || !item) return;

    const lookAhead = 150; // px of neighbouring items to surface beyond the active one
    const asideRect = aside.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    if (itemRect.bottom + lookAhead > asideRect.bottom) {
      aside.scrollBy({
        top: itemRect.bottom + lookAhead - asideRect.bottom,
        behavior: "smooth",
      });
    } else if (itemRect.top - lookAhead < asideRect.top) {
      aside.scrollBy({
        top: itemRect.top - lookAhead - asideRect.top,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setActiveId(id);
  };

  return (
    <div
      ref={wrapRef}
      style={{ height: panelHeight }}
      className="flex w-full items-stretch overflow-hidden"
    >
      {/* Sidebar — all animation names, scrolls independently */}
      <aside
        ref={asideRef}
        className="hidden h-full w-[244px] shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-dashed pr-2 md:flex [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25"
      >
        <p className="sticky top-0 z-10 bg-background px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {TextArr.length} Animations
        </p>
        <nav className="flex flex-col">
          {TextArr.map((item) => {
            const active = activeId === item.registryName;
            return (
              <button
                key={item.registryName}
                type="button"
                ref={(el) => {
                  itemRefs.current[item.registryName] = el;
                }}
                onClick={() => scrollTo(item.registryName)}
                className={cn(
                  "group flex flex-col items-start gap-0.5 border-l-2 px-3 py-2 text-left transition-colors",
                  active
                    ? "border-foreground bg-muted/60"
                    : "border-transparent hover:bg-muted/30"
                )}
              >
                <span
                  className={cn(
                    "text-sm leading-tight transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.name}
                </span>
                <span className="line-clamp-1 text-[10px] text-muted-foreground/70">
                  {item.description}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right — every text animation, stacked in its own scroll container.
          h-full + min-h-0 pin the pane to the container height so the flexbox
          `min-height: auto` rule can't let it grow to content height (which
          would make the parent clip it with no scrollbar). */}
      <div
        ref={contentRef}
        id="text-anim-scroll"
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto"
      >
        {TextArr.map((item) => (
          <section
            key={item.registryName}
            data-id={item.registryName}
            ref={(el) => {
              sectionRefs.current[item.registryName] = el;
            }}
            className="relative flex min-h-[68vh] scroll-mt-4 items-center justify-center border-b border-dashed px-6 py-12"
          >
            <BorderDecorator />
            <div className="z-30">{item.component}</div>

            <div className="absolute bottom-3 left-3 z-30 leading-tight">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="max-w-md text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>

            <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
              {item.hasStagger && (
                <Select
                  value={staggerFrom}
                  onValueChange={(value) =>
                    setStaggerFrom(value as StaggerFrom)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="z-30 rounded-none border-dashed"
                  >
                    <SelectValue placeholder="Stagger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="edges">Edges</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <CopyDropdown registryName={item.registryName} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default TextGrid;

export const BorderDecorator = () => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] -top-[0px] block size-6   border-dashed border-l-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-dashed border-r-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-dashed border-b-1 border-l-1 z-30 "></span>
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b-1 border-r-1 border-dashed z-30"></span>

      {/* Circular border */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>

      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>

      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
