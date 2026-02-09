"use client";
import { Plus } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

import { useState } from "react";

const GooeyButton = () => {
  const [hovered, setHovered] = useState(false);
  return (
    <div>
      <GooeyFilter />
      <div
        className=" inset-0 flex items-center justify-center"
        style={{ filter: "url(#goo-effect)", zIndex: 1 }}
      >
        <motion.button
          className="h-15 px-20 bg-orange-500 rounded-full flex items-center justify-center text-white"
          initial={{ scale: 1 }}
          animate={hovered ? { scale: 1.08 } : { scale: 1 }}
          transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
        >
          Gooey
        </motion.button>
        <motion.div
          drag
          className=" border absolute  w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"
          initial={{ scale: 1 }}
          animate={{ scale: 1.4, x: 135 }}
          transition={{ type: "tween", ease: [0.5, 0, 0, 1], duration: 1 }}
        >
          <Plus color="#fff" size={24} />
        </motion.div>
      </div>
    </div>
  );
};

const GooeyFilter = () => (
  <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
    <defs>
      <filter id="goo-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
);

export default GooeyButton;
