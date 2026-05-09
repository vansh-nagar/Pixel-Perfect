"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

interface ChunkySliderProps {
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
  onChange?: (v: number) => void;
  className?: string;
}

const TRACK_BG =
  "repeating-linear-gradient(90deg, transparent 0 5px, rgba(0,0,0,0.22) 5px 6px), #ece4d0";

const RANGE_BG = "#0a0a0a";

const THUMB_BG = "#fdfaf2";

const EYE_BG = "#000";

export default function ChunkySlider({
  defaultValue = 35,
  min = 0,
  max = 100,
  step = 1,
  width = 220,
  onChange,
  className = "",
}: ChunkySliderProps) {
  const [value, setValue] = React.useState<number[]>([defaultValue]);

  const handleChange = (next: number[]) => {
    setValue(next);
    onChange?.(next[0]);
  };

  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={handleChange}
      min={min}
      max={max}
      step={step}
      style={{ width }}
      className={`relative flex h-9 touch-none items-center select-none ${className}`}
    >
      <SliderPrimitive.Track
        className="relative h-9 w-full grow overflow-hidden rounded-full"
        style={{
          background: TRACK_BG,
          boxShadow:
            "inset 0 2px 3px rgba(0,0,0,0.15), inset 0 -1px 1px rgba(255,255,255,0.85), 0 6px 14px -6px rgba(0,0,0,0.35), 0 2px 3px -2px rgba(0,0,0,0.18)",
        }}
      >
        <SliderPrimitive.Range
          className="absolute h-full"
          style={{
            background: RANGE_BG,
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.5)",
          }}
        />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb
        aria-label="Value"
        className="relative block size-10 shrink-0 cursor-grab rounded-full transition-transform active:cursor-grabbing active:scale-[0.97] focus-visible:outline-hidden"
        style={{
          background: THUMB_BG,
          boxShadow:
            "0 6px 10px rgba(0,0,0,0.32), 0 2px 3px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.95), inset 0 -2px 3px rgba(0,0,0,0.08)",
        }}
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: EYE_BG,
            boxShadow:
              "inset 0 1px 1.5px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.55), 0 1px 1px rgba(255,255,255,0.6)",
          }}
        />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
}
