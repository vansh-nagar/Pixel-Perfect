import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata = generatePageMetadata({
  title: "Component Tutorials",
  description:
    "Step-by-step tutorials for building animated React components — gooey SVG buttons, glass materials, cube carousels, mask reveals and matrix text effects, explained from first principles.",
  path: "/tutorial",
});

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
