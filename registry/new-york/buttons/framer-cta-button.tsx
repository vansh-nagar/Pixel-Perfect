"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type FramerCtaVariant = "dark" | "light";

interface FramerCtaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: FramerCtaVariant;
}

const FramerCtaButton = React.forwardRef<
  HTMLButtonElement,
  FramerCtaButtonProps
>(({ className, children, variant = "dark", ...props }, ref) => {
  const isDark = variant === "dark";
  return (
    <button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center gap-2.5 h-11 px-5 rounded-2xl transition-transform duration-200 active:scale-[0.98]",
        className,
      )}
      style={{
        background: isDark
          ? "linear-gradient(rgb(27, 27, 27) 0%, rgb(0, 0, 0) 100%)"
          : "linear-gradient(rgb(233, 233, 233) 0%, rgb(255, 255, 255) 100%)",
        boxShadow: isDark
          ? "rgba(255, 255, 255, 0.3) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.32) 0px 0px 28px 0px inset, rgba(0, 0, 0, 0.03) 0px 8px 16px 0px, rgb(0, 0, 0) 0px 0px 0px 1px"
          : "rgba(0, 0, 0, 0.03) 0px 8px 8px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(255, 255, 255, 0.95) 0px 0px 34px 0px inset",
      }}
      {...props}
    >
      <span
        className="font-medium text-[15px] leading-7 tracking-[-0.02em]"
        style={{
          color: isDark ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
          fontFamily:
            '"Geist", "Geist Placeholder", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {children || (isDark ? "Book a meeting" : "Send a message")}
      </span>
    </button>
  );
});

FramerCtaButton.displayName = "FramerCtaButton";

export default FramerCtaButton;
