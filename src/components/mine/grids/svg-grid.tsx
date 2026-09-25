"use client";
import Svg1 from "../../../../registry/new-york/svg/svg-1";
import Svg2 from "../../../../registry/new-york/svg/svg-2";
import Svg4 from "../../../../registry/new-york/svg/svg-4";
import Svg5 from "../../../../registry/new-york/svg/svg5";
import Svg6 from "../../../../registry/new-york/svg/svg6";
import Svg8 from "../../../../registry/new-york/svg/svg8";
import Svg9 from "../../../../registry/new-york/svg/svg-9";
import CopyDropdown from "../copy-dropdown";
import BorderDecorator from "./_shared/border-decorator";

export const SvgArr = [
  {
    name: "Svg Asset 1",
    description: "Animated SVG asset with GSAP.",
    component: <Svg1 />,
    registryName: "svg-1",
  },
  {
    name: "Svg Asset 2",
    description: "Animated SVG asset.",
    component: <Svg2 />,
    registryName: "svg-2",
  },
  {
    name: "Svg Asset 4",
    description: "Animated SVG asset.",
    component: <Svg4 />,
    registryName: "svg-4",
  },
  {
    name: "Svg Asset 5",
    description: "Animated SVG asset.",
    component: <Svg5 />,
    registryName: "svg-5",
  },
  {
    name: "Svg Asset 8",
    description: "Animated SVG asset.",
    component: <Svg8 />,
    registryName: "svg-8",
  },
  {
    name: "Svg Asset 9",
    description: "Animated SVG asset.",
    component: <Svg9 />,
    registryName: "svg-9",
  },
  {
    name: "Svg Asset 6",
    description: "Animated SVG asset.",
    component: <Svg6 />,
    registryName: "svg-6",
  },
];

const SvgAssetsGrid = () => {
  return (
    <div className="grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {SvgArr.map((item, index) => (
        <div
          key={index}
          className="relative border-b  border-l border-dashed  aspect-square flex items-center justify-center "
        >
          <BorderDecorator notch />
          <div className=" z-30 flex flex-col items-center gap-2 invert dark:invert-0">
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

export default SvgAssetsGrid;
