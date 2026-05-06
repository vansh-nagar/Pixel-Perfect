"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SquircleCounterButton = () => {
  const [count, setCount] = useState(26);

  return (
    <button
      type="button"
      onClick={() => setCount((c) => c + 1)}
      className="relative h-14 w-16 cursor-pointer select-none overflow-hidden active:scale-[0.97] transition-transform"
      style={{
        borderRadius: "55% / 60%",
        background:
          "linear-gradient(180deg, #FBFBFB 0%, #E8E8E8 55%, #D9D9D9 100%)",
        boxShadow: [
          "inset 0 1.5px 1px rgba(255,255,255,0.95)",
          "inset 0 -2px 2px rgba(0,0,0,0.06)",
          "inset 0 0 0 0.5px rgba(0,0,0,0.05)",
          "0 1px 1px rgba(255,255,255,0.6)",
          "0 6px 14px -4px rgba(0,0,0,0.18)",
          "0 14px 28px -8px rgba(0,0,0,0.18)",
        ].join(", "),
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1 h-3 rounded-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)",
          filter: "blur(1px)",
        }}
      />

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 14, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="text-lg font-medium tracking-tight text-neutral-700"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </div>
    </button>
  );
};

export default SquircleCounterButton;
