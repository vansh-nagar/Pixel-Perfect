import Link from "next/link";
import { BLOCK_CATEGORIES } from "@/lib/blocks/categories";

export function CategoryLinks({ current }: { current?: string }) {
  return (
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
