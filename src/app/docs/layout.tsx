import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { Blocks, File, Download, Terminal, Settings } from "lucide-react";
import DocFooter from "@/components/mine/docs/footer";
import { Button } from "@/components/ui/button";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <>
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions()}
        searchToggle={{
          enabled: true,
          components: {
            lg: (
              <Link
                href={"https://x.com/vansh1029"}
                target="_blank"
                className=" w-full border-t border-dashed pt-3 "
              >
                <Button
                  variant={"outline"}
                  className=" border-t w-full rounded-lg  "
                >
                  <FaXTwitter /> <span className="">Follow for updates</span>
                </Button>
              </Link>
            ),
          },
        }}
        sidebar={{
          collapsible: false,
          banner: (
            <img
              src="https://i.pinimg.com/originals/bd/7f/ce/bd7fce6d5fa8013333b1777ada8485c9.gif"
              alt="Banner"
              className=" h-15 object-cover object-center border rounded-xl border-dashed "
            />
          ),
          tabs: [
            {
              url: "/docs",
              title: "Docs",
              description: "Pixel-perfect components & APIs",
              icon: <File size={18} className="" />,
            },
            {
              url: "/blocks",
              title: "Blocks",
              description: "Build pages fast with ready-made blocks",
              icon: <Blocks size={16} />,
            },
          ],
          footer: <DocFooter />,
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
