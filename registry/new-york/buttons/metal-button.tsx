import React from "react";
import { cn } from "@/lib/utils";

export type MetalVariant =
  | "silver"
  | "chrome"
  | "gold"
  | "copper"
  | "bronze"
  | "titanium"
  | "rose-gold"
  | "gunmetal";

const metalStyles: Record<MetalVariant, { outer: string; inner: string }> = {
  silver: {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #8B8B8B 0%, #E2E1E1 21.88%, #8B8B8B 42.19%, #E2E1E1 60.94%, #8B8B8B 79.17%, #E2E1E1 100%)",
    inner: "linear-gradient(135deg, #1f2025 0%, #15161a 100%)",
  },
  chrome: {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #C0C0C0 0%, #F8F8F8 21.88%, #A8A8A8 42.19%, #F5F5F5 60.94%, #C0C0C0 79.17%, #F8F8F8 100%)",
    inner: "linear-gradient(135deg, #1f2025 0%, #15161a 100%)",
  },
  gold: {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #B8860B 0%, #FFD700 21.88%, #DAA520 42.19%, #FFE55C 60.94%, #B8860B 79.17%, #FFD700 100%)",
    inner: "linear-gradient(135deg, #1a1500 0%, #0d0b00 100%)",
  },
  copper: {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #8B4513 0%, #E8975A 21.88%, #B5651D 42.19%, #E8A96A 60.94%, #8B4513 79.17%, #CD7F32 100%)",
    inner: "linear-gradient(135deg, #1a0d05 0%, #120900 100%)",
  },
  bronze: {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #6B4C1E 0%, #C8A96E 21.88%, #8B6914 42.19%, #D4A853 60.94%, #6B4C1E 79.17%, #B8912A 100%)",
    inner: "linear-gradient(135deg, #16120a 0%, #0d0a04 100%)",
  },
  titanium: {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #4A5568 0%, #8B9BB4 21.88%, #3D4A5C 42.19%, #7A8BA0 60.94%, #4A5568 79.17%, #9AABBF 100%)",
    inner: "linear-gradient(135deg, #151a20 0%, #0d1015 100%)",
  },
  "rose-gold": {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #B76E79 0%, #F4C2C2 21.88%, #C68642 42.19%, #F0B0B8 60.94%, #B76E79 79.17%, #E8B4B8 100%)",
    inner: "linear-gradient(135deg, #1a1015 0%, #120b10 100%)",
  },
  gunmetal: {
    outer:
      "radial-gradient(100% 100% at 0% 0%, #2D333B 0%, #555D6A 21.88%, #2A2F36 42.19%, #5A6370 60.94%, #2D333B 79.17%, #636D7A 100%)",
    inner: "linear-gradient(135deg, #303540 0%, #252930 100%)",
  },
};

interface MetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  metal?: MetalVariant;
}

const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
  ({ className, children, metal = "silver", ...props }, ref) => {
    const { outer, inner } = metalStyles[metal];
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-zinc-100 transition-transform duration-200 active:scale-[0.98]",
          className,
        )}
        style={{
          background: outer,
          borderRadius: "14px",
          boxShadow:
            "0px 9px 4px rgba(0, 0, 0, 0.04), 0px 5px 3px rgba(0, 0, 0, 0.13), 0px 2px 2px rgba(0, 0, 0, 0.23), 0px 1px 1px rgba(0, 0, 0, 0.26)",
        }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[12px]"
          style={{
            background:
              "repeating-radial-gradient(circle at 25% 40%, rgba(255, 255, 255, 0.08) 0px, rgba(255, 255, 255, 0.08) 1px, transparent 2px, transparent 6px)",
            mixBlendMode: "overlay",
            opacity: 0.35,
          }}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[4px] rounded-[10px]"
          style={{
            background: inner,
            boxShadow:
              "inset 0 1px 1px rgba(255, 255, 255, 0.06), inset 0 -1px 1px rgba(0, 0, 0, 0.4)",
          }}
        />

        <span className="relative z-10">{children || "Metal Button"}</span>
      </button>
    );
  },
);

MetalButton.displayName = "MetalButton";

export default MetalButton;
