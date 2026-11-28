"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Navbar } from "@/components/mine/landing-page/navbar";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Sparkles,
  MousePointerClick,
  Palette,
  Waypoints,
  Move3d,
  ChevronDown,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

import GooeyButtonTutorial from "./tutorials/gooey-button/gooey-button-tutorial";
import MorphButtonTutorial from "./tutorials/morph-button/morph-button-tutorial";
import ThreedButtonTutorial from "./tutorials/3d-button/threed-button-tutorial";
import OrangePremiumButtonTutorial from "./tutorials/orange-premium-button/orange-premium-button-tutorial";
import PremiumButtonTutorial from "./tutorials/premium-button/premium-button-tutorial";
import BorderGradientButtonTutorial from "./tutorials/border-gradient-button/border-gradient-button-tutorial";
import VisitButtonTutorial from "./tutorials/visit-button/visit-button-tutorial";
import GlassButtonTutorial from "./tutorials/glass-button/glass-button-tutorial";
import BookDemoButtonTutorial from "./tutorials/book-demo-button/book-demo-button-tutorial";

type TutorialItem = {
  name: string;
  description: string;
  category: string;
  tags: string[];
  registryName: string;
  tutorial?: React.ComponentType;
  example?: React.ReactNode;
  content?: React.ReactNode;
};

type Category = {
  name: string;
  icon: React.ReactNode;
  slug: string;
  description: string;
  items: TutorialItem[];
};

const categories: Category[] = [
  {
    name: "Buttons",
    icon: <MousePointerClick className="size-4" />,
    slug: "buttons",
    description:
      "Interactive button components with hover effects, morphing animations, and premium styling.",
    items: [
      {
        name: "Gooey Button",
        description:
          "Interactive SVG filter breakdown. Toggle each filter primitive to see its effect.",
        category: "Buttons",
        tags: ["svg", "filter", "gooey", "interactive"],
        registryName: "goe-button",
        tutorial: GooeyButtonTutorial,
      },
      {
        name: "Morph Button",
        description:
          "GSAP MorphSVG path animation with color transition on hover.",
        category: "Buttons",
        tags: ["gsap", "morph", "svg", "hover"],
        registryName: "morph-button",
        tutorial: MorphButtonTutorial,
      },
      {
        name: "3D Button",
        description:
          "CSS-only 3D press effect with depth layer and hover lift.",
        category: "Buttons",
        tags: ["css", "3d", "press", "depth"],
        registryName: "3d-button",
        tutorial: ThreedButtonTutorial,
      },
      {
        name: "Border Gradient Button",
        description:
          "Animated rainbow gradient border using inset mask technique.",
        category: "Buttons",
        tags: ["gradient", "border", "rainbow", "css"],
        registryName: "border-gradient-button",
        tutorial: BorderGradientButtonTutorial,
      },
      {
        name: "Premium Button",
        description:
          "Multi-layer box-shadow system creating depth and bevel effects.",
        category: "Buttons",
        tags: ["shadow", "premium", "depth", "bevel"],
        registryName: "premium-button",
        tutorial: PremiumButtonTutorial,
      },
      {
        name: "Orange Premium Button",
        description:
          "Stacked gradients, blend modes, and layered shadows for vibrant styling.",
        category: "Buttons",
        tags: ["gradient", "blend", "shadow", "premium"],
        registryName: "orange-premium-button",
        tutorial: OrangePremiumButtonTutorial,
      },
      {
        name: "Visit Button",
        description:
          "AnimatePresence label and icon swap with blur transitions.",
        category: "Buttons",
        tags: ["framer", "swap", "blur", "hover"],
        registryName: "visit-button",
        tutorial: VisitButtonTutorial,
      },
      {
        name: "Mouse Follower Button",
        description:
          "Button that tracks cursor position with clamped magnetic movement.",
        category: "Buttons",
        tags: ["mouse", "follow", "magnetic", "animation"],
        registryName: "mouse-follower-button",
      },
      {
        name: "Learn More Button",
        description:
          "Expanding pill with arrow reveal using Framer Motion variants.",
        category: "Buttons",
        tags: ["framer", "expand", "pill", "hover"],
        registryName: "learn-more-button",
      },
      {
        name: "Toggle Button",
        description:
          "Spring-physics toggle switch with premium shadow styling.",
        category: "Buttons",
        tags: ["toggle", "spring", "switch", "framer"],
        registryName: "toggle-button",
      },
      {
        name: "Blur Toggle Button",
        description: "Icon swap between check and copy with blur transition.",
        category: "Buttons",
        tags: ["blur", "toggle", "icon", "framer"],
        registryName: "blur-toggle-button",
      },
      {
        name: "Morph Image Button",
        description: "GSAP MorphSVG with masked image reveals on hover.",
        category: "Buttons",
        tags: ["gsap", "morph", "image", "mask"],
        registryName: "morph-image-button",
      },
      {
        name: "Abhinav Bento Button",
        description:
          "Gradient button with elaborate inner glow and shadow layers.",
        category: "Buttons",
        tags: ["gradient", "glow", "bento", "shadow"],
        registryName: "abhinav-bento-button",
      },
      {
        name: "Glass Button",
        description:
          "Frosted glass button with gradient border trick and 10 color variants.",
        category: "Buttons",
        tags: ["glass", "gradient", "border", "backdrop-blur"],
        registryName: "glass-button",
        tutorial: GlassButtonTutorial,
      },
      {
        name: "Book a Demo Button",
        description:
          "Lime square with dotted chevron animation that expands a dark panel on hover.",
        category: "Buttons",
        tags: ["lime", "chevron", "hover", "expand"],
        registryName: "book-demo-button",
        tutorial: BookDemoButtonTutorial,
      },
    ],
  },
  {
    name: "Motion Animations",
    icon: <Move3d className="size-4" />,
    slug: "motion-animations",
    description:
      "Framer Motion-powered animations for cards, logos, tabs, and image interactions.",
    items: [
      {
        name: "Logo Animation",
        description:
          "Logo animation with Framer Motion and custom background effects.",
        category: "Motion Animations",
        tags: ["framer", "logo", "animation", "brand"],
        registryName: "logo-animation",
      },
    ],
  },
  {
    name: "Backgrounds",
    icon: <Palette className="size-4" />,
    slug: "backgrounds",
    description: "Animated currency skies and drifting dither wave backgrounds.",
    items: [
      {
        name: "Currency Sky Background",
        description: "A flowing field of currency glyphs with bright contour bands.",
        category: "Backgrounds",
        tags: ["canvas", "currency", "waves"],
        registryName: "currency-sky-background",
      },
      {
        name: "Dither Wave Background",
        description: "Slow blue-and-paper halftone waves with a gentle pointer warp.",
        category: "Backgrounds",
        tags: ["webgl", "dither", "waves"],
        registryName: "dither-wave-background",
      },

    ],
  },
  {
    name: "Mouse Followers",
    icon: <Waypoints className="size-4" />,
    slug: "mouse-followers",
    description:
      "Mouse trail and cursor follower effects using GSAP animations.",
    items: [
      {
        name: "Image Fall",
        description:
          "Image trail mouse follower with GSAP ticker and elastic animations.",
        category: "Mouse Followers",
        tags: ["gsap", "trail", "image", "elastic"],
        registryName: "mouse-follower-1",
      },
      {
        name: "Icon Fall",
        description: "Icon trail mouse follower with falling animation.",
        category: "Mouse Followers",
        tags: ["gsap", "trail", "icon", "fall"],
        registryName: "mouse-follower-2",
      },
    ],
  },
];

function elasticSearch(query: string, cats: Category[]): Category[] {
  if (!query.trim()) return cats;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return cats
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const haystack = [
          item.name,
          item.description,
          item.category,
          ...item.tags,
        ]
          .join(" ")
          .toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      }),
    }))
    .filter((cat) => cat.items.length > 0);
}

const TutorialPage = () => {
  const [query, setQuery] = useState("");
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(
    new Set(["buttons"]),
  );
  const [selectedItem, setSelectedItem] = useState<TutorialItem | null>(
    () => {
      for (const cat of categories) {
        const found = cat.items.find((i) => i.registryName === "goe-button");
        if (found) return found;
      }
      return null;
    },
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleCategories = useMemo(() => {
    const allowed = new Set([
      "goe-button",
      "orange-premium-button",
      "glass-button",
      "book-demo-button",
    ]);

    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => allowed.has(item.registryName)),
      }))
      .filter((category) => category.items.length > 0);
  }, []);

  const totalItems = useMemo(
    () => visibleCategories.reduce((acc, c) => acc + c.items.length, 0),
    [visibleCategories],
  );

  const filteredCategories = useMemo(
    () => elasticSearch(query, visibleCategories),
    [query, visibleCategories],
  );

  const toggleCategory = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectItem = (item: TutorialItem) => {
    setSelectedItem(item);
  };

  const clearSelection = () => {
    setSelectedItem(null);
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && selectedItem) {
        clearSelection();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [selectedItem]);

  useEffect(() => {
    if (query.trim()) {
      setExpandedSlugs(new Set(filteredCategories.map((c) => c.slug)));
    }
  }, [query, filteredCategories]);

  return (
    <div className="relative w-full grid min-h-screen grid-cols-[1fr_1rem_auto_1rem_1fr] grid-rows-[auto_auto_1px_1fr] [--pattern-fg:var(--color-gray-950)]/5 dark:bg-black dark:[--pattern-fg:var(--color-white)]/10">
      <div className="col-start-3 row-start-1 flex w-[90vw] px-4 py-3 flex-col relative">
        <Navbar />
      </div>

      <div className="col-start-3 row-start-2 w-[90vw] p-3">
        <div className="flex flex-col md:flex-row gap-0 min-h-[calc(100vh-120px)]">
          <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-dashed flex flex-col max-h-[45vh] md:max-h-none">
            <div className="p-3 border-b border-dashed">
              <h1 className="text-lg font-semibold  tracking-tight flex items-center gap-2">
                <BookOpen className="size-5" />
                Tutorials
              </h1>
              <p className="text-[10px] text-muted-foreground mt-1">
                {totalItems} component{totalItems !== 1 ? "s" : ""} available
              </p>
            </div>

            <div className="p-3 border-b border-dashed">
              <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input
                  ref={inputRef}
                  id="tutorial-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-8 h-8 text-xs rounded-none border-dashed bg-background/50 focus-visible:ring-0 focus-visible:border-foreground/30"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <nav className="p-2">
                {filteredCategories.length === 0 && query ? (
                  <div className="px-3 py-8 text-center">
                    <Search className="size-5 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No results for &quot;{query}&quot;
                    </p>
                  </div>
                ) : (
                  filteredCategories.map((cat) => {
                    const isExpanded = expandedSlugs.has(cat.slug);
                    const hasItems = cat.items.length > 0;

                    return (
                      <div key={cat.slug} className="mb-0.5">
                        <button
                          id={`cat-${cat.slug}`}
                          onClick={() => toggleCategory(cat.slug)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs text-left rounded-none transition-all duration-150 group hover:bg-foreground/[0.03] ${
                            isExpanded
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="shrink-0 transition-colors group-hover:text-foreground">
                            {cat.icon}
                          </span>
                          <span className="flex-1 truncate font-medium">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums mr-1">
                            {cat.items.length}
                          </span>
                          <ChevronDown
                            className={`size-3 text-muted-foreground transition-transform duration-200 ${
                              isExpanded ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isExpanded && hasItems && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 border-l border-dashed pl-0">
                                {cat.items.map((item) => (
                                  <button
                                    key={item.registryName}
                                    id={`item-${item.registryName}`}
                                    onClick={() => selectItem(item)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left rounded-none transition-all duration-150 ${
                                      selectedItem?.registryName ===
                                      item.registryName
                                        ? "bg-foreground/5 text-foreground border-l-2 border-foreground -ml-[1px]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02] border-l-2 border-transparent -ml-[1px]"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {item.name}
                                    </span>
                                    {item.tutorial && (
                                      <span className="ml-auto shrink-0 size-1.5 rounded-full bg-green-500" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {isExpanded && !hasItems && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 border-l border-dashed pl-3 py-2">
                                <p className="text-[10px] text-muted-foreground italic">
                                  No tutorials yet
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </nav>
            </ScrollArea>
          </aside>

          <main className="flex-1 min-w-0 min-h-[50vh] md:min-h-0">
            <AnimatePresence mode="wait">
              {selectedItem ? (
                <motion.div
                  key={selectedItem.registryName}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-start sm:items-center gap-3 p-4 border-b border-dashed">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-none border-dashed size-7"
                      onClick={clearSelection}
                    >
                      <ArrowLeft className="size-3.5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold truncate">
                        {selectedItem.name}
                      </h2>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {selectedItem.category} · {selectedItem.description}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end max-w-[45%]">
                      {selectedItem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-1.5 py-0.5 text-[9px] border border-dashed text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedItem.tutorial ? (
                    <selectedItem.tutorial />
                  ) : (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
                      <div className="border-r border-dashed flex flex-col">
                        <div className="px-4 py-2 border-b border-dashed">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Preview
                          </p>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-6 relative">
                          {selectedItem.example ? (
                            selectedItem.example
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-center">
                              <div className="size-20 border-2 border-dashed rounded-none flex items-center justify-center">
                                <Sparkles className="size-6 text-muted-foreground/40" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Interactive tutorial coming soon
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 max-w-[200px]">
                                This component is available in the library. Use
                                the copy button on the main page to get the
                                code.
                              </p>
                            </div>
                          )}
                          <span className="absolute top-0 left-0 block size-5 border-l border-t border-dashed border-muted-foreground" />
                          <span className="absolute top-0 right-0 block size-5 border-r border-t border-dashed border-muted-foreground" />
                          <span className="absolute bottom-0 left-0 block size-5 border-l border-b border-dashed border-muted-foreground" />
                          <span className="absolute bottom-0 right-0 block size-5 border-r border-b border-dashed border-muted-foreground" />
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="px-4 py-2 border-b border-dashed">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                            Tutorial
                          </p>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="p-6">
                            {selectedItem.content ? (
                              selectedItem.content
                            ) : (
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-muted-foreground/50">
                                  <BookOpen className="size-4" />
                                  <p className="text-xs font-medium">
                                    Tutorial content goes here
                                  </p>
                                </div>
                                <div className="space-y-3">
                                  <div className="h-3 w-3/4 bg-foreground/[0.04] rounded-sm" />
                                  <div className="h-3 w-full bg-foreground/[0.04] rounded-sm" />
                                  <div className="h-3 w-5/6 bg-foreground/[0.04] rounded-sm" />
                                  <div className="h-3 w-2/3 bg-foreground/[0.04] rounded-sm" />
                                </div>
                                <div className="border border-dashed p-4 mt-2">
                                  <p className="text-[10px] text-muted-foreground/60">
                                    Set the{" "}
                                    <code className="px-1 py-0.5 bg-foreground/5 text-[9px]">
                                      content
                                    </code>{" "}
                                    property in your tutorial item to add
                                    documentation, usage examples, code
                                    snippets, and more.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8"
                >
                  <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="relative">
                      <div className="size-24 border-2 border-dashed rounded-none flex items-center justify-center">
                        <BookOpen className="size-8 text-muted-foreground/30" />
                      </div>
                      <span className="absolute -top-1 -left-1 block size-3 border-l-2 border-t-2 border-foreground/20" />
                      <span className="absolute -top-1 -right-1 block size-3 border-r-2 border-t-2 border-foreground/20" />
                      <span className="absolute -bottom-1 -left-1 block size-3 border-l-2 border-b-2 border-foreground/20" />
                      <span className="absolute -bottom-1 -right-1 block size-3 border-r-2 border-b-2 border-foreground/20" />
                    </div>

                    <div className="mt-2">
                      <h2 className="text-sm font-semibold">
                        Select a component
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Choose a component from the sidebar to explore its
                        interactive tutorial. Components with a{" "}
                        <span className="inline-block size-1.5 rounded-full bg-green-500 mx-0.5 align-middle" />{" "}
                        dot have full interactive tutorials.
                      </p>
                    </div>

                    {totalItems === 0 && (
                      <div className="border border-dashed p-4 mt-4 w-full">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          No tutorials added yet. Add items to the{" "}
                          <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">
                            categories
                          </code>{" "}
                          array in{" "}
                          <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">
                            tutorial/page.tsx
                          </code>{" "}
                          to get started.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <div className="pointer-events-none -right-px col-start-2 row-span-full row-start-1 border-x mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed" />
      <div className="pointer-events-none relative -left-px col-start-4 row-span-full row-start-1 border-x border-x-[--pattern-fg] mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed" />
      <div className="pointer-events-none relative -bottom-px col-span-full col-start-1 row-start-2 mask-x-from-97% border-t border-dashed" />
      <div className="pointer-events-none relative -top-px col-span-full col-start-1 row-start-4 mask-x-from-99% border-b border-dashed" />
    </div>
  );
};

export default TutorialPage;
