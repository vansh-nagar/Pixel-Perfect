"use client";

/**
 * Page index for the playground: previous / next and a jump to every page, fixed to the
 * bottom-right corner. The current page is the one accent.
 */

import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Add a line here when a new playground page is created.
const PAGES = [
  { href: "/playground", name: "Shelf gallery" },
  { href: "/playground/2", name: "Pixel emblem" },
  { href: "/playground/3", name: "Halftone butterflies" },
  { href: "/playground/4", name: "Drift spiral" },
  { href: "/playground/5", name: "Prism light" },
  { href: "/playground/6", name: "Light funnel" },
  { href: "/playground/7", name: "Street drive" },
  { href: "/playground/8", name: "Car showroom" },
  { href: "/playground/9", name: "Untitled" },
];

export function PlaygroundPager() {
  const pathname = usePathname();
  const current = Math.max(
    0,
    PAGES.findIndex((p) => p.href === pathname),
  );
  const prev = PAGES[(current - 1 + PAGES.length) % PAGES.length];
  const next = PAGES[(current + 1) % PAGES.length];

  const step =
    "grid size-7 place-items-center rounded-[6px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground";

  return (
    <nav
      aria-label="Playground pages"
      className="fixed right-4 bottom-4 z-50 flex items-center gap-0.5 rounded-[6px] border border-foreground/10 bg-background/85 p-1 text-sm font-medium backdrop-blur"
    >
      <Link href={prev.href} aria-label={`Previous: ${prev.name}`} title={prev.name} className={step}>
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.75} />
      </Link>
      {PAGES.map((page, i) => {
        const active = i === current;
        return (
          <Link
            key={page.href}
            href={page.href}
            title={page.name}
            aria-label={page.name}
            aria-current={active ? "page" : undefined}
            className={`grid h-7 min-w-7 place-items-center rounded-[6px] px-1.5 tabular-nums transition-colors ${
              active ? "text-[#e8552f] dark:text-[#f0643c]" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            {i + 1}
          </Link>
        );
      })}
      <Link href={next.href} aria-label={`Next: ${next.name}`} title={next.name} className={step}>
        <HugeiconsIcon icon={ArrowRight02Icon} size={16} strokeWidth={1.75} />
      </Link>
    </nav>
  );
}
