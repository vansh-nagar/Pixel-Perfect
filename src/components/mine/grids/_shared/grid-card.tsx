import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import CopyDropdown from "../../copy-dropdown";
import BorderDecorator from "./border-decorator";

/**
 * The one card frame every grid uses: dashed left/bottom edges, the top edge running
 * into the notched Copy box, the right edge dropping from under it, and corner brackets.
 * Grids differ only in what goes inside, so borders line up the same everywhere.
 */
export function GridCard({
  name,
  description,
  registryName,
  children,
  className,
  contentClassName,
  topLeft,
  fill = false,
  guides = false,
  spinOnHover = false,
}: {
  name: string;
  description?: string;
  registryName: string;
  children: ReactNode;
  /** Sizing for the card itself, e.g. its aspect ratio or column span. */
  className?: string;
  /** Extra classes for the box the component renders in. */
  contentClassName?: string;
  /** Controls pinned to the top-left corner (refresh, variant pickers). */
  topLeft?: ReactNode;
  /** The component covers the whole card (backgrounds, cursor fields) instead of sitting centred. */
  fill?: boolean;
  /** Centre circle and crosshair guides behind the component. */
  guides?: boolean;
  spinOnHover?: boolean;
}) {
  return (
    <div
      data-card
      className={cn(
        "group relative flex aspect-square w-full items-center justify-center border-b border-l border-dashed",
        className,
      )}
    >
      <BorderDecorator notch guides={guides} spinOnHover={spinOnHover} />

      <div
        className={cn(
          fill
            ? "absolute inset-0 z-30 overflow-hidden"
            : "z-30 flex w-full min-w-0 items-center justify-center",
          contentClassName,
        )}
      >
        {children}
      </div>

      {topLeft && (
        <div className="absolute left-1.5 top-1.5 z-40 flex items-center gap-2">
          {topLeft}
        </div>
      )}

      <div
        className={cn(
          "pointer-events-none absolute bottom-1.5 left-1.5 z-40 p-0.5 leading-tight",
          fill && "bg-background/90 px-1",
        )}
      >
        <p className="text-xs">{name}</p>
        {description && (
          <p className="text-[8px] leading-snug text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
        <div className="border-t border-dashed" />
        <div className={cn("pointer-events-auto", fill && "bg-background")}>
          <CopyDropdown registryName={registryName} />
        </div>
        <div />
        <div className="-mr-[0.5px] h-full border-r border-dashed" />
      </div>
    </div>
  );
}

/** Shared wrapper: 1px padding so the right/bottom edges are never clipped. */
export function GridShell({
  children,
  className,
  footer,
}: {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden p-px">
      <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}>
        {children}
      </div>
      {footer}
    </div>
  );
}

export default GridCard;
