"use client";
import BarWaveAnimation from "registry/new-york/svg/bar-wave-animation";
import GlowCardAnimation from "registry/new-york/svg/glow-card-animation";
import LiquidPauseAnimation from "registry/new-york/svg/liquid-pause-animation";
import OrbitSmileyAnimation from "registry/new-york/svg/orbit-smiley-animation";
import SmileyOrbAnimation from "registry/new-york/svg/smiley-orb-animation";
import CopyDropdown from "../copy-dropdown";
import { BorderDecorator } from "./svg-grid";

export const SvgAnimationsArr = [
  {
    name: "Smiley Orb",
    description: "Bouncing gradient orb with a face, animated with Motion.",
    component: <SmileyOrbAnimation />,
    registryName: "smiley-orb-animation",
  },
  {
    name: "Orbit Smiley",
    description: "Smiley orb looping a path with a full spin, animated with Motion.",
    component: <OrbitSmileyAnimation />,
    registryName: "orbit-smiley-animation",
  },
  {
    name: "Bar Wave",
    description: "Animated bar wave SVG.",
    component: <BarWaveAnimation />,
    registryName: "bar-wave-animation",
  },
  {
    name: "Glow Card",
    description: "Gradient card drifting up into a dark glowing panel.",
    component: <GlowCardAnimation />,
    registryName: "glow-card-animation",
  },
  {
    name: "Liquid Pause",
    description: "Pause glyph over a morphing liquid blob on a gradient tile.",
    component: <LiquidPauseAnimation />,
    registryName: "liquid-pause-animation",
  },
];

const SvgAnimationsGrid = () => {
  return (
    <div className="grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {SvgAnimationsArr.map((item, index) => (
        <div
          key={index}
          className="relative border-b  border-l border-dashed  aspect-square flex items-center justify-center "
        >
          <BorderDecorator />
          <div className=" z-30 flex flex-col items-center gap-2 w-full h-full p-8">
            {item.component}
          </div>

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs text-white">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>
          <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
            <div className=" border-t border-dashed "></div>
            <CopyDropdown registryName={item.registryName} />
            <div />
            <div className=" border-r border-dashed h-full -mr-[0.5px] " />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SvgAnimationsGrid;
