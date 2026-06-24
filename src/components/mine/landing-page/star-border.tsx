import { cn } from "@/lib/utils";

const STAR_PATH =
  "M15 0 C19 9 21 11 30 15 C21 19 19 21 15 30 C11 21 9 19 0 15 C9 11 11 9 15 0 Z";

/**
 * Hidden sprite that holds the corner-star geometry once for the whole page.
 * Render a single <StarSprite /> near the root (it's in the root layout) so
 * every <StarBorder /> can reference it via <use> instead of re-declaring the
 * path on each of its four corners.
 */
export const StarSprite = () => (
  <svg
    aria-hidden
    width={0}
    height={0}
    className="absolute"
    style={{ position: "absolute", width: 0, height: 0 }}
  >
    <symbol id="pp-star" viewBox="0 0 30 30">
      <path fill="currentColor" d={STAR_PATH} />
    </symbol>
  </svg>
);

const CORNERS = [
  "-top-[7.9px] -right-[7.6px]",
  "-bottom-[8px] -right-[7.8px]",
  "-top-[7.9px] -left-[7.8px]",
  "-bottom-[8px] -left-[7.8px]",
];

const StarBorder = () => (
  <>
    {CORNERS.map((corner) => (
      <svg
        key={corner}
        aria-hidden
        className={cn("absolute z-50 h-4 w-4 text-muted", corner)}
      >
        <use href="#pp-star" />
      </svg>
    ))}
  </>
);

export default StarBorder;
