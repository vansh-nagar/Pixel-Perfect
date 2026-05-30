"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

function GridSkeleton() {
  return (
    <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground">
      Loading…
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
  {
    name: "Figma → Code",
    slug: "figma-to-code",
    Component: lazyGrid(() => import("../grids/figma-to-code-grid")),
  },
];

export function TabsNavigation() {
  const [active, setActive] = useState(navItems[0].slug);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && navItems.some((item) => item.slug === tab)) {
      setActive(tab);
    }
  }, []);

  const handleChange = (slug: string) => {
    setActive(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", slug);
    window.history.replaceState(null, "", url);
  };

  return (
    <Tabs value={active} onValueChange={handleChange} className="w-full ">
      <TabsList className="flex gap-4 overflow-x-auto overflow-y-hidden w-full mask-r-from-98% dark:bg-black [scrollbar-width:thin] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-thumb]:transition-colors">
        {navItems.map((item) => (
          <TabsTrigger
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
