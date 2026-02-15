import { ComponentTransition } from "@/components/ui/infinite-moving-components";
import { ButtonsArr } from "../grids/button-grid";
import StarBorder from "./star-border";
import { Circle } from "lucide-react";
import { BorderArr } from "../grids/border-grid";
import { MouseFollowerArr } from "../grids/mouse-follower-grid";
import TextMatrixRain from "registry/new-york/text/text-matrix-rain";
import TextGlitchPortal from "registry/new-york/text/text-glitch-portal";
import TextTypewriterGlitch from "registry/new-york/text/text-typewriter-glitch";
import TextReveal from "registry/new-york/text/text-reveal";
import TextVideo from "registry/new-york/text/text-video";
import TextZRotate2 from "registry/new-york/text/text-z-rotate2";
import TextZRotate from "registry/new-york/text/text-z-rotate";
import TextReveal2 from "registry/new-york/text/text-reveal2";
import TextBlackHole from "registry/new-york/text/text-black-hole";
import TextBurnNeon from "registry/new-york/text/text-burn-neon";
import { BackgroudArr } from "../grids/background-grid";
import { SvgArr } from "../grids/svg-grid";

const ComponentsShowcase = () => {
  return (
    <>
      <div className="flex justify-between relative overflow-hidden px-6 py-3 max-sm:px-3 border-b border-muted">
        <div className="flex gap-2">
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
        </div>
        <div className="text-xs text-muted-foreground/30">COMPONENTS</div>
        <StarBorder />
      </div>
      <div className="grid grid-cols-[50px_1fr_50px] max-sm:grid-cols-[30px_1fr_30px] ">
        <div className=" border-r border-muted relative overflow-hidden">
          <StarBorder />
        </div>
        <div className=" overflow-hidden">
          <div className="relative h-10 text-xs text-muted-foreground/30">
            <StarBorder />
          </div>
          <div className="border-y border-muted grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            <ComponentTransition
              componentArr={ButtonsArr}
              className="  border  border-muted"
            />
            <ComponentTransition
              componentArr={SvgArr}
              className="  border  border-muted"
            />
            <ComponentTransition
              className="  border  border-muted"
              componentArr={MouseFollowerArr}
            />
            <ComponentTransition
              className="  border  border-muted"
              componentArr={BorderArr}
            />
            <ComponentTransition
              componentArr={BackgroudArr}
              className="  border  border-muted"
            />
            <ComponentTransition
              componentArr={TextArr}
              className="  border  border-muted"
            />
          </div>{" "}
          <div className="relative h-10 text-xs text-muted-foreground/30">
            <StarBorder />
          </div>
        </div>
        <div className=" border-l border-muted relative overflow-hidden">
          <StarBorder />
        </div>
      </div>{" "}
    </>
  );
};

export default ComponentsShowcase;

const TextArr = [
  {
    name: "Matrix Rain Decode",
    description: "Columns of random symbols fall → lock into real text.",
    component: (
      <TextMatrixRain className="text-2xl font-bold font-mono">
        JUST GIVE IT A STAR
      </TextMatrixRain>
    ),
    registryName: "text-matrix-rain",
    hasStagger: false,
  },
  {
    name: "Glitch Warp Portal",
    description: "RGB split + scale blur → collapse into clean text.",
    component: (
      <TextGlitchPortal className="text-2xl font-bold">
        JUST GIVE IT A STAR
      </TextGlitchPortal>
    ),
    registryName: "text-glitch-portal",
    hasStagger: false,
  },
  {
    name: "Typewriter Malfunction",
    description: "Types → deletes → types wrong → finally correct.",
    component: (
      <TextTypewriterGlitch className="text-2xl font-bold font-mono">
        JUST GIVE IT A STAR
      </TextTypewriterGlitch>
    ),
    registryName: "text-typewriter-glitch",
    hasStagger: false,
  },
  {
    name: "Text Reveal",
    description: "Text reveal animation effect.",
    component: <TextReveal className="text-xl">JUST GIVE IT A STAR</TextReveal>,
    registryName: "text-reveal",
    hasStagger: false,
  },

  {
    name: "Text Video",
    description: "Video masked text effect.",
    component: <TextVideo>JUST GIVE IT A STAR</TextVideo>,
    registryName: "text-video",
    hasStagger: false,
  },
  {
    name: "Text Z Rotate 2",
    description: "Z-axis rotation text animation variant.",
    component: <TextZRotate2 />,
    registryName: "text-z-rotate2",
    hasStagger: true,
  },
  {
    name: "Text Z Rotate",
    description: "Z-axis rotation text animation.",
    component: <TextZRotate />,
    registryName: "text-z-rotate",
    hasStagger: true,
  },
  {
    name: "Text Reveal 2",
    description: "Text reveal animation variant.",
    component: (
      <TextReveal2 className="text-xl">JUST GIVE IT A STAR</TextReveal2>
    ),
    registryName: "text-reveal2",
    hasStagger: false,
  },
  {
    name: "Black Hole Reveal",
    description: "Letters come from center, stretched & sucked outward.",
    component: (
      <TextBlackHole className="text-2xl font-bold">
        JUST GIVE IT A STAR
      </TextBlackHole>
    ),
    registryName: "text-black-hole",
    hasStagger: false,
  },
  {
    name: "Burn-In Neon",
    description: "Random flicker → letters glow red → turn white.",
    component: (
      <TextBurnNeon className="text-2xl font-bold">
        JUST GIVE IT A STAR
      </TextBurnNeon>
    ),
    registryName: "text-burn-neon",
    hasStagger: false,
  },
];

