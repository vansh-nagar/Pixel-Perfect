"use client";

import { GridCard, GridShell } from "./_shared/grid-card";
import type { JSX } from "react";
import CurrencySkyBackground from "../../../../registry/new-york/backgrounds/currency-sky-background";
import DitherWaveBackground from "../../../../registry/new-york/backgrounds/dither-wave-background";
import BrailleTerrainBackground from "../../../../registry/new-york/backgrounds/braille-terrain-background";
import ContourMapBackground from "../../../../registry/new-york/backgrounds/contour-map-background";
import DitherFieldBackground from "../../../../registry/new-york/backgrounds/dither-field-background";
import OpArtStripesBackground from "../../../../registry/new-york/backgrounds/op-art-stripes-background";
import SparkleGridBackground from "../../../../registry/new-york/backgrounds/sparkle-grid-background";
import PixelMapBackground from "../../../../registry/new-york/backgrounds/pixel-map-background";
import GlyphBlocksBackground from "../../../../registry/new-york/backgrounds/glyph-blocks-background";
import CheckerBlocksBackground from "../../../../registry/new-york/backgrounds/checker-blocks-background";

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
  {
    name: "Op-Art Stripes Background",
    description: "Bold bands that ripple and swell in slow waves, with a magnifying lens under the cursor.",
    component: <OpArtStripesBackground />,
    registryName: "op-art-stripes-background",
  },
  {
    name: "Sparkle Grid Background",
    description: "Clusters on a dark grid grow from dots into circles and bloom into sparkles; one follows the cursor.",
    component: <SparkleGridBackground />,
    registryName: "sparkle-grid-background",
  },
  {
    name: "Pixel Map Background",
    description: "A pixel world map panning around the globe while live user squares pop on and ripple.",
    component: <PixelMapBackground />,
    registryName: "pixel-map-background",
  },
  {
    name: "Glyph Blocks Background",
    description: "Acid-green glyph zones drifting across a black grid.",
    component: <GlyphBlocksBackground />,
    registryName: "glyph-blocks-background",
  },
  {
    name: "Checker Blocks Background",
    description: "A red-and-white poster grid of blocks, rings and checkers that glitch through finer checkers as they change; hover to reshuffle.",
    component: <CheckerBlocksBackground />,
    registryName: "checker-blocks-background",
  },
];

export default function BackgroundGrid() {
  return (
    <GridShell>
      {BackgroudArr.map((item) => (
        <GridCard
          key={item.registryName}
          name={item.name}
          description={item.description}
          registryName={item.registryName}
          className="aspect-video"
          fill
        >
          {item.component}
        </GridCard>
      ))}
    </GridShell>
  );
}
