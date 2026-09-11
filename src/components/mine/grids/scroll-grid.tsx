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
import ScrollWarpGallery from "../../../../registry/new-york/scroll/scroll-warp-gallery";

import GlassScrollNavbar from "../../../../registry/new-york/scroll/glass-scroll-navbar";

type ScrollItem = {
  name: string;
  description: string;
  component: React.ReactNode;
  registryName: string;
  isScroll?: boolean;
  isFull?: boolean;
};

const ScrollArr: ScrollItem[] = [
  {
    name: "Glass Scroll Navbar",
    description: "A curved glass lens refracts the images passing behind the fixed navigation, with spectral color edges.",
    component: <GlassScrollNavbar />,
    registryName: "glass-scroll-navbar",
    isFull: true,
  },
  {
    name: "Scroll Warp Gallery",
    description:
      "Scroll velocity bends each image's own vertices in WebGL, smearing it into an RGB-split motion blur, and the cursor lenses it outward. Scroll to play.",
    component: <ScrollWarpGallery />,
    registryName: "scroll-warp-gallery",
    isFull: true,
  },
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

  useEffect(() => {
    const measure = () => {
      const top = wrapRef.current?.getBoundingClientRect().top ?? 137;
      setPanelHeight(`calc(100vh - ${Math.max(0, Math.round(top) + 14)}px)`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const aside = asideRef.current;
    const item = itemRefs.current[activeId];
    if (!aside || !item) return;

    const lookAhead = 80; // px of neighbouring items to surface beyond the active one
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
      {/* Matches the category sidebar in blocks/tabs-navigation.tsx: same width,
          dashed left rail that fills in on the active item, name only. */}
      <aside
        ref={asideRef}
        data-lenis-prevent
        aria-label="Scroll animations"
        className="hidden h-full min-h-0 w-52 shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-dashed pr-3 pb-2 md:flex [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-thumb]:transition-colors hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50"
      >
        <nav className="flex flex-col gap-0.5">
          {ScrollArr.map((item) => {
            const active = activeId === item.registryName;
            return (
              <button
                key={item.registryName}
                type="button"
                title={item.name}
                ref={(el) => {
                  itemRefs.current[item.registryName] = el;
                }}
                onClick={() => scrollTo(item.registryName)}
                className={cn(
                  "w-full cursor-pointer truncate border-l border-dashed px-2 py-1.5 text-left text-xs transition-colors",
                  active
                    ? "border-l-foreground bg-muted text-foreground"
                    : "border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

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
            <div className={cn("pointer-events-none z-80 flex items-start justify-between gap-3 p-3", activeItem.registryName === "glass-scroll-navbar" ? "relative h-12 bg-background" : "sticky top-0 -mb-16") }>
              <div className="pointer-events-auto leading-tight">
                <p className="text-sm font-medium">{activeItem.name}</p>
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
            <GradientBlur
              side="top"
              position="sticky"
              height={96}
              className="-mb-24"
            />

            <div className="pointer-events-none sticky top-0 z-70 flex items-start justify-between gap-3 px-3 pb-10 pt-3">
              <div className="pointer-events-auto leading-tight">
                <p className="text-sm font-medium">{activeItem.name}</p>
              </div>
              <div className="pointer-events-auto">
                <CopyDropdown registryName={activeItem.registryName} />
              </div>
            </div>

            <div aria-hidden style={{ height: "70vh" }} />
            <div className="flex min-h-[40vh] w-full items-center justify-center px-6">
              {activeItem.component}
            </div>
            <div aria-hidden style={{ height: "120vh" }} />

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

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>

      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>

      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
