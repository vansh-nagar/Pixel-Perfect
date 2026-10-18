"use client";

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
  diameter: number;
  inset: number;
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
