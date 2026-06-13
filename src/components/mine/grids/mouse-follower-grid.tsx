"use client";
import MouseFollower1 from "../../../../registry/new-york/mouse-follower/mouse-follower1";
import BendMouseFollower from "../../../../registry/new-york/mouse-follower/bend-mouse-follower";
import BendButtonFollower from "../../../../registry/new-york/mouse-follower/bend-button-follower";
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
    name: "Image Fall",
    description: "Image trail mouse follower using GSAP.",
    component: <MouseFollower1 />,
    registryName: "mouse-follower-1",
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
