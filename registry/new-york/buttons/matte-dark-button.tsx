import React from "react";
import { cn } from "@/lib/utils";

interface MatteDarkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const MatteDarkButton = React.forwardRef<
  HTMLButtonElement,
  MatteDarkButtonProps
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-zinc-100 transition-transform duration-200 active:scale-[0.98]",
        className,
      )}
      style={{
        background:
          "radial-gradient(100% 100% at 0% 0%, #8B8B8B 0%, #E2E1E1 21.88%, #8B8B8B 42.19%, #E2E1E1 60.94%, #8B8B8B 79.17%, #E2E1E1 100%)",
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
          background: "linear-gradient(135deg, #1f2025 0%, #15161a 100%)",
          boxShadow:
            "inset 0 1px 1px rgba(255, 255, 255, 0.06), inset 0 -1px 1px rgba(0, 0, 0, 0.4)",
        }}
      />

      <span className="relative z-10">{children || "Matte Dark Button"}</span>
    </button>
  );
});

MatteDarkButton.displayName = "MatteDarkButton";

export default MatteDarkButton;
