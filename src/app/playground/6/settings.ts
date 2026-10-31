// Everything the control panel can change. The scene eases toward these values every
// frame, so dragging a slider or switching palettes animates instead of snapping.

export type Settings = {
  palette: number;
  hue: number;
  saturation: number;
  speed: number;
  length: number;
  spin: number;
  twist: number;
  waist: number;
  lean: number;
  brightness: number;
  glow: number;
  blur: number;
  dust: number;
  aberration: number;
};

export type Palette = {
  name: string;
  // Six streak colours (linear RGB, used as HDR multipliers), then the two fringe edges.
  colors: [number, number, number][];
  fringe: [[number, number, number], [number, number, number]];
};

export const PALETTES: Palette[] = [
  {
    name: "Ember",
    colors: [[1, 0.72, 0.48], [1, 0.28, 0.03], [1, 0.5, 0.12], [0.1, 0.8, 1], [0.55, 0.33, 1], [1, 0.32, 0.62]],
    fringe: [[1, 0.42, 0.12], [0.3, 0.75, 1]],
  },
  {
    name: "Aurora",
    colors: [[0.6, 1, 0.85], [0.1, 0.9, 0.55], [0.15, 0.75, 1], [0.35, 1, 0.4], [0.55, 0.35, 1], [0.85, 1, 0.95]],
    fringe: [[0.2, 1, 0.6], [0.5, 0.3, 1]],
  },
  {
    name: "Prism",
    colors: [[1, 0.15, 0.1], [1, 0.55, 0.05], [1, 0.95, 0.2], [0.2, 1, 0.35], [0.15, 0.45, 1], [0.65, 0.2, 1]],
    fringe: [[1, 0.2, 0.15], [0.2, 0.4, 1]],
  },
  {
    name: "Glacier",
    colors: [[0.75, 0.9, 1], [0.25, 0.65, 1], [0.1, 0.9, 1], [0.6, 0.55, 1], [0.95, 0.97, 1], [0.2, 1, 0.85]],
    fringe: [[0.4, 0.8, 1], [0.6, 0.45, 1]],
  },
  {
    name: "Plasma",
    colors: [[1, 0.35, 0.85], [0.6, 0.2, 1], [0.25, 0.35, 1], [1, 0.2, 0.45], [1, 0.55, 0.2], [1, 0.8, 0.95]],
    fringe: [[1, 0.25, 0.6], [0.35, 0.3, 1]],
  },
  {
    name: "Mono",
    colors: [[1, 0.97, 0.94], [0.9, 0.88, 0.85], [1, 1, 1], [0.8, 0.82, 0.85], [0.95, 0.93, 0.9], [1, 0.98, 0.96]],
    fringe: [[1, 0.95, 0.9], [0.9, 0.93, 1]],
  },
];

export const DEFAULTS: Settings = {
  palette: 0,
  hue: 0,
  saturation: 1,
  speed: 1,
  length: 1,
  spin: 0.04,
  twist: 0.75,
  waist: 0.46,
  lean: 0.06,
  brightness: 0.13,
  glow: 1.25,
  blur: 0.42,
  dust: 1,
  aberration: 0.35,
};

// Saved looks: every setting at once, picked from the top of the panel.
export const PRESETS: { name: string; settings: Settings }[] = [
  { name: "Default", settings: DEFAULTS },
  {
    name: "Silk",
    settings: {
      palette: 5,
      hue: 242,
      saturation: 1,
      speed: 0.78,
      length: 0.44,
      spin: 0.6,
      twist: 1.8,
      waist: 0.2,
      lean: 0.5,
      brightness: 0.06,
      glow: 1.25,
      blur: 1.2,
      dust: 1,
      aberration: 0.35,
    },
  },
];

export const matchesPreset = (a: Settings, b: Settings) =>
  (Object.keys(a) as (keyof Settings)[]).every((k) => Math.abs(a[k] - b[k]) < 1e-3);

export type Control = { key: Exclude<keyof Settings, "palette">; label: string; min: number; max: number; step: number; format?: (v: number) => string };

const pct = (v: number) => `${Math.round(v * 100)}%`;
const times = (v: number) => `${v.toFixed(2)}×`;

export const GROUPS: { title: string; controls: Control[] }[] = [
  {
    title: "Flow",
    controls: [
      { key: "speed", label: "Speed", min: 0, max: 4, step: 0.01, format: times },
      { key: "length", label: "Streak length", min: 0.2, max: 3, step: 0.01, format: times },
      { key: "spin", label: "Spin", min: -0.6, max: 0.6, step: 0.01, format: (v) => v.toFixed(2) },
    ],
  },
  {
    title: "Shape",
    controls: [
      { key: "twist", label: "Twist", min: 0, max: 1.8, step: 0.01, format: (v) => `${Math.round((v * 180) / Math.PI)}°` },
      { key: "waist", label: "Waist", min: 0.2, max: 0.9, step: 0.01, format: (v) => v.toFixed(2) },
      { key: "lean", label: "Lean", min: -0.5, max: 0.5, step: 0.01, format: (v) => v.toFixed(2) },
    ],
  },
  {
    title: "Light",
    controls: [
      { key: "hue", label: "Hue", min: 0, max: 360, step: 1, format: (v) => `${Math.round(v)}°` },
      { key: "saturation", label: "Saturation", min: 0, max: 2, step: 0.01, format: pct },
      { key: "brightness", label: "Brightness", min: 0.03, max: 0.32, step: 0.005, format: (v) => pct(v / DEFAULTS.brightness) },
      { key: "glow", label: "Glow", min: 0, max: 3.5, step: 0.01, format: times },
      { key: "blur", label: "Depth of field", min: 0, max: 1.2, step: 0.01, format: pct },
      { key: "dust", label: "Dust", min: 0, max: 3, step: 0.01, format: pct },
      { key: "aberration", label: "Aberration", min: 0, max: 1.5, step: 0.01, format: pct },
    ],
  },
];

// A random look that still reads well: bounded tighter than the slider ranges.
export const randomSettings = (): Settings => {
  const r = (a: number, b: number) => a + Math.random() * (b - a);
  return {
    palette: Math.floor(Math.random() * PALETTES.length),
    hue: Math.random() < 0.5 ? 0 : r(0, 360),
    saturation: r(0.8, 1.5),
    speed: r(0.6, 2.2),
    length: r(0.6, 2),
    spin: r(-0.2, 0.2),
    twist: r(0.3, 1.4),
    waist: r(0.3, 0.65),
    lean: r(-0.25, 0.25),
    brightness: r(0.1, 0.18),
    glow: r(0.9, 2),
    blur: r(0.2, 0.7),
    dust: r(0.5, 2),
    aberration: r(0.2, 0.9),
  };
};
