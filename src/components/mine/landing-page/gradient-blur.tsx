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
  const parts =
    stops.length === 4
      ? [
          `rgba(0,0,0,0) ${stops[0]}%`,
          `rgb(0,0,0) ${stops[1]}%`,
          `rgb(0,0,0) ${stops[2]}%`,
          `rgba(0,0,0,0) ${stops[3]}%`,
        ]
      : [`rgba(0,0,0,0) ${stops[0]}%`, `rgb(0,0,0) ${stops[1]}%`];
  return `linear-gradient(to ${side}, ${parts.join(", ")})`;
}

type GradientBlurProps = {
  className?: string;
  height?: number;
  side?: "top" | "bottom";
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

export const progressiveBlurSnippet = [
  `<div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px]">`,
  `  <div className="relative h-full">`,
  ...LAYERS.map((layer, i) => {
    const mask = maskFor(layer.mask, "bottom");
    return [
      `    <div`,
      `      className="absolute inset-0"`,
      `      style={{`,
      `        zIndex: ${i + 1},`,
      `        backdropFilter: "blur(${layer.blur}px)",`,
      `        WebkitBackdropFilter: "blur(${layer.blur}px)",`,
      `        maskImage: "${mask}",`,
      `        WebkitMaskImage: "${mask}",`,
      `      }}`,
      `    />`,
    ].join("\n");
  }),
  `  </div>`,
  `</div>`,
].join("\n");

export default GradientBlur;
