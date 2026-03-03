"use client";
import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlueChromeButtonProps extends HTMLMotionProps<"button"> {}

const BlueChromeButton = React.forwardRef<
  HTMLButtonElement,
  BlueChromeButtonProps
>(({ className, children, style, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ y: 0, scale: 0.985 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "box-border h-[35.46px] w-[100.25px] rounded-[100px] border text-xs font-medium text-white/95",
        className,
      )}
      style={{
        background:
          "linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3)), conic-gradient(from 90deg at 50% 50%, #FDFDFD 0deg, #464646 44.35deg, #2C2C2C 56.43deg, #2C2C2C 63.53deg, #595959 77.78deg, #FDFDFD 101.95deg, #B5B5B5 130.71deg, #2C2C2C 158.9deg, #2F2F2F 170.95deg, #2C2C2C 179.09deg, #595959 197.78deg, #FDFDFD 227.8deg, #CDCDCD 240.9deg, #595959 273.03deg, #696969 300.73deg, #8C8C8C 313.13deg, #FDFDFD 360deg)",
        border: "1px solid #DCEFFF",
        boxShadow:
          "0px 0px 2px 2px rgba(46, 164, 255, 0.25), 0px 0px 1px rgba(0, 0, 0, 0.25), 0px 0px 0px 1px rgba(0, 23, 73, 0.65), inset 0px 0px 4px 2px rgba(46, 164, 255, 0.25)",
        ...style,
      }}
      {...props}
    >
      {children || "Blue Chrome"}
    </motion.button>
  );
});

BlueChromeButton.displayName = "BlueChromeButton";

export default BlueChromeButton;
