// next.config.mjs
import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
};

const withMDX = createMDX({
  // configPath: "source.config.ts" // optional
});

export default withMDX(nextConfig);
