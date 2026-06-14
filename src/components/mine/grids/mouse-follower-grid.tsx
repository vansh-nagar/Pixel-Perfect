"use client";
import MouseFollower1 from "../../../../registry/new-york/mouse-follower/mouse-follower1";
import BendMouseFollower from "../../../../registry/new-york/mouse-follower/bend-mouse-follower";
import BendButtonFollower from "../../../../registry/new-york/mouse-follower/bend-button-follower";
import PixelCursorTrail from "../../../../registry/new-york/mouse-follower/pixel-cursor-trail";
import GravityImageTrail from "../../../../registry/new-york/mouse-follower/gravity-image-trail";
import ScaleImageTrail from "../../../../registry/new-york/mouse-follower/scale-image-trail";
import ImageTrailEffects from "../../../../registry/new-york/mouse-follower/image-trail-effects";
import MotionTrailClassic from "../../../../registry/new-york/mouse-follower/motion-trail-classic";
import MotionTrailInnerscape from "../../../../registry/new-york/mouse-follower/motion-trail-innerscape";
import MotionTrailExiting from "../../../../registry/new-york/mouse-follower/motion-trail-exiting";
import MotionTrailFlow from "../../../../registry/new-york/mouse-follower/motion-trail-flow";
import MotionTrailSpin from "../../../../registry/new-york/mouse-follower/motion-trail-spin";
import MotionTrailVelocity from "../../../../registry/new-york/mouse-follower/motion-trail-velocity";
import MotionTrailPersistence from "../../../../registry/new-york/mouse-follower/motion-trail-persistence";
import MotionTrailTile from "../../../../registry/new-york/mouse-follower/motion-trail-tile";
import MotionTrailPerspective from "../../../../registry/new-york/mouse-follower/motion-trail-perspective";
import ImageTrailFade from "../../../../registry/new-york/mouse-follower/image-trail-fade";
import ImageTrailScaleUp from "../../../../registry/new-york/mouse-follower/image-trail-scaleup";
import ImageTrailDrop from "../../../../registry/new-york/mouse-follower/image-trail-drop";
import ImageTrailSlide from "../../../../registry/new-york/mouse-follower/image-trail-slide";
import ImageTrailSqueeze from "../../../../registry/new-york/mouse-follower/image-trail-squeeze";
import ImageTrailDirection from "../../../../registry/new-york/mouse-follower/image-trail-direction";
import IconFall from "@/components/rune-landing/icon-fall";
import CopyDropdown from "../copy-dropdown";

export const MouseFollowerArr = [
  {
    name: "Bend Follower",
    description:
      "A frame smoothly chases the cursor and warps with an air-friction bend on a WebGL plane.",
    component: <BendMouseFollower />,
    registryName: "bend-mouse-follower",
  },
  {
    name: "Bend Button",
    description:
      "A rounded button that smoothly follows the cursor and leans with its motion for an air-friction feel.",
    component: <BendButtonFollower />,
    registryName: "bend-button-follower",
  },
  {
    name: "Pixel Cursor Trail",
    description:
      "Hovered grid cells flash and fade behind the cursor for a pixelated trail.",
    component: <PixelCursorTrail />,
    registryName: "pixel-cursor-trail",
  },
  {
    name: "Image Fall",
    description: "Image trail mouse follower using GSAP.",
    component: <MouseFollower1 />,
    registryName: "mouse-follower-1",
  },
  {
    name: "Gravity Image Trail",
    description:
      "Images cascade from the cursor, fall, and bounce off the bottom edge using GSAP.",
    component: <GravityImageTrail />,
    registryName: "gravity-image-trail",
  },
  {
    name: "Scale Image Trail",
    description:
      "Images pop in with a bouncy scale behind the cursor, then shrink away using GSAP.",
    component: <ScaleImageTrail />,
    registryName: "scale-image-trail",
  },
  {
    name: "Image Trail Effects",
    description:
      "A cursor image trail with six switchable reveal effects — flame, venetian, curtain, hexagon, liquid and zoom split.",
    component: <ImageTrailEffects />,
    registryName: "image-trail-effects",
  },
  {
    name: "Motion Trail · Classic",
    description:
      "Images appear at the cursor, glide to it, then scale and fade out. (GSAP)",
    component: <MotionTrailClassic />,
    registryName: "motion-trail-classic",
  },
  {
    name: "Motion Trail · Innerscape",
    description:
      "The outer image grows in while its inner layer un-zooms from a bright over-scale. (GSAP)",
    component: <MotionTrailInnerscape />,
    registryName: "motion-trail-innerscape",
  },
  {
    name: "Motion Trail · Exiting",
    description:
      "Each image pops in at the cursor, then exits upward with a random sideways drift. (GSAP)",
    component: <MotionTrailExiting />,
    registryName: "motion-trail-exiting",
  },
  {
    name: "Motion Trail · Flow",
    description:
      "Images flare with brightness/contrast tied to speed, then drift off in the travel direction. (GSAP)",
    component: <MotionTrailFlow />,
    registryName: "motion-trail-flow",
  },
  {
    name: "Motion Trail · Spin",
    description:
      "Images rotate to follow the cursor's heading and fling off along its path. (GSAP)",
    component: <MotionTrailSpin />,
    registryName: "motion-trail-spin",
  },
  {
    name: "Motion Trail · Velocity",
    description:
      "Images grow, brighten, blur and desaturate in proportion to cursor speed. (GSAP)",
    component: <MotionTrailVelocity />,
    registryName: "motion-trail-velocity",
  },
  {
    name: "Motion Trail · Persistence",
    description:
      "Blend-mode images linger in a stack and the oldest fades out as new ones arrive. (GSAP)",
    component: <MotionTrailPersistence />,
    registryName: "motion-trail-persistence",
  },
  {
    name: "Motion Trail · Tile",
    description:
      "Each image lands as a 3x3 grid of tiles that scatter and fade apart. (GSAP)",
    component: <MotionTrailTile />,
    registryName: "motion-trail-tile",
  },
  {
    name: "Motion Trail · Perspective",
    description:
      "Images tilt in 3D and shift in depth based on the cursor's distance from center. (GSAP)",
    component: <MotionTrailPerspective />,
    registryName: "motion-trail-perspective",
  },
  {
    name: "Image Trail · Fade",
    description: "Images ease toward the cursor, then fade and shrink away. (GSAP)",
    component: <ImageTrailFade />,
    registryName: "image-trail-fade",
  },
  {
    name: "Image Trail · Scale Up",
    description:
      "Images trail the cursor on a long ease, then fade while scaling up and out. (GSAP)",
    component: <ImageTrailScaleUp />,
    registryName: "image-trail-scaleup",
  },
  {
    name: "Image Trail · Drop",
    description:
      "Images chase the cursor, then fade and fall off the bottom edge. (GSAP)",
    component: <ImageTrailDrop />,
    registryName: "image-trail-drop",
  },
  {
    name: "Image Trail · Slide",
    description:
      "Images follow the cursor, then scatter off in random directions with a spin. (GSAP)",
    component: <ImageTrailSlide />,
    registryName: "image-trail-slide",
  },
  {
    name: "Image Trail · Squeeze",
    description:
      "Each image fades, squeezes thin and stretches tall as it drops away. (GSAP)",
    component: <ImageTrailSqueeze />,
    registryName: "image-trail-squeeze",
  },
  {
    name: "Image Trail · Direction",
    description:
      "Each image slides in from the side the cursor is moving toward, then fades out. (GSAP)",
    component: <ImageTrailDirection />,
    registryName: "image-trail-direction",
  },
  {
    name: "Icon Fall",
    description: "Icon trail mouse follower using GSAP.",
    component: <IconFall />,
    registryName: "mouse-follower-2",
  },
];

const MouseFollower = () => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {MouseFollowerArr.map((item, index) => (
        <div
          key={index}
          className="relative max-h-[90vh] w-full border-b border-l border-dashed  aspect-square flex justify-center items-center "
        >
          {item.component}

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs ">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>
          <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
            <div className=" border-t border-dashed "></div>
            <CopyDropdown registryName={item.registryName} variant="ghost" />
            <div />
            <div className=" border-r border-dashed h-full -mr-[0.5px] " />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MouseFollower;
