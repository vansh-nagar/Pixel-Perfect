import React, { useState } from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitButtonProps extends HTMLMotionProps<"button"> {
  label?: string;
  hoverLabel?: string;
}

const VisitButton = React.forwardRef<HTMLButtonElement, VisitButtonProps>(
  (
    {
      className,
      label = "Visit",
      hoverLabel = "Add :)",
      style,
      onHoverStart,
      onHoverEnd,
      type,
      ...props
    },
    ref,
  ) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
      <motion.button
        ref={ref}
        type={type ?? "button"}
        onHoverStart={(event, info) => {
          setIsHovering(true);
          onHoverStart?.(event, info);
        }}
        onHoverEnd={(event, info) => {
          setIsHovering(false);
          onHoverEnd?.(event, info);
        }}
        className={cn(
          "flex justify-between w-32 gap-2 px-4 py-2.5 rounded-md cursor-pointer font-medium",
          className,
        )}
        style={{
          background: "#F4F4F4",
          boxShadow:
            "0.444584px 0.444584px 0.628737px -1px rgba(0, 0, 0, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(0, 0, 0, 0.247), 2.6583px 2.6583px 3.75941px -2.25px rgba(0, 0, 0, 0.23), 5.90083px 5.90083px 8.34503px -3px rgba(0, 0, 0, 0.192), 10px 10px 21.2132px -3.75px rgba(0, 0, 0, 0.055), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(0, 0, 0, 0.15)",
          ...style,
        }}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isHovering ? (
            <motion.span
              key="add"
              initial={{ y: 10, filter: "blur(1px)", opacity: 0 }}
              animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
              exit={{ y: -10, filter: "blur(1px)", opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {hoverLabel}
            </motion.span>
          ) : (
            <motion.span
              key="visit"
              initial={{ y: 10, filter: "blur(1px)", opacity: 0 }}
              animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
              exit={{ y: -10, filter: "blur(1px)", opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {isHovering ? (
            <motion.div
              key="plus"
              initial={{ filter: "blur(1px)", opacity: 0, rotate: -45 }}
              animate={{ filter: "blur(0px)", opacity: 1, rotate: 0 }}
              exit={{ filter: "blur(1px)", opacity: 0, rotate: 45 }}
              transition={{ duration: 0.1 }}
            >
              <Plus />
            </motion.div>
          ) : (
            <motion.div
              key="arrow"
              initial={{ filter: "blur(1px)", opacity: 0, rotate: -45 }}
              animate={{ filter: "blur(0px)", opacity: 1, rotate: 0 }}
              exit={{ filter: "blur(1px)", opacity: 0, rotate: 45 }}
              transition={{ duration: 0.1 }}
            >
              <ArrowUpRight />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  },
);

VisitButton.displayName = "VisitButton";

export default VisitButton;
