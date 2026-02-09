"use client";
import { Plus } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

const GooeyButton = () => {
  return (
    <button className="relative h-12 px-6 rounded-full font-bold flex items-center">
      <GooeyFilter />
      <div
        className="absolute inset-0 bg-orange-500 rounded-full"
        style={{ filter: "url(#goo-effect)" }}
      />

      <span className="relative text-white">Hello</span>

      <motion.div
        className="relative ml-3 border bg-white text-black rounded-full p-2"
        animate={{ x: 100 }}
        transition={{ duration: 1 }}
      >
        <Plus />
      </motion.div>
    </button>
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
