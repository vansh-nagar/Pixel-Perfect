"use client";

/**
 * A progressive (layered) backdrop-blur fade, stacking eight masked blur layers.
 */
export default function ProgressiveBlur() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="relative h-full w-full">
        {[
          { blur: 0.5, mask: [0, 12.5, 25, 37.5] },
          { blur: 1, mask: [12.5, 25, 37.5, 50] },
          { blur: 2, mask: [25, 37.5, 50, 62.5] },
          { blur: 3, mask: [37.5, 50, 62.5, 75] },
          { blur: 5, mask: [50, 62.5, 75, 87.5] },
          { blur: 8, mask: [62.5, 75, 87.5, 100] },
          { blur: 12, mask: [75, 87.5, 100, 112.5] },
          { blur: 16, mask: [87.5, 100, 100, 100] },
        ].map((layer, i) => {
          const s = layer.mask;
          const mask = `linear-gradient(to bottom, rgba(0,0,0,0) ${s[0]}%, rgb(0,0,0) ${s[1]}%, rgb(0,0,0) ${s[2]}%, rgba(0,0,0,0) ${s[3]}%)`;
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
