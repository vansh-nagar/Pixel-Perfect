import { Children, type ReactNode } from "react";

type LandingGridProps = {
  children: ReactNode;
};

export function LandingGrid({ children }: LandingGridProps) {
  const sections = Children.toArray(children);
  const rowCount = sections.length;
  const gridRows = Array.from({ length: rowCount * 2 - 1 }, (_, i) =>
    i % 2 === 0 ? "auto" : "1px",
  ).join("_");

  return (
    <div
      className="relative w-full grid min-h-screen grid-cols-[1fr_1rem_auto_1rem_1fr] [--pattern-fg:var(--color-gray-950)]/5 dark:bg-black dark:[--pattern-fg:var(--color-white)]/10 overflow-hidden"
      style={{ gridTemplateRows: gridRows.replace(/_/g, " ") }}
    >
      {sections.map((section, i) => {
        const contentRow = i * 2 + 1;
        const dividerRow = contentRow + 1;
        const isLast = i === rowCount - 1;
        return (
          <div key={i} className="contents">
            <div className="col-start-3 flex flex-col w-[90vw]" style={{ gridRow: contentRow }}>
              {section}
            </div>
            {!isLast && (
              <div
                className="pointer-events-none relative col-span-full col-start-1 mask-x-from-99% border-b z-50"
                style={{ gridRow: dividerRow }}
              />
            )}
          </div>
        );
      })}

      {/* Decorative side borders spanning all rows */}
      <div className="pointer-events-none -right-px col-start-2 row-span-full row-start-1 border-x mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed z-50" />
      <div className="pointer-events-none relative -left-px col-start-4 row-span-full row-start-1 border-x border-x-[--pattern-fg] mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed z-50" />
    </div>
  );
}
