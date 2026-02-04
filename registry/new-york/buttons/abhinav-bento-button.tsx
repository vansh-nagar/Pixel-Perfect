"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BentoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function AbhinavBentoButton({
  className,
  children,
  ...props
}: BentoButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-full aspect-square",
        className
      )}
      {...props}
       style={{
          background: "linear-gradient(180deg, #FF5700 0%, #EF5200 100%)",
          backgroundBlendMode: "plus-lighter, normal",
          boxShadow:
            "0px 42px 107px rgba(255, 88, 0, 0.34), 0px 24.7206px 32.2574px rgba(255, 88, 0, 0.1867), 0px 10.2677px 13.3981px rgba(255, 88, 0, 0.22), 0px 3.71362px 4.84582px rgba(255, 88, 0, 0.153301), inset 0px 1px 18px 2px #FFEDDB, inset 0px 1px 4px 2px #FFEDDB",
        }}
    >
    
        {children || "Bento"}
    </button>
  );
}
