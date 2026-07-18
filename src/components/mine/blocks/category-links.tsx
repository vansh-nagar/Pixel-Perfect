import Link from "next/link";
import { BLOCK_CATEGORIES } from "@/lib/blocks/categories";

// Crawlable anchors to every category — the tab triggers are <button>s, so
// these links (plus the sitemap) are how search engines reach /blocks/[category].
export function CategoryLinks({ current }: { current?: string }) {
  return (
    // sr-only: keeps the crawl path between category pages without visible UI.
    <nav aria-label="Component categories" className="sr-only">
      <h2>Browse all categories</h2>
      <ul>
        {BLOCK_CATEGORIES.map((category) => (
          <li key={category.slug}>
            {category.slug === current ? (
              <span>{category.name}</span>
            ) : (
              <Link href={`/blocks/${category.slug}`}>{category.name}</Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
