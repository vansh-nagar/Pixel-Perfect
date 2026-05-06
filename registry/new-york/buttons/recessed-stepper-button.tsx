"use client";
import React, { useState } from "react";

const RecessedStepperButton = () => {
  return (
    <div
      className="relative grid h-16 w-44 grid-cols-[1fr_1px_1fr] items-stretch p-[5px]"
      style={{
        borderRadius: 999,
        background:
          "linear-gradient(180deg, #e6eaee 0%, #eff2f5 50%, #f7f9fb 100%)",
        boxShadow: [
          "inset 0 0 0 1px rgba(90,100,115,0.35)",
          "inset 0 2px 3px -1px rgba(50,60,70,0.18)",
          "inset 0 -1px 0 rgba(255,255,255,0.9)",
          "0 0 28px 6px rgba(255,255,255,0.85)",
          "0 14px 26px -10px rgba(60,70,80,0.22)",
        ].join(", "),
      }}
    >
      <Cap side="left" ariaLabel="Decrease">
        <svg width="18" height="3" viewBox="0 0 36 6" fill="none">
          <rect width="36" height="6" rx="3" fill="currentColor" />
        </svg>
      </Cap>

      <span
        aria-hidden
        className="self-center"
        style={{
          width: 1,
          height: "62%",
          background:
            "linear-gradient(180deg, rgba(80,90,100,0) 0%, rgba(80,90,100,0.55) 35%, rgba(80,90,100,0.55) 65%, rgba(80,90,100,0) 100%)",
          boxShadow: "1px 0 0 rgba(255,255,255,0.85)",
        }}
      />

      <Cap side="right" ariaLabel="Increase">
        <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
          <rect y="15" width="36" height="6" rx="3" fill="currentColor" />
          <rect x="15" width="6" height="36" rx="3" fill="currentColor" />
        </svg>
      </Cap>
    </div>
  );
};

const Cap = ({
  side,
  ariaLabel,
  children,
}: {
  side: "left" | "right";
  ariaLabel: string;
  children: React.ReactNode;
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="relative flex items-center justify-center cursor-pointer outline-none"
      style={{
        color: "#3a4a55",
        borderRadius:
          side === "left" ? "999px 6px 6px 999px" : "6px 999px 999px 6px",
        background: pressed
          ? "linear-gradient(180deg, #e8ecee 0%, #f0f3f5 60%, #f9fbfc 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f7f9fa 55%, #e8ecef 100%)",
        boxShadow: pressed
          ? "inset 0 2px 4px rgba(40,50,60,0.35), inset 0 0 0 0.5px rgba(90,100,115,0.16)"
          : "inset 0 1.5px 1px rgba(255,255,255,1), inset 0 -10px 14px -10px rgba(60,70,80,0.18), inset 0 0 0 0.5px rgba(90,100,115,0.16), 0 4px 8px -3px rgba(40,50,60,0.28), 0 1px 2px -1px rgba(40,50,60,0.2)",
        transform: pressed ? "translateY(1px)" : "none",
        transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
      }}
    >
      {children}
    </button>
  );
};

export default RecessedStepperButton;
