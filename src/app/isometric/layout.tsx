import { Navbar } from "@/components/mine/landing-page/navbar";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata = generatePageMetadata({
  title: "Illustrations",
  description: "Animated isometric line illustrations: a compact keyboard, a macropad, a cash register, a desktop computer and a wizard's tower.",
  path: "/isometric",
});

export default function IsometricLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar className="fixed top-0 px-1" />
      {children}
    </>
  );
}
