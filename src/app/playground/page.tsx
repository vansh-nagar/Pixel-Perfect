"use client";
import { set } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Page() {
  const arr = ["Cool", "Warm", "Hot", "Bloom", "Mild"];
  const image = [
    "https://i.pinimg.com/originals/ce/7f/35/ce7f35ec213d896247c7c2e8620d81f9.gif",
    "https://i.pinimg.com/originals/3a/a4/6f/3aa46f5701fc6ed92234ea0a9f86e2cd.gif",
    "https://i.pinimg.com/736x/64/20/b5/6420b5ba0dd45dc35aae9705c8e275dd.jpg",
    "https://i.pinimg.com/originals/f8/ba/9b/f8ba9b7f92fa91361e251c72e213c11a.gif",
    "https://i.pinimg.com/originals/3a/a4/6f/3aa46f5701fc6ed92234ea0a9f86e2cd.gif",
    "https://i.pinimg.com/736x/64/20/b5/6420b5ba0dd45dc35aae9705c8e275dd.jpg",
    "https://i.pinimg.com/originals/f8/ba/9b/f8ba9b7f92fa91361e251c72e213c11a.gif",
  ];
  const [active, setActive] = useState(5);
  const [containerHover, setContainerHover] = useState(false);

  return (
    <div className="flex justify-center h-screen items-center">
      <motion.div
        animate={{ x: [0, 200, 200, 0, 0], y: [0, 0, 200, 200, 0] }}
        transition={{
          duration: 4,
          times: [0, 0.33, 0.66, 1],
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="h-10 w-10 border"
      ></motion.div>
      <div>
        {/* <div
          onMouseLeave={() => {
            setActive(5);
            setContainerHover(false);
          }}
          onMouseEnter={() => {
            setContainerHover(true);
          }}
          className="flex items-end gap-3"
        >
          {image.map((item, i) => (
            <motion.img
              layout
              transition={{
                type: "tween",
                duration: 0.2,
                ease: "easeOut",
              }}
              style={{
                opacity: containerHover ? (active === i ? 1 : 0.5) : 1,
                width: active === i ? "350px" : "320px ",
                height: active === i ? "350px" : "320px ",
              }}
              onMouseEnter={() => {
                setActive(i);
              }}
              src={item}
              className="w-80 h-40 object-cover  origin-bottom"
            />
          ))}
        </div> */}
        {/* 
        <div
          style={{
            background: "rgba(0, 0, 0, 0.08)",
            boxShadow:
              "0px 1px 0px rgba(255, 255, 255, 0.25), inset 0px 1px 2px rgba(0, 0, 0, 0.15)",
          }}
          className="flex gap-8 bg-neutral-800 p-2 rounded-full"
        >
          {arr.map((item, i) => (
            <button
              key={i}
              onMouseEnter={() => setActive(i)}
              className=" relative px-4 py-1 text-white cursor-pointer"
            >
              {active === i && (
                <motion.div
                  style={{
                    background: "#F4F4F4",
                    boxShadow:
                      "0.222px 0.222px 0.314px -0.5px rgba(0, 0, 0, 0.2), 0.605px 0.605px 0.856px -1px rgba(0, 0, 0, 0.18), 1.329px 1.329px 1.88px -1.5px rgba(0, 0, 0, 0.25), 2.95px 2.95px 4.172px -2px rgba(0, 0, 0, 0.1), 2.5px 2.5px 3px -2.5px rgba(0, 0, 0, 0.15), -0.5px -0.5px 0px rgba(0, 0, 0, 0.1), inset 0.5px 0.5px 1px #FFFFFF, inset -0.5px -0.5px 1px rgba(0, 0, 0, 0.15)",
                  }}
                  layoutId="highlight"
                  className="absolute inset-0 bg-white rounded-full"
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 40,
                  }}
                />
              )}

              <span className="relative z-10 font-extralight mix-blend-difference">
                {item}
              </span>
            </button>
          ))}
        </div> */}
      </div>
    </div>
  );
}
