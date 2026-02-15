import React from "react";
import { cn } from "@/lib/utils";

interface OrangePremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const OrangePremiumButton = React.forwardRef<HTMLButtonElement, OrangePremiumButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "bg-muted px-4 py-3 rounded-3xl cursor-pointer font-medium text-white transition-all active:scale-95",
          className
        )}
        style={{
          background:
            "linear-gradient(0.1deg, rgba(255, 74, 74, 0) 0.09%, rgba(255, 36, 36, 0.2) 76.39%), linear-gradient(360deg, #FFF16E 2.67%, #FF8A33 30.48%, #FF4A4A 51.8%), #FF4A4A",
          backgroundBlendMode: "soft-light, normal, normal, normal",
          boxShadow:
            "0px 7.25px 7.5px rgba(255, 245, 153, 0.3), 0px 5px 7.5px rgba(255, 197, 128, 0.56), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
        }}
        {...props}
      >
        {children || "Cool Button"}
      </button>
    );
  }
);

OrangePremiumButton.displayName = "OrangePremiumButton";

export default OrangePremiumButton;
