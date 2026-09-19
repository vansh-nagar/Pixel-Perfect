"use client";

import type { JSX } from "react";
import CopyDropdown from "../copy-dropdown";
import CurrencySkyBackground from "../../../../registry/new-york/backgrounds/currency-sky-background";
import DitherWaveBackground from "../../../../registry/new-york/backgrounds/dither-wave-background";
import BrailleTerrainBackground from "../../../../registry/new-york/backgrounds/braille-terrain-background";
import HalftoneBlobsBackground from "../../../../registry/new-york/backgrounds/halftone-blobs-background";
import ContourMapBackground from "../../../../registry/new-york/backgrounds/contour-map-background";
import RidgeLinesBackground from "../../../../registry/new-york/backgrounds/ridge-lines-background";
import CircuitTracesBackground from "../../../../registry/new-york/backgrounds/circuit-traces-background";
import LightningStormBackground from "../../../../registry/new-york/backgrounds/lightning-storm-background";
import HyperspaceBackground from "../../../../registry/new-york/backgrounds/hyperspace-background";
import SynthwaveHorizonBackground from "../../../../registry/new-york/backgrounds/synthwave-horizon-background";
import WireframeTerrainBackground from "../../../../registry/new-york/backgrounds/wireframe-terrain-background";
import RadarSweepBackground from "../../../../registry/new-york/backgrounds/radar-sweep-background";
import WarpTunnelBackground from "../../../../registry/new-york/backgrounds/warp-tunnel-background";

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
    name: "Ridge Lines Background",
    description: "Stacked pulse lines rising into a ridge, each occluding the ones behind.",
    component: <RidgeLinesBackground />,
    registryName: "ridge-lines-background",
  },
  {
    name: "Circuit Traces Background",
    description: "A seeded circuit board of traces and vias with pulses running along the copper.",
    component: <CircuitTracesBackground />,
    registryName: "circuit-traces-background",
  },
  {
    name: "Lightning Storm Background",
    description: "Lightning forks down at random, flashing the clouds and branching as it falls.",
    component: <LightningStormBackground />,
    registryName: "lightning-storm-background",
  },
  {
    name: "Hyperspace Background",
    description: "Stars streak past from a vanishing point, surging and easing at warp speed.",
    component: <HyperspaceBackground />,
    registryName: "hyperspace-background",
  },
  {
    name: "Synthwave Horizon Background",
    description: "A striped sun over a neon grid that streams toward you.",
    component: <SynthwaveHorizonBackground />,
    registryName: "synthwave-horizon-background",
  },
  {
    name: "Wireframe Terrain Background",
    description: "A flyover of vector mountains, near ridges hiding the far ones.",
    component: <WireframeTerrainBackground />,
    registryName: "wireframe-terrain-background",
  },
  {
    name: "Radar Sweep Background",
    description: "A phosphor scope whose contacts ping and fade as the sweep passes.",
    component: <RadarSweepBackground />,
    registryName: "radar-sweep-background",
  },
  {
    name: "Warp Tunnel Background",
    description: "Checkered rings rush out of a drifting dark centre, demoscene style.",
    component: <WarpTunnelBackground />,
    registryName: "warp-tunnel-background",
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
