import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { Inter_Tight, Pixelify_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import LenisProvider from "@/components/providers/lenis-provider";
import { baseMetadata, defaultViewport } from "@/lib/seo/metadata";
import { jsonLdSchemas } from "@/lib/seo/schemas";
import { Agentation } from "agentation";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { StarSprite } from "@/components/mine/landing-page/star-border";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = baseMetadata;
export const viewport = defaultViewport;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {jsonLdSchemas.map((schema) => (
          <script
            key={schema["@type"]}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
            }}
          />
        ))}
      </head>
      <LenisProvider>
        <body
          className={`${interTight.variable} ${pixelify.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <StarSprite />
            {children}
            <Toaster />
            {process.env.NODE_ENV === "development" && <Agentation />}
            {process.env.NODE_ENV === "development" && (
              <DialRoot position="top-right" />
            )}
          </ThemeProvider>
          <Analytics />
        </body>
      </LenisProvider>
    </html>
  );
}
