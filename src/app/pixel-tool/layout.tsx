import { generatePageMetadata } from "@/lib/seo/metadata";

// Server wrapper: the pixel-tool page is a client component and can't export metadata.
export const metadata = generatePageMetadata({
  title: "Pixel Icon Tool",
  description:
    "Free in-browser pixel icon generator — convert any icon or overlay into crisp pixel-art SVG, tune the grid and padding, and download the result. No signup, no upload.",
  path: "/pixel-tool",
});

export default function PixelToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
