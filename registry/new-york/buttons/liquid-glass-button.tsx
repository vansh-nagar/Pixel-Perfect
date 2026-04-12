import React from "react";
import { motion } from "framer-motion";

const LiquidGlassButton = () => {
  return (
    <>
      <motion.button
        drag
        className="relative px-6 py-3 rounded-full overflow-visible bg-transparent border-none"
      >
        <span className="relative z-50 text-sm">Liquid Glass Button</span>
        {/* Border gradient mask */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-50 z-40"
          aria-hidden="true"
          style={{
            background:
              "conic-gradient(from 102.21deg at 52.75% 38.75%, rgba(249, 249, 249, 0.3) -32.95deg, rgba(120, 120, 120, 0.5) 10.52deg, rgba(120, 120, 120, 0.35) 32.12deg, rgba(255, 255, 255, 0.3) 60.28deg, rgba(255, 255, 255, 0.3) 107.79deg, rgba(120, 120, 120, 0.35) 187.59deg, rgba(249, 249, 249, 0.5) 207.58deg, rgba(255, 255, 255, 0.3) 287.31deg, rgba(249, 249, 249, 0.3) 327.05deg, rgba(120, 120, 120, 0.5) 370.52deg)",
            padding: "1.5px",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div
          className="absolute inset-[1px] rounded-full z-40"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(16.5px)",
          }}
        />
        {/* Shadow layer 1 */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: 0,
            transform: "translate(-1px, 4px)",
            background: "rgba(0, 0, 0, 0.08)",
            filter: "blur(8px)",
            zIndex: 0,
          }}
        />

        {/* Shadow layer 2 */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: 0,
            transform: "translate(-3px, 11px)",
            background: "rgba(0, 0, 0, 0.07)",
            filter: "blur(11px)",
            zIndex: 0,
          }}
        />

        {/* Shadow layer 3 */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: 0,
            transform: "translate(-7px, 24px)",
            background: "rgba(0, 0, 0, 0.04)",
            filter: "blur(15px)",
            zIndex: 0,
          }}
        />

        {/* Shadow layer 4 */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: 0,
            transform: "translate(-13px, 43px)",
            background: "rgba(0, 0, 0, 0.01)",
            filter: "blur(18px)",
            zIndex: 0,
          }}
        />
      </motion.button>
    </>
  );
};

export default LiquidGlassButton;
