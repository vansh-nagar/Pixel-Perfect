"use client";
import { ChevronRightIcon } from "lucide-react";
import React from "react";
import { hover, motion } from "framer-motion";

const LearnMoreButtion = () => {
  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      transition={{
        type: "spring",
        stiffness: 1000,
        damping: 20,
        mass: 10,
      }}
      className="flex items-center gap-2 relative cursor-pointer"
    >
      <motion.div
        variants={{
          rest: {
            width: 40,
          },
          hover: {
            width: 175,
          },
        }}
        className="h-10 rounded-full flex origin-left justify-start items-center absolute -left-12"
        style={{
          background: "linear-gradient(180deg, #0073FF 0%, #0DA2FF 100%)",
          boxShadow:
            "0px 42px 107px rgba(87, 177, 255, 0.34), 0px 24.7206px 32.2574px rgba(87, 177, 255, 0.1867), 0px 10.2677px 13.3981px rgba(87, 177, 255, 0.22), 0px 3.71362px 4.84582px rgba(87, 177, 255, 0.153301), inset 0px 1px 18px 2px #D2EAFF, inset 0px 1px 4px 2px #D2EAFF",
        }}
      >
        <motion.svg
          variants={{
            rest: {
              x: 0,
              scale: 1,
            },
            hover: {
              x: 10,
              scale: 1.05,
            },
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-arrow-right ml-1.5 text-white"
        >
          <motion.path
            transition={{ duration: 0.15, delay: 0.05 }}
            variants={{
              rest: {
                opacity: 0,
              },
              hover: {
                opacity: 1,
              },
            }}
            d="M5 12h14"
          ></motion.path>
          <path d="m12 5 7 7-7 7"></path>
        </motion.svg>
      </motion.div>
      <motion.span
        transition={{
          delay: 0.1,
          duration: 1,
        }}
        variants={{
          rest: {
            color: "black",
          },
          hover: {
            color: "white",
          },
        }}
        className=" font-medium z-20"
      >
        WATCH MORE
      </motion.span>
    </motion.div>
  );
};

export default LearnMoreButtion;
