import { notFound } from "next/navigation";
import { TabsNavigation } from "@/components/mine/blocks/tabs-navigation";
import { CategoryLinks } from "@/components/mine/blocks/category-links";
import { CATEGORY_SLUGS, getCategory } from "@/lib/blocks/categories";
import { getCategoryItems } from "@/lib/blocks/category-items";
import { generatePageMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbSchema,
  buildCategoryCollectionSchema,
} from "@/lib/seo/schemas";
import { SEO_CONSTANTS } from "@/lib/seo/constants";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return generatePageMetadata({
    title: cat.title,
    description: cat.description,
    path: `/blocks/${cat.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const items = getCategoryItems(cat.slug);
  const schemas = [
    buildCategoryCollectionSchema(cat, items),
    buildBreadcrumbSchema([
      { name: "Home", url: SEO_CONSTANTS.siteUrl },
      { name: "Blocks", url: `${SEO_CONSTANTS.siteUrl}/blocks` },
      { name: cat.title, url: `${SEO_CONSTANTS.siteUrl}/blocks/${cat.slug}` },
    ]),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <TabsNavigation initialTab={cat.slug} showCategoryHeader />
      {/* sr-only: describes what the client-only grid renders, for crawlers
          and screen readers — no visible SEO copy anywhere on the page. */}
      <section className="sr-only">
        <h2>
          All {items.length} {cat.name.toLowerCase()} components
        </h2>
        <ul>
          {items.map((item) => (
            <li key={item.name}>
              {item.name} — {item.description}
            </li>
          ))}
        </ul>
      </section>
      <CategoryLinks current={cat.slug} />
    </>
  );
}
