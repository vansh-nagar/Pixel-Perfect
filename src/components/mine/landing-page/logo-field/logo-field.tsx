"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const LogoFieldScene = dynamic(
  () => import("./logo-field-scene").then((m) => m.LogoFieldScene),
  { ssr: false },
);

const noopSubscribe = () => () => {};

/**
 * Floating 3D Pixel Perfect logos scattered down the whole page, drawn on
 * one fixed, click-through canvas above the content.
 */
export function LogoField() {
  const { resolvedTheme } = useTheme();
  // false on the server and during hydration, true after: the theme is only
  // known on the client, so the canvas must not be part of the hydrated HTML.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!hydrated || !resolvedTheme) return null;
  return <LogoFieldScene theme={resolvedTheme === "dark" ? "dark" : "light"} />;
}
