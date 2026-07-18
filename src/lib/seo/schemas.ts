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

export function buildCategoryCollectionSchema(
  category: { slug: string; title: string; description: string },
  items: { name: string; description: string }[],
) {
  const pageUrl = `${SEO_CONSTANTS.siteUrl}/blocks/${category.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${pageUrl}#collection`,
    url: pageUrl,
    name: category.title,
    description: category.description,
    isPartOf: { "@id": siteId },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        description: item.description,
      })),
    },
  };
}

export function buildBreadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
