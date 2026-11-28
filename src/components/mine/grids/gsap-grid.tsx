"use client";
import { GridCard, GridShell } from "./_shared/grid-card";
import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";
import { useInfiniteItems } from "@/hooks/use-infinite-items";
import { RefreshCcw } from "lucide-react";
import TextAlongPath from "registry/new-york/gsap/text-along-path";
import ColorFlairButton from "registry/new-york/motion-framer/color-flair-button";

type GridItem = {
  name: string;
  description: string;
  component: ReactNode;
  registryName: string;
  span?: 1 | 2; // how many columns the card covers (default 1)
};

export const GsapStaggerGridArr: GridItem[] = [
  {
    name: "Text Along Path",
    description:
      "Repeated text glides endlessly around a curved SVG path, looped seamlessly with a GSAP timeline.",
    component: <TextAlongPath />,
    registryName: "text-along-path",
    span: 2,
  },
  {
    name: "Color Flair Button",
    description:
      "Concentric color circles bloom from the cursor's entry point, trail it, and peel back on exit.",
    component: <ColorFlairButton />,
    registryName: "color-flair-button",
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

const GsapGrid = () => {
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const { visible, sentinelRef, hasMore } = useInfiniteItems(
    GsapStaggerGridArr,
    6,
  );

  return (
    <GridShell
      footer={hasMore && <div ref={sentinelRef} aria-hidden className="h-px" />}
    >
      {visible.map((item, index) => (
        <GridCard
          key={item.registryName}
          name={item.name}
          description={item.description}
          registryName={item.registryName}
          className={item.span === 2 ? "aspect-2/1 sm:col-span-2" : undefined}
          contentClassName={item.span === 2 ? "h-full p-6" : undefined}
          topLeft={<RefreshButton onClick={() => handleRefresh(index)} />}
        >
          <div key={refreshKeys[index] || 0} className="contents">
            {item.component}
          </div>
        </GridCard>
      ))}
    </GridShell>
  );
};

export default GsapGrid;
