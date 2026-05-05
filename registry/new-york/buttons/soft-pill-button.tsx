"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type SoftPillVariant = "secondary" | "primary";

interface SoftPillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SoftPillVariant;
}

const SoftPillButton = React.forwardRef<HTMLButtonElement, SoftPillButtonProps>(
  ({ className, children, variant = "secondary", ...props }, ref) => {
    const isPrimary = variant === "primary";
    return (
      <button
        ref={ref}
        className={cn(
          "group relative block rounded-full text-center px-5 py-2.5 text-[13px] font-medium tracking-tight transition-[transform] duration-200 active:scale-[0.99] active:duration-[50ms]",
          "[backdrop-filter:blur(6px)]",
          isPrimary ? "text-white/90" : "text-neutral-900",
          className,
        )}
        style={{
          boxShadow: isPrimary
            ? "0 12px 24px -8px rgba(0, 0, 0, 0.28), 0 4px 8px -2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.12)"
            : "0 12px 24px -8px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full overflow-hidden transition-all duration-200 group-active:duration-[50ms]"
          style={{
            background: isPrimary
              ? "rgba(0, 0, 0, 0.56)"
              : "rgba(255, 255, 255, 0.9)",
          }}
        >
          {!isPrimary && (
            <span
              className="absolute inset-0 transition duration-200 bg-black/[0.06] group-hover:bg-black/[0.03] group-active:bg-black/[0.07] group-active:duration-[50ms]"
            />
          )}
          <span
            className="absolute inset-0 transition duration-200 group-active:opacity-0 group-active:duration-[50ms]"
            style={{
              background: isPrimary
                ? "linear-gradient(rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)"
                : "linear-gradient(rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)",
              opacity: isPrimary ? 0.12 : 0.32,
            }}
          />
          <span
            className="absolute inset-0 transition duration-200 group-active:duration-[50ms]"
            style={{
              background:
                "radial-gradient(65.62% 65.62% at 50% 100%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%)",
              opacity: isPrimary ? 0.32 : 0.08,
            }}
          />
          {!isPrimary && (
            <span
              className="absolute inset-0 transition duration-200 group-active:opacity-0 group-active:duration-[50ms]"
              style={{
                background:
                  "linear-gradient(99deg, rgba(255, 255, 255, 0) 27.7%, rgba(255, 255, 255, 0.12) 60.19%, rgba(255, 255, 255, 0) 86.06%)",
              }}
            />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full p-px"
            style={{
              background: isPrimary
                ? "linear-gradient(rgb(255, 255, 255) 0%, rgb(153, 153, 153) 55%, rgb(255, 255, 255) 80%, rgb(153, 153, 153) 95%)"
                : "linear-gradient(transparent 0%, rgb(255, 255, 255) 55%, transparent 80%, rgb(255, 255, 255) 95%)",
              opacity: isPrimary ? 0.24 : 0.12,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        </span>
        <span className="relative">{children}</span>
      </button>
    );
  },
);

SoftPillButton.displayName = "SoftPillButton";

export default SoftPillButton;
