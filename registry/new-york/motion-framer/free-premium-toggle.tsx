"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

const FreePremiumToggle = () => {
  const [selected, setSelected] = useState<"free" | "premium">("free");

  return (
    <div
      className="relative flex w-[300px] items-center rounded-full p-1.5"
      style={{
        background: "#F2EFEA",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.04) inset, 0 18px 30px -12px rgba(0,0,0,0.18), 0 4px 10px -2px rgba(0,0,0,0.08)",
      }}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="absolute inset-y-1.5 w-[calc(50%-6px)] rounded-full"
        style={{
          left: selected === "free" ? 6 : "calc(50% + 0px)",
          background:
            "linear-gradient(180deg, #1a1a1a 0%, #050505 100%)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.6) inset, 0 8px 16px -4px rgba(0,0,0,0.45), 0 2px 6px -1px rgba(0,0,0,0.35)",
        }}
      />

      <button
        type="button"
        onClick={() => setSelected("free")}
        className="relative z-10 flex h-12 flex-1 items-center justify-center rounded-full transition-colors"
      >
        <span
          className={`text-sm font-semibold tracking-tight transition-colors ${
            selected === "free" ? "text-white" : "text-neutral-400"
          }`}
        >
          Free
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSelected("premium")}
        className="relative z-10 flex h-12 flex-1 flex-col items-center justify-center rounded-full leading-tight transition-colors"
      >
        <span
          className={`text-sm font-semibold tracking-tight transition-colors ${
            selected === "premium" ? "text-white" : "text-neutral-400"
          }`}
        >
          Premium
        </span>
        <span
          className={`text-[10px] transition-colors ${
            selected === "premium" ? "text-neutral-300" : "text-neutral-400/80"
          }`}
        >
          Monthly · Annual
        </span>
      </button>
    </div>
  );
};

export default FreePremiumToggle;
