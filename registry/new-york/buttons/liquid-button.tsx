"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  textColor?: string;
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    {
      className,
      children = "Hover Me",
      textColor = "rgb(61, 61, 61)",
      ...props
    },
    ref,
  ) => {
    const textStyle: React.CSSProperties = {
      color: textColor,
      letterSpacing: "-0.05em",
      lineHeight: 1.2,
      textShadow: "0px 1px 0px rgba(255, 255, 255, 0.46)",
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "group/lb relative inline-flex items-center justify-center rounded-full p-[2px] text-sm",
          className,
        )}
        style={{
          background:
            "linear-gradient(180deg, rgb(245, 245, 245) 0%, rgba(101, 104, 111, 0.39) 24%, rgba(255, 255, 255, 0.75) 100%)",
          boxShadow:
            "inset 0px 4px 6.1px 0px rgba(255, 255, 255, 0.23), 2px 23px 14px 0px rgba(0, 0, 0, 0.02), 1px 10px 10px 0px rgba(0, 0, 0, 0.03), 0px 3px 6px 0px rgba(0, 0, 0, 0.03)",
        }}
        {...props}
      >
        <span
          className="flex items-center justify-center rounded-full px-5 py-2"
          style={{ background: "rgba(255, 255, 255, 0.6)" }}
        >
          <span className="whitespace-nowrap font-bold" style={textStyle}>
            {children}
          </span>
        </span>
      </button>
    );
  },
);

LiquidButton.displayName = "LiquidButton";

export default LiquidButton;
