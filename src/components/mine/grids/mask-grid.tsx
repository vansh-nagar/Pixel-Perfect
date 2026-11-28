"use client";
import { GridCard, GridShell } from "./_shared/grid-card";
import { type ReactNode } from "react";
import RectMaskReveal from "../../../../registry/new-york/mask/rect-mask-reveal";
import StarMaskReveal from "../../../../registry/new-york/mask/star-mask-reveal";

type MaskGridItem = {
  name: string;
  description: string;
  component: ReactNode;
  registryName: string;
};

export const MaskGridArr: MaskGridItem[] = [
  {
    name: "Rect Mask Reveal",
    description:
      "A clip-path rectangle grows from the center, keeping the video aspect ratio, to uncover the full image. Click to replay.",
    component: <RectMaskReveal />,
    registryName: "rect-mask-reveal",
  },
  {
    name: "Star Mask Reveal",
    description:
      "A sparkle-shaped clip-path scales up to uncover the full image. Click to replay.",
    component: <StarMaskReveal />,
    registryName: "star-mask-reveal",
  },
];

const MaskGrid = () => {
  return (
    <GridShell>
      {MaskGridArr.map((item) => (
        <GridCard
          key={item.registryName}
          name={item.name}
          description={item.description}
          registryName={item.registryName}
          contentClassName="overflow-hidden"
        >
          {item.component}
        </GridCard>
      ))}
    </GridShell>
  );
};

export default MaskGrid;
