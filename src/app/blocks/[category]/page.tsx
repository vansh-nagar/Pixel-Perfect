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
      {/* Collapsed by default — indexable, but no visible wall of text. */}
      <details className="mt-10 border-t border-dashed pt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground/70 transition-colors hover:text-foreground">
          What&apos;s inside — {items.length} {cat.name.toLowerCase()}{" "}
          components
        </summary>
        <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.name} className="text-muted-foreground">
              <strong className="font-medium text-foreground">
                {item.name}
              </strong>{" "}
              — {item.description}
            </li>
          ))}
        </ul>
      </details>
      <CategoryLinks current={cat.slug} />
    </>
  );
}
