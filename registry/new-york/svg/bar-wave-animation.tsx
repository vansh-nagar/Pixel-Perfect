"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const TOTAL = 15;

const BarWaveAnimation = () => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg
      className=" invert dark:invert-0 cursor-pointer w-full h-full m-10"
      viewBox="0 0 350 130"
      overflow={"visible"}
    >
      <g transform="rotate(180, 175, 65)">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const baseHeight = 41.5199;
          const distance = hovered === null ? Infinity : Math.abs(hovered - i);
          const influence = Math.max(0, 1 - distance * 0.25);
          const height = baseHeight + influence * 150;
          const opacity = hovered === null ? 1 : 0.2 + influence * 0.8;

          return (
            <motion.rect
              key={i}
              animate={{ height, filter: `brightness(${opacity})` }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              x={0.4 + i * 15}
              y={0.75 + i * -15}
              width="183.071"
              height={baseHeight}
              rx="6.5"
              transform="matrix(0.866025 0.5 0 1 0.0580127 -2.88838)"
              fill="#171717"
              stroke="#626262"
            />
          );
        })}
      </g>
    </svg>
  );
};

export default BarWaveAnimation;
