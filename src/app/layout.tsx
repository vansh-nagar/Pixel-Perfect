import type { Metadata } from "next";
import { Inter_Tight, Pixelify_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { RootProvider } from "fumadocs-ui/provider/next";
import LenisProvider from "@/components/providers/lenis-provider";
import { Toaster } from "@/components/ui/sonner";

// Default font
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Special font for headings
const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Pixel Perfect UI",
  description: "Pixel Perfect UI — a lightweight documentation UI library",
  icons: {
    icon: "/logo/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interTight.variable} ${pixelify.variable} antialiased`}
      >
        <RootProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LenisProvider>
              {children}
              <Toaster />
            </LenisProvider>
          </ThemeProvider>
        </RootProvider>
      </body>
    </html>
  );
}
