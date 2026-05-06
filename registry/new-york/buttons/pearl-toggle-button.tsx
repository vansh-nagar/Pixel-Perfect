"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

const PearlToggleButton = () => {
  const [on, setOn] = useState(true);

  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      className="relative h-11 w-[88px] cursor-pointer overflow-hidden rounded-full"
      style={{
        background:
          "linear-gradient(180deg, #E6E0D6 0%, #EFEAE1 35%, #F4EFE6 70%, #F6F2EA 100%)",
        boxShadow: [
          "inset 0 0 0 1px rgba(150,140,125,0.35)",
          "inset 0 5px 6px -2px rgba(0,0,0,0.28)",
          "inset 4px 0 6px -3px rgba(0,0,0,0.22)",
          "inset 0 -2px 2px -1px rgba(255,255,255,0.7)",
          "0 1px 0 rgba(255,255,255,0.6)",
          "0 2px 4px rgba(0,0,0,0.06)",
        ].join(", "),
      }}
    >
      <motion.span
        animate={{ x: on ? 44 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className="absolute left-1 top-1 block h-9 w-9 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F7F3EC 45%, #E6DFD2 100%)",
          boxShadow: [
            "inset 0 0 0 0.5px rgba(120,110,95,0.45)",
            "inset 0 1px 0 rgba(255,255,255,0.95)",
            "inset 0 -1px 1px rgba(0,0,0,0.06)",
            "0 1px 1px rgba(0,0,0,0.08)",
            "0 3px 6px -1px rgba(0,0,0,0.18)",
            "0 6px 12px -4px rgba(0,0,0,0.15)",
          ].join(", "),
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(60% 80% at 80% 50%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
      </motion.span>
    </button>
  );
};

export default PearlToggleButton;
