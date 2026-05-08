"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const BOOK_DEMO_SOURCE = `import React from "react";
import { cn } from "@/lib/utils";

const DoubleChevron = ({ index }: { index: number }) => {
  const base = index * 0.12;
  const dots = [
    { cx: 2, cy: 2, d: 0 },    { cx: 5, cy: 5, d: 0.05 },
    { cx: 8, cy: 8, d: 0.1 },  { cx: 5, cy: 11, d: 0.15 },
    { cx: 2, cy: 14, d: 0.2 }, { cx: 6, cy: 2, d: 0.05 },
    { cx: 9, cy: 5, d: 0.1 },  { cx: 12, cy: 8, d: 0.15 },
    { cx: 9, cy: 11, d: 0.2 }, { cx: 6, cy: 14, d: 0.25 },
  ];
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" className="shrink-0 overflow-visible">
      <g fill="#0f0f0f">
        {dots.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r="1"
            className="bd-dot" style={{ animationDelay: \`\${base + p.d}s\` }} />
        ))}
      </g>
    </svg>
  );
};

const BookDemoButton = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <button ref={ref}
      className={cn(
        "group/btn relative inline-flex h-11 w-36 rounded-[12px] overflow-hidden transition-transform active:scale-[0.98]",
        className,
      )}
      style={{
        background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.18)",
      }}
      {...props}
    >
      <style>{\`
        @keyframes bd-dot-wave {
          0%, 70%, 100% { opacity: 0.25; transform: scale(0.85); }
          35% { opacity: 1; transform: scale(1); }
        }
        .bd-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: bd-dot-wave 1.4s ease-in-out infinite;
        }
      \`}</style>

      {/* Dark layer — label sits on right, panel slides over it */}
      <span className="absolute inset-y-0 right-4 flex items-center text-white font-medium text-[14px] tracking-tight">
        {children || "Book a demo"}
      </span>

      {/* Lime panel — w-9 idle, expands on hover */}
      <span
        className="absolute top-1 left-1 bottom-1 z-10 w-9 group-hover/btn:w-[calc(100%-0.5rem)]
                   flex items-center justify-start overflow-hidden rounded-md pl-3 pr-2.5 gap-2.5
                   transition-[width,gap] duration-200 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{
          background: "linear-gradient(180deg, #d6f54a 0%, #c5ea2c 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
        }}
      >
        <DoubleChevron index={0} />
        <DoubleChevron index={1} />
        <DoubleChevron index={2} />
        <DoubleChevron index={3} />
        <DoubleChevron index={4} />
      </span>
    </button>
  );
});

export default BookDemoButton;`;

const DoubleChevron = ({
  index,
  showWave,
}: {
  index: number;
  showWave: boolean;
}) => {
  const base = index * 0.12;
  const dots: { cx: number; cy: number; d: number }[] = [
    { cx: 2, cy: 2, d: 0 },
    { cx: 5, cy: 5, d: 0.05 },
    { cx: 8, cy: 8, d: 0.1 },
    { cx: 5, cy: 11, d: 0.15 },
    { cx: 2, cy: 14, d: 0.2 },
    { cx: 6, cy: 2, d: 0.05 },
    { cx: 9, cy: 5, d: 0.1 },
    { cx: 12, cy: 8, d: 0.15 },
    { cx: 9, cy: 11, d: 0.2 },
    { cx: 6, cy: 14, d: 0.25 },
  ];
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      className="shrink-0 overflow-visible"
    >
      <g fill="#0f0f0f">
        {dots.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r="1"
            className={showWave ? "bd-tutorial-dot" : ""}
            style={
              showWave
                ? { animationDelay: `${base + p.d}s` }
                : { opacity: 1 }
            }
          />
        ))}
      </g>
    </svg>
  );
};

const BookDemoPreview = ({
  showLimePanel,
  showChevrons,
  showWave,
  showHoverExpand,
}: {
  showLimePanel: boolean;
  showChevrons: boolean;
  showWave: boolean;
  showHoverExpand: boolean;
}) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <button
        className={`group/btn relative inline-flex h-11 w-36 rounded-[12px] overflow-hidden transition-transform active:scale-[0.98] cursor-pointer`}
        style={{
          background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.18)",
        }}
      >
        <style>{`
          @keyframes bd-tutorial-wave {
            0%, 70%, 100% { opacity: 0.25; transform: scale(0.85); }
            35% { opacity: 1; transform: scale(1); }
          }
          .bd-tutorial-dot {
            transform-box: fill-box;
            transform-origin: center;
            animation: bd-tutorial-wave 1.4s ease-in-out infinite;
          }
        `}</style>

        <span className="absolute inset-y-0 right-4 flex items-center text-white font-medium text-[14px] tracking-tight">
          Book a demo
        </span>

        {showLimePanel && (
          <span
            className={`absolute top-1 left-1 bottom-1 z-10 w-9 ${
              showHoverExpand
                ? "group-hover/btn:w-[calc(100%-0.5rem)]"
                : ""
            } flex items-center justify-start overflow-hidden rounded-md pl-3 pr-2.5 gap-2.5 transition-[width,gap] duration-200 ease-[cubic-bezier(0.65,0,0.35,1)]`}
            style={{
              background:
                "linear-gradient(180deg, #d6f54a 0%, #c5ea2c 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            {showChevrons && (
              <>
                <DoubleChevron index={0} showWave={showWave} />
                <DoubleChevron index={1} showWave={showWave} />
                <DoubleChevron index={2} showWave={showWave} />
                <DoubleChevron index={3} showWave={showWave} />
                <DoubleChevron index={4} showWave={showWave} />
              </>
            )}
          </span>
        )}
      </button>

      <p className="text-[10px] text-muted-foreground italic">
        Hover the button to see the lime panel expand
      </p>

      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span className={showLimePanel ? "text-green-500" : "text-red-400"}>
          panel: {showLimePanel ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showChevrons ? "text-green-500" : "text-red-400"}>
          chevrons: {showChevrons ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showWave ? "text-green-500" : "text-red-400"}>
          wave: {showWave ? "on" : "off"}
        </span>
        <span>·</span>
        <span
          className={showHoverExpand ? "text-green-500" : "text-red-400"}
        >
          expand: {showHoverExpand ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const BookDemoContent = ({
  showLimePanel,
  setShowLimePanel,
  showChevrons,
  setShowChevrons,
  showWave,
  setShowWave,
  showHoverExpand,
  setShowHoverExpand,
}: {
  showLimePanel: boolean;
  setShowLimePanel: React.Dispatch<React.SetStateAction<boolean>>;
  showChevrons: boolean;
  setShowChevrons: React.Dispatch<React.SetStateAction<boolean>>;
  showWave: boolean;
  setShowWave: React.Dispatch<React.SetStateAction<boolean>>;
  showHoverExpand: boolean;
  setShowHoverExpand: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">
          How the Book Demo Button Works
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Two stacked layers do all the work: a dark base with the label
          anchored to the right, and a lime square absolutely positioned over
          the left side. On hover, the lime square&apos;s{" "}
          <strong>width</strong> animates from <strong>w-9</strong> to{" "}
          <strong>calc(100% - 0.5rem)</strong>, sliding over the dark layer
          and revealing five staggered chevrons made of dots that wave on a
          1.4s loop.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold">Lime Panel</h4>
          </div>
          <ToggleButton
            toggle={showLimePanel}
            setToggle={setShowLimePanel}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An absolutely positioned <strong>span</strong> with{" "}
          <strong>top-1 left-1 bottom-1</strong> creates a square that sits
          inside the dark button with a 4px gap. Its background is a vertical
          lime gradient, and inset shadows give it a polished, embossed look.
          The <strong>z-10</strong> ensures it stacks above the label.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`background: linear-gradient(180deg, #d6f54a 0%, #c5ea2c 100%);
box-shadow:
  inset 0 1px 0 rgba(255,255,255,0.4),
  inset 0 -2px 4px rgba(0,0,0,0.12),
  0 2px 4px rgba(0,0,0,0.08);`}
          </pre>
        </div>
        <div className="flex gap-1">
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "#d6f54a" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "#c5ea2c" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the dark base shows through with just the label visible.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold">Dotted Chevrons</h4>
          </div>
          <ToggleButton toggle={showChevrons} setToggle={setShowChevrons} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Each chevron is an <strong>SVG</strong> with ten circles arranged
          into two diagonal arms — five points form each side of the V.
          Rendering five chevrons in a row with <strong>gap-2.5</strong>{" "}
          fills the expanded panel with a directional dot pattern.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const dots = [
  { cx: 2, cy: 2 },  { cx: 5, cy: 5 },
  { cx: 8, cy: 8 },  { cx: 5, cy: 11 },
  { cx: 2, cy: 14 }, // first arm (top-left to bottom-left)
  { cx: 6, cy: 2 },  { cx: 9, cy: 5 },
  { cx: 12, cy: 8 }, { cx: 9, cy: 11 },
  { cx: 6, cy: 14 }, // second arm (offset by 4px)
];`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the lime panel expands but stays empty.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold">Staggered Dot Wave</h4>
          </div>
          <ToggleButton toggle={showWave} setToggle={setShowWave} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A single <strong>@keyframes</strong> rule pulses each dot from
          0.25 to 1 opacity (and 0.85 to 1 scale). Two stagger sources
          combine to make the wave directional: each chevron gets a base
          delay of <strong>index * 0.12s</strong>, and each dot inside gets
          its own offset (0s → 0.25s along the V). The total stagger sweeps
          from top-left to bottom-right across the panel.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`@keyframes bd-dot-wave {
  0%, 70%, 100% { opacity: 0.25; transform: scale(0.85); }
  35%           { opacity: 1;    transform: scale(1); }
}

// per-dot delay
animationDelay: \`\${index * 0.12 + dotOffset}s\`;`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: dots stay fully opaque and static — useful for seeing
          the chevron geometry without motion.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              4
            </span>
            <h4 className="text-sm font-semibold">Hover Expand</h4>
          </div>
          <ToggleButton
            toggle={showHoverExpand}
            setToggle={setShowHoverExpand}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The lime panel ships at <strong>w-9</strong> (a 36px square). On{" "}
          <strong>group/btn</strong> hover, Tailwind&apos;s{" "}
          <strong>group-hover/btn:w-[calc(100%-0.5rem)]</strong> expands it
          across the button, minus the 4px gap on each side.{" "}
          <strong>transition-[width,gap]</strong> with a 200ms{" "}
          <strong>cubic-bezier(0.65, 0, 0.35, 1)</strong> ease keeps the
          slide quick but smooth. <strong>overflow-hidden</strong> on the
          panel clips the chevrons until there&apos;s room to show them.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`className="
  w-9
  group-hover/btn:w-[calc(100%-0.5rem)]
  transition-[width,gap]
  duration-200
  ease-[cubic-bezier(0.65,0,0.35,1)]
"`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the panel stays a square — chevrons remain clipped at
          the right edge, no expansion on hover.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Layer Stack</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">
            Dark base + label
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showLimePanel ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Lime panel
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showChevrons ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Chevrons
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showWave ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Dot wave
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showHoverExpand ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Hover expand
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Final button
          </span>
        </div>
      </div>
    </div>
  );
};

export const BookDemoButtonTutorial = () => {
  const [showLimePanel, setShowLimePanel] = useState(true);
  const [showChevrons, setShowChevrons] = useState(true);
  const [showWave, setShowWave] = useState(true);
  const [showHoverExpand, setShowHoverExpand] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[calc(100vh-120px)]">
      <div className="border-b border-dashed lg:border-b-0 lg:border-r flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Preview
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[280px] sm:min-h-[340px] lg:min-h-0 p-4 sm:p-6">
          <div className="flex bg-background items-center gap-1.5 absolute top-2 right-2 z-50">
            <button
              onClick={() => setShowCode(!showCode)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed rounded-none transition-colors cursor-pointer ${showCode ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}
            >
              {showCode ? (
                <Eye className="size-3" />
              ) : (
                <Code className="size-3" />
              )}
              {showCode ? "Preview" : "Code"}
            </button>
            <CopyDropdown
              registryName="book-demo-button"
              className="right-0 top-0"
            />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  value={BOOK_DEMO_SOURCE}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    renderLineHighlight: "none",
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    scrollbar: {
                      vertical: "auto",
                      horizontal: "auto",
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    },
                    padding: { top: 16, bottom: 16 },
                    domReadOnly: true,
                    contextmenu: false,
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <BookDemoPreview
                  showLimePanel={showLimePanel}
                  showChevrons={showChevrons}
                  showWave={showWave}
                  showHoverExpand={showHoverExpand}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="absolute top-0 left-0 block size-5 border-l border-t border-dashed border-muted-foreground" />
          <span className="absolute top-0 right-0 block size-5 border-r border-t border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 left-0 block size-5 border-l border-b border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 right-0 block size-5 border-r border-b border-dashed border-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-col min-h-0 min-w-0">
        <div className="px-4 py-2 border-b border-dashed shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Tutorial
          </p>
        </div>
        <div className="p-4 sm:p-6 flex-1">
          <BookDemoContent
            showLimePanel={showLimePanel}
            setShowLimePanel={setShowLimePanel}
            showChevrons={showChevrons}
            setShowChevrons={setShowChevrons}
            showWave={showWave}
            setShowWave={setShowWave}
            showHoverExpand={showHoverExpand}
            setShowHoverExpand={setShowHoverExpand}
          />
        </div>
      </div>
    </div>
  );
};

export default BookDemoButtonTutorial;
