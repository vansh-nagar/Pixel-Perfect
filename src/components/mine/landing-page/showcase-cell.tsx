"use client";

import { ComponentTransition } from "@/components/ui/infinite-moving-components";

const loaders = {
  buttons: () => import("../grids/button-grid").then((m) => m.ButtonsArr),
  motion: () =>
    import("../grids/motion-animations-grid").then((m) =>
      m.MotionComponentArr.map(({ Component, ...item }) => ({
        ...item,
        component: <Component />,
      })),
    ),
  mouse: () =>
    import("../grids/mouse-follower-grid").then((m) => m.MouseFollowerArr),
  mask: () => import("../grids/mask-grid").then((m) => m.MaskGridArr),
  background: () =>
    import("../grids/background-grid").then((m) => m.BackgroudArr),
  gsap: () => import("../grids/gsap-grid").then((m) => m.GsapStaggerGridArr),
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
