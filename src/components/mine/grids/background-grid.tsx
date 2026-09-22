"use client";

import type { JSX } from "react";
import CopyDropdown from "../copy-dropdown";
import CurrencySkyBackground from "../../../../registry/new-york/backgrounds/currency-sky-background";
import DitherWaveBackground from "../../../../registry/new-york/backgrounds/dither-wave-background";
import BrailleTerrainBackground from "../../../../registry/new-york/backgrounds/braille-terrain-background";
import HalftoneBlobsBackground from "../../../../registry/new-york/backgrounds/halftone-blobs-background";
import ContourMapBackground from "../../../../registry/new-york/backgrounds/contour-map-background";
import DitherFieldBackground from "../../../../registry/new-york/backgrounds/dither-field-background";

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
  {
    name: "Braille Terrain Background",
    description: "A drifting terrain drawn in Unicode braille, every character its own 2×4 dither cell.",
    component: <BrailleTerrainBackground />,
    registryName: "braille-terrain-background",
  },
  {
    name: "Halftone Blobs Background",
    description: "A print halftone screen whose dots swell as unseen blobs drift beneath it.",
    component: <HalftoneBlobsBackground />,
    registryName: "halftone-blobs-background",
  },
  {
    name: "Contour Map Background",
    description: "Animated topographic contour lines over a slowly morphing landscape.",
    component: <ContourMapBackground />,
    registryName: "contour-map-background",
  },
  {
    name: "Dither Field Background",
    description:
      "A woven field of dashes on flat orange, switched on and off by a drifting noise field.",
    component: <DitherFieldBackground />,
    registryName: "dither-field-background",
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
