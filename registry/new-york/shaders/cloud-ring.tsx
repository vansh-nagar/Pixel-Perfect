"use client";

/**
 * A frame of white cloud that breathes in and out around a blurred sky, drawn to fit whatever box it's in.
 */

import { useInView } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/*
 * After GetOn's Tap Anywhere cloud frame, rebuilt to fill any box edge to edge rather than one
 * portrait size:
 *
 *   sky    a cloud photo, blurred, behind everything
 *   rings  two frames of white cloud around a rounded window. Each is a white sheet with the
 *          window cut out, its inner edge torn up by fractal noise (feTurbulence into
 *          feDisplacementMap), blurred soft, with a faint blue-grey underside for volume. The SVG
 *          is laid out in real pixels, so the wisps keep their shape at any aspect ratio.
 *
 * Each ring breathes 100% → 95.5% → 100% on a 5s loop, the second half a breath behind, and
 * drifts a few px on slower, unequal periods, so the edge keeps billowing and never repeats.
 * The cloud band is 15% of the box's shorter side; each sheet overhangs the box by that much
 * again, so a breath never pulls its outer edge into view. Paused while off screen; still under
 * reduced motion. Children sit over the sky, under the rings.
 */

const BAND = 0.15;

const CSS = `
  .cloud-ring-cloud {
    transform-origin: 50% 50%;
    will-change: transform;
    animation:
      cloud-ring-breathe 5000ms ease-in-out infinite,
      cloud-ring-drift-a 8000ms ease-in-out infinite alternate;
    animation-play-state: paused;
  }
  .cloud-ring-b {
    animation-name: cloud-ring-breathe, cloud-ring-drift-b;
    animation-duration: 5000ms, 10000ms;
    animation-delay: 2500ms, 0ms;
  }
  .cloud-ring[data-playing] > .cloud-ring-cloud {
    animation-play-state: running;
  }
  @keyframes cloud-ring-breathe {
    0%, 100% { scale: 1; }
    50% { scale: 0.955; }
  }
  @keyframes cloud-ring-drift-a {
    from { translate: 0 0; }
    to { translate: -7px 6px; }
  }
  @keyframes cloud-ring-drift-b {
    from { translate: 0 0; }
    to { translate: 8px -7px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cloud-ring-cloud { animation: none; }
  }
`;

/** One frame of cloud for a w×h box: a white sheet with a torn, rounded window. */
function Ring({ w, h, seed, id, className }: { w: number; h: number; seed: number; id: string; className: string }) {
  const band = Math.min(w, h) * BAND;
  const W = w + band * 2;
  const H = h + band * 2;
  // The window, in the sheet's coordinates (the sheet starts `band` outside the box).
  const x0 = band * 2;
  const y0 = band * 2;
  const x1 = W - band * 2;
  const y1 = H - band * 2;
  const r = Math.min(band * 1.2, (x1 - x0) / 2, (y1 - y0) / 2);
  const sheet =
    `M0 0H${W}V${H}H0Z` +
    `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}` +
    `H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;

  return (
    <svg
      aria-hidden
      className={`cloud-ring-cloud absolute ${className}`}
      style={{ left: -band, top: -band }}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
    >
      <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={1.1 / band} numOctaves={4} seed={seed} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={band * 1.4} xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation={band * 0.12} result="cloud" />
        {/* a faint blue-grey underside, so the bank reads as volume rather than fog */}
        <feGaussianBlur in="cloud" stdDeviation={band * 0.3} />
        <feOffset dy={band * 0.12} result="soft" />
        <feFlood floodColor="#8fa6bf" floodOpacity={0.35} />
        <feComposite in2="soft" operator="in" result="shade" />
        <feMerge>
          <feMergeNode in="shade" />
          <feMergeNode in="cloud" />
        </feMerge>
      </filter>
      <path d={sheet} fill="#fff" fillRule="evenodd" filter={`url(#${id})`} />
    </svg>
  );
}

export default function CloudRing({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const playing = useInView(ref, { amount: 0.15 });
  const id = `cloud-ring-${useId().replace(/[^\w-]/g, "")}`;

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-white ${className ?? ""}`}>
      <style>{CSS}</style>
      {size && size.w > 0 && size.h > 0 && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/clouds/clouds.png"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover"
            style={{ filter: `blur(${Math.min(size.w, size.h) * 0.02}px)` }}
          />
          {children && <div className="absolute inset-0">{children}</div>}
          <div data-playing={playing || undefined} className="cloud-ring pointer-events-none absolute inset-0">
            <Ring w={size.w} h={size.h} seed={3} id={`${id}-a`} className="cloud-ring-a" />
            <Ring w={size.w} h={size.h} seed={11} id={`${id}-b`} className="cloud-ring-b" />
          </div>
        </>
      )}
    </div>
  );
}
