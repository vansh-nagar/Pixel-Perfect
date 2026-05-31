import { Navbar } from "@/components/mine/landing-page/navbar";

export default function ToolsLayout({
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
