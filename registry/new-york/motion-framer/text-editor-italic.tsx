"use client";

/**
 * Soft cream "Text Editor" mock with a neumorphic toolbar. Click the toolbar
 * buttons (Bold, Italic, Align) to apply formatting to the highlighted
 * "Giovanni Giorgio" text. Hover the italic button to see its tooltip.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Play,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

// Surfaces resolve from CSS variables declared on the root (see className),
// so the editor retints itself for light/dark without a theme hook.
const TOOLBAR_BG = "var(--te-toolbar)";
const HIGHLIGHT = "var(--te-highlight)";
const NAME_HIGHLIGHT = "var(--te-name-hl)";
const TOOLTIP_BG = "var(--te-tooltip)";
const HOVER_BG = "var(--te-hover)";

const FULL_TEXT =
  "Giovanni Giorgio, known professionally as Giorgio Moroder, is an Italian music producer, songwriter, and DJ who is widely regarded as one of the pioneers of electronic dance music. Born on April 26, 1940, in Italy, Moroder's career spans over five decades, and he is credited with shaping the development of disco";
const NAME = "Giovanni Giorgio";
const REST_TEXT = FULL_TEXT.slice(NAME.length);
const REST_WORDS = REST_TEXT.split(/(\s+)/);

const STYLES = [
  { label: "Style 01", fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Style 02", fontFamily: "Georgia, 'Times New Roman', serif" },
  { label: "Style 03", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" },
] as const;

type Align = "left" | "center" | "right";

const TextEditorItalic = () => {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [align, setAlign] = useState<Align>("center");
  const [hoverItalic, setHoverItalic] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [styleIdx, setStyleIdx] = useState(0);

  const cycleStyle = () => setStyleIdx((i) => (i + 1) % STYLES.length);
  const currentStyle = STYLES[styleIdx];

  const alignmentClass =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  const cycleAlign = () =>
    setAlign((a) => (a === "left" ? "center" : a === "center" ? "right" : "left"));

  const resetFormatting = () => {
    setBold(false);
    setItalic(false);
    setAlign("center");
  };

  const playAnimation = () => setPlayKey((k) => k + 1);

  return (
    <div
      className="relative h-80 w-[420px] overflow-hidden rounded-2xl flex flex-col items-center [--te-toolbar:#F2F2F1] [--te-highlight:#E2E2E0] [--te-name-hl:#EAEAE8] [--te-tooltip:#F6F6F5] [--te-hl:rgba(255,255,255,0.95)] [--te-hover:rgba(0,0,0,0.04)] dark:[--te-toolbar:#2A2A2D] dark:[--te-highlight:#3A3A3E] dark:[--te-name-hl:#303034] dark:[--te-tooltip:#2E2E32] dark:[--te-hl:rgba(255,255,255,0.06)] dark:[--te-hover:rgba(255,255,255,0.06)]"
      style={{ fontFamily: "ui-sans-serif, system-ui" }}
    >
      {/* Toolbar */}
      <div className="relative mt-8">
        <div
          className="flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1.5"
          style={{
            background: TOOLBAR_BG,
            boxShadow:
              "0 1px 0 var(--te-hl) inset, 0 -1px 0 rgba(0,0,0,0.12) inset, 0 18px 30px -12px rgba(0,0,0,0.35), 0 4px 10px -2px rgba(0,0,0,0.16)",
          }}
        >
          {/* Style cycler — changes the font of the highlighted name */}
          <button
            type="button"
            onClick={cycleStyle}
            aria-label={`Font style: ${currentStyle.label}`}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 active:scale-[0.97] dark:text-neutral-300 dark:hover:text-neutral-50"
          >
            {currentStyle.label}
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              className="text-neutral-500 dark:text-neutral-400"
            >
              <path
                d="M3 3 L9 9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M9 5 L9 9 L5 9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Bold */}
          <ToolButton
            active={bold}
            onClick={() => setBold((b) => !b)}
            ariaLabel="Toggle bold"
          >
            <span className="text-[12px] font-bold text-black dark:text-white">
              B
            </span>
          </ToolButton>

          {/* Italic — hover shows tooltip */}
          <div
            className="relative"
            onMouseEnter={() => setHoverItalic(true)}
            onMouseLeave={() => setHoverItalic(false)}
          >
            <ToolButton
              active={italic}
              onClick={() => setItalic((i) => !i)}
              ariaLabel="Toggle italic"
            >
              <span
                className="text-[13px] italic text-black dark:text-white"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                I
              </span>
            </ToolButton>

            {/* Tooltip on hover */}
            <AnimatePresence>
              {hoverItalic && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.8, 0.4, 1] }}
                  className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                >
                  <div
                    className="px-2 py-1 text-[10px] font-medium text-neutral-700 dark:text-neutral-200 rounded-md whitespace-nowrap"
                    style={{
                      background: TOOLTIP_BG,
                      boxShadow:
                        "0 1px 0 var(--te-hl) inset, 0 4px 10px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.16)",
                    }}
                  >
                    Italic letters
                  </div>
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 -mt-[3px] size-1.5 rotate-45"
                    style={{ background: TOOLTIP_BG }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Align — cycles left/center/right */}
          <ToolButton
            active={align !== "center"}
            onClick={cycleAlign}
            ariaLabel={`Alignment: ${align}`}
          >
            {align === "left" ? (
              <AlignLeft
                className="size-3.5 text-black dark:text-white"
                strokeWidth={1.8}
              />
            ) : align === "right" ? (
              <AlignRight
                className="size-3.5 text-black dark:text-white"
                strokeWidth={1.8}
              />
            ) : (
              <AlignCenter
                className="size-3.5 text-black dark:text-white"
                strokeWidth={1.8}
              />
            )}
          </ToolButton>

          {/* Spacer */}
          <div className="w-1" />

          {/* Reset formatting */}
          <ToolButton
            active={false}
            onClick={resetFormatting}
            ariaLabel="Reset formatting"
          >
            <RotateCcw
              className="size-3.5 text-black dark:text-white"
              strokeWidth={1.8}
            />
          </ToolButton>

          {/* Play — triggers letter-scatter animation on the body text */}
          <motion.button
            type="button"
            onClick={playAnimation}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="grid size-7 cursor-pointer place-items-center rounded-full bg-neutral-900 dark:bg-white"
            aria-label="Play animation"
          >
            <Play
              className="size-3 translate-x-[0.5px] fill-white text-white dark:fill-neutral-900 dark:text-neutral-900"
              strokeWidth={0}
            />
          </motion.button>
        </div>
      </div>

      {/* Body text — re-keyed by playKey so the stagger animation re-runs on play */}
      <div
        key={playKey}
        className={`relative mt-10 px-10 ${alignmentClass}`}
      >
        <p
          className="text-[13px] leading-[1.55] tracking-[-0.005em] text-neutral-700 dark:text-neutral-300"
          style={{
            maskImage:
              "linear-gradient(180deg, black 0%, black 65%, transparent 95%)",
            WebkitMaskImage:
              "linear-gradient(180deg, black 0%, black 65%, transparent 95%)",
            fontStyle: italic ? "italic" : "normal",
            fontWeight: bold ? 600 : 400,
          }}
        >
          <span
            className="px-0.5 py-px"
            style={{
              background: NAME_HIGHLIGHT,
              borderRadius: 2,
              fontFamily: currentStyle.fontFamily,
            }}
          >
            <motion.span
              key={`name-${styleIdx}-${playKey}`}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ display: "inline-block" }}
            >
              {NAME}
            </motion.span>
          </span>
          {REST_WORDS.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.05 + i * 0.012,
                duration: 0.35,
                ease: "easeOut",
              }}
              style={{ display: "inline-block", whiteSpace: "pre" }}
            >
              {word}
            </motion.span>
          ))}
        </p>
      </div>

    </div>
  );
};

function ToolButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      animate={{
        backgroundColor: active ? HIGHLIGHT : "rgba(0,0,0,0)",
      }}
      whileTap={{ scale: 0.92 }}
      whileHover={{ backgroundColor: active ? HIGHLIGHT : HOVER_BG }}
      transition={{
        backgroundColor: { duration: 0.18 },
        scale: { type: "spring", stiffness: 600, damping: 22 },
      }}
      className="grid size-7 cursor-pointer place-items-center rounded-full"
    >
      {children}
    </motion.button>
  );
}

export default TextEditorItalic;
