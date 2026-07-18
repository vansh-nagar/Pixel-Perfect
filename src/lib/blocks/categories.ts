// Single source of truth for /blocks categories.
// Imported by the client tab bar, the /blocks/[category] routes, and sitemap.ts —
// keep this module string-only (no registry.json, JSX, or shader-data imports).

export type CategoryItem = { name: string; description: string };

export type CategorySource =
  | {
      type: "registry";
      folder: string;
      nameEndsWith?: string;
      nameNotEndsWith?: string;
      exclude?: string[];
    }
  | { type: "shader-data"; set: "shaders" | "image-shaders" }
  | { type: "manual"; items: CategoryItem[] };

export type BlockCategory = {
  /** URL segment and tab value — must match the historical ?tab= slugs. */
  slug: string;
  /** Tab label, verbatim from the original navItems. */
  name: string;
  /** SEO <title> and on-page h1. */
  title: string;
  /** Meta description and on-page intro paragraph. */
  description: string;
  source: CategorySource;
};

export const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    slug: "buttons",
    name: "Buttons",
    title: "React Button Components",
    description:
      "Copy-paste React buttons with real character — glass, metal, neumorphic and 3D materials, magnetic hover, morphing icons and refraction effects. Built with Tailwind CSS, Framer Motion and GSAP, ready to drop into any Next.js app.",
    source: { type: "registry", folder: "buttons" },
  },
  {
    slug: "svg-animations",
    name: "SVG Animations",
    title: "Animated SVG Components for React",
    description:
      "Hand-tuned SVG animations for React — stroke draws, wave loops and playful vector motion you can paste straight into your project. Lightweight, dependency-free markup animated with CSS and Motion.",
    source: {
      type: "registry",
      folder: "svg",
      nameEndsWith: "-animation",
      exclude: ["barwave-svg-animation"],
    },
  },
  {
    slug: "motion",
    name: "Motion Animations",
    title: "Framer Motion Components",
    description:
      "Production-ready Framer Motion components for React — springy toggles, hover reveals, layout transitions and micro-interactions with tuned easing. Copy the source, keep the physics.",
    source: { type: "registry", folder: "motion-framer" },
  },
  {
    slug: "gsap",
    name: "GSAP Animations",
    title: "GSAP Animation Components",
    description:
      "GSAP-powered React components — timeline choreography, magnetic cursors, SVG morphs and scroll-linked motion using the real GSAP plugin APIs. Each one is a copyable, self-contained lesson in imperative animation.",
    source: { type: "registry", folder: "gsap" },
  },
  {
    slug: "carousels",
    name: "Carousels",
    title: "React Carousel Components",
    description:
      "React carousels and sliders beyond the basic track — 3D cubes, momentum drags, perspective decks and auto-playing marquees. Touch-friendly, Tailwind-styled, and free to copy.",
    source: { type: "registry", folder: "carousel" },
  },
  {
    slug: "svg-assets",
    name: "SVG Assets",
    title: "Free SVG Assets",
    description:
      "A growing set of free SVG assets — decorative vectors, shapes and illustrations exported clean and optimized for the web. Grab the markup and restyle every path with CSS.",
    source: {
      type: "registry",
      folder: "svg",
      nameNotEndsWith: "-animation",
      exclude: ["svg-5", "svg-6", "svg-8"],
    },
  },
  {
    slug: "text",
    name: "Text Animations",
    title: "React Text Animation Components",
    description:
      "Text effects that make typography the hero — split reveals, scrambles, matrix rain, marquees and scroll-triggered headlines for React. Powered by Motion and GSAP with copy-paste source.",
    source: { type: "registry", folder: "text" },
  },
  {
    slug: "scroll",
    name: "Scroll Animations",
    title: "React Scroll Animation Components",
    description:
      "Scroll-driven React components — parallax scenes, pinned sections and progress-linked reveals that respond to the user's scroll position. Built on GSAP ScrollTrigger and Motion scroll values.",
    source: { type: "registry", folder: "scroll" },
  },
  {
    slug: "borders",
    name: "Borders & Intersections",
    title: "Border & Intersection Effects",
    description:
      "Animated borders, gradient rings and intersection tricks for React — the details that frame a card or section without a single image asset. Pure CSS and Tailwind techniques you can copy.",
    source: { type: "registry", folder: "borders" },
  },
  {
    slug: "backgrounds",
    name: "Background Gradients, Patterns & Masks",
    title: "Background Gradients & Patterns",
    description:
      "Backgrounds worth shipping — mesh gradients, dot grids, noise textures and masked patterns for React and Tailwind. Each one is a small copyable component with zero image dependencies.",
    source: { type: "registry", folder: "backgrounds" },
  },
  {
    slug: "masks",
    name: "Mask Animation",
    title: "CSS Mask Animation Components",
    description:
      "CSS mask and clip-path animations for React — image reveals, clock wipes, spotlight cutouts and shape-driven transitions. Modern mask techniques packaged as paste-ready components.",
    source: { type: "registry", folder: "mask" },
  },
  {
    slug: "image-gradients",
    name: "Image Gradients",
    title: "Mesh Gradient Images",
    description:
      "Curated mesh gradients rendered as ready-to-use image backgrounds — from soft pastel blends to deep aurora darks. Preview each palette and pull it straight into your design.",
    source: {
      type: "manual",
      // Mirrors GRADIENTS in src/components/mine/grids/image-gradient-grid.tsx
      // (unexported inside a "use client" file) — keep the two lists in sync.
      items: [
        { name: "Subpixel", description: "Soft blue-lavender mesh gradient." },
        { name: "Hot Pixel", description: "Warm pink-to-magenta mesh gradient." },
        { name: "Full Spectrum", description: "Multi-hue pastel mesh gradient." },
        { name: "Vector Tide", description: "Cool cyan-to-indigo mesh gradient." },
        { name: "Dark Mode", description: "Deep navy aurora with teal & magenta." },
        { name: "Anti-Alias", description: "Lavender & mint with a poppy-red bloom." },
        { name: "Frame Buffer", description: "Midnight navy into dodger blue & cyan." },
        { name: "Hue Shift", description: "Electric blue-violet bleeding into red." },
        { name: "Wireframe", description: "Gunmetal slate mesh in greys & greens." },
      ],
    },
  },
  {
    slug: "mouse-followers",
    name: "Mouse Followers",
    title: "Mouse Follower Components",
    description:
      "Custom cursors and mouse followers for React — trailing blobs, magnetic dots, image reveals and physics-driven pointers that give a site personality. Copy the component, plug in your content.",
    source: { type: "registry", folder: "mouse-follower" },
  },
  {
    slug: "svg-path",
    name: "SVG Path Effects",
    title: "SVG Path Effect Components",
    description:
      "SVG path techniques for React — text flowing along curves and path-driven motion that plain CSS can't reach. Small focused components demonstrating the raw SVG APIs.",
    source: { type: "registry", folder: "svg-path-effects" },
  },
  {
    slug: "bento",
    name: "Bento Cards",
    title: "Bento Grid Components",
    description:
      "Bento-style grid cards for React landing pages — dense, magazine-like layouts with hover depth and animated content slots. Tailwind-first markup you can reshape for any content.",
    source: { type: "registry", folder: "bento-cards" },
  },
  {
    slug: "sidebars",
    name: "Sidebars",
    title: "React Sidebar Components",
    description:
      "Animated sidebar and navigation panels for React — smooth expand-collapse motion, staggered items and mobile-friendly behavior. Ready to wire into your routes.",
    source: { type: "registry", folder: "sidebars" },
  },
  {
    slug: "shaders",
    name: "Shaders",
    title: "WebGL Shader Backgrounds",
    description:
      "GPU shader backgrounds for React — plasma flows, gentle waves, spotlights and generative GLSL effects running in WebGL. Each shader ships as a component with its fragment source included.",
    source: { type: "shader-data", set: "shaders" },
  },
  {
    slug: "image-shaders",
    name: "Image Shaders",
    title: "WebGL Image Effect Shaders",
    description:
      "WebGL image effects for React — fluid distortion, particle dissolves, pixel sorting and hover-reactive shaders applied to your own images. Drop in a texture and the GLSL does the rest.",
    source: { type: "shader-data", set: "image-shaders" },
  },
  {
    slug: "perspective",
    name: "Perspective",
    title: "3D Perspective Components",
    description:
      "CSS 3D perspective components for React — tilting cards, rotating planes and depth-staged scenes built on transform-3d, no WebGL required. Copy-paste depth for flat layouts.",
    source: { type: "registry", folder: "perspective" },
  },
  {
    slug: "3j",
    name: "3J",
    title: "Three.js Components",
    description:
      "Three.js scenes packaged as React components — real-time 3D models, lighting and camera work embedded straight into your page. WebGL power with a copyable component API.",
    source: { type: "registry", folder: "three-js" },
  },
];

export const CATEGORY_SLUGS = BLOCK_CATEGORIES.map((c) => c.slug);

export const getCategory = (slug: string): BlockCategory | undefined =>
  BLOCK_CATEGORIES.find((c) => c.slug === slug);
