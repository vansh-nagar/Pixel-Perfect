"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import CopyDropdown from "../copy-dropdown";
import { GradientBlur } from "../landing-page/gradient-blur";
import HeroCoverReveal from "../../../../registry/new-york/scroll/hero-cover-reveal";
import FooterReveal from "../../../../registry/new-york/scroll/footer-reveal";
import StackingCardsParallax from "../../../../registry/new-york/scroll/stacking-cards-parallax";
import TextClipMaskReveal from "../../../../registry/new-york/scroll/text-clip-mask-reveal";
import FluidCubeScroll from "../../../../registry/new-york/scroll/fluid-cube-scroll";

type ScrollItem = {
  name: string;
  description: string;
  component: React.ReactNode;
  registryName: string;
  /** Scroll-driven effect — rendered in a tall runway you scroll to play. */
  isScroll?: boolean;
  /** Full-bleed effect that manages its own pinned/scrolling layout. */
  isFull?: boolean;
};

// Scroll animations land here — add an entry per promoted component.
const ScrollArr: ScrollItem[] = [
  {
    name: "Fluid Cube",
    description:
      "A 3D cube slides across on scroll while a GPU fluid simulation masks its colourful faces in under the cursor. Scroll to play.",
    component: <FluidCubeScroll />,
    registryName: "fluid-cube-scroll",
    isFull: true,
  },
  {
    name: "Hero Cover Reveal",
    description:
      "The hero pins in place while the next section slides up and covers it. Scroll to play.",
    component: <HeroCoverReveal />,
    registryName: "hero-cover-reveal",
    isFull: true,
  },
  {
    name: "Footer Reveal",
    description:
      "The footer sits pinned in place while the content above slides up to uncover it. Scroll to play.",
    component: <FooterReveal />,
    registryName: "footer-reveal",
    isFull: true,
  },
  {
    name: "Stacking Cards Parallax",
    description:
      "Sticky cards pin and scale down as later cards scroll up over them, building a layered depth stack. Scroll to play.",
    component: <StackingCardsParallax />,
    registryName: "stacking-cards-parallax",
    isFull: true,
  },
  {
    name: "Text Clip Mask Reveal",
    description:
      "A video is clipped to the shape of a word, then the text-shaped mask scales up on scroll until it opens out and uncovers the full frame. Scroll to play.",
    component: <TextClipMaskReveal />,
    registryName: "text-clip-mask-reveal",
    isFull: true,
  },
];

const ScrollGrid = () => {
  const [activeId, setActiveId] = useState<string>(
    ScrollArr[0]?.registryName ?? "",
  );
  const [panelHeight, setPanelHeight] = useState("calc(100vh - 151px)");
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
    setActiveId(id);
    // Reset the content pane to the top when switching to a new animation so a
    // previously scrolled (overflowing) item doesn't start mid-scroll.
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };

  if (ScrollArr.length === 0) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center text-sm text-muted-foreground">
        No scroll animations yet.
      </div>
    );
  }

  const activeItem =
    ScrollArr.find((item) => item.registryName === activeId) ?? ScrollArr[0];

  return (
    <div
      ref={wrapRef}
      style={{ height: panelHeight }}
      className="flex w-full items-stretch overflow-hidden"
    >
      {/* Sidebar — all animation names, scrolls independently */}
      <aside
        ref={asideRef}
        data-lenis-prevent
        className="hidden h-full min-h-0 w-[244px] shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-dashed pr-2 md:flex [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25"
      >
        <div className="sticky top-0 z-10 bg-background px-3 pb-2 pt-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {ScrollArr.length} Animations
          </p>
        </div>
        <nav className="flex flex-col">
          {ScrollArr.map((item) => {
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
                    : "border-transparent hover:bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "text-sm leading-tight transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
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

      {/* Right — only the selected scroll animation. Its own scroll container so
          a single overflowing item scrolls here while the sidebar stays put. */}
      <div
        ref={contentRef}
        id="scroll-anim-scroll"
        data-lenis-prevent
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto"
      >
        {activeItem.isFull ? (
          <section
            key={activeItem.registryName}
            data-id={activeItem.registryName}
            className="relative border-b border-dashed"
          >
            {/* Sticky chrome — name + copy float over the full-bleed effect. */}
            <div className="pointer-events-none sticky top-0 z-80 -mb-16 flex items-start justify-between gap-3 p-3">
              <div className="pointer-events-auto leading-tight">
                <p className="text-sm font-medium">{activeItem.name}</p>
                <p className="max-w-md text-xs text-muted-foreground">
                  {activeItem.description}
                </p>
              </div>
              <div className="pointer-events-auto">
                <CopyDropdown registryName={activeItem.registryName} />
              </div>
            </div>
            {activeItem.component}
          </section>
        ) : activeItem.isScroll ? (
          <section
            key={activeItem.registryName}
            data-id={activeItem.registryName}
            className="relative min-h-full border-b border-dashed"
          >
            {/* Progressive blur band at the top of the runway. */}
            <GradientBlur
              side="top"
              position="sticky"
              height={96}
              className="-mb-24"
            />

            {/* Sticky chrome — name + copy stay in view while you scroll. */}
            <div className="pointer-events-none sticky top-0 z-70 flex items-start justify-between gap-3 px-3 pb-10 pt-3">
              <div className="pointer-events-auto leading-tight">
                <p className="text-sm font-medium">{activeItem.name}</p>
                <p className="max-w-md text-xs text-muted-foreground">
                  {activeItem.description}
                </p>
              </div>
              <div className="pointer-events-auto">
                <CopyDropdown registryName={activeItem.registryName} />
              </div>
            </div>

            {/* Entry runway → content → exit runway (scroll drives the effect) */}
            <div aria-hidden style={{ height: "70vh" }} />
            <div className="flex min-h-[40vh] w-full items-center justify-center px-6">
              {activeItem.component}
            </div>
            <div aria-hidden style={{ height: "120vh" }} />

            {/* Persistent scroll hint */}
            <div className="pointer-events-none sticky bottom-4 z-40 -mt-12 flex justify-center">
              <span className="rounded-full border border-dashed bg-background/70 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground backdrop-blur">
                Scroll ↓ to play
              </span>
            </div>
          </section>
        ) : (
          <section
            key={activeItem.registryName}
            data-id={activeItem.registryName}
            className="relative flex min-h-full scroll-mt-4 items-center justify-center border-b border-dashed px-6 py-12"
          >
            <BorderDecorator />
            <div className="z-30">{activeItem.component}</div>

            <div className="absolute bottom-3 left-3 z-30 leading-tight">
              <p className="text-sm font-medium">{activeItem.name}</p>
              <p className="max-w-md text-xs text-muted-foreground">
                {activeItem.description}
              </p>
            </div>

            <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
              <CopyDropdown registryName={activeItem.registryName} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ScrollGrid;

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
