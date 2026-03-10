"use client";
import { motion } from "framer-motion";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FrostedMetalButtonProps = React.ComponentProps<typeof Button>;

export function FrostedMetalButton({
  className,
  children,
  ...props
}: FrostedMetalButtonProps) {
  return (
    <motion.div drag className="cursor-pointer p-10">
      <button
        className="flex items-center justify-center"
        style={{
          position: "relative",
          width: "82px",
          height: "31px",
          background:
            "linear-gradient(0deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3))",
          backgroundBlendMode: "plus-lighter, darken",
          boxShadow:
            "inset 1px 1px 0px -0.5px #FFFFFF, inset -1px -1px 0px -0.5px #F2F2F2, inset 1px 1px 0.5px -1px #FFFFFF, inset -1px -1px 0.5px -1px #FAFAFA, inset 0px 0px 3px rgba(255, 255, 255, 0.65), inset 0px 0px 11px #F8F8F8",
          borderRadius: "24px",
        }}
      >
        {children || " Metal"}
      </button>
    </motion.div>
  );
}
