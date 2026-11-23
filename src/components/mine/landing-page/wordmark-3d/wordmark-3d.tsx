"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  PIXEL_WORDMARK_PATH,
  PIXEL_WORDMARK_VIEWBOX,
} from "../pixel-wordmark-path";

const Wordmark3DScene = dynamic(
  () => import("./wordmark-3d-scene").then((m) => m.Wordmark3DScene),
  { ssr: false, loading: () => <FlatWordmark /> },
);

const noopSubscribe = () => () => {};

/** The original flat SVG; shown on the server and until the 3D one loads. */
function FlatWordmark() {
  const { width, height } = PIXEL_WORDMARK_VIEWBOX;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="w-full h-auto"
      fill="currentColor"
    >
      <path d={PIXEL_WORDMARK_PATH} />
    </svg>
  );
}

/** "Pixel Perfect" pixel wordmark, extruded in 3D with the site's glass. */
export function Wordmark3D({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return (
    <div className={className} role="img" aria-label="Pixel Perfect">
      {hydrated && resolvedTheme ? (
        <Wordmark3DScene theme={resolvedTheme === "dark" ? "dark" : "light"} />
      ) : (
        <FlatWordmark />
      )}
    </div>
  );
}
