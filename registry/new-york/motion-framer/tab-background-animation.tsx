"use client";
import { motion } from "framer-motion";
import { useState } from "react";

const TabBackgroundAnimation = () => {
  const arr = ["Cool", "Warm", "Hot", "Bloom", "Mild"];
  const [active, setActive] = useState(0);

  return (
    <div
      style={{
        background: "var(--tab-track)",
        boxShadow:
          "0px 1px 0px var(--tab-track-hl), inset 0px 1px 2px var(--tab-track-shade)",
      }}
      className="flex rounded-full [--tab-fg-active:#171717] [--tab-fg:rgba(0,0,0,0.45)] [--tab-thumb-hl:#FFFFFF] [--tab-thumb-shade:rgba(0,0,0,0.15)] [--tab-thumb:#F4F4F4] [--tab-track-hl:rgba(255,255,255,0.9)] [--tab-track-shade:rgba(0,0,0,0.15)] [--tab-track:rgba(0,0,0,0.06)] dark:[--tab-fg-active:#FAFAFA] dark:[--tab-fg:rgba(255,255,255,0.5)] dark:[--tab-thumb-hl:rgba(255,255,255,0.14)] dark:[--tab-thumb-shade:rgba(0,0,0,0.5)] dark:[--tab-thumb:#3A3A3F] dark:[--tab-track-hl:rgba(255,255,255,0.06)] dark:[--tab-track-shade:rgba(0,0,0,0.45)] dark:[--tab-track:rgba(255,255,255,0.07)]"
    >
      {arr.map((item, i) => (
        <button
          key={i}
          onMouseEnter={() => setActive(i)}
          className="relative cursor-pointer px-8 py-3"
        >
          {active === i && (
            <motion.div
              style={{
                background: "var(--tab-thumb)",
                boxShadow:
                  "0.222px 0.222px 0.314px -0.5px rgba(0, 0, 0, 0.2), 0.605px 0.605px 0.856px -1px rgba(0, 0, 0, 0.18), 1.329px 1.329px 1.88px -1.5px rgba(0, 0, 0, 0.25), 2.95px 2.95px 4.172px -2px rgba(0, 0, 0, 0.1), 2.5px 2.5px 3px -2.5px rgba(0, 0, 0, 0.15), -0.5px -0.5px 0px rgba(0, 0, 0, 0.1), inset 0.5px 0.5px 1px var(--tab-thumb-hl), inset -0.5px -0.5px 1px var(--tab-thumb-shade)",
              }}
              layoutId="highlight"
              className="absolute inset-0 rounded-full"
              initial={{ scale: 1 }}
              animate={{ scale: 1.3 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 40,
              }}
            />
          )}

          <span
            className={`relative z-10 font-extralight transition-colors duration-200 ${
              active === i ? "text-[var(--tab-fg-active)]" : "text-[var(--tab-fg)]"
            }`}
          >
            {item}
          </span>
        </button>
      ))}
    </div>
  );
};

export default TabBackgroundAnimation;
