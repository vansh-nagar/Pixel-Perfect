import { TabsNavigation } from "@/components/mine/blocks/tabs-navigation";
import { CategoryLinks } from "@/components/mine/blocks/category-links";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata = generatePageMetadata({
  title: "UI Blocks — Animated React Components",
  description:
    "Browse hundreds of copy-paste React components across 20 categories — buttons, text animations, shaders, carousels, mouse followers and more. Built with Tailwind CSS, Framer Motion and GSAP.",
  path: "/blocks",
});

const Page = () => {
  return (
    <>
      <h1 className="sr-only">
        UI Blocks — animated React components to copy and paste
      </h1>
      <TabsNavigation />
      <CategoryLinks />
    </>
  );
};

export default Page;
