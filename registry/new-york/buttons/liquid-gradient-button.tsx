"use client";
import React from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface LiquidGradientButtonProps extends HTMLMotionProps<"button"> {
  loading?: boolean;
}

const buttonVar = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const LiquidGradientButton = React.forwardRef<
  HTMLButtonElement,
  LiquidGradientButtonProps
>(({ className, children, loading, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative min-w-28 h-10 px-6 py-2 text-white font-medium rounded-md overflow-hidden transition-all duration-300 active:scale-95",
        className,
      )}
      style={{
        background:
          "linear-gradient(225deg, #FD97FF 0%, #FC36FF 42.86%, #FD82FF 49.48%, #830086 56.42%, #000000 100%)",
      }}
      {...props}
    >
      <img
        src="/bg-png/master.png"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-overlay"
        draggable="false"
        alt=""
      />
      <span className="relative z-10 w-full flex items-center justify-center">
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
            >
              {children || "Login"}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
});

LiquidGradientButton.displayName = "LiquidGradientButton";

export default LiquidGradientButton;
