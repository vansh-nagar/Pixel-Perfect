import React from "react";
import { cn } from "@/lib/utils";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "bg-muted px-4 py-3 rounded-md cursor-pointer font-medium transition-all active:scale-95",
          className
        )}
        style={{
          boxShadow:
            "0.444584px 0.444584px 0.628737px -1px rgba(0, 0, 0, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(0, 0, 0, 0.247), 2.6583px 2.6583px 3.75941px -2.25px rgba(0, 0, 0, 0.23), 5.90083px 5.90083px 8.34503px -3px rgba(0, 0, 0, 0.192), 10px 10px 21.2132px -3.75px rgba(0, 0, 0, 0.055), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(0, 0, 0, 0.15)",
        }}
        {...props}
      >
        {children || "Premium Button"}
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export default PremiumButton;
