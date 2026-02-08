import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"
import { Inter_Tight, Pixelify_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import LenisProvider from "@/components/providers/lenis-provider";

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
  openGraph: {
    images: [
      "https://res.cloudinary.com/dz12pywzs/image/upload/v1766372535/Copy_of_Copy_of_Webinar_Keynote_Presentation_1_ljemzi.jpg",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <LenisProvider>
      <body
        className={`${interTight.variable} ${pixelify.variable} antialiased`}
        >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics/>
      </body>
        </LenisProvider>
    </html>
  );
}
