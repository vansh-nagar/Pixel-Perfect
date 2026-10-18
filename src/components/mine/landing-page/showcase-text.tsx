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
import TextHighlightWave from "registry/new-york/text/text-highlight-wave";
import TextInlineChipReveal from "registry/new-york/text/text-inline-chip-reveal";

export const TextArr = [
  {
    name: "Highlight Wave",
    description: "A highlight colour washes across a headline character by character.",
    component: <TextHighlightWave className="text-2xl" />,
    registryName: "text-highlight-wave",
    hasStagger: false,
  },
  {
    name: "Inline Chip Reveal",
    description: "Words resolve one by one from a hue-shifting glow into solid ink.",
    component: <TextInlineChipReveal className="text-base" />,
    registryName: "text-inline-chip-reveal",
    hasStagger: false,
  },
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

