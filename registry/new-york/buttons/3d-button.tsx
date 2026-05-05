"use client";
import React, { useState } from "react";
import { cn } from "@/lib/cn";

export type ThreedVariant =
  | "amber"
  | "emerald"
  | "rose"
  | "sky"
  | "violet"
  | "slate"
  | "coral"
  | "mint";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

interface ThreedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  threedVariant?: ThreedVariant;
  children?: React.ReactNode;
}

const threedStyles: Record<
  ThreedVariant,
  {
    border: string;
    text: string;
    base: string;
    hover: string;
    front: string;
    back: string;
  }
> = {
  amber: {
    border: "#d97706",
    text: "#78350f",
    base: "#fef3c7",
    hover: "#fde047",
    front: "#f59e0b",
    back: "#fbbf24",
  },
  emerald: {
    border: "#047857",
    text: "#064e3b",
    base: "#d1fae5",
    hover: "#6ee7b7",
    front: "#10b981",
    back: "#34d399",
  },
  rose: {
    border: "#be123c",
    text: "#881337",
    base: "#ffe4e6",
    hover: "#fda4af",
    front: "#f43f5e",
    back: "#fb7185",
  },
  sky: {
    border: "#0369a1",
    text: "#0c4a6e",
    base: "#e0f2fe",
    hover: "#7dd3fc",
    front: "#0ea5e9",
    back: "#38bdf8",
  },
  violet: {
    border: "#6d28d9",
    text: "#4c1d95",
    base: "#ede9fe",
    hover: "#c4b5fd",
    front: "#8b5cf6",
    back: "#a78bfa",
  },
  slate: {
    border: "#334155",
    text: "#0f172a",
    base: "#e2e8f0",
    hover: "#94a3b8",
    front: "#475569",
    back: "#64748b",
  },
  coral: {
    border: "#c2410c",
    text: "#7c2d12",
    base: "#ffedd5",
    hover: "#fdba74",
    front: "#f97316",
    back: "#fb923c",
  },
  mint: {
    border: "#0d9488",
    text: "#134e4a",
    base: "#ccfbf1",
    hover: "#5eead4",
    front: "#14b8a6",
    back: "#2dd4bf",
  },
};

const ThreedButton = React.forwardRef<HTMLButtonElement, ThreedButtonProps>(
  (
    { className, disabled = false, children, threedVariant = "amber", ...props },
    ref,
  ) => {
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const s = threedStyles[threedVariant];

    return (
      <div className="flex items-center justify-center">
        <style>{`
          @import url('https://fonts.googleapis.com/css?family=Rubik:700&display=swap');
          .btn-3d-${threedVariant} {
            position: relative;
            display: inline-block;
            cursor: pointer;
            outline: none;
            border: 2px solid ${s.border};
            vertical-align: middle;
            font-size: 1rem;
            font-weight: 600;
            color: ${s.text};
            text-transform: uppercase;
            padding: 0.6em 1.2em;
            border-radius: 0.75em;
            transform-style: preserve-3d;
            transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), background 150ms cubic-bezier(0, 0, 0.58, 1);
            background: ${
              isPressed ? s.hover : isHovered ? s.hover : s.base
            };
            transform: ${
              isPressed
                ? "translate(0em, 0.75em)"
                : isHovered
                ? "translate(0, 0.25em)"
                : "translate(0, 0)"
            };
          }
          .btn-3d-${threedVariant}::before {
            position: absolute;
            content: '';
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${s.front};
            border-radius: 0.75em;
            box-shadow: ${
              isPressed
                ? `0 0 0 2px ${s.border}, 0 0 ${s.back}`
                : isHovered
                ? `0 0 0 2px ${s.border}, 0 0.5em 0 0 ${s.back}`
                : `0 0 0 2px ${s.border}, 0 0.625em 0 0 ${s.back}`
            };
            transform: ${
              isPressed
                ? "translate3d(0, 0, -1em)"
                : isHovered
                ? "translate3d(0, 0.5em, -1em)"
                : "translate3d(0, 0.75em, -1em)"
            };
            transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
            pointer-events: none;
          }
        `}</style>
        <button
          ref={ref}
          className={cn(`btn-3d-${threedVariant} relative`, className)}
          disabled={disabled}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsPressed(false);
          }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          {...props}
        >
          <span className="relative z-10">{children ?? "Hover Me"}</span>
        </button>
      </div>
    );
  },
);

ThreedButton.displayName = "ThreedButton";

export default ThreedButton;
