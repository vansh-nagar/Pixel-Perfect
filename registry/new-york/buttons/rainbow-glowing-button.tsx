"use client";
import React, { useEffect, useState } from "react";

export type RainbowVariant =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "pink";

export type RainbowColors = [string, string, string, string, string, string];

type RainbowGlowingButtonProps = {
  children?: React.ReactNode;
  variant?: RainbowVariant;
  autoCycle?: boolean;
  cycleMs?: number;
  transitionMs?: number;
  onClick?: () => void;
  colors?: RainbowColors;
};

const order: RainbowVariant[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "pink",
];

const palette: Record<RainbowVariant, string> = {
  red: "rgb(254, 0, 2)",
  orange: "rgb(254, 121, 2)",
  yellow: "rgb(255, 254, 3)",
  green: "rgb(19, 221, 23)",
  blue: "rgb(0, 136, 255)",
  pink: "rgb(207, 4, 245)",
};

const PROPERTY_CSS = `
@property --rg-c1 { syntax: '<color>'; initial-value: rgb(254, 0, 2); inherits: true; }
@property --rg-c2 { syntax: '<color>'; initial-value: rgb(254, 121, 2); inherits: true; }
@property --rg-c3 { syntax: '<color>'; initial-value: rgb(255, 254, 3); inherits: true; }
@property --rg-c4 { syntax: '<color>'; initial-value: rgb(19, 221, 23); inherits: true; }
@property --rg-c5 { syntax: '<color>'; initial-value: rgb(0, 136, 255); inherits: true; }
@property --rg-c6 { syntax: '<color>'; initial-value: rgb(207, 4, 245); inherits: true; }
`;

let propertyStyleInjected = false;
const injectPropertyStyles = () => {
  if (typeof document === "undefined" || propertyStyleInjected) return;
  propertyStyleInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-rainbow-glow", "");
  style.textContent = PROPERTY_CSS;
  document.head.appendChild(style);
};

const colorVarsFor = (variant: RainbowVariant) => {
  const i = order.indexOf(variant);
  const vars: Record<string, string> = {};
  for (let k = 0; k < 6; k++) {
    vars[`--rg-c${k + 1}`] = palette[order[(i + k) % 6]];
  }
  return vars;
};

const colorVarsFromArray = (colors: RainbowColors) => {
  const vars: Record<string, string> = {};
  for (let k = 0; k < 6; k++) {
    vars[`--rg-c${k + 1}`] = colors[k];
  }
  return vars;
};

const RainbowGlowingButton = ({
  children = "Button text",
  variant: variantProp,
  autoCycle = true,
  cycleMs = 500,
  transitionMs = 500,
  onClick,
  colors,
}: RainbowGlowingButtonProps) => {
  const [variant, setVariant] = useState<RainbowVariant>(variantProp ?? "red");

  useEffect(() => {
    injectPropertyStyles();
  }, []);

  useEffect(() => {
    if (variantProp) setVariant(variantProp);
  }, [variantProp]);

  useEffect(() => {
    if (!autoCycle || variantProp || colors) return;
    const id = window.setInterval(() => {
      setVariant((v) => order[(order.indexOf(v) + 1) % order.length]);
    }, cycleMs);
    return () => window.clearInterval(id);
  }, [autoCycle, cycleMs, variantProp, colors]);

  const colorTransition = Array.from({ length: 6 }, (_, k) =>
    `--rg-c${k + 1} ${transitionMs}ms linear`,
  ).join(", ");

  const colorVars = (colors
    ? colorVarsFromArray(colors)
    : colorVarsFor(variant)) as React.CSSProperties;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex cursor-pointer items-center justify-center gap-3 border-0 bg-transparent outline-none"
      style={{
        padding: "12px 24px",
        borderRadius: 120,
        ...colorVars,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: 0,
          right: 0,
          top: 2,
          bottom: 0,
          borderRadius: 114,
          background:
            "radial-gradient(50% 40% at 50% 100%, rgba(255,255,255,0) 0%, var(--rg-c1) 25%, var(--rg-c2) 50%, var(--rg-c3) 75%, rgba(255,255,255,0) 100%)",
          filter: "blur(15px)",
          WebkitFilter: "blur(15px)",
          transition: colorTransition,
          ...colorVars,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute overflow-hidden"
        style={{
          left: 0,
          right: 0,
          top: 2,
          bottom: 0,
          borderRadius: 114,
          background:
            "linear-gradient(90deg, var(--rg-c1) 0%, var(--rg-c2) 20%, var(--rg-c3) 40%, var(--rg-c4) 60%, var(--rg-c5) 80%, var(--rg-c6) 100%)",
          transition: colorTransition,
          ...colorVars,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: 0,
          right: 0,
          top: 2,
          bottom: 2,
          borderRadius: 114,
          backgroundColor: "rgb(16, 16, 16)",
        }}
      />
      <span
        className="relative z-10 whitespace-pre text-white"
        style={{
          fontWeight: 500,
          fontSize: 16,
          lineHeight: "24px",
        }}
      >
        {children}
      </span>
    </button>
  );
};

export default RainbowGlowingButton;
