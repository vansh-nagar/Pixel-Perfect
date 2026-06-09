import { cn } from "@/lib/utils";

const LAYERS = [
  { blur: 0.5, mask: [0, 12.5, 25, 37.5] },
  { blur: 1, mask: [12.5, 25, 37.5, 50] },
  { blur: 2, mask: [25, 37.5, 50, 62.5] },
  { blur: 3, mask: [37.5, 50, 62.5, 75] },
  { blur: 5, mask: [50, 62.5, 75, 87.5] },
  { blur: 8, mask: [62.5, 75, 87.5, 100] },
  { blur: 12, mask: [75, 87.5, 100, 112.5] },
  { blur: 16, mask: [87.5, 100] },
];

function maskFor(stops: number[], side: "top" | "bottom") {
  // 4 stops -> transparent, opaque, opaque, transparent
  // 2 stops -> transparent, opaque (final layer)
  const parts =
    stops.length === 4
      ? [
          `rgba(0,0,0,0) ${stops[0]}%`,
          `rgb(0,0,0) ${stops[1]}%`,
          `rgb(0,0,0) ${stops[2]}%`,
          `rgba(0,0,0,0) ${stops[3]}%`,
        ]
      : [`rgba(0,0,0,0) ${stops[0]}%`, `rgb(0,0,0) ${stops[1]}%`];
  // `to bottom` (the default) stacks the heaviest blur at the bottom edge; for a
  // top band we flip the axis so the heaviest blur sits at the top edge instead.
  return `linear-gradient(to ${side}, ${parts.join(", ")})`;
}

type GradientBlurProps = {
  className?: string;
  /** Height of the blur band. Defaults to 60px. */
  height?: number;
  /** Which edge the blur is anchored to / fades from. Defaults to "bottom". */
  side?: "top" | "bottom";
  /** Positioning strategy. "fixed" pins to the viewport (landing page); use
   *  "absolute"/"sticky" to pin inside a scroll container instead. */
  position?: "fixed" | "absolute" | "sticky";
};

export function GradientBlur({
  className,
  height = 60,
  side = "bottom",
  position = "fixed",
}: GradientBlurProps) {
  return (
    <div
      className={cn(
        "pointer-events-none inset-x-0 z-[60]",
        position,
        side === "top" ? "top-0" : "bottom-0",
        className,
      )}
      style={{ height }}
    >
      <div className="relative h-full">
        {LAYERS.map((layer, i) => {
          const mask = maskFor(layer.mask, side);
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                zIndex: i + 1,
                backdropFilter: `blur(${layer.blur}px)`,
                WebkitBackdropFilter: `blur(${layer.blur}px)`,
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default GradientBlur;
