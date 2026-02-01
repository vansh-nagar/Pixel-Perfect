import React from "react";
import { cn } from "@/lib/utils";

interface StripeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const StripeButton = React.forwardRef<HTMLButtonElement, StripeButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex flex-row justify-center items-center px-4 py-2 gap-2 rounded-lg cursor-pointer font-medium transition-all active:scale-95 text-white text-sm",
          className
        )}
        style={{
          background: "#635CFF",
          boxShadow: "inset 0px 2px 0px #7A74FF",
        }}
        {...props}
      >
        {children || "Stripe Button"}
      </button>
    );
  }
);

StripeButton.displayName = "StripeButton";

export default StripeButton;
