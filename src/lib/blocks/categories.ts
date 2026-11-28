// Single source of truth for /blocks categories.
// Imported by the client tab bar, the /blocks/[category] routes, and sitemap.ts —
// keep this module string-only (no registry.json or JSX imports).

export type CategoryItem = { name: string; description: string };

export type CategorySource =
  | {
      type: "registry";
      folder: string;
      nameEndsWith?: string;
      nameNotEndsWith?: string;
      exclude?: string[];
    }
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
    slug: "backgrounds",
    name: "Backgrounds",
    title: "Backgrounds",
    description:
      "Animated currency skies and drifting dither waves for React. Two reusable backgrounds with copyable source and configurable effects.",
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
    slug: "mouse-followers",
    name: "Mouse Followers",
    title: "Mouse Follower Components",
    description:
      "Custom cursors and mouse followers for React — trailing blobs, magnetic dots, image reveals and physics-driven pointers that give a site personality. Copy the component, plug in your content.",
    source: { type: "registry", folder: "mouse-follower" },
  },

];

export const CATEGORY_SLUGS = BLOCK_CATEGORIES.map((c) => c.slug);

export const getCategory = (slug: string): BlockCategory | undefined =>
  BLOCK_CATEGORIES.find((c) => c.slug === slug);
