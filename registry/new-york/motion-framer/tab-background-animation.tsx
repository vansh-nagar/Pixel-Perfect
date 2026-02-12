"use client";
import { motion } from "framer-motion";
import { useState } from "react";

const TabBackgroundAnimation = () => {
  const arr = ["Cool", "Warm", "Hot", "Bloom", "Mild"];
  const [active, setActive] = useState(0);

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.08)",
        boxShadow:
          "0px 1px 0px rgba(255, 255, 255, 0.25), inset 0px 1px 2px rgba(0, 0, 0, 0.15)",
      }}
      className="flex gap-8 p-2 rounded-full"
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
    </div>
  );
};

export default TabBackgroundAnimation;
