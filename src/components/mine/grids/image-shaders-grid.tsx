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
import ImageParticles from "@/components/pixel-perfect/shaders/image-particles";
import InertiaParticles from "@/components/pixel-perfect/shaders/inertia-particles";
import MagneticSwarm from "@/components/pixel-perfect/shaders/magnetic-swarm";
import FlowField from "@/components/pixel-perfect/shaders/flow-field";
import RippleTouch from "@/components/pixel-perfect/shaders/ripple-touch";
import PixelDistortion from "@/components/pixel-perfect/shaders/pixel-distortion";
import MagneticWarp from "@/components/pixel-perfect/shaders/magnetic-warp";
import CursorTrailSmear from "@/components/pixel-perfect/shaders/cursor-trail-smear";
import LiquidMelt from "@/components/pixel-perfect/shaders/liquid-melt";
import VortexPull from "@/components/pixel-perfect/shaders/vortex-pull";
import JellyBulge from "@/components/pixel-perfect/shaders/jelly-bulge";
import LazyVisible from "@/components/mine/lazy-visible";
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
  const [particlesOpen, setParticlesOpen] = useState(false);
  const [inertiaOpen, setInertiaOpen] = useState(false);
  const [swarmOpen, setSwarmOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [rippleOpen, setRippleOpen] = useState(false);
  const [warpOpen, setWarpOpen] = useState(false);
  const [trailOpen, setTrailOpen] = useState(false);
  const [meltOpen, setMeltOpen] = useState(false);
  const [vortexOpen, setVortexOpen] = useState(false);
  const [jellyOpen, setJellyOpen] = useState(false);
  // The 16 hand-built interactive tiles (Pixel Distortion, Fluid, Paint, Cursor
  // Paint, Scratch, Before/After, Particles, Inertia, Swarm, Flow Field, Ripple,
  // Magnetic Warp, Cursor Trail, Liquid Melt, Vortex Pull, Jelly Bulge) all live
  // on page 1; the registry shaders paginate over pages 2+. Each shader tile is
  // wrapped in <LazyVisible>, so only the tiles near the viewport hold a live
  // WebGL context (browsers cap at ~16) — the rest tear down until scrolled to.
  const itemsPerPage = 12;
  const RESERVED_FIRST_PAGE = 16;
  const firstPageItems = Math.max(0, itemsPerPage - RESERVED_FIRST_PAGE);
  const totalPages =
    IMAGE_SHADERS.length <= firstPageItems
      ? 1
      : 1 + Math.ceil((IMAGE_SHADERS.length - firstPageItems) / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex =
    currentPage === 1 ? 0 : firstPageItems + (currentPage - 2) * itemsPerPage;
  const itemsOnPage = currentPage === 1 ? firstPageItems : itemsPerPage;
  const paginatedItems = IMAGE_SHADERS.slice(
    startIndex,
    startIndex + itemsOnPage,
  );

  // Esc to close + lock scroll while a full-screen preview is open.
  useEffect(() => {
    if (
      !active &&
      !fluidOpen &&
      !paintOpen &&
      !brushOpen &&
      !scratchOpen &&
      !baOpen &&
      !particlesOpen &&
      !inertiaOpen &&
      !swarmOpen &&
      !flowOpen &&
      !rippleOpen &&
      !warpOpen &&
      !trailOpen &&
      !meltOpen &&
      !vortexOpen &&
      !jellyOpen
    )
      return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setFluidOpen(false);
        setPaintOpen(false);
        setBrushOpen(false);
        setScratchOpen(false);
        setBaOpen(false);
        setParticlesOpen(false);
        setInertiaOpen(false);
        setSwarmOpen(false);
        setFlowOpen(false);
        setRippleOpen(false);
        setWarpOpen(false);
        setTrailOpen(false);
        setMeltOpen(false);
        setVortexOpen(false);
        setJellyOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [
    active,
    fluidOpen,
    paintOpen,
    brushOpen,
    scratchOpen,
    baOpen,
    particlesOpen,
    inertiaOpen,
    swarmOpen,
    flowOpen,
    rippleOpen,
    warpOpen,
    trailOpen,
    meltOpen,
    vortexOpen,
    jellyOpen,
  ]);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <LazyVisible className="absolute inset-0 w-full h-full">
                <PixelDistortion
                  image={FLUID_IMAGE}
                  dpr={1.25}
                  className="w-full h-full"
                />
              </LazyVisible>
            </div>

            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Pixel Distortion
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Move your cursor to smear the image pixels along a relaxing grid.
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import PixelDistortion from "@/components/pixel-perfect/shaders/pixel-distortion";\n\n<PixelDistortion\n  className="w-full h-full"\n  image="${FLUID_IMAGE}"\n/>`;
                  navigator.clipboard.writeText(code);
                  toast.success("Pixel Distortion component copied to clipboard!");
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
                onClick={() => setFluidOpen(true)}
                aria-label="Preview Fluid Distortion full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <FluidImage
                    image={FLUID_IMAGE}
                    imageB={FLUID_IMAGE_B}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
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
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <PaintReveal
                    image={PAINT_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
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
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <CursorReveal
                    image={BRUSH_IMAGE}
                    mode="paint"
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
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
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <CursorReveal
                    image={BRUSH_IMAGE}
                    mode="scratch"
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
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
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <BeforeAfter
                    image={FLUID_IMAGE}
                    imageB={FLUID_IMAGE_B}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
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
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setParticlesOpen(true)}
                aria-label="Preview Image Particles full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <ImageParticles
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Image Particles
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                The image is shattered into a drifting grid of particles — move
                your cursor to scatter them.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import ImageParticles from "@/components/pixel-perfect/shaders/image-particles";\n\n<ImageParticles className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Image Particles component copied to clipboard!");
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
                onClick={() => setInertiaOpen(true)}
                aria-label="Preview Inertia Particles full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <InertiaParticles
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Inertia Particles
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Move your cursor to shove the particles aside — a damped spring
                bounces them back home with inertia.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import InertiaParticles from "@/components/pixel-perfect/shaders/inertia-particles";\n\n<InertiaParticles className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Inertia Particles component copied to clipboard!");
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
                onClick={() => setSwarmOpen(true)}
                aria-label="Preview Magnetic Swarm full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <MagneticSwarm
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Magnetic Swarm
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Particles are sucked into a swirling swarm around your cursor,
                then drift home when you leave.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import MagneticSwarm from "@/components/pixel-perfect/shaders/magnetic-swarm";\n\n<MagneticSwarm className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Magnetic Swarm component copied to clipboard!");
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
                onClick={() => setFlowOpen(true)}
                aria-label="Preview Flow Field full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <FlowField
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Flow Field
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Particles stream along curl-noise currents that reform the image
                — move your cursor to stir the flow.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import FlowField from "@/components/pixel-perfect/shaders/flow-field";\n\n<FlowField className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Flow Field component copied to clipboard!");
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
                onClick={() => setRippleOpen(true)}
                aria-label="Preview Ripple Touch full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <RippleTouch
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Ripple Touch
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Move or click to drop water ripples that expand and refract the
                image like a pond surface.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import RippleTouch from "@/components/pixel-perfect/shaders/ripple-touch";\n\n<RippleTouch className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Ripple Touch component copied to clipboard!");
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
                onClick={() => setWarpOpen(true)}
                aria-label="Preview Magnetic Warp full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <MagneticWarp
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Magnetic Warp
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                The image gathers toward your cursor like iron filings, then
                springs and wobbles back home.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import MagneticWarp from "@/components/pixel-perfect/shaders/magnetic-warp";\n\n<MagneticWarp className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Magnetic Warp component copied to clipboard!");
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
                onClick={() => setTrailOpen(true)}
                aria-label="Preview Cursor Trail full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <CursorTrailSmear
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Cursor Trail
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Your cursor drags a liquid streak across the image that trails
                behind and heals as it fades.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import CursorTrailSmear from "@/components/pixel-perfect/shaders/cursor-trail-smear";\n\n<CursorTrailSmear className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Cursor Trail component copied to clipboard!");
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
                onClick={() => setMeltOpen(true)}
                aria-label="Preview Liquid Melt full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <LiquidMelt
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Liquid Melt
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Hover to heat the image — the columns you linger over sag and
                drip like warm wax, then recover.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import LiquidMelt from "@/components/pixel-perfect/shaders/liquid-melt";\n\n<LiquidMelt className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Liquid Melt component copied to clipboard!");
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
                onClick={() => setVortexOpen(true)}
                aria-label="Preview Vortex Pull full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <VortexPull
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Vortex Pull
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                A whirlpool chases your cursor with momentum — it lags,
                overshoots and keeps spinning after you stop.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import VortexPull from "@/components/pixel-perfect/shaders/vortex-pull";\n\n<VortexPull className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Vortex Pull component copied to clipboard!");
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
                onClick={() => setJellyOpen(true)}
                aria-label="Preview Jelly Bulge full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <JellyBulge
                    image={FLUID_IMAGE}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
              </button>
            </div>
            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Jelly Bulge
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                A glassy lens of jelly follows your cursor, magnifying the image
                and jiggling with a bouncy overshoot.
              </p>
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import JellyBulge from "@/components/pixel-perfect/shaders/jelly-bulge";\n\n<JellyBulge className="w-full h-full" image="${FLUID_IMAGE}" />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Jelly Bulge component copied to clipboard!");
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
                <LazyVisible className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <ImageShaderCanvas
                    fragmentShader={item.fragmentShader}
                    image={item.image}
                    imageB={item.imageB}
                    dpr={1.25}
                    className="w-full h-full"
                  />
                </LazyVisible>
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
                  const code = `import ImageShaderCanvas from "@/components/pixel-perfect/shaders/image-shader-canvas";\n\n<ImageShaderCanvas\n  className="w-full h-full"\n  image="${item.image}"${item.imageB ? `\n  imageB="${item.imageB}"` : ""}\n  fragmentShader={\`${item.fragmentShader.trim()}\`}\n/>`;
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
              imageB={active.imageB}
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

      {particlesOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image Particles preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <ImageParticles image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setParticlesOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Image Particles
              <span className="ml-2 text-white/40">
                move cursor to scatter · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {inertiaOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Inertia Particles preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <InertiaParticles
              image={FLUID_IMAGE}
              className="h-full w-full"
              controls
            />
            <button
              type="button"
              onClick={() => setInertiaOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Inertia Particles
              <span className="ml-2 text-white/40">
                move cursor · springs back · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {swarmOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Magnetic Swarm preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <MagneticSwarm image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setSwarmOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Magnetic Swarm
              <span className="ml-2 text-white/40">
                cursor pulls the swarm · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {flowOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Flow Field preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <FlowField image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setFlowOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Flow Field
              <span className="ml-2 text-white/40">
                move cursor to stir · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {rippleOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ripple Touch preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <RippleTouch image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setRippleOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Ripple Touch
              <span className="ml-2 text-white/40">
                move or click · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {warpOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Magnetic Warp preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <MagneticWarp image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setWarpOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Magnetic Warp
              <span className="ml-2 text-white/40">
                gather + spring back · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {trailOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cursor Trail preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <CursorTrailSmear
              image={FLUID_IMAGE}
              className="h-full w-full"
              controls
            />
            <button
              type="button"
              onClick={() => setTrailOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Cursor Trail
              <span className="ml-2 text-white/40">
                drag a streak · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {meltOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Liquid Melt preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <LiquidMelt image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setMeltOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Liquid Melt
              <span className="ml-2 text-white/40">
                hover to melt · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {vortexOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vortex Pull preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <VortexPull image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setVortexOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Vortex Pull
              <span className="ml-2 text-white/40">
                swirl chases cursor · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}

      {jellyOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Jelly Bulge preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <JellyBulge image={FLUID_IMAGE} className="h-full w-full" controls />
            <button
              type="button"
              onClick={() => setJellyOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Jelly Bulge
              <span className="ml-2 text-white/40">
                bouncy lens · Esc to close
              </span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ImageShadersGrid;
