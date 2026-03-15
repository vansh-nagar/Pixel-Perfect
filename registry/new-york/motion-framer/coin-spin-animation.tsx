"use client";

import { motion } from "framer-motion";

const CoinSpinAnimation = () => {
  return (
    <div
      className="relative h-[74px] w-[74px]"
      style={{ perspective: "900px" }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2 h-14 w-14"
        style={{
          transform: "translate(-50%, -50%)",
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 2, ease: "linear", repeat: Infinity }}
      >
        <div
          className="absolute h-14 w-[5.5px] bg-[#A9EFC3]"
          style={{
            transform: "translateX(25px) rotateY(90deg)",
            transformOrigin: "center",
          }}
        />

        <div
          className="absolute inset-0 rounded-full bg-[#A9EFC3]"
          style={{
            transform: "translateZ(3px)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <CoinIcon />
        </div>

        <div
          className="absolute inset-0 rounded-full bg-[#A9EFC3]"
          style={{
            transform: "rotateY(180deg) translateZ(-2px)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        />

        <div
          className="absolute inset-0 rounded-full bg-[#A9EFC3]"
          style={{
            transform: "rotateY(180deg) translateZ(3px)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <CoinIcon />
        </div>

        <div
          className="absolute inset-0 rounded-full bg-[#A9EFC3]"
          style={{
            transform: "translateZ(-2px)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        />
      </motion.div>
    </div>
  );
};

function CoinIcon() {
  return (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="43.75" cy="43.75" r="43.75" fill="#A9EFC3" />
      <path
        d="M43.7501 78.3334C62.8499 78.3334 78.3334 62.8499 78.3334 43.7501C78.3334 24.6502 62.8499 9.16675 43.7501 9.16675C24.6502 9.16675 9.16675 24.6502 9.16675 43.7501C9.16675 62.8499 24.6502 78.3334 43.7501 78.3334Z"
        stroke="#0048FF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M64.5 47.2083C63.6748 52.0929 61.1294 56.5212 57.3237 59.6925C53.5181 62.8639 48.7034 64.5691 43.75 64.4999C38.7966 64.5691 33.9819 62.8639 30.1763 59.6925C26.3706 56.5212 23.8252 52.0929 23 47.2083"
        stroke="#0048FF"
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M33.375 33.375H33.4096"
        stroke="#0048FF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54.125 33.375H54.1596"
        stroke="#0048FF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CoinSpinAnimation;
