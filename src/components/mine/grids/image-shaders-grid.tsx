"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import ImageShaderCanvas from "@/components/pixel-perfect/shaders/image-shader-canvas";
import FluidImage from "@/components/pixel-perfect/shaders/fluid-image";
import PaintReveal from "@/components/pixel-perfect/shaders/paint-reveal";
import CursorReveal from "@/components/pixel-perfect/shaders/cursor-reveal";
import BeforeAfter from "@/components/pixel-perfect/shaders/before-after";
import {
  IMAGE_SHADERS,
  type ImageShader,
} from "@/components/pixel-perfect/shaders/image-registry";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";

const FLUID_IMAGE = "/bend-image-reveal.gif";
const FLUID_IMAGE_B = "/fluid-transition.gif";
const PAINT_IMAGE = "/bend-image-reveal.gif";
const BRUSH_IMAGE = "/bend-image-reveal.gif";

const ImageShadersGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [active, setActive] = useState<ImageShader | null>(null);
  const [fluidOpen, setFluidOpen] = useState(false);
  const [paintOpen, setPaintOpen] = useState(false);
  const [brushOpen, setBrushOpen] = useState(false);
  const [scratchOpen, setScratchOpen] = useState(false);
  const [baOpen, setBaOpen] = useState(false);
  // Kept low on purpose: every tile is its own WebGL context and browsers cap
  // them at ~16. The 5 interactive tiles (Fluid, Paint, Cursor Paint, Scratch,
  // Before/After) all live on page 1, so 6 single-pass tiles keeps page 1 at 11.
  const itemsPerPage = 6;
  const totalPages = Math.ceil(IMAGE_SHADERS.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = IMAGE_SHADERS.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Esc to close + lock scroll while a full-screen preview is open.
  useEffect(() => {
    if (!active && !fluidOpen && !paintOpen && !brushOpen && !scratchOpen && !baOpen)
      return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setFluidOpen(false);
        setPaintOpen(false);
        setBrushOpen(false);
        setScratchOpen(false);
        setBaOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, fluidOpen, paintOpen, brushOpen, scratchOpen, baOpen]);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setFluidOpen(true)}
                aria-label="Preview Fluid Distortion full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <FluidImage
                  image={FLUID_IMAGE}
                  imageB={FLUID_IMAGE_B}
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>

            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Fluid Distortion
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                A real-time GPU fluid simulation — move your cursor to flow a
                second scene in over the first.
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import FluidImage from "@/components/pixel-perfect/shaders/fluid-image";\n\n<FluidImage\n  className="w-full h-full"\n  image="${FLUID_IMAGE}"\n  imageB="${FLUID_IMAGE_B}"\n/>`;
                  navigator.clipboard.writeText(code);
                  toast.success("Fluid component copied to clipboard!");
                }}
                className="text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none pointer-events-auto"
              >
                <Copy className="size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed" />
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed" />
              </Button>
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        )}
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setPaintOpen(true)}
                aria-label="Preview Paint Reveal full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <PaintReveal
                  image={PAINT_IMAGE}
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>

            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Paint Reveal
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                A pencil sketch paints itself in with organic, noisy brush edges
                — hover to reveal.
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import PaintReveal from "@/components/pixel-perfect/shaders/paint-reveal";\n\n<PaintReveal className="w-full h-full" image="${PAINT_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Paint Reveal component copied to clipboard!");
                }}
                className="text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none pointer-events-auto"
              >
                <Copy className="size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed" />
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed" />
              </Button>
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        )}
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setBrushOpen(true)}
                aria-label="Preview Cursor Paint full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <CursorReveal
                  image={BRUSH_IMAGE}
                  mode="paint"
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Cursor Paint
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Drag to paint colour back into a B&amp;W photo; strokes linger
                and fade.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import CursorReveal from "@/components/pixel-perfect/shaders/cursor-reveal";\n\n<CursorReveal className="w-full h-full" image="${BRUSH_IMAGE}" mode="paint" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Cursor Paint component copied to clipboard!");
                }}
                className="text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none pointer-events-auto"
              >
                <Copy className="size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed" />
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed" />
              </Button>
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        )}
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setScratchOpen(true)}
                aria-label="Preview Scratch to Reveal full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <CursorReveal
                  image={BRUSH_IMAGE}
                  mode="scratch"
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Scratch to Reveal
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Scratch off the frosted glass with your cursor to uncover the
                image.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import CursorReveal from "@/components/pixel-perfect/shaders/cursor-reveal";\n\n<CursorReveal className="w-full h-full" image="${BRUSH_IMAGE}" mode="scratch" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Scratch component copied to clipboard!");
                }}
                className="text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none pointer-events-auto"
              >
                <Copy className="size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed" />
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed" />
              </Button>
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        )}
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setBaOpen(true)}
                aria-label="Preview Before After full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <BeforeAfter
                  image={FLUID_IMAGE}
                  imageB={FLUID_IMAGE_B}
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Before / After
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Drag the handle to wipe between two images with a liquid seam.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import BeforeAfter from "@/components/pixel-perfect/shaders/before-after";\n\n<BeforeAfter\n  className="w-full h-full"\n  image="${FLUID_IMAGE}"\n  imageB="${FLUID_IMAGE_B}"\n  interactive\n/>`;
                  navigator.clipboard.writeText(code);
                  toast.success("Before/After component copied to clipboard!");
                }}
                className="text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none pointer-events-auto"
              >
                <Copy className="size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed" />
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed" />
              </Button>
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        )}
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center"
          >
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setActive(item)}
                aria-label={`Preview ${item.title} image shader full screen`}
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <ImageShaderCanvas
                  fragmentShader={item.fragmentShader}
                  image={item.image}
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>

            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                {item.title}
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                {item.description}
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import ImageShaderCanvas from "@/components/pixel-perfect/shaders/image-shader-canvas";\n\n<ImageShaderCanvas\n  className="w-full h-full"\n  image="${item.image}"\n  fragmentShader={\`${item.fragmentShader.trim()}\`}\n/>`;
                  navigator.clipboard.writeText(code);
                  toast.success("Image shader code copied to clipboard!");
                }}
                className="text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none pointer-events-auto"
              >
                <Copy className="size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed" />
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed" />
              </Button>
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-dashed rounded-none"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 rounded-none border-dashed"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="border-dashed rounded-none"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {active &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${active.title} image shader preview`}
            className="fixed inset-0 z-[9999] bg-black"
          >
            <ImageShaderCanvas
              fragmentShader={active.fragmentShader}
              image={active.image}
              className="h-full w-full"
              controls
            />
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              {active.title}
              <span className="ml-2 text-white/40">
                move cursor · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {fluidOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Fluid Distortion preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <FluidImage
              image={FLUID_IMAGE}
              imageB={FLUID_IMAGE_B}
              className="h-full w-full"
              controls
            />
            <button
              type="button"
              onClick={() => setFluidOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Fluid Distortion
              <span className="ml-2 text-white/40">
                move cursor · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {paintOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Paint Reveal preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <PaintReveal image={PAINT_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setPaintOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Paint Reveal
              <span className="ml-2 text-white/40">
                sketch → painted · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {brushOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cursor Paint preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <CursorReveal image={BRUSH_IMAGE} mode="paint" className="h-full w-full" />
            <button
              type="button"
              onClick={() => setBrushOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Cursor Paint
              <span className="ml-2 text-white/40">
                drag to paint · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {scratchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Scratch to Reveal preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <CursorReveal image={BRUSH_IMAGE} mode="scratch" className="h-full w-full" />
            <button
              type="button"
              onClick={() => setScratchOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Scratch to Reveal
              <span className="ml-2 text-white/40">
                drag to scratch · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {baOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Before After preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <BeforeAfter
              image={FLUID_IMAGE}
              imageB={FLUID_IMAGE_B}
              className="h-full w-full"
              interactive
            />
            <button
              type="button"
              onClick={() => setBaOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Before / After
              <span className="ml-2 text-white/40">
                move cursor to wipe · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ImageShadersGrid;
