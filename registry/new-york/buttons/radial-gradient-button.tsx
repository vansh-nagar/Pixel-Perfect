"use client";
import React from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export type RadialGradientVariant =
  | "blue"
  | "purple"
  | "emerald"
  | "crimson"
  | "amber"
  | "cyan"
  | "violet"
  | "rose";

const radialGradientStyles: Record<RadialGradientVariant, string> = {
  blue: "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #1700E3 100%)",
  purple:
    "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #8B00E3 100%)",
  emerald:
    "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #00C97A 100%)",
  crimson:
    "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #E30000 100%)",
  amber:
    "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #E37C00 100%)",
  cyan: "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #00C9E3 100%)",
  violet:
    "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #5500E3 100%)",
  rose: "radial-gradient(74.77% 41.6% at 83.56% 45.09%, #000000 44.14%, #E30055 100%)",
};

interface RadialGradientButtonProps extends HTMLMotionProps<"button"> {
  loading?: boolean;
  variant?: RadialGradientVariant;
}

const buttonVar = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const RadialGradientButton = React.forwardRef<
  HTMLButtonElement,
  RadialGradientButtonProps
>(({ className, children, loading, variant = "blue", ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.95 }}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative min-w-28 rounded-xl h-10 px-6 py-2 text-white border-none shadow-lg overflow-hidden transition-all duration-300 active:scale-95",
        className,
      )}
      style={{
        background: radialGradientStyles[variant],
        boxShadow: "inset 0px 3px 12px -2px #FFFFFF",
      }}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="spinner"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={buttonVar}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="flex items-center justify-center h-full"
          >
            <Spinner className="size-4" />
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={buttonVar}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="flex items-center justify-center h-full"
          >
            {children || "Login"}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

RadialGradientButton.displayName = "RadialGradientButton";

export default RadialGradientButton;
