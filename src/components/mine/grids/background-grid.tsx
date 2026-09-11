"use client";

import type { JSX } from "react";
import CopyDropdown from "../copy-dropdown";
import CurrencySkyBackground from "../../../../registry/new-york/backgrounds/currency-sky-background";
import DitherWaveBackground from "../../../../registry/new-york/backgrounds/dither-wave-background";

type BackgroundItem = {
  name: string;
  description: string;
  component: JSX.Element;
  registryName: string;
};

export const BackgroudArr: BackgroundItem[] = [
  {
    name: "Currency Sky Background",
    description: "A flowing field of currency glyphs with luminous contour bands.",
    component: <CurrencySkyBackground />,
    registryName: "currency-sky-background",
  },
  {
    name: "Dither Wave Background",
    description: "Slow blue-and-paper halftone waves with a gentle pointer warp.",
    component: <DitherWaveBackground />,
    registryName: "dither-wave-background",
  },
];

export default function BackgroundGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {BackgroudArr.map((item) => (
        <article key={item.registryName} className="min-w-0">
          <div className="relative aspect-video overflow-hidden border border-dashed">
            {item.component}
            <div className="absolute right-0 top-0 z-40">
              <CopyDropdown registryName={item.registryName} className="bg-background/90" />
            </div>
          </div>
          <div className="px-1 pb-3 pt-3">
            <h2 className="text-sm font-medium">{item.name}</h2>
          </div>
        </article>
      ))}
    </div>
  );
}
