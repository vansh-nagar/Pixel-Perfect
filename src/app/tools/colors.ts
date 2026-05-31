export const COLORS = [
  "cyan",
  "magenta",
  "yellow",
  "green",
  "orange",
  "blue",
  "red",
  "purple",
  "white",
  "teal",
  "pink",
  "lime",
] as const;

export type Color = (typeof COLORS)[number];

export const colorSwatch = (c: Color): string => {
  const map: Record<Color, string> = {
    cyan: "oklch(80% 0.25 195)",
    magenta: "oklch(75% 0.3 330)",
    yellow: "oklch(90% 0.25 90)",
    green: "oklch(80% 0.3 145)",
    orange: "oklch(75% 0.28 50)",
    blue: "oklch(70% 0.28 260)",
    red: "oklch(60% 0.3 25)",
    purple: "oklch(65% 0.28 300)",
    white: "oklch(95% 0 0)",
    teal: "oklch(72% 0.24 175)",
    pink: "oklch(70% 0.26 350)",
    lime: "oklch(80% 0.28 120)",
  };
  return map[c];
};
