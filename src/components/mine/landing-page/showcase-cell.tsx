"use client";

import { ComponentTransition } from "@/components/ui/infinite-moving-components";

const loaders = {
  buttons: () => import("../grids/button-grid").then((m) => m.ButtonsArr),
  svg: () => import("../grids/svg-grid").then((m) => m.SvgArr),
  mouse: () =>
    import("../grids/mouse-follower-grid").then((m) => m.MouseFollowerArr),
  border: () => import("../grids/border-grid").then((m) => m.BorderArr),
  background: () =>
    import("../grids/background-grid").then((m) => m.BackgroudArr),
  text: () => import("./showcase-text").then((m) => m.TextArr),
};

export function ShowcaseCell({
  source,
  className,
}: {
  source: keyof typeof loaders;
  className?: string;
}) {
  return <ComponentTransition load={loaders[source]} className={className} />;
}
