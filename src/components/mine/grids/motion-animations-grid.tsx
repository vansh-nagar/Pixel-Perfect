"use client";
import { GridCard, GridShell } from "./_shared/grid-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useInfiniteItems } from "@/hooks/use-infinite-items";
import { RefreshCcw } from "lucide-react";
import LogoAnimation from "registry/new-york/motion-framer/logo-animation";
import SuccessRippleAnimation from "registry/new-york/motion-framer/success-ripple-animation";
import OrbitDotMotion from "registry/new-york/motion-framer/orbit-dot-motion";
import CoinSpinAnimation from "registry/new-york/motion-framer/coin-spin-animation";
import DialKnobMotion from "registry/new-york/motion-framer/dial-knob-motion";
import HoverExpandPlayer from "registry/new-york/motion-framer/hover-expand-player";

export const MotionComponentArr: {
  name: string;
  description: string;
  Component: React.ComponentType;
  registryName: string;
}[] = [
  {
    name: "Success Ripple",
    description: "Looping ripple pulses with a springy success check reveal.",
    Component: SuccessRippleAnimation,
    registryName: "success-ripple-animation",
  },
  {
    name: "Orbit Dot",
    description:
      "3D orbiting dot with perspective and constant angular velocity.",
    Component: OrbitDotMotion,
    registryName: "orbit-dot-motion",
  },
  {
    name: "Coin Spin",
    description: "3D spinning coin with layered faces and side profile.",
    Component: CoinSpinAnimation,
    registryName: "coin-spin-animation",
  },
  {
    name: "Hover Expand Player",
    description:
      "Compact pill springs open on hover — corners morph, art grows, controls reveal from blur.",
    Component: HoverExpandPlayer,
    registryName: "hover-expand-player",
  },
  {
    name: "Dial Knob",
    description:
      "Tactile rotary knob with concentric tick rings and an amber dot-arc indicator.",
    Component: DialKnobMotion,
    registryName: "dial-knob-motion",
  },
  {
    name: "Logo Animation",
    description: "Logo animation with Framer Motion and custom background.",
    Component: LogoAnimation,
    registryName: "logo-animation",
  },
];

const RefreshButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6 rounded-none text-muted-foreground hover:bg-transparent hover:text-foreground"
    onClick={onClick}
    aria-label="Replay"
  >
    <RefreshCcw className="size-3" />
  </Button>
);

const MotionAnimationsGrid = () => {
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const { visible, sentinelRef, hasMore } = useInfiniteItems(
    MotionComponentArr,
    6,
  );

  return (
    <GridShell
      footer={hasMore && <div ref={sentinelRef} aria-hidden className="h-px" />}
    >
      {visible.map((item, index) => {
        const Component = item.Component;
        return (
          <GridCard
            key={item.registryName + item.name}
            name={item.name}
            description={item.description}
            registryName={item.registryName}
            topLeft={<RefreshButton onClick={() => handleRefresh(index)} />}
          >
            <Component key={refreshKeys[index] || 0} />
          </GridCard>
        );
      })}
    </GridShell>
  );
};

export default MotionAnimationsGrid;
