import { Navbar } from "@/components/mine/landing-page/navbar";
import { generatePageMetadata } from "@/lib/seo/metadata";

// The playground is a scratch pad — keep it out of search indexes.
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
  return (
    <>
      <Navbar className="fixed top-0 px-1" />
      {children}
    </>
  );
}
