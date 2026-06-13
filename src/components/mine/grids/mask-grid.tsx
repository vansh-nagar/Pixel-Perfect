"use client";
import { useState, type ReactNode } from "react";
import CopyDropdown from "../copy-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RectMaskReveal from "../../../../registry/new-york/mask/rect-mask-reveal";
import StarMaskReveal from "../../../../registry/new-york/mask/star-mask-reveal";
import DirectionalMaskReveal, {
  type WipeDirection,
} from "../../../../registry/new-york/mask/directional-mask-reveal";

type MaskGridItem = {
  name: string;
  description: string;
  component: ReactNode;
  registryName: string;
};

const wipeDirections: { value: WipeDirection; label: string }[] = [
  { value: "bottom", label: "Bottom → Top" },
  { value: "top", label: "Top → Bottom" },
  { value: "left", label: "Left → Right" },
  { value: "right", label: "Right → Left" },
];

const DirectionalMaskRevealWrapper = () => {
  const [direction, setDirection] = useState<WipeDirection>("bottom");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={direction}
          onValueChange={(v) => setDirection(v as WipeDirection)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-32">
            {wipeDirections.map((d) => (
              <SelectItem key={d.value} value={d.value} className="text-xs">
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DirectionalMaskReveal direction={direction} />
    </>
  );
};

// Mask animations land here — add an entry per promoted component.
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
  {
    name: "Directional Mask Reveal",
    description:
      "The image wipes in from a chosen edge — pick the direction from the dropdown. Click to replay.",
    component: <DirectionalMaskRevealWrapper />,
    registryName: "directional-mask-reveal",
  },
];

const MaskGrid = () => {
  if (MaskGridArr.length === 0) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center text-sm text-muted-foreground">
        No mask animations yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {MaskGridArr.map((item, index) => (
        <div
          key={index}
          className="relative flex aspect-square w-full items-center justify-center border-b border-l border-dashed"
        >
          <div className="z-30">{item.component}</div>

          <div className="leading-1 absolute bottom-1.5 left-1.5">
            <p className="text-xs">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="absolute inset-x-0 top-0 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
            <div className="border-t border-dashed" />
            <CopyDropdown registryName={item.registryName} variant="ghost" />
            <div />
            <div className="h-full border-r border-dashed mr-[-0.5px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaskGrid;
