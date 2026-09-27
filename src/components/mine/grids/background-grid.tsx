"use client";

import type { JSX } from "react";
import CopyDropdown from "../copy-dropdown";
import CurrencySkyBackground from "../../../../registry/new-york/backgrounds/currency-sky-background";
import DitherWaveBackground from "../../../../registry/new-york/backgrounds/dither-wave-background";
import BrailleTerrainBackground from "../../../../registry/new-york/backgrounds/braille-terrain-background";
import HalftoneBlobsBackground from "../../../../registry/new-york/backgrounds/halftone-blobs-background";
import ContourMapBackground from "../../../../registry/new-york/backgrounds/contour-map-background";
import DitherFieldBackground from "../../../../registry/new-york/backgrounds/dither-field-background";
import VectorFieldBackground from "../../../../registry/new-york/backgrounds/vector-field-background";
import BayerSunsetBackground from "../../../../registry/new-york/backgrounds/bayer-sunset-background";
import TruchetWeaveBackground from "../../../../registry/new-york/backgrounds/truchet-weave-background";
import OpArtStripesBackground from "../../../../registry/new-york/backgrounds/op-art-stripes-background";
import SparkleGridBackground from "../../../../registry/new-york/backgrounds/sparkle-grid-background";
import PixelMapBackground from "../../../../registry/new-york/backgrounds/pixel-map-background";
import GlyphBlocksBackground from "../../../../registry/new-york/backgrounds/glyph-blocks-background";
import ArrowLetterBackground from "../../../../registry/new-york/backgrounds/arrow-letter-background";
import MisprintBackground from "../../../../registry/new-york/backgrounds/misprint-background";
import CheckerBlocksBackground from "../../../../registry/new-york/backgrounds/checker-blocks-background";
import BrickBlobsBackground from "../../../../registry/new-york/backgrounds/brick-blobs-background";

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
  {
    name: "Vector Field Background",
    description: "A grid of strokes that follow a drifting flow and swirl into a vortex around the cursor.",
    component: <VectorFieldBackground />,
    registryName: "vector-field-background",
  },
  {
    name: "Bayer Sunset Background",
    description: "A 1-bit retro sun over a scrolling perspective grid, drawn with a Bayer ordered dither.",
    component: <BayerSunsetBackground />,
    registryName: "bayer-sunset-background",
  },
  {
    name: "Truchet Weave Background",
    description: "Quarter-arc tiles that spin as slow waves sweep across, re-routing the maze.",
    component: <TruchetWeaveBackground />,
    registryName: "truchet-weave-background",
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
    description: "Acid-green glyph zones drifting across a black grid while solid blocks snap to new places on a beat.",
    component: <GlyphBlocksBackground />,
    registryName: "glyph-blocks-background",
  },
  {
    name: "Arrow Letter Background",
    description: "A field of diagonal arrows where a red letter spells out a word, each change sweeping across.",
    component: <ArrowLetterBackground />,
    registryName: "arrow-letter-background",
  },
  {
    name: "Misprint Background",
    description: "Brush strokes printed as misregistered cyan, blue, red and yellow separations, dithered over a pixel checkerboard; they slip apart under the cursor.",
    component: <MisprintBackground />,
    registryName: "misprint-background",
  },
  {
    name: "Checker Blocks Background",
    description: "A red-and-white poster grid of blocks, rings and checkers that glitch through finer checkers as they change; hover to reshuffle.",
    component: <CheckerBlocksBackground />,
    registryName: "checker-blocks-background",
  },
  {
    name: "Brick Blobs Background",
    description: "Toy-brick cats on a studded baseplate; hover and the nearest one walks over, watches the cursor and perks up when touched.",
    component: <BrickBlobsBackground />,
    registryName: "brick-blobs-background",
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
