import type { MetadataRoute } from "next";
import { SEO_CONSTANTS } from "@/lib/seo/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) =>
    `${SEO_CONSTANTS.siteUrl}${path === "/" ? "" : path}`;

  return [
    { url: url("/"),           lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: url("/blocks"),     lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: url("/tools"), lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: url("/tools/pixel-grid"),  lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: url("/tools/dot-spinner"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: url("/playground"), lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: url("/pixel-tool"), lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: url("/tutorial"),   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/donate"),     lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
  ];
}
