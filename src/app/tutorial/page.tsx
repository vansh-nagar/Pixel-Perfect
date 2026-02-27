"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Navbar } from "@/components/mine/landing-page/navbar";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Sparkles,
  MousePointerClick,
  Type,
  Palette,
  Frame,
  Waypoints,
  PenTool,
  Move3d,
  Layers,
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
import ShinyButtonTutorial from "./tutorials/shiny-button/shiny-button-tutorial";
import OrangePremiumButtonTutorial from "./tutorials/orange-premium-button/orange-premium-button-tutorial";
import PremiumButtonTutorial from "./tutorials/premium-button/premium-button-tutorial";
import BorderGradientButtonTutorial from "./tutorials/border-gradient-button/border-gradient-button-tutorial";
import StripeButtonTutorial from "./tutorials/stripe-button/stripe-button-tutorial";
import VisitButtonTutorial from "./tutorials/visit-button/visit-button-tutorial";

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
    description: "Interactive button components with hover effects, morphing animations, and premium styling.",
    items: [
      {
        name: "Gooey Button",
        description: "Interactive SVG filter breakdown. Toggle each filter primitive to see its effect.",
        category: "Buttons",
        tags: ["svg", "filter", "gooey", "interactive"],
        registryName: "goe-button",
        tutorial: GooeyButtonTutorial,
      },
      {
        name: "Morph Button",
        description: "GSAP MorphSVG path animation with color transition on hover.",
        category: "Buttons",
        tags: ["gsap", "morph", "svg", "hover"],
        registryName: "morph-button",
        tutorial: MorphButtonTutorial,
      },
      {
        name: "3D Button",
        description: "CSS-only 3D press effect with depth layer and hover lift.",
        category: "Buttons",
        tags: ["css", "3d", "press", "depth"],
        registryName: "3d-button",
        tutorial: ThreedButtonTutorial,
      },
      {
        name: "Shiny Button",
        description: "CSS keyframe shine sweep with rotation and overflow clipping.",
        category: "Buttons",
        tags: ["css", "shine", "keyframe", "hover"],
        registryName: "shiny-button",
        tutorial: ShinyButtonTutorial,
      },
      {
        name: "Border Gradient Button",
        description: "Animated rainbow gradient border using inset mask technique.",
        category: "Buttons",
        tags: ["gradient", "border", "rainbow", "css"],
        registryName: "border-gradient-button",
        tutorial: BorderGradientButtonTutorial,
      },
      {
        name: "Premium Button",
        description: "Multi-layer box-shadow system creating depth and bevel effects.",
        category: "Buttons",
        tags: ["shadow", "premium", "depth", "bevel"],
        registryName: "premium-button",
        tutorial: PremiumButtonTutorial,
      },
      {
        name: "Orange Premium Button",
        description: "Stacked gradients, blend modes, and layered shadows for vibrant styling.",
        category: "Buttons",
        tags: ["gradient", "blend", "shadow", "premium"],
        registryName: "orange-premium-button",
        tutorial: OrangePremiumButtonTutorial,
      },
      {
        name: "Stripe Button",
        description: "Minimalist button with inset top shadow for subtle 3D bevel.",
        category: "Buttons",
        tags: ["stripe", "inset", "shadow", "minimal"],
        registryName: "stripe-button",
        tutorial: StripeButtonTutorial,
      },
      {
        name: "Visit Button",
        description: "AnimatePresence label and icon swap with blur transitions.",
        category: "Buttons",
        tags: ["framer", "swap", "blur", "hover"],
        registryName: "visit-button",
        tutorial: VisitButtonTutorial,
      },
      {
        name: "Mouse Follower Button",
        description: "Button that tracks cursor position with clamped magnetic movement.",
        category: "Buttons",
        tags: ["mouse", "follow", "magnetic", "animation"],
        registryName: "mouse-follower-button",
      },
      {
        name: "Learn More Button",
        description: "Expanding pill with arrow reveal using Framer Motion variants.",
        category: "Buttons",
        tags: ["framer", "expand", "pill", "hover"],
        registryName: "learn-more-button",
      },
      {
        name: "Toggle Button",
        description: "Spring-physics toggle switch with premium shadow styling.",
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
        description: "Gradient button with elaborate inner glow and shadow layers.",
        category: "Buttons",
        tags: ["gradient", "glow", "bento", "shadow"],
        registryName: "abhinav-bento-button",
      },
    ],
  },
  {
    name: "Motion Animations",
    icon: <Move3d className="size-4" />,
    slug: "motion-animations",
    description: "Framer Motion-powered animations for cards, logos, tabs, and image interactions.",
    items: [
      {
        name: "Card Animation",
        description: "Staggered card stack with cursor follower using Framer Motion variants.",
        category: "Motion Animations",
        tags: ["framer", "card", "stagger", "hover"],
        registryName: "card-animation",
      },
      {
        name: "Logo Animation",
        description: "Logo animation with Framer Motion and custom background effects.",
        category: "Motion Animations",
        tags: ["framer", "logo", "animation", "brand"],
        registryName: "logo-animation",
      },
      {
        name: "Tab Background",
        description: "Animated tab indicator using Framer Motion layoutId for smooth transitions.",
        category: "Motion Animations",
        tags: ["framer", "tabs", "layoutId", "spring"],
        registryName: "tab-background-animation",
      },
      {
        name: "Image Hover",
        description: "Image hover animation with scaling and opacity effects.",
        category: "Motion Animations",
        tags: ["framer", "image", "hover", "scale"],
        registryName: "image-hover-animation",
      },
    ],
  },
  {
    name: "GSAP Animations",
    icon: <Sparkles className="size-4" />,
    slug: "gsap-animations",
    description: "GSAP-powered stagger and ripple animations for dynamic UI effects.",
    items: [
      {
        name: "Stagger Ripple",
        description: "Grid-based ripple animation with stagger effect using GSAP.",
        category: "GSAP Animations",
        tags: ["gsap", "stagger", "ripple", "grid"],
        registryName: "stagger-1",
      },
    ],
  },
  {
    name: "SVG Assets",
    icon: <PenTool className="size-4" />,
    slug: "svg-assets",
    description: "Animated SVG assets and illustrations with GSAP-powered motion.",
    items: [
      {
        name: "SVG Asset 1",
        description: "Animated SVG asset with GSAP-powered path animations.",
        category: "SVG Assets",
        tags: ["svg", "gsap", "animated", "asset"],
        registryName: "svg-1",
      },
      {
        name: "SVG Asset 2",
        description: "Animated SVG asset with path drawing effects.",
        category: "SVG Assets",
        tags: ["svg", "path", "draw", "asset"],
        registryName: "svg-2",
      },
      {
        name: "SVG Asset 4",
        description: "Complex animated SVG illustration.",
        category: "SVG Assets",
        tags: ["svg", "complex", "illustration", "gsap"],
        registryName: "svg-4",
      },
      {
        name: "SVG Asset 5",
        description: "Animated SVG asset with motion effects.",
        category: "SVG Assets",
        tags: ["svg", "motion", "animated", "asset"],
        registryName: "svg-5",
      },
      {
        name: "SVG Asset 8",
        description: "Animated SVG asset with dynamic effects.",
        category: "SVG Assets",
        tags: ["svg", "dynamic", "animated", "asset"],
        registryName: "svg-8",
      },
      {
        name: "SVG Asset 9",
        description: "Large animated SVG illustration.",
        category: "SVG Assets",
        tags: ["svg", "large", "animated", "illustration"],
        registryName: "svg-9",
      },
      {
        name: "SVG Asset 6",
        description: "Animated SVG asset with stroke animations.",
        category: "SVG Assets",
        tags: ["svg", "stroke", "animated", "asset"],
        registryName: "svg-6",
      },
    ],
  },
  {
    name: "Text Animations",
    icon: <Type className="size-4" />,
    slug: "text-animations",
    description: "Advanced text animations like glitch, scatter, reveal, matrix rain, and more.",
    items: [
      {
        name: "Broken Glass",
        description: "Letters start shattered and rotated, then snap into place using GSAP SplitText.",
        category: "Text Animations",
        tags: ["gsap", "splittext", "shatter", "assemble"],
        registryName: "text-broken-glass",
      },
      {
        name: "Matrix Rain",
        description: "Japanese characters scramble and resolve to final text, Matrix-style.",
        category: "Text Animations",
        tags: ["gsap", "matrix", "scramble", "decode"],
        registryName: "text-matrix-rain",
      },
      {
        name: "Glitch Portal",
        description: "RGB split, scale blur, and elastic resolve using GSAP SplitText.",
        category: "Text Animations",
        tags: ["gsap", "glitch", "rgb", "portal"],
        registryName: "text-glitch-portal",
      },
      {
        name: "Typewriter Glitch",
        description: "Types, deletes, types wrong, then finally resolves to correct text.",
        category: "Text Animations",
        tags: ["gsap", "typewriter", "glitch", "error"],
        registryName: "text-typewriter-glitch",
      },
      {
        name: "Text Reveal",
        description: "Characters resolve from random symbols to final text progressively.",
        category: "Text Animations",
        tags: ["gsap", "reveal", "scramble", "decode"],
        registryName: "text-reveal",
      },
      {
        name: "Text Video",
        description: "Video masked text effect using CSS clip-path.",
        category: "Text Animations",
        tags: ["css", "video", "mask", "clip"],
        registryName: "text-video",
      },
      {
        name: "Text Z Rotate",
        description: "Z-axis rotation animation with configurable stagger direction.",
        category: "Text Animations",
        tags: ["gsap", "rotation", "z-axis", "stagger"],
        registryName: "text-z-rotate",
      },
      {
        name: "Text Z Rotate 2",
        description: "Z-axis rotation variant with different easing.",
        category: "Text Animations",
        tags: ["gsap", "rotation", "z-axis", "variant"],
        registryName: "text-z-rotate2",
      },
      {
        name: "Text Reveal 2",
        description: "Text reveal animation variant with different styling.",
        category: "Text Animations",
        tags: ["gsap", "reveal", "variant", "animation"],
        registryName: "text-reveal2",
      },
      {
        name: "Text Scatter",
        description: "Characters scatter to random positions and reassemble with GSAP.",
        category: "Text Animations",
        tags: ["gsap", "scatter", "random", "yoyo"],
        registryName: "text-scatter",
      },
      {
        name: "Text Scatter 1",
        description: "Text scatter variant with different animation parameters.",
        category: "Text Animations",
        tags: ["gsap", "scatter", "variant", "stagger"],
        registryName: "text-scatter1",
      },
      {
        name: "Text Fade",
        description: "Text fades in and out on scroll using GSAP ScrollTrigger.",
        category: "Text Animations",
        tags: ["gsap", "fade", "scroll", "trigger"],
        registryName: "text-fade",
      },
      {
        name: "Text Inertia",
        description: "Text follows mouse movement with inertia physics using GSAP.",
        category: "Text Animations",
        tags: ["gsap", "inertia", "mouse", "physics"],
        registryName: "text-inertia",
      },
      {
        name: "Text Gradient",
        description: "Animated rainbow gradient text using CSS background-clip.",
        category: "Text Animations",
        tags: ["css", "gradient", "rainbow", "clip"],
        registryName: "text-gradient",
      },
      {
        name: "Text X Rotate",
        description: "3D X-axis rotation with configurable stagger direction.",
        category: "Text Animations",
        tags: ["gsap", "rotation", "x-axis", "3d"],
        registryName: "text-x-rotate",
      },
      {
        name: "Text Y Animation",
        description: "Y-axis slide animation with configurable stagger.",
        category: "Text Animations",
        tags: ["gsap", "slide", "y-axis", "stagger"],
        registryName: "text-y-animation",
      },
      {
        name: "Text Y Animation 2",
        description: "Y-axis animation variant with different parameters.",
        category: "Text Animations",
        tags: ["gsap", "slide", "y-axis", "variant"],
        registryName: "text-y-animation2",
      },
      {
        name: "Text Y Animation 3",
        description: "Y-axis animation variant with unique easing.",
        category: "Text Animations",
        tags: ["gsap", "slide", "y-axis", "easing"],
        registryName: "text-y-animation3",
      },
      {
        name: "Text Y Animation 4",
        description: "Y-axis animation variant with custom timing.",
        category: "Text Animations",
        tags: ["gsap", "slide", "y-axis", "timing"],
        registryName: "text-y-animation4",
      },
      {
        name: "Black Hole Reveal",
        description: "Letters emerge from center, stretched and sucked outward.",
        category: "Text Animations",
        tags: ["gsap", "blackhole", "stretch", "reveal"],
        registryName: "text-black-hole",
      },
      {
        name: "Burn-In Neon",
        description: "Random flicker, glow red, then turn white using GSAP SplitText.",
        category: "Text Animations",
        tags: ["gsap", "neon", "flicker", "glow"],
        registryName: "text-burn-neon",
      },
    ],
  },
  {
    name: "Borders & Intersections",
    icon: <Frame className="size-4" />,
    slug: "borders",
    description: "Decorative border designs, intersection patterns, and animated corner effects.",
    items: [
      {
        name: "Square Border",
        description: "Dashed corner borders using CSS positioning.",
        category: "Borders & Intersections",
        tags: ["css", "dashed", "corners", "border"],
        registryName: "border-1",
      },
      {
        name: "Simple Dashed Border",
        description: "Clean dashed border design with CSS.",
        category: "Borders & Intersections",
        tags: ["css", "dashed", "simple", "border"],
        registryName: "border-2",
      },
      {
        name: "Intersection Scope",
        description: "Corner intersection design using CSS scoping.",
        category: "Borders & Intersections",
        tags: ["css", "intersection", "scope", "corners"],
        registryName: "intersection-1",
      },
      {
        name: "Star Borders",
        description: "Intersection design with content wrapping.",
        category: "Borders & Intersections",
        tags: ["css", "intersection", "wrap", "content"],
        registryName: "intersection-2",
      },
      {
        name: "Star Border",
        description: "Star decorations at border corners using SVG.",
        category: "Borders & Intersections",
        tags: ["svg", "star", "corners", "decorative"],
        registryName: "star-border",
      },
    ],
  },
  {
    name: "Backgrounds",
    icon: <Palette className="size-4" />,
    slug: "backgrounds",
    description: "Gradient, pattern, and texture backgrounds including radial, conic, metallic, and more.",
    items: [
      {
        name: "Radial Glow",
        description: "Radial gradient fading from transparent center to blue glow.",
        category: "Backgrounds",
        tags: ["radial", "gradient", "glow", "blue"],
        registryName: "gradient-1",
      },
      {
        name: "Bottom Bloom",
        description: "Radial gradient blooming from the bottom of the container.",
        category: "Backgrounds",
        tags: ["radial", "gradient", "bloom", "bottom"],
        registryName: "gradient-2",
      },
      {
        name: "Diagonal Pattern",
        description: "Repeating diagonal micro pattern using linear gradients.",
        category: "Backgrounds",
        tags: ["pattern", "diagonal", "repeating", "linear"],
        registryName: "gradient-3",
      },
      {
        name: "Dual Grid",
        description: "Two-layered grid system with major and minor gridlines.",
        category: "Backgrounds",
        tags: ["grid", "dual", "lines", "pattern"],
        registryName: "gradient-4",
      },
      {
        name: "Dot Mesh",
        description: "Dot mesh texture using radial gradient with fixed positioning.",
        category: "Backgrounds",
        tags: ["dots", "mesh", "texture", "radial"],
        registryName: "gradient-5",
      },
      {
        name: "Purple-Blue Angle",
        description: "Angled linear gradient from deep blue to vivid purple.",
        category: "Backgrounds",
        tags: ["linear", "gradient", "purple", "blue"],
        registryName: "gradient-6",
      },
      {
        name: "Conic Sweep",
        description: "Multi-layer conic gradient creating a metallic sweep effect.",
        category: "Backgrounds",
        tags: ["conic", "gradient", "sweep", "metallic"],
        registryName: "gradient-7",
      },
      {
        name: "Sunset Glow",
        description: "Warm sunset gradient from yellow to red with inner shadow.",
        category: "Backgrounds",
        tags: ["linear", "gradient", "sunset", "warm"],
        registryName: "gradient-8",
      },
      {
        name: "Coral Blur",
        description: "Coral gradient with backdrop blur for depth effect.",
        category: "Backgrounds",
        tags: ["linear", "gradient", "coral", "blur"],
        registryName: "gradient-9",
      },
      {
        name: "Aurora",
        description: "Cool aurora effect with multiple radial gradients.",
        category: "Backgrounds",
        tags: ["radial", "aurora", "cool", "multi"],
        registryName: "gradient-10",
      },
      {
        name: "Fire Aurora",
        description: "Fiery aurora with orange and yellow radial gradients.",
        category: "Backgrounds",
        tags: ["radial", "fire", "aurora", "warm"],
        registryName: "gradient-11",
      },
      {
        name: "Gold Metallic",
        description: "Gold metallic sheen using multi-stop linear gradient.",
        category: "Backgrounds",
        tags: ["linear", "gold", "metallic", "sheen"],
        registryName: "gradient-12",
      },
      {
        name: "Chrome Metal",
        description: "Chrome metallic reflection using conic and linear gradients.",
        category: "Backgrounds",
        tags: ["conic", "chrome", "metallic", "reflection"],
        registryName: "gradient-14",
      },
      {
        name: "Purple Brushed",
        description: "Purple brushed metal effect with hard-light blending.",
        category: "Backgrounds",
        tags: ["linear", "brushed", "purple", "blend"],
        registryName: "gradient-15",
      },
      {
        name: "Steel Brushed",
        description: "Steel brushed metal effect with subtle grain texture.",
        category: "Backgrounds",
        tags: ["linear", "brushed", "steel", "grain"],
        registryName: "gradient-16",
      },
      {
        name: "Silver Metallic",
        description: "Soft silver gradient with backdrop blur effect.",
        category: "Backgrounds",
        tags: ["linear", "silver", "metallic", "soft"],
        registryName: "silver-metallic",
      },
      {
        name: "Nexvyn Gradient",
        description: "Soft purple-orange radial gradient combination.",
        category: "Backgrounds",
        tags: ["radial", "purple", "orange", "soft"],
        registryName: "nexvyn-gradient",
      },
    ],
  },
  {
    name: "Mouse Followers",
    icon: <Waypoints className="size-4" />,
    slug: "mouse-followers",
    description: "Mouse trail and cursor follower effects using GSAP animations.",
    items: [
      {
        name: "Image Fall",
        description: "Image trail mouse follower with GSAP ticker and elastic animations.",
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
  {
    name: "SVG Path Effects",
    icon: <Layers className="size-4" />,
    slug: "svg-path-effects",
    description: "SVG path drawing and motion path animations with beam effects.",
    items: [
      {
        name: "Guitar",
        description: "SVG path drawing animation of a guitar illustration.",
        category: "SVG Path Effects",
        tags: ["svg", "path", "draw", "guitar"],
        registryName: "guitar-svg",
      },
      {
        name: "SVG Path Effect",
        description: "Legions Dev SVG path effect with drawing animation.",
        category: "SVG Path Effects",
        tags: ["svg", "path", "draw", "effect"],
        registryName: "legionsdev-svg",
      },
      {
        name: "Beam Motion Path",
        description: "Motion path effect with beam animation along SVG paths.",
        category: "SVG Path Effects",
        tags: ["svg", "motion", "path", "beam"],
        registryName: "motion-path",
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
        const haystack = [item.name, item.description, item.category, ...item.tags]
          .join(" ")
          .toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      }),
    }))
    .filter((cat) => cat.items.length > 0);
}

const TutorialPage = () => {
  const [query, setQuery] = useState("");
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<TutorialItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalItems = useMemo(
    () => categories.reduce((acc, c) => acc + c.items.length, 0),
    []
  );

  const filteredCategories = useMemo(
    () => elasticSearch(query, categories),
    [query]
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
        <div className="flex gap-0 min-h-[calc(100vh-120px)]">
          <aside className="w-64 shrink-0 border-r border-dashed hidden md:flex flex-col">
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
                                      selectedItem?.registryName === item.registryName
                                        ? "bg-foreground/5 text-foreground border-l-2 border-foreground -ml-[1px]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02] border-l-2 border-transparent -ml-[1px]"
                                    }`}
                                  >
                                    <span className="truncate">{item.name}</span>
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

          <main className="flex-1 min-w-0">
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
                  <div className="flex items-center gap-3 p-4 border-b border-dashed">
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
                    <div className="flex items-center gap-1">
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
                                This component is available in the library. Use the copy button on the main page to get the code.
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
                                  <p className="text-xs font-medium">Tutorial content goes here</p>
                                </div>
                                <div className="space-y-3">
                                  <div className="h-3 w-3/4 bg-foreground/[0.04] rounded-sm" />
                                  <div className="h-3 w-full bg-foreground/[0.04] rounded-sm" />
                                  <div className="h-3 w-5/6 bg-foreground/[0.04] rounded-sm" />
                                  <div className="h-3 w-2/3 bg-foreground/[0.04] rounded-sm" />
                                </div>
                                <div className="border border-dashed p-4 mt-2">
                                  <p className="text-[10px] text-muted-foreground/60">
                                    Set the <code className="px-1 py-0.5 bg-foreground/5 text-[9px]">content</code> property
                                    in your tutorial item to add documentation, usage examples,
                                    code snippets, and more.
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
                      <h2 className="text-sm font-semibold">Select a component</h2>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Choose a component from the sidebar to explore its interactive tutorial.
                        Components with a <span className="inline-block size-1.5 rounded-full bg-green-500 mx-0.5 align-middle" /> dot have full interactive tutorials.
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
