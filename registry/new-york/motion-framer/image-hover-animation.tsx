"use client";
import { motion } from "framer-motion";
import { useState } from "react";

const ImageHoverAnimation = () => {
  const image = [
    "https://i.pinimg.com/originals/ce/7f/35/ce7f35ec213d896247c7c2e8620d81f9.gif",
    "https://i.pinimg.com/originals/3a/a4/6f/3aa46f5701fc6ed92234ea0a9f86e2cd.gif",
    "https://i.pinimg.com/736x/64/20/b5/6420b5ba0dd45dc35aae9705c8e275dd.jpg",
    "https://i.pinimg.com/originals/f8/ba/9b/f8ba9b7f92fa91361e251c72e213c11a.gif",
  ];
  const [active, setActive] = useState(100);
  const [containerHover, setContainerHover] = useState(false);

  return (
    <div className="flex justify-center items-center h-full w-full overflow-hidden">
      <div
        onMouseLeave={() => {
          setActive(100);
          setContainerHover(false);
        }}
        onMouseEnter={() => {
          setContainerHover(true);
        }}
        className="flex items-end gap-1"
      >
        {image.map((item, i) => (
          <motion.img
            key={i}
            layout
            transition={{
              type: "tween",
              duration: 0.25,
              ease: "easeOut",
            }}
            style={{
              opacity: containerHover ? (active === i ? 1 : 0.5) : 1,
              width: active === i ? "180px" : "120px",
              height: active === i ? "150px" : "100px",
            }}
            onMouseEnter={() => {
              setActive(i);
            }}
            src={item}
            className="object-cover origin-bottom rounded-lg"
          />
        ))}
      </div>
    </div>
  );
};

export default ImageHoverAnimation;
