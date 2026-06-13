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
import CenterSplitReveal, {
  type SplitAxis,
} from "../../../../registry/new-york/mask/center-split-reveal";
import BlindsMaskReveal, {
  type SlatOrientation,
} from "../../../../registry/new-york/mask/blinds-mask-reveal";
import ClockMaskReveal from "../../../../registry/new-york/mask/clock-mask-reveal";
import MosaicMaskReveal, {
  type MosaicOrder,
} from "../../../../registry/new-york/mask/mosaic-mask-reveal";
import IrisMaskReveal from "../../../../registry/new-york/mask/iris-mask-reveal";
import SpotlightMaskReveal from "../../../../registry/new-york/mask/spotlight-mask-reveal";
import BrushMaskReveal from "../../../../registry/new-york/mask/brush-mask-reveal";
import PinwheelMaskReveal from "../../../../registry/new-york/mask/pinwheel-mask-reveal";
import SonarMaskReveal from "../../../../registry/new-york/mask/sonar-mask-reveal";

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

const splitAxes: { value: SplitAxis; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
];

const CenterSplitRevealWrapper = () => {
  const [axis, setAxis] = useState<SplitAxis>("horizontal");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select value={axis} onValueChange={(v) => setAxis(v as SplitAxis)}>
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-32">
            {splitAxes.map((a) => (
              <SelectItem key={a.value} value={a.value} className="text-xs">
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CenterSplitReveal axis={axis} />
    </>
  );
};

const slatOrientations: { value: SlatOrientation; label: string }[] = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
];

const BlindsMaskRevealWrapper = () => {
  const [orientation, setOrientation] = useState<SlatOrientation>("vertical");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={orientation}
          onValueChange={(v) => setOrientation(v as SlatOrientation)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-32">
            {slatOrientations.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <BlindsMaskReveal orientation={orientation} />
    </>
  );
};

const mosaicOrders: { value: MosaicOrder; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "edges", label: "Edges" },
  { value: "random", label: "Random" },
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
];

const MosaicMaskRevealWrapper = () => {
  const [order, setOrder] = useState<MosaicOrder>("center");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select value={order} onValueChange={(v) => setOrder(v as MosaicOrder)}>
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-32">
            {mosaicOrders.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <MosaicMaskReveal order={order} />
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
  {
    name: "Center Split Reveal",
    description:
      "The image splits open from the middle — pick horizontal or vertical from the dropdown. Click to replay.",
    component: <CenterSplitRevealWrapper />,
    registryName: "center-split-reveal",
  },
  {
    name: "Blinds Mask Reveal",
    description:
      "The image opens through venetian-blind slats cut from a CSS mask — pick vertical or horizontal from the dropdown. Click to replay.",
    component: <BlindsMaskRevealWrapper />,
    registryName: "blinds-mask-reveal",
  },
  {
    name: "Clock Mask Reveal",
    description:
      "A conic-gradient mask sweeps a wedge around the center like a clock hand to uncover the image. Click to replay.",
    component: <ClockMaskReveal />,
    registryName: "clock-mask-reveal",
  },
  {
    name: "Mosaic Mask Reveal",
    description:
      "The image is rebuilt from a grid of tiles that pop in staggered — pick the order from the dropdown. Click to replay.",
    component: <MosaicMaskRevealWrapper />,
    registryName: "mosaic-mask-reveal",
  },
  {
    name: "Iris Mask Reveal",
    description:
      "A circular clip-path opens from wherever you click and expands to fill the frame. Click anywhere to replay.",
    component: <IrisMaskReveal />,
    registryName: "iris-mask-reveal",
  },
  {
    name: "Spotlight Mask Reveal",
    description:
      "The frame stays dark except a soft circle that follows your cursor — move to aim the flashlight, click to flood the whole frame (click again to dim).",
    component: <SpotlightMaskReveal />,
    registryName: "spotlight-mask-reveal",
  },
  {
    name: "Brush Mask Reveal",
    description:
      "The image is painted in along a thick snaking brush stroke via an animated SVG-mask stroke-dashoffset. Click to replay.",
    component: <BrushMaskReveal />,
    registryName: "brush-mask-reveal",
  },
  {
    name: "Pinwheel Mask Reveal",
    description:
      "Wedges sweep open around the center like a windmill, cut from a repeating-conic-gradient mask. Click to replay.",
    component: <PinwheelMaskReveal />,
    registryName: "pinwheel-mask-reveal",
  },
  {
    name: "Sonar Mask Reveal",
    description:
      "Concentric rings thicken outward from the center, filling the gaps until the frame resolves. Click to replay.",
    component: <SonarMaskReveal />,
    registryName: "sonar-mask-reveal",
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
