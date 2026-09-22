"use client";

import { ArtCanvas } from "./art-canvas";
import type { SceneFactory } from "./scene";
import { chevronFlow } from "./scenes/chevron-flow";
import { ditherField } from "./scenes/dither-field";
import { emblem } from "./scenes/emblem";
import { equalizer } from "./scenes/equalizer";
import { metro } from "./scenes/metro";
import { spray } from "./scenes/spray";
import { staircase } from "./scenes/staircase";
import { subdivision } from "./scenes/subdivision";
import { tokenColumnsColor, tokenColumnsMono } from "./scenes/token-columns";
import { wings } from "./scenes/wings";
import { wireframeEcho } from "./scenes/wireframe-echo";

/** Same order as the reference board: three across, four down. */
const SCENES: { name: string; scene: SceneFactory }[] = [
  { name: "Emblem", scene: emblem },
  { name: "Spray", scene: spray },
  { name: "Token columns", scene: tokenColumnsColor },
  { name: "Staircase", scene: staircase },
  { name: "Equalizer", scene: equalizer },
  { name: "Subdivision", scene: subdivision },
  { name: "Wings", scene: wings },
  { name: "Token columns, mono", scene: tokenColumnsMono },
  { name: "Chevron flow", scene: chevronFlow },
  { name: "Metro", scene: metro },
  { name: "Dither field", scene: ditherField },
  { name: "Wireframe echo", scene: wireframeEcho },
];

export function ArtGallery() {
  return (
    <main className="min-h-screen bg-[#171717] px-2 pb-2 pt-14 sm:px-3 sm:pb-3">
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SCENES.map(({ name, scene }) => (
          <ArtCanvas key={name} name={name} scene={scene} className="aspect-[385/157] w-full" />
        ))}
      </div>
    </main>
  );
}
