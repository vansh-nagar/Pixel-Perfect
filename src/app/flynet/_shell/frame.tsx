import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

const TONES: Record<Tone, CSSProperties> = {
  light: {
    "--rail": "rgba(0,0,0,0.1)",
    "--marker": "#1b1b1b",
  } as CSSProperties,
  dark: {
    "--rail": "rgba(255,255,255,0.1)",
    "--marker": "#ffffff",
  } as CSSProperties,
};

/**
 * One full-bleed page section. Owns the page geometry: the background slot
 * (edge to edge), the 1280px rail column with its two vertical rails, and the
 * content inset. Sections stack flush — the gap between them is always 0.
 */
export function FlynetSection({
  tone = "light",
  inset = true,
  railsFrom = 0,
  background,
  className,
  children,
}: {
  tone?: Tone;
  /** Content inset from the rails (20px). Off only for sections whose content sits on the rail. */
  inset?: boolean;
  /** Where the vertical rails start, in px from the section top. */
  railsFrom?: number;
  background?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={TONES[tone]}
      className={cn("relative isolate overflow-clip", className)}
    >
      {background && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {background}
        </div>
      )}
      <div className="px-4 md:px-8 lg:px-20">
        <div
          style={{ "--inset": inset ? "var(--content-inset)" : "0px" } as CSSProperties}
          className="relative mx-auto max-w-[1280px] [--content-inset:16px] md:[--content-inset:20px]"
        >
          <span
            aria-hidden
            style={{ top: railsFrom }}
            className="pointer-events-none absolute bottom-0 left-0 w-px bg-(--rail)"
          />
          <span
            aria-hidden
            style={{ top: railsFrom }}
            className="pointer-events-none absolute right-0 bottom-0 w-px bg-(--rail)"
          />
          <div className="px-(--inset)">{children}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * A zero-height, full-width marker placed in normal flow inside a section's
 * content. Draws a full-bleed 1px rule at its position and/or the two 7×7
 * squares centred on the rails. Colours follow the section's tone.
 */
export function RailDivider({
  line = true,
  markers = true,
  className,
}: {
  line?: boolean;
  markers?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none relative h-0 w-full", className)}>
      {line && (
        <span className="absolute top-0 left-1/2 h-px w-[200vw] -translate-x-1/2 bg-(--rail)" />
      )}
      {markers && (
        <>
          <span className="absolute -top-[3px] left-[calc(-1*var(--inset)-3px)] size-[7px] bg-(--marker)" />
          <span className="absolute -top-[3px] right-[calc(-1*var(--inset)-3px)] size-[7px] bg-(--marker)" />
        </>
      )}
    </div>
  );
}
