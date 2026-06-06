"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import ShaderCanvas from "@/components/pixel-perfect/shaders/shader-canvas";
import BlobSphere from "@/components/pixel-perfect/shaders/blob-sphere";
import TwistedBlob from "@/components/pixel-perfect/shaders/twisted-blob";
import { SHADERS, type Shader } from "@/components/pixel-perfect/shaders/registry";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";

const ShaderGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [active, setActive] = useState<Shader | null>(null);
  const [blobOpen, setBlobOpen] = useState(false);
  const [twistOpen, setTwistOpen] = useState(false);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(SHADERS.length / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = SHADERS.slice(startIndex, startIndex + itemsPerPage);

  // Esc to close + lock scroll while any full-screen preview is open.
  useEffect(() => {
    if (!active && !blobOpen && !twistOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setBlobOpen(false);
        setTwistOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, blobOpen, twistOpen]);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {currentPage === 1 && (
          <div className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center">
            <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
              <button
                type="button"
                onClick={() => setBlobOpen(true)}
                aria-label="Preview Noise Blob full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <BlobSphere
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>

            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Noise Blob
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                A sphere displaced by 3D noise in the vertex shader — drag to spin.
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import BlobSphere from "@/components/pixel-perfect/shaders/blob-sphere";\n\n<BlobSphere className="w-full h-full" interactive />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Blob component copied to clipboard!");
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
                onClick={() => setTwistOpen(true)}
                aria-label="Preview Twisted Blob full screen"
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <TwistedBlob
                  dpr={1.25}
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </div>

            <div className="leading-1 absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                Twisted Blob
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                A vertex-twisted sphere with domain-warped noise — drag to spin.
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <Button
                size="sm"
                variant="copy"
                onClick={() => {
                  const code = `import TwistedBlob from "@/components/pixel-perfect/shaders/twisted-blob";\n\n<TwistedBlob className="w-full h-full" interactive />`;
                  navigator.clipboard.writeText(code);
                  toast.success("Blob component copied to clipboard!");
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
                aria-label={`Preview ${item.title} shader full screen`}
                className="w-full h-full relative overflow-hidden block cursor-pointer"
              >
                <ShaderCanvas
                  fragmentShader={item.fragmentShader}
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
                  const code = `import ShaderCanvas from "@/components/pixel-perfect/shaders/shader-canvas";\n\n<ShaderCanvas\n  className="w-full h-full"\n  fragmentShader={\`${item.fragmentShader.trim()}\`}\n/>`;
                  navigator.clipboard.writeText(code);
                  toast.success("Shader code copied to clipboard!");
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
            aria-label={`${active.title} shader preview`}
            className="fixed inset-0 z-[9999] bg-black"
          >
            <ShaderCanvas
              fragmentShader={active.fragmentShader}
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
              <span className="ml-2 text-white/40">Esc to close</span>
            </div>
          </div>,
          document.body,
        )}

      {blobOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Noise Blob preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <BlobSphere interactive className="h-full w-full" />
            <button
              type="button"
              onClick={() => setBlobOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Noise Blob
              <span className="ml-2 text-white/40">drag to spin · Esc to close</span>
            </div>
          </div>,
          document.body,
        )}

      {twistOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Twisted Blob preview"
            className="fixed inset-0 z-[9999] bg-black"
          >
            <TwistedBlob interactive className="h-full w-full" />
            <button
              type="button"
              onClick={() => setTwistOpen(false)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div className="pointer-events-none absolute bottom-5 left-5 z-10 text-sm text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Twisted Blob
              <span className="ml-2 text-white/40">drag to spin · Esc to close</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ShaderGrid;
