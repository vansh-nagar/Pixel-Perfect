import { notFound } from "next/navigation";
import { Navbar } from "@/components/mine/landing-page/navbar";
import { isDev } from "@/lib/dev-only";
import { generatePageMetadata } from "@/lib/seo/metadata";
import { PlaygroundPager } from "./_shared/playground-pager";

export const metadata = generatePageMetadata({
  title: "Playground",
  description: "Internal animation scratch pad.",
  path: "/playground",
  noIndex: true,
});

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDev) notFound();
  return (
    <>
      <Navbar className="fixed top-0 px-1" showStars={false} />
      {children}
      <PlaygroundPager />
    </>
  );
}
