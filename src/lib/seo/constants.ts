export const SEO_CONSTANTS = {
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.pixel-perfect.space",
  siteName: "Pixel Perfect UI",
  defaultTitle: "Pixel Perfect UI — Lightweight UI Library for React",
  titleTemplate: "%s | Pixel Perfect UI",
  defaultDescription:
    "A lightweight, documentation-first UI library for React with bespoke components, animations, and effects you can copy, paste, and ship.",
  defaultOgImage: "/og-card.jpg",
  twitterHandle: "@vansh1029",
  locale: "en_US",
} as const;

export const SEO_KEYWORDS = {
  primary: [
    "react ui library",
    "tailwind components",
    "shadcn alternative",
    "next.js components",
    "copy paste components",
  ],
  secondary: [
    "react animations",
    "framer motion components",
    "gsap components",
    "react buttons",
    "react sliders",
    "tailwind css",
  ],
  longtail: [
    "free react component library",
    "open source ui kit nextjs",
    "animated react components copy paste",
    "tailwind motion components",
  ],
} as const;

export const ALL_KEYWORDS = [
  ...SEO_KEYWORDS.primary,
  ...SEO_KEYWORDS.secondary,
  ...SEO_KEYWORDS.longtail,
];
