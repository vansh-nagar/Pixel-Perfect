import React from "react";
import { cn } from "@/lib/utils";

export type PremiumVariant =
  | "neutral"
  | "dark"
  | "gold"
  | "mint"
  | "rose"
  | "sky"
  | "lavender"
  | "sand";

interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  premiumVariant?: PremiumVariant;
}

const premiumStyles: Record<
  PremiumVariant,
  { background: string; color: string; shadow: string }
> = {
  neutral: {
    background: "linear-gradient(145deg, #f1f1f1, #d8d8d8)",
    color: "#1a1a1a",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(0, 0, 0, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(0, 0, 0, 0.247), 2.6583px 2.6583px 3.75941px -2.25px rgba(0, 0, 0, 0.23), 5.90083px 5.90083px 8.34503px -3px rgba(0, 0, 0, 0.192), 10px 10px 21.2132px -3.75px rgba(0, 0, 0, 0.055), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(0, 0, 0, 0.15)",
  },
  dark: {
    background: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
    color: "#f5f5f5",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(0, 0, 0, 0.5), 1.21072px 1.21072px 1.71222px -1.5px rgba(0, 0, 0, 0.45), 2.6583px 2.6583px 3.75941px -2.25px rgba(0, 0, 0, 0.4), 5.90083px 5.90083px 8.34503px -3px rgba(0, 0, 0, 0.3), 10px 10px 21.2132px -3.75px rgba(0, 0, 0, 0.15), -0.5px -0.5px 0px rgba(255, 255, 255, 0.05), inset 1px 1px 1px rgba(255, 255, 255, 0.15), inset -1px -1px 1px rgba(0, 0, 0, 0.4)",
  },
  gold: {
    background: "linear-gradient(145deg, #fde9a8, #d9a441)",
    color: "#5a3a00",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(140, 95, 0, 0.3), 1.21072px 1.21072px 1.71222px -1.5px rgba(140, 95, 0, 0.28), 2.6583px 2.6583px 3.75941px -2.25px rgba(140, 95, 0, 0.25), 5.90083px 5.90083px 8.34503px -3px rgba(140, 95, 0, 0.2), 10px 10px 21.2132px -3.75px rgba(140, 95, 0, 0.08), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFBEA, inset -1px -1px 1px rgba(140, 95, 0, 0.2)",
  },
  mint: {
    background: "linear-gradient(145deg, #d6fbe9, #9ee2c1)",
    color: "#0e3d2a",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(0, 80, 50, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(0, 80, 50, 0.24), 2.6583px 2.6583px 3.75941px -2.25px rgba(0, 80, 50, 0.22), 5.90083px 5.90083px 8.34503px -3px rgba(0, 80, 50, 0.18), 10px 10px 21.2132px -3.75px rgba(0, 80, 50, 0.06), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(0, 80, 50, 0.18)",
  },
  rose: {
    background: "linear-gradient(145deg, #ffe1ea, #f4a8be)",
    color: "#5a0e29",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(140, 20, 60, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(140, 20, 60, 0.24), 2.6583px 2.6583px 3.75941px -2.25px rgba(140, 20, 60, 0.22), 5.90083px 5.90083px 8.34503px -3px rgba(140, 20, 60, 0.18), 10px 10px 21.2132px -3.75px rgba(140, 20, 60, 0.06), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(140, 20, 60, 0.18)",
  },
  sky: {
    background: "linear-gradient(145deg, #dff1ff, #a5d2f5)",
    color: "#0c2d4f",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(20, 60, 140, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(20, 60, 140, 0.24), 2.6583px 2.6583px 3.75941px -2.25px rgba(20, 60, 140, 0.22), 5.90083px 5.90083px 8.34503px -3px rgba(20, 60, 140, 0.18), 10px 10px 21.2132px -3.75px rgba(20, 60, 140, 0.06), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(20, 60, 140, 0.18)",
  },
  lavender: {
    background: "linear-gradient(145deg, #ece2ff, #c1aeec)",
    color: "#2e1065",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(60, 20, 140, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(60, 20, 140, 0.24), 2.6583px 2.6583px 3.75941px -2.25px rgba(60, 20, 140, 0.22), 5.90083px 5.90083px 8.34503px -3px rgba(60, 20, 140, 0.18), 10px 10px 21.2132px -3.75px rgba(60, 20, 140, 0.06), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(60, 20, 140, 0.18)",
  },
  sand: {
    background: "linear-gradient(145deg, #f5ecdc, #d8c4a3)",
    color: "#4a3414",
    shadow:
      "0.444584px 0.444584px 0.628737px -1px rgba(90, 60, 20, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(90, 60, 20, 0.24), 2.6583px 2.6583px 3.75941px -2.25px rgba(90, 60, 20, 0.22), 5.90083px 5.90083px 8.34503px -3px rgba(90, 60, 20, 0.18), 10px 10px 21.2132px -3.75px rgba(90, 60, 20, 0.06), -0.5px -0.5px 0px rgba(0, 0, 0, 0.05), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(90, 60, 20, 0.18)",
  },
};

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, children, premiumVariant = "neutral", ...props }, ref) => {
    const s = premiumStyles[premiumVariant];
    return (
      <button
        ref={ref}
        className={cn(
          "px-4 py-3 rounded-md cursor-pointer font-medium transition-all active:scale-95",
          className,
        )}
        style={{
          background: s.background,
          color: s.color,
          boxShadow: s.shadow,
        }}
        {...props}
      >
        {children || "Premium Button"}
      </button>
    );
  },
);

PremiumButton.displayName = "PremiumButton";

export default PremiumButton;
