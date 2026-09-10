"use client";

import { useEffect, useState } from "react";
import { DesignEngineerCard } from "@/components/pixel-perfect/design-engineer/design-engineer-card";

export function CaptureStage() {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const update = (event: Event) => setExpanded((event as CustomEvent<boolean>).detail);
    window.addEventListener("recorder-state", update);
    document.documentElement.dataset.captureReady = "true";
    return () => {
      window.removeEventListener("recorder-state", update);
      delete document.documentElement.dataset.captureReady;
    };
  }, []);
  return (
    <div data-capture-stage style={{ position: "fixed", inset: 0, zIndex: 2147483647, background: "#f3f3ef", overflow: "hidden" }}>
      <style>{`[data-capture-stage] > section { min-height: 100vh; height: 100vh; } [data-capture-stage] button { cursor: none; }`}</style>
      <DesignEngineerCard recordingExpanded={expanded} />
    </div>
  );
}
