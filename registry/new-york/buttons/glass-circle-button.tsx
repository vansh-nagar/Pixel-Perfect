"use client";
import React from "react";
import { Heart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type GlassCircleVariant =
  | "blue"
  | "purple"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "lime"
  | "slate"
  | "red"
  | "indigo";

const glassStyles: Record<
  GlassCircleVariant,
  { border: string; inner: string; shadow: string }
> = {
  blue: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(16,191,255,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(16,191,255,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(199, 240, 255, 0.55) 0%, rgba(0, 187, 255, 0.4) 60%, rgba(0, 100, 180, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(94, 212, 255, 0.02), 0px 20.34px 12.71px rgba(94, 212, 255, 0.08), 0px 8.9px 8.9px rgba(94, 212, 255, 0.13), 0px 2.54px 5.08px rgba(94, 212, 255, 0.15)",
  },
  purple: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(168,85,247,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(168,85,247,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(243, 232, 255, 0.55) 0%, rgba(147, 51, 234, 0.4) 60%, rgba(88, 28, 135, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(168, 85, 247, 0.02), 0px 20.34px 12.71px rgba(168, 85, 247, 0.08), 0px 8.9px 8.9px rgba(168, 85, 247, 0.13), 0px 2.54px 5.08px rgba(168, 85, 247, 0.15)",
  },
  emerald: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(16,185,129,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(16,185,129,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(209, 250, 229, 0.55) 0%, rgba(5, 150, 105, 0.4) 60%, rgba(6, 78, 59, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(52, 211, 153, 0.02), 0px 20.34px 12.71px rgba(52, 211, 153, 0.08), 0px 8.9px 8.9px rgba(52, 211, 153, 0.13), 0px 2.54px 5.08px rgba(52, 211, 153, 0.15)",
  },
  rose: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(244,63,94,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(244,63,94,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(255, 228, 230, 0.55) 0%, rgba(225, 29, 72, 0.4) 60%, rgba(136, 19, 55, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(251, 113, 133, 0.02), 0px 20.34px 12.71px rgba(251, 113, 133, 0.08), 0px 8.9px 8.9px rgba(251, 113, 133, 0.13), 0px 2.54px 5.08px rgba(251, 113, 133, 0.15)",
  },
  amber: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(245,158,11,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(245,158,11,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(254, 243, 199, 0.55) 0%, rgba(217, 119, 6, 0.4) 60%, rgba(120, 53, 15, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(251, 191, 36, 0.02), 0px 20.34px 12.71px rgba(251, 191, 36, 0.08), 0px 8.9px 8.9px rgba(251, 191, 36, 0.13), 0px 2.54px 5.08px rgba(251, 191, 36, 0.15)",
  },
  cyan: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(6,182,212,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(6,182,212,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(207, 250, 254, 0.55) 0%, rgba(8, 145, 178, 0.4) 60%, rgba(22, 78, 99, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(34, 211, 238, 0.02), 0px 20.34px 12.71px rgba(34, 211, 238, 0.08), 0px 8.9px 8.9px rgba(34, 211, 238, 0.13), 0px 2.54px 5.08px rgba(34, 211, 238, 0.15)",
  },
  lime: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(132,204,22,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(132,204,22,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(236, 252, 203, 0.55) 0%, rgba(101, 163, 13, 0.4) 60%, rgba(54, 83, 20, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(163, 230, 53, 0.02), 0px 20.34px 12.71px rgba(163, 230, 53, 0.08), 0px 8.9px 8.9px rgba(163, 230, 53, 0.13), 0px 2.54px 5.08px rgba(163, 230, 53, 0.15)",
  },
  slate: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(100,116,139,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(100,116,139,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(226, 232, 240, 0.55) 0%, rgba(71, 85, 105, 0.4) 60%, rgba(30, 41, 59, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(148, 163, 184, 0.02), 0px 20.34px 12.71px rgba(148, 163, 184, 0.08), 0px 8.9px 8.9px rgba(148, 163, 184, 0.13), 0px 2.54px 5.08px rgba(148, 163, 184, 0.15)",
  },
  red: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(239,68,68,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(239,68,68,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(254, 226, 226, 0.55) 0%, rgba(220, 38, 38, 0.4) 60%, rgba(127, 29, 29, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(248, 113, 113, 0.02), 0px 20.34px 12.71px rgba(248, 113, 113, 0.08), 0px 8.9px 8.9px rgba(248, 113, 113, 0.13), 0px 2.54px 5.08px rgba(248, 113, 113, 0.15)",
  },
  indigo: {
    border:
      "conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(99,102,241,0.7) 120deg, rgba(255,255,255,0.7) 240deg, rgba(99,102,241,0.7) 360deg)",
    inner:
      "radial-gradient(circle at 30% 30%, rgba(224, 231, 255, 0.55) 0%, rgba(79, 70, 229, 0.4) 60%, rgba(49, 46, 129, 0.4) 100%)",
    shadow:
      "0px 36.86px 13.98px rgba(129, 140, 248, 0.02), 0px 20.34px 12.71px rgba(129, 140, 248, 0.08), 0px 8.9px 8.9px rgba(129, 140, 248, 0.13), 0px 2.54px 5.08px rgba(129, 140, 248, 0.15)",
  },
};

interface GlassCircleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassCircleVariant;
  icon?: LucideIcon;
  size?: number;
}

const GlassCircleButton = React.forwardRef<
  HTMLButtonElement,
  GlassCircleButtonProps
>(
  (
    { className, variant = "blue", icon: Icon = Heart, size = 56, ...props },
    ref,
  ) => {
    const { border, inner, shadow } = glassStyles[variant];
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center text-white transition-transform duration-200 active:scale-[0.95]",
          className,
        )}
        style={{
          width: size,
          height: size,
          background: border,
          borderRadius: "9999px",
          border: "none",
        }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-full"
          style={{
            background: inner,
            boxShadow: shadow,
            backdropFilter: "blur(4.5px)",
          }}
        />
        <Icon
          className="relative z-10"
          size={Math.round(size * 0.4)}
          strokeWidth={2}
        />
      </button>
    );
  },
);

GlassCircleButton.displayName = "GlassCircleButton";

export default GlassCircleButton;
