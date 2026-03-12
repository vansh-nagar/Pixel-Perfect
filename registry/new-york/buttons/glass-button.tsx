import React from "react";
import { cn } from "@/lib/utils";

export type GlassVariant =
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
  GlassVariant,
  { border: string; inner: string; shadow: string }
> = {
  blue: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(16, 191, 255, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(199, 240, 255, 0.4) 10.17%, rgba(0, 187, 255, 0.4) 48.94%, rgba(199, 240, 255, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(94, 212, 255, 0.02), 0px 20.34px 12.71px rgba(94, 212, 255, 0.08), 0px 8.9px 8.9px rgba(94, 212, 255, 0.13), 0px 2.54px 5.08px rgba(94, 212, 255, 0.15)",
  },
  purple: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(168, 85, 247, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(243, 232, 255, 0.4) 10.17%, rgba(147, 51, 234, 0.4) 48.94%, rgba(243, 232, 255, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(168, 85, 247, 0.02), 0px 20.34px 12.71px rgba(168, 85, 247, 0.08), 0px 8.9px 8.9px rgba(168, 85, 247, 0.13), 0px 2.54px 5.08px rgba(168, 85, 247, 0.15)",
  },
  emerald: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(16, 185, 129, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(209, 250, 229, 0.4) 10.17%, rgba(5, 150, 105, 0.4) 48.94%, rgba(209, 250, 229, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(52, 211, 153, 0.02), 0px 20.34px 12.71px rgba(52, 211, 153, 0.08), 0px 8.9px 8.9px rgba(52, 211, 153, 0.13), 0px 2.54px 5.08px rgba(52, 211, 153, 0.15)",
  },
  rose: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(244, 63, 94, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(255, 228, 230, 0.4) 10.17%, rgba(225, 29, 72, 0.4) 48.94%, rgba(255, 228, 230, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(251, 113, 133, 0.02), 0px 20.34px 12.71px rgba(251, 113, 133, 0.08), 0px 8.9px 8.9px rgba(251, 113, 133, 0.13), 0px 2.54px 5.08px rgba(251, 113, 133, 0.15)",
  },
  amber: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(245, 158, 11, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(254, 243, 199, 0.4) 10.17%, rgba(217, 119, 6, 0.4) 48.94%, rgba(254, 243, 199, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(251, 191, 36, 0.02), 0px 20.34px 12.71px rgba(251, 191, 36, 0.08), 0px 8.9px 8.9px rgba(251, 191, 36, 0.13), 0px 2.54px 5.08px rgba(251, 191, 36, 0.15)",
  },
  cyan: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(6, 182, 212, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(207, 250, 254, 0.4) 10.17%, rgba(8, 145, 178, 0.4) 48.94%, rgba(207, 250, 254, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(34, 211, 238, 0.02), 0px 20.34px 12.71px rgba(34, 211, 238, 0.08), 0px 8.9px 8.9px rgba(34, 211, 238, 0.13), 0px 2.54px 5.08px rgba(34, 211, 238, 0.15)",
  },
  lime: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(132, 204, 22, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(236, 252, 203, 0.4) 10.17%, rgba(101, 163, 13, 0.4) 48.94%, rgba(236, 252, 203, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(163, 230, 53, 0.02), 0px 20.34px 12.71px rgba(163, 230, 53, 0.08), 0px 8.9px 8.9px rgba(163, 230, 53, 0.13), 0px 2.54px 5.08px rgba(163, 230, 53, 0.15)",
  },
  slate: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(100, 116, 139, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(226, 232, 240, 0.4) 10.17%, rgba(71, 85, 105, 0.4) 48.94%, rgba(226, 232, 240, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(148, 163, 184, 0.02), 0px 20.34px 12.71px rgba(148, 163, 184, 0.08), 0px 8.9px 8.9px rgba(148, 163, 184, 0.13), 0px 2.54px 5.08px rgba(148, 163, 184, 0.15)",
  },
  red: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(239, 68, 68, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(254, 226, 226, 0.4) 10.17%, rgba(220, 38, 38, 0.4) 48.94%, rgba(254, 226, 226, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(248, 113, 113, 0.02), 0px 20.34px 12.71px rgba(248, 113, 113, 0.08), 0px 8.9px 8.9px rgba(248, 113, 113, 0.13), 0px 2.54px 5.08px rgba(248, 113, 113, 0.15)",
  },
  indigo: {
    border:
      "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(99, 102, 241, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
    inner:
      "linear-gradient(263.57deg, rgba(224, 231, 255, 0.4) 10.17%, rgba(79, 70, 229, 0.4) 48.94%, rgba(224, 231, 255, 0.4) 103.12%)",
    shadow:
      "0px 36.86px 13.98px rgba(129, 140, 248, 0.02), 0px 20.34px 12.71px rgba(129, 140, 248, 0.08), 0px 8.9px 8.9px rgba(129, 140, 248, 0.13), 0px 2.54px 5.08px rgba(129, 140, 248, 0.15)",
  },
};

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassVariant;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, variant = "blue", ...props }, ref) => {
    const { border, inner, shadow } = glassStyles[variant];
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.98]",
          className,
        )}
        style={{
          background: border,
          borderRadius: "100px",
          border: "none",
        }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-[100px]"
          style={{
            background: inner,
            boxShadow: shadow,
            backdropFilter: "blur(4.5px)",
          }}
        />
        <span className="relative z-10">{children || "Glass Button"}</span>
      </button>
    );
  },
);

GlassButton.displayName = "GlassButton";

export default GlassButton;
