"use client";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const GRADIENTS = [
  {
    name: "Subpixel",
    description: "Soft blue-lavender mesh gradient.",
    src: "/img-gradient/gradient-1.png",
  },
  {
    name: "Hot Pixel",
    description: "Warm pink-to-magenta mesh gradient.",
    src: "/img-gradient/gradient-2.png",
  },
  {
    name: "Full Spectrum",
    description: "Multi-hue pastel mesh gradient.",
    src: "/img-gradient/gradient-3.png",
  },
  {
    name: "Vector Tide",
    description: "Cool cyan-to-indigo mesh gradient.",
    src: "/img-gradient/gradient-4.png",
  },
  {
    name: "Dark Mode",
    description: "Deep navy aurora with teal & magenta.",
    src: "/img-gradient/gradient-5.png",
  },
  {
    name: "Anti-Alias",
    description: "Lavender & mint with a poppy-red bloom.",
    src: "/img-gradient/gradient-6.png",
  },
  {
    name: "Frame Buffer",
    description: "Midnight navy into dodger blue & cyan.",
    src: "/img-gradient/gradient-7.png",
  },
  {
    name: "Hue Shift",
    description: "Electric blue-violet bleeding into red.",
    src: "/img-gradient/gradient-8.png",
  },
  {
    name: "Wireframe",
    description: "Gunmetal slate mesh in greys & greens.",
    src: "/img-gradient/gradient-9.png",
  },
];

export const ImageGradientArr = GRADIENTS.map((g) => ({
  ...g,
  component: (
    <img
      src={g.src}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover"
    />
  ),
}));

const ImageGradientGrid = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyImage = async (src: string, index: number) => {
    try {
      // Construct the ClipboardItem with a Blob promise so Safari (which
      // requires the item to be built synchronously in the click handler)
      // and Chromium both accept it.
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": fetch(src).then((res) => res.blob()),
        }),
      ]);
      setCopiedIndex(index);
      toast.success("Image copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy image.");
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {GRADIENTS.map((item, index) => (
        <div
          key={index}
          className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center overflow-hidden"
        >
          <img
            src={item.src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute left-1.5 bottom-1.5 z-40 leading-1">
            <p className="text-xs">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>

          <div className="absolute top-0 right-0 z-40">
            <Button
              size={"sm"}
              variant={"copy"}
              onClick={() => copyImage(item.src, index)}
              className="text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none"
            >
              {copiedIndex === index ? (
                <Check className="size-3 text-green-500" />
              ) : (
                <Copy className="size-3" />
              )}{" "}
              {copiedIndex === index ? "Copied" : "Copy"}
              <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed"></span>
              <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed"></span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGradientGrid;
