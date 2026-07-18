"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { BLOCK_CATEGORIES } from "@/lib/blocks/categories";

function GridSkeleton() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center text-muted-foreground">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin"
      >
        <path d="M12 3V6" />
        <path d="M12 18V21" />
        <path d="M21 12L18 12" />
        <path d="M6 12L3 12" />
        <path d="M18.3635 5.63672L16.2422 7.75804" />
        <path d="M7.75804 16.2422L5.63672 18.3635" />
        <path d="M18.3635 18.3635L16.2422 16.2422" />
        <path d="M7.75804 7.75804L5.63672 5.63672" />
      </svg>
    </div>
  );
}

const lazyGrid = (loader: () => Promise<{ default: ComponentType }>) =>
  dynamic(loader, { ssr: false, loading: () => <GridSkeleton /> });

// Labels/slugs live in BLOCK_CATEGORIES (shared with routes + sitemap); only the
// grid loaders stay here so the imports remain statically analyzable.
const GRID_COMPONENTS: Record<string, ComponentType> = {
  buttons: lazyGrid(() => import("../grids/button-grid")),
  "svg-animations": lazyGrid(() => import("../grids/svg-animations-grid")),
  motion: lazyGrid(() => import("../grids/motion-animations-grid")),
  gsap: lazyGrid(() => import("../grids/gsap-grid")),
  carousels: lazyGrid(() => import("../grids/carousel-grid")),
  "svg-assets": lazyGrid(() => import("../grids/svg-grid")),
  text: lazyGrid(() => import("../grids/text-grid")),
  scroll: lazyGrid(() => import("../grids/scroll-grid")),
  borders: lazyGrid(() => import("../grids/border-grid")),
  backgrounds: lazyGrid(() => import("../grids/background-grid")),
  masks: lazyGrid(() => import("../grids/mask-grid")),
  "image-gradients": lazyGrid(() => import("../grids/image-gradient-grid")),
  "mouse-followers": lazyGrid(() => import("../grids/mouse-follower-grid")),
  "svg-path": lazyGrid(() => import("../grids/svg-path-effect-grid")),
  bento: lazyGrid(() => import("../grids/bento-cards-grid")),
  sidebars: lazyGrid(() => import("../grids/sidebar-grid")),
  shaders: lazyGrid(() => import("../grids/shader-grid")),
  "image-shaders": lazyGrid(() => import("../grids/image-shaders-grid")),
  perspective: lazyGrid(() => import("../grids/perspective-grid")),
  "3j": lazyGrid(() => import("../grids/three-js-grid")),
};

const navItems = BLOCK_CATEGORIES.map((category) => ({
  name: category.name,
  slug: category.slug,
  Component: GRID_COMPONENTS[category.slug],
}));

interface TabsNavigationProps {
  /** Slug of the category route rendering this instance; omit on /blocks. */
  initialTab?: string;
  /** Render the active category's h1 + intro (used on /blocks/[category]). */
  showCategoryHeader?: boolean;
}

export function TabsNavigation({
  initialTab,
  showCategoryHeader = false,
}: TabsNavigationProps) {
  const [active, setActive] = useState(
    initialTab && navItems.some((item) => item.slug === initialTab)
      ? initialTab
      : navItems[0].slug,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (initialTab) {
      // Tidy the ?tab= that Next's 308 redirect passes through on legacy links.
      if (new URLSearchParams(window.location.search).has("tab")) {
        window.history.replaceState(null, "", `/blocks/${initialTab}`);
      }
      return;
    }
    // Legacy links: /blocks?tab=x → activate and normalize the URL to the route.
    // One-shot sync from an external input (the URL) — allowed setState-in-effect.
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && navItems.some((item) => item.slug === tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(tab);
      window.history.replaceState(null, "", `/blocks/${tab}`);
    }
  }, [initialTab]);

  useEffect(() => {
    const list = listRef.current;
    const trigger = triggerRefs.current[active];
    if (!list || !trigger) return;

    const padding = 480; // breathing room so several neighbouring items scroll into the viewport
    const listRect = list.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();

    if (triggerRect.right + padding > listRect.right) {
      list.scrollBy({
        left: triggerRect.right + padding - listRect.right,
        behavior: "smooth",
      });
    } else if (triggerRect.left - padding < listRect.left) {
      list.scrollBy({
        left: triggerRect.left - padding - listRect.left,
        behavior: "smooth",
      });
    }
  }, [active]);

  const handleChange = (slug: string) => {
    setActive(slug);
    // replaceState (not router navigation): the root template replays its
    // transition on every Next navigation, which would remount the grid.
    window.history.replaceState(null, "", `/blocks/${slug}`);

    requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (
        focused instanceof HTMLElement &&
        focused.getAttribute("data-slot") === "tabs-trigger"
      ) {
        focused.blur();
      }
    });
  };

  const activeCategory = BLOCK_CATEGORIES.find((c) => c.slug === active);

  return (
    <Tabs value={active} onValueChange={handleChange} className="w-full ">
      {showCategoryHeader && activeCategory && (
        // Screen-reader/crawler only — Vansh doesn't want visible SEO copy.
        <header className="sr-only">
          <h1>{activeCategory.title}</h1>
          <p>{activeCategory.description}</p>
        </header>
      )}
      <TabsList
        ref={listRef}
        className="flex gap-4 overflow-x-auto overflow-y-hidden w-full mask-r-from-98% dark:bg-black [scrollbar-width:thin] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-thumb]:transition-colors"
      >
        {navItems.map((item) => (
          <TabsTrigger
            ref={(el) => {
              triggerRefs.current[item.slug] = el;
            }}
            className="z-50 cursor-pointer group text-xs"
            key={item.slug}
            value={item.slug}
          >
            {item.name}
            <div className="border-t border-dashed group-data-[state=active]:border-foreground mask-x-to-98%" />
          </TabsTrigger>
        ))}
        <a
          href="https://www.asciistudio.space/showcase"
          target="_blank"
          rel="noopener noreferrer"
          className="z-50 cursor-pointer group text-xs px-1 py-1 font-medium text-nowrap inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          ASCII Animations
          <ArrowUpRight className="size-3" />
        </a>
      </TabsList>
      <div className=" border-t border-dashed mask-x-from-95%"></div>
      {navItems.map(({ slug, Component }) => (
        <TabsContent key={slug} value={slug}>
          <Component />
        </TabsContent>
      ))}
    </Tabs>
  );
}
