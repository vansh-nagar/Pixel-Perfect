"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CyberButton = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={cn(
        "group relative px-6 py-2 font-mono text-sm font-bold uppercase tracking-wider text-cyan-400 transition-all duration-300",
        "hover:text-cyan-200 active:scale-95",
        className,
      )}
      {...props}
    >
      <span className="relative z-10">{children || "Initialize"}</span>

      {/* Main Border */}
      <div className="absolute inset-0 border border-cyan-500/50 transition-colors group-hover:border-cyan-400" />

      {/* Diagonal Corners */}
      <div className="absolute -left-1 -top-1 size-2 border-l-2 border-t-2 border-cyan-500 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
      <div className="absolute -right-1 -bottom-1 size-2 border-r-2 border-b-2 border-cyan-500 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />

      {/* Hover Background Glow */}
      <div className="absolute inset-0 bg-cyan-500/0 opacity-0 transition-all duration-300 group-hover:bg-cyan-500/10 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]" />

      {/* Decor Lines */}
      <div className="absolute left-2 top-0 h-px w-4 bg-cyan-500/50 group-hover:w-8 group-hover:bg-cyan-400 transition-all" />
      <div className="absolute right-2 bottom-0 h-px w-4 bg-cyan-500/50 group-hover:w-8 group-hover:bg-cyan-400 transition-all" />

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-x-0 h-[2px] bg-cyan-400/30 opacity-0 group-hover:opacity-100 blur-[1px] z-20 pointer-events-none"
        animate={{
          top: ["0%", "100%", "0%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </button>
  );
};

export default CyberButton;
