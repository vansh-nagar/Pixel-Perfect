"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

const BlurToggleButton = () => {
  const [checked, setChecked] = useState(false);

  return (
    <motion.button
      whileTap={{
        scale: 0.95,
      }}
      className="border p-3 rounded-md bg-background cursor-pointer"
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
            <Copy size={16} />
          </motion.div>
        ) : (
          <motion.div
            key="check"
            initial={{ filter: "blur(1px)", scale: 1 }}
            animate={{ filter: "blur(0px)", scale: 1.2 }}
            exit={{ filter: "blur(1px)", scale: 0.8 }}
            transition={{ duration: 0.05 }}
          >
            <Check size={16} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default BlurToggleButton;
