/**
 * Every flat face on the avatar carousel: the six DevDay originals (openai.com's
 * agent faces, eyes redrawn as SVG) and eight custom faces in the same style.
 * Tapping a face plays its next animation.
 */

import { AGENT_MODES, AGENT_STATES, type AgentAnimation, type FaceSpec } from "./devday-agent";

export type RosterFace = { name: string; face: FaceSpec; animations: AgentAnimation[] };

const EMPTY = { character: "", x: 50, y: 25 };

/** The originals cycle through these, each starting at its own index. */
const ORIGINAL_ANIMATIONS: AgentAnimation[] = ["look-around", "nod", "hop", "wiggle", "spin"];

const ORIGINALS: RosterFace[] = AGENT_MODES.map((mode, index) => ({
  name: mode,
  face: AGENT_STATES[mode],
  animations: [...ORIGINAL_ANIMATIONS.slice(index % 5), ...ORIGINAL_ANIMATIONS.slice(0, index % 5)],
}));

/*
 * Eye widths drive the resting layout (centred, 50.0855px apart). The x/y/
 * rotation values are each face's "bespoke" pose, the one the eyes swing to
 * while an animation plays.
 */
const CUSTOM: RosterFace[] = [
  {
    name: "love",
    animations: ["heartbeat"],
    face: {
      color: "#ff5fa2",
      eyeColor: "#000000",
      eyes: [
        { character: "heart", width: 28, x: 13, y: 18, rotation: -10 },
        { character: "heart", width: 28, x: 59, y: 18, rotation: 10 },
      ],
      expressions: [EMPTY],
    },
  },
  {
    name: "money",
    animations: ["spin"],
    face: {
      color: "#ffd21f",
      eyeColor: "#000000",
      eyes: [
        { character: "$", width: 26, x: 7, y: 24, rotation: -12 },
        { character: "$", width: 26, x: 67, y: 24, rotation: 12 },
      ],
      expressions: [EMPTY],
    },
  },
  {
    name: "knocked-out",
    animations: ["dizzy"],
    face: {
      color: "#ff3b30",
      eyeColor: "#000000",
      eyes: [
        { character: "x", width: 26, x: 10, y: 28, rotation: 20 },
        { character: "x", width: 26, x: 63, y: 18, rotation: -20 },
      ],
      expressions: [EMPTY],
    },
  },
  {
    name: "online",
    animations: ["wiggle"],
    face: {
      color: "#00b3a7",
      eyeColor: "#000000",
      eyes: [
        { character: "@", width: 30, x: 4, y: 19, rotation: -10 },
        { character: "@", width: 30, x: 58, y: 26, rotation: 10 },
      ],
      expressions: [EMPTY],
    },
  },
  {
    name: "sleepy",
    animations: ["sleepy"],
    face: {
      color: "#b8a6ff",
      eyeColor: "#000000",
      eyes: [
        { character: "u", width: 28, x: 12, y: 30 },
        { character: "u", width: 28, x: 60, y: 31 },
      ],
      expressions: [EMPTY],
    },
  },
  {
    name: "calm",
    animations: ["nod"],
    face: {
      color: "#7fe0b6",
      eyeColor: "#000000",
      eyes: [
        { character: "=", width: 28, x: 11, y: 30 },
        { character: "=", width: 28, x: 61, y: 30 },
      ],
      expressions: [EMPTY],
    },
  },
  {
    name: "crying",
    animations: ["cry"],
    face: {
      color: "#ff7a59",
      eyeColor: "#000000",
      eyes: [
        { character: ";", width: 20, x: 17, y: 25, rotation: -8 },
        { character: ";", width: 20, x: 63, y: 25, rotation: 8 },
      ],
      expressions: [EMPTY],
      tearColor: "#6ec6ff",
    },
  },
  {
    name: "curious",
    animations: ["look-around"],
    face: {
      color: "#f4f4f4",
      eyeColor: "#000000",
      eyes: [
        { character: "◕", width: 28, x: 22, y: 19 },
        { character: "◕", width: 28, x: 70, y: 15 },
      ],
      expressions: [EMPTY],
    },
  },
];

export const FACE_ROSTER: Record<string, RosterFace> = Object.fromEntries(
  [...ORIGINALS, ...CUSTOM].map((face) => [face.name, face]),
);
