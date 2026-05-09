import type { MetadataRoute } from "next";
import { SEO_CONSTANTS } from "@/lib/seo/constants";

export default function robots(): MetadataRoute.Robots {
  const allowAll = {
    allow: "/",
    disallow: ["/api/", "/_next/", "/admin/", "/preview/"],
  };

  return {
    rules: [
      { userAgent: "*", ...allowAll },
      { userAgent: "Googlebot", ...allowAll },
      { userAgent: "Bingbot", ...allowAll },
      { userAgent: "DuckDuckBot", ...allowAll },
      { userAgent: "GPTBot", ...allowAll },
      { userAgent: "ChatGPT-User", ...allowAll },
      { userAgent: "PerplexityBot", ...allowAll },
      { userAgent: "ClaudeBot", ...allowAll },
      { userAgent: "anthropic-ai", ...allowAll },
    ],
    sitemap: `${SEO_CONSTANTS.siteUrl}/sitemap.xml`,
    host: SEO_CONSTANTS.siteUrl,
  };
}
