"use client";

import "./shiny-cta.css";

interface ShinyCtaProps {
  text?: string;
  onClick?: () => void;
}

export function ShinyCtaButton({
  text = "Explore Icons",
  onClick,
}: ShinyCtaProps) {
  return (
    <button className="shiny-cta" onClick={onClick}>
      <span>{text}</span>
    </button>
  );
}
