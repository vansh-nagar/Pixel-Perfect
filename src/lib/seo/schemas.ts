import { SEO_CONSTANTS } from "./constants";

const orgId = `${SEO_CONSTANTS.siteUrl}/#organization`;
const siteId = `${SEO_CONSTANTS.siteUrl}/#website`;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": orgId,
  name: SEO_CONSTANTS.siteName,
  url: SEO_CONSTANTS.siteUrl,
  logo: {
    "@type": "ImageObject",
    url: `${SEO_CONSTANTS.siteUrl}/logo/static/logo.svg`,
  },
} as const;

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": siteId,
  name: SEO_CONSTANTS.siteName,
  url: SEO_CONSTANTS.siteUrl,
  description: SEO_CONSTANTS.defaultDescription,
  publisher: { "@id": orgId },
} as const;

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SEO_CONSTANTS.siteName,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description: SEO_CONSTANTS.defaultDescription,
  url: SEO_CONSTANTS.siteUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: { "@id": orgId },
} as const;

export const jsonLdSchemas = [
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
];
