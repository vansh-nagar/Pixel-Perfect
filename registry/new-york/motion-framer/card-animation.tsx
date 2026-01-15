import React from "react";
import TextMatrixRain from "../text/text-matrix-rain";
import { Card } from "@/components/ui/card";
import {
  BookAIcon,
  Bookmark,
  CalendarRange,
  Copy,
  Fingerprint,
  MousePointer2,
  Sparkle,
  Sparkles,
  UserRound,
  Variable,
} from "lucide-react";
import { easeIn, easeOut, hover, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import TextBurnNeon from "../text/text-burn-neon";

const container = {
  rest: {
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1,
    },
  },
  hover: {
    transition: {
      staggerChildren: 0.1,
      staggerDirection: 1,
    },
  },
};
const card = {
  rest: {
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [1, 0.18, 0.6, 0.8] as [number, number, number, number],
    },
  },
  hover: {
    scale: 1.05,
    y: -10,
    transition: {
      duration: 0.4,
      ease: [1, 0.18, 0.6, 0.8] as [number, number, number, number],
    },
  },
};

const pointer2 = {
  rest: {
    x: 0,
    rotate: 0,
    rotation: 0,
    transition: {
      duration: 0.4,
      ease: [1, 0.18, 0.6, 0.8] as [number, number, number, number],
    },
  },
  hover: {
    x: -100,
    rotate: 20,
    transition: {
      duration: 0.6,
      ease: [1, 0.18, 0.6, 0.8] as [number, number, number, number],
    },
  },
};

const CardAnimation = () => {
  const [isHover, setIsHover] = useState(false);

  return (
    <motion.div
      variants={container}
      animate={isHover ? "hover" : "rest"}
      onHoverStart={() => setIsHover(true)}
      onHoverEnd={() => setIsHover(false)}
      className=" max-w-md w-full border rounded-3xl p-7"
    >
      <TextMatrixRain repeat={false} className="text-xs">
        AI POWERED
      </TextMatrixRain>

      <h1 className="mt-2 text-xl  font-light">
        Built for Professional AI Workflows
      </h1>
      <h2 className="mt-3 text-sm">
        Streamline your AI operations with powerful orchestration tools.
        Automate complex workflows, manage multiple models, and scale
        effortlessly with our intuitive interface.
      </h2>

      <section className="mt-20 relative h-60 flex justify-center items-start">
        <motion.div
          variants={pointer2}
          className="flex justify-center items-center h-8 aspect-square z-50 bottom-11 right-12 absolute  rounded-full "
        >
          <MousePointer2 size={24} className="" />
        </motion.div>
        <motion.div
          variants={card}
          className={`h-36 w-[70%] border rounded-2xl absolute right-1/2 translate-x-1/2 p-4 bg-background`}
        >
          <div className="w-full flex justify-between items-center">
            <div className="flex gap-2 flex-1">
              <div className="w-[50%] bg-accent h-5 rounded-md"></div>
              <div className="w-[10%] bg-accent h-5 rounded-md"></div>
            </div>
            <CalendarRange size={16} />
          </div>
        </motion.div>
        <motion.div
          variants={card}
          className={`h-36 w-[80%] border rounded-2xl absolute right-1/2 translate-x-1/2 translate-y-8 bg-[#1346E7] p-4 `}
        >
          <div className="w-full flex justify-between items-center ">
            <div className="flex gap-2 flex-1">
              <div className="w-[50%] bg-accent-foreground/20 h-5 rounded-md"></div>
              <div className="w-[10%] bg-accent-foreground/20 h-5 rounded-md"></div>
            </div>
            <Fingerprint size={16} className="text-white" />
          </div>
        </motion.div>
        <motion.div
          variants={card}
          className={`h-36 w-[90%] border rounded-2xl absolute  translate-y-16  bg-background  p-4`}
        >
          <div className="w-full flex flex-col gap-3 justify-between items-center">
            <div className="w-full flex justify-between items-center">
              <div className="flex gap-2 flex-1">
                <div className="w-[50%] bg-accent h-5 rounded-md"></div>
                <div className="w-[10%] bg-accent h-5 rounded-md"></div>
              </div>
              <Bookmark size={16} />
            </div>
            <div className="bg-accent w-full h-20 rounded-md flex justify-center items-end p-2">
              <Button variant={"outline"} size={"sm"} className="text-xs">
                {isHover ? (
                  <TextBurnNeon repeat={false}>Copy Page</TextBurnNeon>
                ) : (
                  "Copy Page"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default CardAnimation;
