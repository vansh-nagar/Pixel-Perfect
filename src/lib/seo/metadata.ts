import type { Metadata, Viewport } from "next";
import { ALL_KEYWORDS, SEO_CONSTANTS } from "./constants";

export const defaultViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const baseMetadata: Metadata = {
  metadataBase: new URL(SEO_CONSTANTS.siteUrl),
  title: {
    default: SEO_CONSTANTS.defaultTitle,
    template: SEO_CONSTANTS.titleTemplate,
  },
  description: SEO_CONSTANTS.defaultDescription,
  keywords: ALL_KEYWORDS,
  applicationName: SEO_CONSTANTS.siteName,
  authors: [{ name: SEO_CONSTANTS.siteName }],
  alternates: { canonical: SEO_CONSTANTS.siteUrl },
  openGraph: {
    type: "website",
    locale: SEO_CONSTANTS.locale,
    url: SEO_CONSTANTS.siteUrl,
    siteName: SEO_CONSTANTS.siteName,
    title: SEO_CONSTANTS.defaultTitle,
    description: SEO_CONSTANTS.defaultDescription,
    images: [
      {
        url: SEO_CONSTANTS.defaultOgImage,
        width: 1200,
        height: 630,
        alt: SEO_CONSTANTS.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: SEO_CONSTANTS.twitterHandle,
    creator: SEO_CONSTANTS.twitterHandle,
    title: SEO_CONSTANTS.defaultTitle,
    description: SEO_CONSTANTS.defaultDescription,
    images: [SEO_CONSTANTS.defaultOgImage],
  },
  icons: { icon: "/logo/static/logo.svg" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

type GeneratePageMetadataInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function generatePageMetadata({
  title,
  description,
  path,
  ogImage,
  keywords,
  noIndex,
}: GeneratePageMetadataInput): Metadata {
  const url = `${SEO_CONSTANTS.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const image = ogImage ?? SEO_CONSTANTS.defaultOgImage;
  const mergedKeywords = keywords ? [...ALL_KEYWORDS, ...keywords] : ALL_KEYWORDS;

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: { canonical: url },
    openGraph: {
      ...baseMetadata.openGraph,
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      ...baseMetadata.twitter,
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : baseMetadata.robots,
  };
}
