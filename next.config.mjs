const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    return [
      {
        // Legacy tab links → category routes. Slug list must mirror
        // CATEGORY_SLUGS in src/lib/blocks/categories.ts (config can't import TS).
        // Unknown ?tab= values fall through to plain /blocks instead of a 404.
        source: "/blocks",
        has: [
          {
            type: "query",
            key: "tab",
            value:
              "(?<tab>buttons|svg-animations|motion|gsap|carousels|svg-assets|text|scroll|borders|backgrounds|masks|image-gradients|mouse-followers|svg-path|bento|sidebars|shaders|image-shaders|perspective|3j)",
          },
        ],
        destination: "/blocks/:tab",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
