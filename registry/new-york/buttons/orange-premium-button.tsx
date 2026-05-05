import React from "react";
import { cn } from "@/lib/utils";

export type OrangePremiumVariant =
  | "orange"
  | "pink"
  | "emerald"
  | "violet"
  | "sky"
  | "ocean"
  | "gold"
  | "magenta";

interface OrangePremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  orangeVariant?: OrangePremiumVariant;
}

const orangePremiumStyles: Record<
  OrangePremiumVariant,
  { background: string; shadow: string }
> = {
  orange: {
    background:
      "linear-gradient(0.1deg, rgba(255, 74, 74, 0) 0.09%, rgba(255, 36, 36, 0.2) 76.39%), linear-gradient(360deg, #FFF16E 2.67%, #FF8A33 30.48%, #FF4A4A 51.8%), #FF4A4A",
    shadow:
      "0px 7.25px 7.5px rgba(255, 245, 153, 0.3), 0px 5px 7.5px rgba(255, 197, 128, 0.56), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
  pink: {
    background:
      "linear-gradient(0.1deg, rgba(255, 74, 153, 0) 0.09%, rgba(255, 36, 134, 0.2) 76.39%), linear-gradient(360deg, #FFE0F0 2.67%, #FF6BB3 30.48%, #FF2D87 51.8%), #FF2D87",
    shadow:
      "0px 7.25px 7.5px rgba(255, 200, 230, 0.35), 0px 5px 7.5px rgba(255, 150, 200, 0.5), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
  emerald: {
    background:
      "linear-gradient(0.1deg, rgba(74, 255, 153, 0) 0.09%, rgba(36, 211, 110, 0.2) 76.39%), linear-gradient(360deg, #E2FFE6 2.67%, #58D68D 30.48%, #1FAE5C 51.8%), #1FAE5C",
    shadow:
      "0px 7.25px 7.5px rgba(180, 255, 200, 0.35), 0px 5px 7.5px rgba(120, 220, 160, 0.5), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
  violet: {
    background:
      "linear-gradient(0.1deg, rgba(150, 74, 255, 0) 0.09%, rgba(120, 36, 255, 0.2) 76.39%), linear-gradient(360deg, #EBDDFF 2.67%, #A56BFF 30.48%, #7C3AFF 51.8%), #7C3AFF",
    shadow:
      "0px 7.25px 7.5px rgba(220, 200, 255, 0.35), 0px 5px 7.5px rgba(180, 150, 255, 0.5), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
  sky: {
    background:
      "linear-gradient(0.1deg, rgba(74, 150, 255, 0) 0.09%, rgba(36, 110, 255, 0.2) 76.39%), linear-gradient(360deg, #DDF1FF 2.67%, #6BB5FF 30.48%, #2D8AFF 51.8%), #2D8AFF",
    shadow:
      "0px 7.25px 7.5px rgba(200, 230, 255, 0.35), 0px 5px 7.5px rgba(150, 200, 255, 0.5), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
  ocean: {
    background:
      "linear-gradient(0.1deg, rgba(74, 211, 255, 0) 0.09%, rgba(36, 180, 220, 0.2) 76.39%), linear-gradient(360deg, #DDFAFF 2.67%, #6BD5E5 30.48%, #2DAEC5 51.8%), #2DAEC5",
    shadow:
      "0px 7.25px 7.5px rgba(200, 245, 255, 0.35), 0px 5px 7.5px rgba(150, 220, 235, 0.5), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
  gold: {
    background:
      "linear-gradient(0.1deg, rgba(255, 200, 74, 0) 0.09%, rgba(255, 170, 36, 0.2) 76.39%), linear-gradient(360deg, #FFFADC 2.67%, #FFD66B 30.48%, #FFA82D 51.8%), #FFA82D",
    shadow:
      "0px 7.25px 7.5px rgba(255, 240, 180, 0.35), 0px 5px 7.5px rgba(255, 215, 130, 0.5), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
  magenta: {
    background:
      "linear-gradient(0.1deg, rgba(255, 74, 220, 0) 0.09%, rgba(220, 36, 200, 0.2) 76.39%), linear-gradient(360deg, #FFE0FA 2.67%, #E66BD5 30.48%, #C42DAE 51.8%), #C42DAE",
    shadow:
      "0px 7.25px 7.5px rgba(255, 200, 245, 0.35), 0px 5px 7.5px rgba(230, 150, 220, 0.5), inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
  },
};

const OrangePremiumButton = React.forwardRef<
  HTMLButtonElement,
  OrangePremiumButtonProps
>(({ className, children, orangeVariant = "orange", ...props }, ref) => {
  const s = orangePremiumStyles[orangeVariant];
  return (
    <button
      ref={ref}
      className={cn(
        "bg-muted px-4 py-3 rounded-3xl cursor-pointer font-medium text-white transition-all active:scale-95",
        className,
      )}
      style={{
        background: s.background,
        backgroundBlendMode: "soft-light, normal, normal, normal",
        boxShadow: s.shadow,
      }}
      {...props}
    >
      {children || "Cool Button"}
    </button>
  );
});

OrangePremiumButton.displayName = "OrangePremiumButton";

export default OrangePremiumButton;
