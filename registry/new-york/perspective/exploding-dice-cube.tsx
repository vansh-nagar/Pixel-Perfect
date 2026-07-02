/**
 * A spinning 3D die whose six pip faces fly apart into an exploded view on hover and spring back together.
 */
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const SIZE = 88;
const HALF = SIZE / 2;
const EXPLODE = HALF + 36;

const FACES = [
  { pips: 1, rotate: "rotateY(0deg)" },
  { pips: 6, rotate: "rotateY(180deg)" },
  { pips: 3, rotate: "rotateY(90deg)" },
  { pips: 4, rotate: "rotateY(-90deg)" },
  { pips: 2, rotate: "rotateX(90deg)" },
  { pips: 5, rotate: "rotateX(-90deg)" },
];

// which cells of a 3x3 grid hold a pip for each face value
const PIP_CELLS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const ExplodingDiceCube = () => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: 900 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          transform: "rotateX(-24deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <motion.div
          className="relative"
          style={{
            width: SIZE,
            height: SIZE,
            transformStyle: "preserve-3d",
          }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity }}
        >
          {FACES.map((face) => (
            <div
              key={face.pips}
              className="absolute inset-0"
              style={{ transform: face.rotate, transformStyle: "preserve-3d" }}
            >
              <motion.div
                className="absolute inset-0 grid grid-cols-3 place-items-center rounded-lg border border-foreground/30 bg-background/80 p-3"
                animate={{ z: hovered ? EXPLODE : HALF }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
              >
                {Array.from({ length: 9 }, (_, cell) => (
                  <div
                    key={cell}
                    className={
                      PIP_CELLS[face.pips].includes(cell)
                        ? "size-2 rounded-full bg-foreground/70"
                        : undefined
                    }
                  />
                ))}
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ExplodingDiceCube;
