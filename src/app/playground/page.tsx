"use client";
import React, { useState } from "react";
import GooeyButton from "registry/new-york/buttons/goe-button";
import { AnimatePresence, motion, scale, useScroll } from "framer-motion";
import ToggleButton from "registry/new-york/buttons/toggle-buttion";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const page = () => {
  const [show, setShow] = useState(true);
  const [checked, setChecked] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-5 justify-center items-center h-screen">
        <motion.button
          whileTap={{
            scale: 0.95,
          }}
          className=" border p-3 rounded-md"
          onClick={() => {
            setChecked(!checked);
          }}
        >
          <AnimatePresence mode="wait">
            {checked ? <Copy /> : <Check />}
          </AnimatePresence>
        </motion.button>
        <motion.button
          whileTap={{
            scale: 0.95,
          }}
          className=" border p-4 rounded-md"
          onClick={() => {
            setChecked(!checked);
          }}
        >
          <AnimatePresence mode="wait">
            {checked ? (
              <motion.div
                key="copy"
                initial={{ filter: "blur(1px)", scale: 1 }}
                animate={{ filter: "blur(0px)", scale: 1.2 }}
                exit={{ filter: "blur(1px)", scale: 0.8 }}
                transition={{ duration: 0.05 }}
              >
                <Copy />
              </motion.div>
            ) : (
              <motion.div
                key="check"
                initial={{ filter: "blur(1px)", scale: 1 }}
                animate={{ filter: "blur(0px)", scale: 1.2 }}
                exit={{ filter: "blur(1px)", scale: 0.8 }}
                transition={{ duration: 0.05 }}
              >
                <Check />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Spring</span>
            <div className="h-10 w-10 rounded-full flex items-center justify-center">
              <AnimatePresence>
                {show && (
                  <motion.div
                    exit={{ scale: 0, opacity: 0 }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onHoverStart={() => {
                      console.log("hello");
                    }}
                    whileHover={{
                      scale: 1.1,
                      transition: {
                        type: "tween",
                        duration: 0.3,
                        ease: "easeInOut",
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 10,
                      mass: 1,
                    }}
                    className="h-10 w-10 bg-[#ff00ff] rounded-full relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 rounded-full cursor-pointer"
                      style={{
                        background:
                          "radial-gradient(45.33% 46.43% at 41.69% 50%, #FF4001 0%, rgba(255, 64, 1, 0) 100%), radial-gradient(28.41% 117.96% at 7.72% 28.75%, #FFFDA6 0%, rgba(255, 255, 255, 0) 100%), radial-gradient(37.39% 69.19% at 107.79% 0%, #FF7500 0%, rgba(255, 66, 0, 0) 100%), radial-gradient(54.38% 89.75% at 83.46% 89.75%, #FFF926 0%, rgba(255, 69, 0, 0.6) 100%), #FF4001",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Default</span>
            <div className="h-10 w-10 rounded-full flex items-center justify-center">
              <AnimatePresence>
                {show && (
                  <motion.div
                    drag="x"
                    dragDirectionLock
                    whileDrag={{
                      scale: 1.5,
                    }}
                    dragTransition={{
                      bounceStiffness: 1000,
                      bounceDamping: 10,
                    }}
                    dragConstraints={{
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-10 w-10 bg-[#ff00ff] rounded-full relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "radial-gradient(45.33% 46.43% at 41.69% 50%, #FF4001 0%, rgba(255, 64, 1, 0) 100%), radial-gradient(28.41% 117.96% at 7.72% 28.75%, #FFFDA6 0%, rgba(255, 255, 255, 0) 100%), radial-gradient(37.39% 69.19% at 107.79% 0%, #FF7500 0%, rgba(255, 66, 0, 0) 100%), radial-gradient(54.38% 89.75% at 83.46% 89.75%, #FFF926 0%, rgba(255, 69, 0, 0.6) 100%), #FF4001",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <ToggleButton toggle={show} setToggle={setShow} />
      </div>
      <div className="h-screen w-full flex  justify-center items-center">
        <motion.div
          className="h-10 w-10 bg-orange-500"
          initial={{ scale: 1 }}
          whileInView={{ scale: 6, rotate: 360 }}
          transition={{
            type: "spring",
          }}
        />
      </div>
    </>
  );
};

export default page;
