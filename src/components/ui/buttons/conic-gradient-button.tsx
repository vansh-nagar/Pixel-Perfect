"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const conicGradientBackground =
  "conic-gradient(from 102.21deg at 52.75% 38.75%, rgba(249, 249, 249, 0.5) -32.95deg, rgba(64, 64, 64, 0.5) 10.52deg, rgba(64, 64, 64, 0.35) 32.12deg, rgba(255, 255, 255, 0.5) 60.28deg, rgba(255, 255, 255, 0.5) 107.79deg, rgba(64, 64, 64, 0.35) 187.59deg, #F9F9F9 207.58deg, rgba(255, 255, 255, 0.5) 287.31deg, rgba(249, 249, 249, 0.5) 327.05deg, rgba(64, 64, 64, 0.5) 370.52deg)";

type ConicGradientButtonProps = React.ComponentProps<typeof Button>;

export function ConicGradientButton({
  className,
  style,
  children,
  ...props
}: ConicGradientButtonProps) {
  return (
    <motion.div drag className="cursor-pointer p-10">
      <Button
        className={cn(
          "relative overflow-hidden rounded-xl text-accent-foreground border-0 bg-transparent px-4 py-2",
          className,
        )}
        style={{
          background: "rgba(240, 240, 240, 0.25)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          ...style,
        }}
        {...props}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            padding: "2px",
            background: conicGradientBackground,
            filter: "blur(0.3px)",
            opacity: 0.9,
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
          }}
        />

        <span className="relative z-10">{children || "Click me"}</span>
      </Button>
    </motion.div>
  );
}
