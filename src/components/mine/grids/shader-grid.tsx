"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import CopyDropdown from "../copy-dropdown";

import ShaderCanvas from "registry/new-york/shaders/shader-canvas";
import CardScan from "registry/new-york/shaders/card-scan";
import CoinRead from "registry/new-york/shaders/coin-read";
import CloudRing from "registry/new-york/shaders/cloud-ring";
import CloudSky from "registry/new-york/shaders/cloud-sky";
import { SHADERS, type Shader } from "@/components/pixel-perfect/shaders/registry";
import { usePaginationKeys } from "@/hooks/use-pagination-keys";
import GridPagination from "./_shared/grid-pagination";

// Shaders (and the CSS cloud pieces) that are their own component, not a fragment string
// for ShaderCanvas; they lead page 1, ahead of SHADERS.
type Standalone = {
  id: string;
  title: string;
  description: string;
  /** Shown next to "Esc to close" in the full-screen preview. */
  hint?: string;
  /** Light artwork: set the label in dark text so it stays readable. */
  light?: boolean;
  Component: ComponentType<{ className?: string; dpr?: number }>;
};

const STANDALONE: Standalone[] = [
  {
    id: "card-scan",
    title: "Card Scan",
    description:
      "Hover to read it: holographic foil that shifts as you move, light rippling from the cursor, a flash as you leave.",
    hint: "hover to read",
    Component: CardScan,
  },
  {
    id: "coin-read",
    title: "Coin Read",
    description:
      "Glowing coins slide in under the left edge; each one sends a wave of light and foil across.",
    Component: CoinRead,
  },
  {
    id: "cloud-ring",
    title: "Cloud Ring",
    description:
      "A frame of white cloud breathes in and out around a blurred sky, drawn to fit whatever box it's in.",
    light: true,
    Component: CloudRing,
  },
  {
    id: "cloud-sky",
    title: "Cloud Sky",
    description:
      "A cloud photo blurred and faded out toward the bottom over white, with a soft white glow at the edges.",
    light: true,
    Component: CloudSky,
  },
];

const ShaderGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [active, setActive] = useState<Shader | null>(null);
  const [standaloneOpen, setStandaloneOpen] = useState<Standalone | null>(null);
  const itemsPerPage = 12;
  const firstPageItems = itemsPerPage - STANDALONE.length;
  const totalPages =
    SHADERS.length <= firstPageItems
      ? 1
      : 1 + Math.ceil((SHADERS.length - firstPageItems) / itemsPerPage);
  usePaginationKeys(totalPages, setCurrentPage);
  const startIndex =
    currentPage === 1 ? 0 : firstPageItems + (currentPage - 2) * itemsPerPage;
  const itemsOnPage = currentPage === 1 ? firstPageItems : itemsPerPage;
  const paginatedItems = SHADERS.slice(startIndex, startIndex + itemsOnPage);

  useEffect(() => {
    if (!active && !standaloneOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setStandaloneOpen(null);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, standaloneOpen]);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {currentPage === 1 &&
          STANDALONE.map((item) => (
            <div
              key={item.id}
              className="relative group border-b border-l border-dashed aspect-video flex items-center justify-center"
            >
              <div className="z-30 w-full h-full flex items-center justify-center overflow-hidden">
                <button
                  type="button"
                  onClick={() => setStandaloneOpen(item)}
                  aria-label={`Preview ${item.title} full screen`}
                  className="w-full h-full relative overflow-hidden block cursor-pointer"
                >
                  <item.Component
                    dpr={1.25}
                    className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              </div>

              <div className="leading-tight absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
                <p
                  className={`text-xs ${item.light ? "text-black" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}
                >
                  {item.title}
                </p>
                <p
                  className={`text-[8px] ${item.light ? "text-black/60" : "text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"}`}
                >
                  {item.description}
                </p>
              </div>

              <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
                <div className="border-t border-dashed" />
                <CopyDropdown
                  registryName={item.id}
                  className="pointer-events-auto"
                />
                <div />
                <div className="border-r border-dashed h-full -mr-[0.5px]" />
              </div>
            </div>
          ))}
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

            <div className="leading-tight absolute left-1.5 bottom-1.5 z-40 pointer-events-none">
              <p className="text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                {item.title}
              </p>
              <p className="text-[8px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                {item.description}
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2 pointer-events-none">
              <div className="border-t border-dashed" />
              <CopyDropdown
                registryName={item.id}
                className="pointer-events-auto"
              />
              <div />
              <div className="border-r border-dashed h-full -mr-[0.5px]" />
            </div>
          </div>
        ))}
      </div>

      <GridPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onChange={setCurrentPage}
      />

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

      {standaloneOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${standaloneOpen.title} preview`}
            className="fixed inset-0 z-[9999] bg-black"
          >
            <standaloneOpen.Component className="h-full w-full" />
            <button
              type="button"
              onClick={() => setStandaloneOpen(null)}
              aria-label="Close preview"
              className="absolute left-5 top-5 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="size-5" />
            </button>
            <div
              className={`pointer-events-none absolute bottom-5 left-5 z-10 text-sm ${standaloneOpen.light ? "text-black/70" : "text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"}`}
            >
              {standaloneOpen.title}
              <span
                className={`ml-2 ${standaloneOpen.light ? "text-black/40" : "text-white/40"}`}
              >
                {standaloneOpen.hint ? `${standaloneOpen.hint} · ` : ""}Esc to
                close
              </span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ShaderGrid;
