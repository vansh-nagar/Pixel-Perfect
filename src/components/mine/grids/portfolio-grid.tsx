"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { portfolioTemplates } from "@/components/clean-portfolios/templates";

export default function PortfolioGrid() {
  const [activeSlug, setActiveSlug] = useState(() => {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("template") : null;
    return portfolioTemplates.find((template) => template.slug === requested)?.slug ?? "folio";
  });
  const [mobile, setMobile] = useState(false);
  const template = portfolioTemplates.find((item) => item.slug === activeSlug)!;

  function selectTemplate(slug: typeof activeSlug) {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `/blocks/clean-portfolios?template=${slug}`);
  }

  return (
    <section aria-label="Clean portfolio templates" className="relative border border-dashed bg-background text-foreground">
      <div className="flex flex-col sm:flex-row">
        <aside aria-label="Portfolio sidebar" className="shrink-0 border-b border-dashed p-2 sm:w-36 sm:border-r sm:border-b-0 sm:py-3">
          <p className="px-2 pb-3 pt-1 text-xs text-muted-foreground">Portfolios</p>
          <div role="group" aria-label="Portfolio template" className="flex gap-1 sm:flex-col">
            {portfolioTemplates.map((item) => (
              <button key={item.slug} onClick={() => selectTemplate(item.slug)} aria-pressed={activeSlug === item.slug}
                className={`flex min-h-7 cursor-pointer items-center gap-3 border-l border-dashed px-2 py-1 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${activeSlug === item.slug ? "border-foreground bg-muted text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                {item.name}
              </button>
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3 border-b border-dashed px-3 py-2">
        <p className="text-xs font-medium">{template.name}</p>
        <div className="flex items-center gap-1.5">
          <div role="group" aria-label="Preview size" className="hidden gap-1 sm:flex">
            <Toggle pressed={!mobile} onPressedChange={() => setMobile(false)} aria-label="Desktop preview" className="size-7 min-w-7 rounded-none p-0"><Monitor className="size-3.5" /></Toggle>
            <Toggle pressed={mobile} onPressedChange={() => setMobile(true)} aria-label="Mobile preview" className="size-7 min-w-7 rounded-none p-0"><Smartphone className="size-3.5" /></Toggle>
          </div>
        </div>
      </div>
      <div className={`flex justify-center bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] ${mobile ? "p-3 sm:p-6" : ""}`}>
        <iframe key={template.slug} title={`${template.name} portfolio preview`} src={`/portfolios/${template.slug}.html`}
          className={`block h-[max(620px,calc(100dvh-210px))] border-0 bg-white ${mobile ? "w-[390px] max-w-full shadow-sm" : "w-full"}`} />
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed px-3 py-2 leading-tight">
        <div><p className="text-xs font-medium">{template.name}</p><p className="mt-1 text-xs text-muted-foreground">{template.description}</p></div>
        <span className="text-xs text-muted-foreground">Responsive preview</span>
      </footer>
        </div>
      </div>
    </section>
  );
}
