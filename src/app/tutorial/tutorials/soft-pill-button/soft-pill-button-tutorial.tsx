"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOFT_PILL_SOURCE = `"use client";
import React from "react";
import { cn } from "@/lib/utils";

export type SoftPillVariant = "secondary" | "primary";

interface SoftPillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SoftPillVariant;
}

const SoftPillButton = React.forwardRef<HTMLButtonElement, SoftPillButtonProps>(
  ({ className, children, variant = "secondary", ...props }, ref) => {
    const isPrimary = variant === "primary";
    return (
      <button
        ref={ref}
        className={cn(
          "group relative block rounded-full text-center px-5 py-2.5 text-[13px] font-medium tracking-tight transition-[transform] duration-200 active:scale-[0.99] active:duration-[50ms]",
          "[backdrop-filter:blur(6px)]",
          isPrimary ? "text-white/90" : "text-neutral-900",
          className,
        )}
        style={{
          boxShadow: isPrimary
            ? "0 12px 24px -8px rgba(0,0,0,0.28), 0 4px 8px -2px rgba(0,0,0,0.16), 0 1px 2px rgba(0,0,0,0.12)"
            : "0 12px 24px -8px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        }}
        {...props}
      >
        {/* Frosted base */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: isPrimary
              ? "rgba(0,0,0,0.56)"
              : "rgba(255,255,255,0.9)",
          }}
        >
          {/* Top white highlight */}
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0) 100%)",
              opacity: isPrimary ? 0.12 : 0.32,
            }}
          />
          {/* Bottom radial vignette */}
          <span
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(65.62% 65.62% at 50% 100%, rgb(0,0,0) 0%, rgba(0,0,0,0) 100%)",
              opacity: isPrimary ? 0.32 : 0.08,
            }}
          />
          {/* Diagonal sheen */}
          {!isPrimary && (
            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(99deg, rgba(255,255,255,0) 27.7%, rgba(255,255,255,0.12) 60.19%, rgba(255,255,255,0) 86.06%)",
              }}
            />
          )}
          {/* Gradient border via mask xor */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full p-px"
            style={{
              background:
                "linear-gradient(transparent 0%, rgb(255,255,255) 55%, transparent 80%, rgb(255,255,255) 95%)",
              opacity: 0.12,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        </span>
        <span className="relative">{children}</span>
      </button>
    );
  },
);

SoftPillButton.displayName = "SoftPillButton";

export default SoftPillButton;`;

const SoftPillPreview = ({
  showBase,
  showTopHighlight,
  showVignette,
  showSheen,
  showBorder,
}: {
  showBase: boolean;
  showTopHighlight: boolean;
  showVignette: boolean;
  showSheen: boolean;
  showBorder: boolean;
}) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative flex items-center justify-center p-10 rounded-md"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.04) 75%)",
          backgroundSize: "12px 12px",
          backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
        }}
      >
        <button
          className="group relative block rounded-full text-center px-5 py-2.5 text-[13px] font-medium tracking-tight text-neutral-900 transition-transform duration-200 active:scale-[0.99] cursor-pointer"
          style={{
            backdropFilter: "blur(6px)",
            boxShadow:
              "0 12px 24px -8px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: showBase ? "rgba(255,255,255,0.9)" : "transparent",
            }}
          >
            {showTopHighlight && (
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(rgb(255,255,255) 0%, rgba(255,255,255,0) 100%)",
                  opacity: 0.32,
                }}
              />
            )}
            {showVignette && (
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(65.62% 65.62% at 50% 100%, rgb(0,0,0) 0%, rgba(0,0,0,0) 100%)",
                  opacity: 0.08,
                }}
              />
            )}
            {showSheen && (
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(99deg, rgba(255,255,255,0) 27.7%, rgba(255,255,255,0.12) 60.19%, rgba(255,255,255,0) 86.06%)",
                }}
              />
            )}
            {showBorder && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full p-px"
                style={{
                  background:
                    "linear-gradient(transparent 0%, rgb(255,255,255) 55%, transparent 80%, rgb(255,255,255) 95%)",
                  opacity: 0.6,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
            )}
          </span>
          <span className="relative">Philosophy</span>
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground italic text-center max-w-[260px]">
        Toggle layers on the right to see how each contributes to the
        frosted-glass effect.
      </p>

      <div className="flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground">
        <span className={showBase ? "text-green-500" : "text-red-400"}>
          base: {showBase ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showTopHighlight ? "text-green-500" : "text-red-400"}>
          top: {showTopHighlight ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showVignette ? "text-green-500" : "text-red-400"}>
          vignette: {showVignette ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showSheen ? "text-green-500" : "text-red-400"}>
          sheen: {showSheen ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showBorder ? "text-green-500" : "text-red-400"}>
          border: {showBorder ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const SoftPillContent = ({
  showBase,
  setShowBase,
  showTopHighlight,
  setShowTopHighlight,
  showVignette,
  setShowVignette,
  showSheen,
  setShowSheen,
  showBorder,
  setShowBorder,
}: {
  showBase: boolean;
  setShowBase: React.Dispatch<React.SetStateAction<boolean>>;
  showTopHighlight: boolean;
  setShowTopHighlight: React.Dispatch<React.SetStateAction<boolean>>;
  showVignette: boolean;
  setShowVignette: React.Dispatch<React.SetStateAction<boolean>>;
  showSheen: boolean;
  setShowSheen: React.Dispatch<React.SetStateAction<boolean>>;
  showBorder: boolean;
  setShowBorder: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">
          How the Soft Pill Button Works
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          The button is a stack of five translucent layers inside a{" "}
          <strong>rounded-full</strong> pill. A frosted white base sets the
          tone, then a top-down white gradient adds a glassy highlight, a
          radial vignette darkens the bottom edge, a diagonal sheen sweeps
          across the surface, and a gradient stroke, drawn with a{" "}
          <strong>mask-composite</strong> trick, wraps the whole thing. The
          drop shadow underneath gives it lift.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold">Frosted Base</h4>
          </div>
          <ToggleButton toggle={showBase} setToggle={setShowBase} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An absolutely positioned <strong>span</strong> with{" "}
          <strong>inset-0</strong> and <strong>rounded-full</strong> fills the
          button with a 90% opaque white surface. Combined with{" "}
          <strong>backdrop-filter: blur(6px)</strong> on the parent, this is
          what makes the pill read as &quot;frosted glass&quot;, anything
          behind the button gets softened, but the surface still feels solid.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(6px);
border-radius: 9999px;`}
          </pre>
        </div>
        <div className="flex gap-1">
          <div
            className="h-6 flex-1 rounded-sm border border-dashed"
            style={{ background: "rgba(255,255,255,0.9)" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: every other layer becomes invisible because they paint on
          top of this base.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold">Top White Highlight</h4>
          </div>
          <ToggleButton
            toggle={showTopHighlight}
            setToggle={setShowTopHighlight}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A vertical <strong>linear-gradient</strong> from solid white to fully
          transparent, painted at <strong>opacity 0.32</strong>. It brightens
          the top of the pill and fades into the base, the cue your eye reads
          as &quot;light coming from above.&quot; Without it the pill looks
          flat.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`background: linear-gradient(
  rgb(255,255,255) 0%,
  rgba(255,255,255,0) 100%
);
opacity: 0.32;`}
          </pre>
        </div>
        <div
          className="h-6 rounded-sm border border-dashed"
          style={{
            background:
              "linear-gradient(rgb(255,255,255) 0%, rgba(180,180,180,1) 100%)",
          }}
        />
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the pill loses its &quot;lit from above&quot; feel and
          reads more matte.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold">Bottom Radial Vignette</h4>
          </div>
          <ToggleButton toggle={showVignette} setToggle={setShowVignette} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A <strong>radial-gradient</strong> centered at{" "}
          <strong>50% 100%</strong> (bottom-center) that fades black outward.
          It&apos;s only <strong>0.08</strong> opacity, barely there, but it
          mirrors the top highlight on the opposite axis, grounding the pill
          and adding subtle depth at the bottom edge.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`background: radial-gradient(
  65.62% 65.62% at 50% 100%,
  rgb(0,0,0) 0%,
  rgba(0,0,0,0) 100%
);
opacity: 0.08;`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the difference is subtle, but side-by-side the pill
          floats less convincingly without it.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              4
            </span>
            <h4 className="text-sm font-semibold">Diagonal Sheen</h4>
          </div>
          <ToggleButton toggle={showSheen} setToggle={setShowSheen} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A <strong>99deg linear-gradient</strong> with white peaking near the
          middle (60% stop) and fading to transparent on either side. It mimics
          a soft reflection sliding diagonally across the pill, the detail
          that pushes it from &quot;flat surface&quot; to &quot;polished
          material.&quot;
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`background: linear-gradient(99deg,
  rgba(255,255,255,0)    27.7%,
  rgba(255,255,255,0.12) 60.19%,
  rgba(255,255,255,0)    86.06%
);`}
          </pre>
        </div>
        <div
          className="h-6 rounded-sm border border-dashed"
          style={{
            background:
              "linear-gradient(99deg, rgba(180,180,180,1) 27.7%, rgba(255,255,255,1) 60.19%, rgba(180,180,180,1) 86.06%)",
          }}
        />
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the pill loses its &quot;polished&quot; glint and reads
          as a plain rounded shape.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              5
            </span>
            <h4 className="text-sm font-semibold">
              Gradient Border (mask trick)
            </h4>
          </div>
          <ToggleButton toggle={showBorder} setToggle={setShowBorder} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Borders can&apos;t have gradients directly, so we fake it: paint a
          gradient as the <strong>background</strong> on a 1px-padded span,
          then subtract the inner content area using{" "}
          <strong>mask-composite: exclude</strong>. What&apos;s left is just a
          1px ring of gradient, a hairline metallic edge that highlights and
          dims around the perimeter.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`/* 1. Pad 1px so background bleeds through edge */
padding: 1px;

/* 2. Paint the gradient */
background: linear-gradient(
  transparent 0%,
  #fff 55%,
  transparent 80%,
  #fff 95%
);

/* 3. Mask: cut out the inner content box */
-webkit-mask:
  linear-gradient(#000 0 0) content-box,
  linear-gradient(#000 0 0);
-webkit-mask-composite: xor;
        mask-composite: exclude;`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the pill loses its hairline ring, the silhouette feels
          softer but less defined against the page.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">
          Layer Stack (bottom &#8594; top)
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showBase ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Frosted base
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showTopHighlight ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Top highlight
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showVignette ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Bottom vignette
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showSheen ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Diagonal sheen
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showBorder ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Gradient border
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Final pill
          </span>
        </div>
      </div>
    </div>
  );
};

export const SoftPillButtonTutorial = () => {
  const [showBase, setShowBase] = useState(true);
  const [showTopHighlight, setShowTopHighlight] = useState(true);
  const [showVignette, setShowVignette] = useState(true);
  const [showSheen, setShowSheen] = useState(true);
  const [showBorder, setShowBorder] = useState(true);
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
              registryName="soft-pill-button"
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
                  value={SOFT_PILL_SOURCE}
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
                <SoftPillPreview
                  showBase={showBase}
                  showTopHighlight={showTopHighlight}
                  showVignette={showVignette}
                  showSheen={showSheen}
                  showBorder={showBorder}
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
          <SoftPillContent
            showBase={showBase}
            setShowBase={setShowBase}
            showTopHighlight={showTopHighlight}
            setShowTopHighlight={setShowTopHighlight}
            showVignette={showVignette}
            setShowVignette={setShowVignette}
            showSheen={showSheen}
            setShowSheen={setShowSheen}
            showBorder={showBorder}
            setShowBorder={setShowBorder}
          />
        </div>
      </div>
    </div>
  );
};

export default SoftPillButtonTutorial;
