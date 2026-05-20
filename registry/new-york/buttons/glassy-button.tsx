"use client";
import React, { useState } from "react";
import { Home, type LucideIcon } from "lucide-react";

type GlassyButtonProps = {
  icon?: LucideIcon;
  color?: string;
  strokeWidth?: number;
  size?: number;
  disabled?: boolean;
  onClick?: () => void;
};

const OUTER_GRADIENT =
  "linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(201, 201, 201) 8.99%, rgb(161, 161, 161) 31.88%, rgb(117, 117, 117) 73%, rgb(255, 255, 255) 100%)";

const INNER_GRADIENT_DEFAULT =
  "linear-gradient(150deg, rgb(208, 208, 208) 0%, rgb(204, 204, 204) 50.17%, rgb(200, 200, 200) 100%)";

const INNER_GRADIENT_HOVER =
  "linear-gradient(150deg, rgb(208, 208, 208) 0%, rgb(232, 232, 232) 50.17%, rgb(200, 200, 200) 100%)";

const DISABLED_OUTER = "rgb(207, 207, 207)";

const DISABLED_INNER =
  "linear-gradient(180deg, rgb(200, 200, 200) 0%, rgb(208, 208, 208) 100%)";

const SHADOW_DEFAULT =
  "0.067px 1.008px 0.505px 0px rgba(0,0,0,0), 0.159px 2.389px 1.197px 0px rgba(0,0,0,0), 0.29px 4.357px 2.183px 0px rgba(0,0,0,0.01), 0.483px 7.244px 3.63px 0px rgba(0,0,0,0.01), 0.78px 11.698px 5.862px 0px rgba(0,0,0,0.02), 1.277px 19.148px 9.595px 0px rgba(0,0,0,0.03), 2.198px 32.971px 16.522px 0px rgba(0,0,0,0.05), 4px 60px 30.067px 0px rgba(0,0,0,0.1)";

const SHADOW_HOVER =
  "0.067px 1.008px 0.505px 0px rgba(0,0,0,0), 0.159px 2.389px 1.197px 0px rgba(0,0,0,0), 0.29px 4.357px 2.183px 0px rgba(0,0,0,0.01), 0.483px 7.244px 3.63px 0px rgba(0,0,0,0.01), 0.78px 11.698px 5.862px 0px rgba(0,0,0,0.01), 1.277px 19.148px 9.595px 0px rgba(0,0,0,0.02), 2.198px 32.971px 16.522px 0px rgba(0,0,0,0.04), 4px 60px 30.067px 0px rgba(0,0,0,0.07)";

const SHADOW_PRESSED =
  "0.067px 1.008px 0.404px -0.375px rgba(0,0,0,0.03), 0.159px 2.389px 0.958px -0.75px rgba(0,0,0,0.03), 0.29px 4.357px 1.747px -1.125px rgba(0,0,0,0.03), 0.483px 7.244px 2.904px -1.5px rgba(0,0,0,0.03), 0.78px 11.698px 4.689px -1.875px rgba(0,0,0,0.03), 1.277px 19.148px 7.676px -2.25px rgba(0,0,0,0.03), 2.198px 32.971px 13.218px -2.625px rgba(0,0,0,0.02), 4px 60px 24.053px -3px rgba(0,0,0,0.02)";

const GlassyButton = ({
  icon: Icon = Home,
  color = "rgb(0, 0, 0)",
  strokeWidth = 1.5,
  size = 149,
  disabled = false,
  onClick,
}: GlassyButtonProps) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const outerBg = disabled ? DISABLED_OUTER : OUTER_GRADIENT;
  const innerBg = disabled
    ? DISABLED_INNER
    : hovered || pressed
      ? INNER_GRADIENT_HOVER
      : INNER_GRADIENT_DEFAULT;

  const shadow = disabled
    ? "none"
    : pressed
      ? SHADOW_PRESSED
      : hovered
        ? SHADOW_HOVER
        : SHADOW_DEFAULT;

  const innerShadow = disabled
    ? "inset 3px 3px 3px 0px rgba(0,0,0,0.16), inset 0px 0px 1px 2px rgba(0,0,0,0.08), inset 1px 1px 0px 0px rgba(0,0,0,0.1)"
    : "inset 2px 4px 5px 0px rgba(0,0,0,0), inset 0px 0px 1px 1px rgba(0,0,0,0)";

  const iconOpacity = disabled ? 0.4 : pressed ? 0.8 : 1;
  const iconSize = Math.round(size * 0.45);
  const outerRadius = Math.round(size * 0.27);
  const innerRadius = Math.max(outerRadius - 3, 4);
  const innerPadding = Math.max(Math.round(size * 0.02), 2);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="relative flex items-center justify-center border-0 outline-none"
      style={{
        width: size,
        height: size,
        borderRadius: outerRadius,
        padding: innerPadding,
        background: outerBg,
        boxShadow: shadow,
        cursor: disabled ? "not-allowed" : "pointer",
        transition:
          "background 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        style={{
          borderRadius: innerRadius,
          background: innerBg,
          boxShadow: innerShadow,
          transition: "background 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Icon
          size={iconSize}
          strokeWidth={strokeWidth}
          color={color}
          style={{
            opacity: iconOpacity,
            transition: "opacity 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </button>
  );
};

export default GlassyButton;
