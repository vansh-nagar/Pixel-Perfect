"use client";
import React from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export type LiquidGradientVariant =
  | "pink"
  | "cyan"
  | "emerald"
  | "amber"
  | "crimson"
  | "violet"
  | "ocean"
  | "sunset";

const liquidGradientStyles: Record<LiquidGradientVariant, string> = {
  pink: "linear-gradient(225deg, #FD97FF 0%, #FC36FF 42.86%, #FD82FF 49.48%, #830086 56.42%, #000000 100%)",
  cyan: "linear-gradient(225deg, #97F0FF 0%, #36E0FF 42.86%, #82EBFF 49.48%, #006B86 56.42%, #000000 100%)",
  emerald:
    "linear-gradient(225deg, #97FFB8 0%, #36FF74 42.86%, #82FF9E 49.48%, #008632 56.42%, #000000 100%)",
  amber:
    "linear-gradient(225deg, #FFE597 0%, #FFB736 42.86%, #FFD082 49.48%, #864F00 56.42%, #000000 100%)",
  crimson:
    "linear-gradient(225deg, #FF9797 0%, #FF3636 42.86%, #FF8282 49.48%, #860000 56.42%, #000000 100%)",
  violet:
    "linear-gradient(225deg, #C397FF 0%, #8836FF 42.86%, #B082FF 49.48%, #2D0086 56.42%, #000000 100%)",
  ocean:
    "linear-gradient(225deg, #97C5FF 0%, #3680FF 42.86%, #82A8FF 49.48%, #001E86 56.42%, #000000 100%)",
  sunset:
    "linear-gradient(225deg, #FFB597 0%, #FF6536 42.86%, #FF9882 49.48%, #861500 56.42%, #000000 100%)",
};

interface LiquidGradientButtonProps extends HTMLMotionProps<"button"> {
  loading?: boolean;
  variant?: LiquidGradientVariant;
}

const buttonVar = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const LiquidGradientButton = React.forwardRef<
  HTMLButtonElement,
  LiquidGradientButtonProps
>(({ className, children, loading, variant = "violet", ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative min-w-28 h-10 px-6 py-2 text-white font-medium rounded-md overflow-hidden transition-all duration-300 active:scale-95",
        className,
      )}
      style={{
        background: liquidGradientStyles[variant],
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
