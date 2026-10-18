import { Navbar } from "@/components/mine/landing-page/navbar";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata = generatePageMetadata({
  title: "3D",
  description: "3D scene studies.",
  path: "/3d",
  noIndex: true,
});

export default function ThreeDLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar className="fixed top-0 px-1" />
      {children}
    </>
  );
}
