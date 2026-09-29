"use client";

/**
 * Eye glyphs for the faces, drawn as plain SVG geometry.
 *
 * Every glyph lives in a 55-unit-tall box (the height of one line of the
 * original's 46px type) and has an `advance` width. The first seven redraw
 * the original DevDay eyes (which openai.com renders from its proprietary
 * typeface); the rest are glyphs for the custom faces, drawn to the same
 * weight (~4-5 unit strokes) and centred on the same x-height line (y≈32.5).
 */

import { memo, type ReactNode } from "react";

export type EyeGlyph =
  // originals
  | "^"
  | "o"
  | "+"
  | ">"
  | "<"
  | "–"
  | "*"
  // custom
  | "heart"
  | "$"
  | "x"
  | "@"
  | "u"
  | "="
  | ";"
  | "◕";

const stroke = { fill: "none", stroke: "currentColor" } as const;

export const EYE_GLYPHS: Record<EyeGlyph, { advance: number; shape: ReactNode }> = {
  "^": {
    advance: 27.7,
    shape: <polygon points="2.5,31 7.2,31 13.8,14.9 20.3,31 25.2,31 16.4,10.3 11.3,10.3" />,
  },
  o: {
    advance: 28.7,
    shape: (
      <path
        fillRule="evenodd"
        d="M14.4 19.8a12.2 13 0 1 0 0.01 0zM14.4 23.8a7.4 8.95 0 1 1 -0.01 0z"
      />
    ),
  },
  "+": {
    advance: 29.55,
    shape: (
      <>
        <rect x="2.45" y="30.28" width="24.65" height="4.25" />
        <rect x="12.35" y="20.28" width="4.85" height="24.25" />
      </>
    ),
  },
  ">": {
    advance: 27.35,
    shape: <polygon points="3.45,43.3 24.7,34.5 24.7,30.4 3.45,21.7 3.45,26.8 18.4,32.5 3.45,38.4" />,
  },
  "<": {
    advance: 27.35,
    shape: <polygon points="23.85,43.2 23.85,38.1 8.95,32.4 23.85,26.5 23.85,21.6 2.6,30.4 2.6,34.5" />,
  },
  "–": {
    advance: 28.1,
    shape: <rect x="2.8" y="28.13" width="22.45" height="4.05" />,
  },
  "*": {
    advance: 20.65,
    shape: (
      <g transform="translate(10.35 16.08)">
        <rect x="-8.45" y="-1.6" width="16.9" height="3.2" />
        <rect x="-8.5" y="-1.6" width="17" height="3.2" transform="rotate(60)" />
        <rect x="-8.5" y="-1.6" width="17" height="3.2" transform="rotate(-60)" />
      </g>
    ),
  },

  // --- custom faces ---
  heart: {
    advance: 28,
    shape: (
      <path d="M14 43C6.6 37.2 2 32.6 2 27.6 2 24 4.7 21.4 8.1 21.4c2.5 0 4.6 1.4 5.9 3.6 1.3-2.2 3.4-3.6 5.9-3.6 3.4 0 6.1 2.6 6.1 6.2 0 5-4.6 9.6-12 15.4z" />
    ),
  },
  $: {
    advance: 26,
    shape: (
      <>
        <path
          {...stroke}
          strokeWidth={3.8}
          d="M20.3 25.8c-.9-2.4-3.2-3.8-6.3-3.8-3.8 0-6.2 2-6.2 4.9 0 6.4 13 3.8 13 10.5 0 3.2-2.8 5.4-6.8 5.4-3.6 0-6.3-1.6-7.2-4.6"
        />
        <rect x="12.1" y="17.6" width="3.8" height="29.6" />
      </>
    ),
  },
  x: {
    advance: 26,
    shape: (
      <g transform="translate(13 32.5)">
        <rect x="-11" y="-2.2" width="22" height="4.4" transform="rotate(45)" />
        <rect x="-11" y="-2.2" width="22" height="4.4" transform="rotate(-45)" />
      </g>
    ),
  },
  "@": {
    advance: 30,
    shape: (
      <>
        <circle {...stroke} strokeWidth={3.4} cx="15" cy="32.5" r="5" />
        <path
          {...stroke}
          strokeWidth={3.4}
          d="M22.6 42.2A12 12 0 1 1 27 32.5v1.9c0 2.4-1.5 3.9-3.5 3.9s-3.5-1.5-3.5-3.9V26"
        />
      </>
    ),
  },
  u: {
    advance: 28,
    shape: <path {...stroke} strokeWidth={4.4} d="M5.2 22v11c0 5.6 3.6 9.2 8.8 9.2s8.8-3.6 8.8-9.2V22" />,
  },
  "=": {
    advance: 28,
    shape: (
      <>
        <rect x="3" y="26.3" width="22" height="4.2" />
        <rect x="3" y="34.5" width="22" height="4.2" />
      </>
    ),
  },
  ";": {
    advance: 20,
    shape: (
      <>
        <circle cx="10" cy="24.6" r="3.2" />
        <path d="M7.2 35.4h5.6v4.4c0 3.2-1.3 5.6-4 7.1l-1.6-1.9c1.5-1 2.3-2.5 2.4-4.1H7.2z" />
      </>
    ),
  },
  "◕": {
    advance: 28,
    shape: (
      <>
        <circle {...stroke} strokeWidth={3.4} cx="14" cy="32.5" r="10.8" />
        <path d="M14 32.5V24.8A7.7 7.7 0 1 0 21.7 32.5z" />
      </>
    ),
  },
};

/** One eye: an SVG the width of the eye box, glyph centred by its advance. */
export const EyeSvg = memo(function EyeSvg({
  character,
  width,
}: {
  character: EyeGlyph;
  width: number;
}) {
  const glyph = EYE_GLYPHS[character];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={width}
      height={55}
      viewBox={`0 0 ${width} 55`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", flex: "none", overflow: "visible" }}
    >
      <g fill="currentColor" transform={`translate(${(width - glyph.advance + 2) / 2} 0)`}>
        {glyph.shape}
      </g>
    </svg>
  );
});
