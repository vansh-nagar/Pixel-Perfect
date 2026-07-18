import Link from "next/link";
import { BLOCK_CATEGORIES } from "@/lib/blocks/categories";

// Crawlable anchors to every category — the tab triggers are <button>s, so
// these links (plus the sitemap) are how search engines reach /blocks/[category].
export function CategoryLinks({ current }: { current?: string }) {
  return (
    <nav aria-label="Component categories" className="mt-10 border-t border-dashed pt-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Browse all categories
      </h2>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {BLOCK_CATEGORIES.map((category) => (
          <li key={category.slug}>
            {category.slug === current ? (
              <span className="text-xs font-medium">{category.name}</span>
            ) : (
              <Link
                href={`/blocks/${category.slug}`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
