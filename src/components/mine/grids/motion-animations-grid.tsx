"use client";
import CardAnimation from "registry/new-york/motion-framer/card-animation";
import ImageHoverAnimation from "registry/new-york/motion-framer/image-hover-animation";
import LogoAnimation from "registry/new-york/motion-framer/logo-animation";
import TabBackgroundAnimation from "registry/new-york/motion-framer/tab-background-animation";
import CopyDropdown from "../copy-dropdown";

const MotionComponentArr = [
  {
    name: "Simple Card",
    description: "A simple card animation using Framer Motion.",
    component: <CardAnimation />,
    registryName: "card-animation",
  },
  {
    name: "Logo Animation",
    description: "Logo animation with Framer Motion and custom background.",
    component: <LogoAnimation />,
    registryName: "logo-animation",
  },
  {
    name: "Tab Background",
    description: "A tab background animation using Framer Motion.",
    component: <TabBackgroundAnimation />,
    registryName: "tab-background-animation",
  },
  {
    name: "Image Hover",
    description: "An image hover animation with scaling and opacity effects.",
    component: <ImageHoverAnimation />,
    registryName: "image-hover-animation",
  },
];

const MotionAnimationsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2  gap-0">
      {MotionComponentArr.map((item, index) => (
        <div
          key={index}
          className="w-full border relative border-b border-l border-dashed  aspect-square flex justify-center items-center"
        >
          {item.component}

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs ">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="absolute top-0 right-0">
            <CopyDropdown registryName={item.registryName} variant="ghost" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MotionAnimationsGrid;
