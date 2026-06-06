"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";

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

const navItems = [
  {
    name: "Buttons",
    slug: "buttons",
    Component: lazyGrid(() => import("../grids/button-grid")),
  },
  {
    name: "SVG Animations",
    slug: "svg-animations",
    Component: lazyGrid(() => import("../grids/svg-animations-grid")),
  },
  {
    name: "Motion Animations",
    slug: "motion",
    Component: lazyGrid(() => import("../grids/motion-animations-grid")),
  },
  {
    name: "GSAP Animations",
    slug: "gsap",
    Component: lazyGrid(() => import("../grids/gsap-grid")),
  },
  {
    name: "SVG Assets",
    slug: "svg-assets",
    Component: lazyGrid(() => import("../grids/svg-grid")),
  },
  {
    name: "Text Animations",
    slug: "text",
    Component: lazyGrid(() => import("../grids/text-grid")),
  },
  {
    name: "Borders & Intersections",
    slug: "borders",
    Component: lazyGrid(() => import("../grids/border-grid")),
  },
  {
    name: "Background Gradients, Patterns & Masks",
    slug: "backgrounds",
    Component: lazyGrid(() => import("../grids/background-grid")),
  },
  {
    name: "Image Gradients",
    slug: "image-gradients",
    Component: lazyGrid(() => import("../grids/image-gradient-grid")),
  },
  {
    name: "Mouse Followers",
    slug: "mouse-followers",
    Component: lazyGrid(() => import("../grids/mouse-follower-grid")),
  },
  {
    name: "SVG Path Effects",
    slug: "svg-path",
    Component: lazyGrid(() => import("../grids/svg-path-effect-grid")),
  },
  {
    name: "Bento Cards",
    slug: "bento",
    Component: lazyGrid(() => import("../grids/bento-cards-grid")),
  },
  {
    name: "Sidebars",
    slug: "sidebars",
    Component: lazyGrid(() => import("../grids/sidebar-grid")),
  },
  {
    name: "Shaders",
    slug: "shaders",
    Component: lazyGrid(() => import("../grids/shader-grid")),
  },
];

export function TabsNavigation() {
  const [active, setActive] = useState(navItems[0].slug);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && navItems.some((item) => item.slug === tab)) {
      setActive(tab);
    }
  }, []);

  // Smart scroll: bring the active tab — and the items just after it — into view.
  useEffect(() => {
    const list = listRef.current;
    const trigger = triggerRefs.current[active];
    if (!list || !trigger) return;

    const padding = 480; // breathing room so several neighbouring items scroll into the viewport
    const listRect = list.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();

    if (triggerRect.right + padding > listRect.right) {
      // Active tab is at/past the right edge → scroll right to reveal the next items.
      list.scrollBy({
        left: triggerRect.right + padding - listRect.right,
        behavior: "smooth",
      });
    } else if (triggerRect.left - padding < listRect.left) {
      // Active tab is at/past the left edge → scroll left to reveal the previous items.
      list.scrollBy({
        left: triggerRect.left - padding - listRect.left,
        behavior: "smooth",
      });
    }
  }, [active]);

  const handleChange = (slug: string) => {
    setActive(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", slug);
    window.history.replaceState(null, "", url);

    // Release focus from the tab trigger so the ←/→ keys drive the grid's
    // pagination instead of Radix's built-in tab navigation.
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

  return (
    <Tabs value={active} onValueChange={handleChange} className="w-full ">
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
