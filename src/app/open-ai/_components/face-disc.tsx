"use client";

/**
 * A flat face as a carousel disc: the face's circle is the disc, its eyes follow the
 * cursor, and the play action registered with the carousel runs one of its animations.
 */

import { useEffect, useRef, useState } from "react";
import { DevdayAgent, type AgentAnimation } from "./devday-agent";
import type { RosterFace } from "./face-roster";

export type PlayFace = (animation?: AgentAnimation) => void;

export function FaceDisc({
  entry,
  diameter,
  inset,
  active,
  register,
}: {
  entry: RosterFace;
  /** Disc diameter in px; the face circle is drawn this size. */
  diameter: number;
  /** Distance from the card edge to the disc. */
  inset: number;
  /** False while off-screen: pauses the keyframes and the cursor gaze. */
  active: boolean;
  register: (play: PlayFace | null) => void;
}) {
  const [animation, setAnimation] = useState<AgentAnimation | null>(null);
  const next = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    register((kind) => {
      if (busy.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      busy.current = true;
      setAnimation(kind ?? entry.animations[next.current++ % entry.animations.length]);
    });
    return () => register(null);
  }, [register, entry]);

  // The agent canvas is 190x166 per 100px of face, with the circle at (40, 32).
  const scale = diameter / 100;
  return (
    <DevdayAgent
      mode={entry.name}
      face={entry.face}
      animation={animation ?? "look-around"}
      animationEnabled={animation !== null}
      mouseControl={active}
      playing={active}
      showExtras={false}
      size={diameter}
      onComplete={() => {
        busy.current = false;
        setAnimation(null);
      }}
      style={{ position: "absolute", left: inset - 40 * scale, top: inset - 32 * scale }}
    />
  );
}
