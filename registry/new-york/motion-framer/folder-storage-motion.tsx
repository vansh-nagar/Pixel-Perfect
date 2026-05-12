"use client";

/**
 * Folder storage — a soft folder-shaped card. On mount the MB counter
 * eases up from 0 to its final value and the storage bars stagger in.
 * Click the card to 3D-open the front cover: it rotates back around
 * its top edge (rotateX), revealing a stack of file rows that fade in
 * underneath.
 */

import { animate, motion } from "framer-motion";
import {
  Archive,
  FileText,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import { useEffect, useState } from "react";

const TOTAL_MB = 700;
const USED_MB = 500;
const TOTAL_BARS = 5;
const FILLED_BARS = 4;
const FILLED = "#86C580";
const EMPTY = "#D4D4D8";

const FOLDER_GRADIENT =
  "linear-gradient(180deg, #FAFAFA 0%, #E4E4E7 100%)";
const FOLDER_SHADOW =
  "0 1px 0 rgba(255,255,255,0.95) inset, 0 24px 40px -16px rgba(0,0,0,0.07), 0 4px 12px -2px rgba(0,0,0,0.04)";

const FILES = [
  {
    name: "design-mockup.fig",
    size: "184 KB",
    Icon: FileText,
    tint: "#E8E2F5",
    color: "#7B5BB8",
  },
  {
    name: "hero-shot.png",
    size: "112 KB",
    Icon: ImageIcon,
    tint: "#DEEFE3",
    color: "#3F8A57",
  },
  {
    name: "soundtrack.mp3",
    size: "62 KB",
    Icon: Music,
    tint: "#FFE3D9",
    color: "#DA6034",
  },
  {
    name: "portfolio.zip",
    size: "142 KB",
    Icon: Archive,
    tint: "#FFF1C8",
    color: "#C99317",
  },
];

const FolderStorageMotion = () => {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, USED_MB, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return () => controls.stop();
  }, []);

  return (
    <div
      onClick={() => setOpen((o) => !o)}
      className="w-[320px] cursor-pointer select-none"
      style={{
        height: 280,
        perspective: 900,
        perspectiveOrigin: "50% 30%",
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      <div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Interior (back panel — revealed when cover opens) */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: 28,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 22,
            background: "#E4E4E7",
            boxShadow:
              "inset 0 4px 14px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.7) inset",
            padding: "22px 16px 16px",
            transform: "translateZ(-1px)",
          }}
        >
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            Inside
          </p>
          <div className="flex flex-col gap-1.5">
            {FILES.map((file, i) => (
              <motion.div
                key={file.name}
                animate={{
                  opacity: open ? 1 : 0,
                  y: open ? 0 : 10,
                }}
                transition={{
                  delay: open ? 0.22 + i * 0.06 : i * 0.02,
                  duration: 0.32,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="grid size-5 shrink-0 place-items-center rounded-md"
                    style={{ background: file.tint }}
                  >
                    <file.Icon
                      className="size-3"
                      style={{ color: file.color }}
                      strokeWidth={2.2}
                    />
                  </div>
                  <span className="truncate text-[11px] text-neutral-700">
                    {file.name}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-neutral-400">
                  {file.size}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tab — sits behind the cover, peeks above it. Anchored to the
            back panel so it stays put as the cover opens. */}
        <div
          className="absolute"
          style={{
            top: 0,
            left: 22,
            width: 110,
            height: 36,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            background:
              "linear-gradient(180deg, #FFFFFF 0%, #E4E4E7 100%)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.95) inset, 0 4px 8px -3px rgba(0,0,0,0.06)",
            transform: "translateZ(-2px)",
          }}
        />

        {/* Front cover — rotates back around its top edge on click */}
        <motion.div
          className="absolute overflow-hidden"
          style={{
            top: 28,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 22,
            background: FOLDER_GRADIENT,
            boxShadow: FOLDER_SHADOW,
            transformOrigin: "50% 0%",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform",
          }}
          animate={{ rotateX: open ? -68 : 0 }}
          transition={{
            duration: 0.65,
            ease: [0.32, 0.72, 0.24, 1],
          }}
        >
          {/* 4 Files label */}
          <div className="absolute left-5 top-6 flex items-center gap-1.5">
            <FileText
              className="size-3.5 text-neutral-400"
              strokeWidth={2}
            />
            <span className="text-[13px] text-neutral-500">4 Files</span>
          </div>

          {/* Storage row */}
          <div className="absolute bottom-5 right-5 flex items-end gap-2">
            <span className="text-[12px] tracking-tight text-neutral-400">
              <span className="tabular-nums">{count}</span>
              <span className="text-neutral-300">/{TOTAL_MB}MB</span>
            </span>
            <div className="flex items-end gap-1">
              {Array.from({ length: TOTAL_BARS }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    delay: 0.18 + i * 0.07,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    width: 4,
                    height: 18,
                    borderRadius: 1.5,
                    background: i < FILLED_BARS ? FILLED : EMPTY,
                    transformOrigin: "bottom",
                    skewX: -12,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FolderStorageMotion;
