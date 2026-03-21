import React from "react";
import { cn } from "@/lib/utils";

type PixelCreditsButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const PixelCreditsButton = React.forwardRef<
  HTMLButtonElement,
  PixelCreditsButtonProps
>(({ className, children, style, type, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn("px-4 py-3 text-black", className)}
      style={{
        background: "#FAFAFA",
        boxShadow:
          "0px 2px 3px rgba(0, 0, 0, 0.3), 0px 3px 4px rgba(0, 0, 0, 0.15), inset 0px 2px 2px rgba(255, 255, 255, 0.8), inset 0px -3px 0px rgba(0, 0, 0, 0.16)",
        borderRadius: "10px",
        ...style,
      }}
      {...props}
    >
      {children || "Pixel Credits"}
    </button>
  );
});

PixelCreditsButton.displayName = "PixelCreditsButton";

export default PixelCreditsButton;
