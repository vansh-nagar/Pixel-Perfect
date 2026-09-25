import fs from "node:fs";

// The legacy `?tab=` redirects have to list every category slug, and this file
// can't import TypeScript — so read them straight out of the source of truth
// instead of keeping a second copy by hand. The old copy had drifted: it still
// listed `bento` and `image-gradients` (which 308'd into a 404, because
// `blocks/[category]` sets `dynamicParams = false`) and was missing
// `image-animations` entirely.
const CATEGORY_SLUGS = [
  ...fs
    .readFileSync(new URL("./src/lib/blocks/categories.ts", import.meta.url), "utf8")
    .matchAll(/slug: "([^"]+)"/g),
].map((match) => match[1]);

if (CATEGORY_SLUGS.length === 0) {
  throw new Error("next.config: no category slugs found in src/lib/blocks/categories.ts");
}

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    return [
      {
        // Legacy tab links → category routes. Unknown `?tab=` values fall
        // through to plain /blocks instead of a 404.
        source: "/blocks",
        has: [
          {
            type: "query",
            key: "tab",
            value: `(?<tab>${CATEGORY_SLUGS.join("|")})`,
          },
        ],
        destination: "/blocks/:tab",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
