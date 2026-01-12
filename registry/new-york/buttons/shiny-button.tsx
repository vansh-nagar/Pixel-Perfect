"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

interface ShinyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
}

const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div>
        <style>{`
          .shiny-wrapper {
            position: relative;
            display: inline-block;
            overflow: hidden;
          }
          .shiny-wrapper .shiny-mask {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.6);
            transform: translateX(-100%) rotate(45deg);
            pointer-events: none;
            z-index: 10;
          }
          .shiny-wrapper:hover .shiny-mask {
            animation: shiny-mask 0.4s ease-out;
          }
          @keyframes shiny-mask {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
          }
        `}</style>
        <div className="shiny-wrapper border overflow-hidden rounded-md">
          <Button
            ref={ref}
            variant={variant}
            size={size}
            disabled={disabled}
            className={cn("relative z-0", className)}
            {...props}
          >
            {children ?? "Hover Me"}
          </Button>
          <span className="shiny-mask"></span>
        </div>
      </div>
    );
  }
);

ShinyButton.displayName = "ShinyButton";

export default ShinyButton;
