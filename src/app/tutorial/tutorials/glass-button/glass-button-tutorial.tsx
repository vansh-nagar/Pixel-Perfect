"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import GlassButton from "../../../../../registry/new-york/buttons/glass-button";
import type { GlassVariant } from "../../../../../registry/new-york/buttons/glass-button";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GLASS_SOURCE = `import React from "react";
import { cn } from "@/lib/utils";

export type GlassVariant =
  | "blue" | "purple" | "emerald" | "rose" | "amber"
  | "cyan" | "lime" | "slate" | "red" | "indigo";

const glassStyles: Record<GlassVariant, { border: string; inner: string; shadow: string }> = {
  blue: {
    border: "linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(16,191,255,0.6) 52.26%, rgba(255,255,255,0.6) 100%)",
    inner: "linear-gradient(263.57deg, rgba(199,240,255,0.4) 10.17%, rgba(0,187,255,0.4) 48.94%, rgba(199,240,255,0.4) 103.12%)",
    shadow: "0px 36.86px 13.98px rgba(94,212,255,0.02), 0px 20.34px 12.71px rgba(94,212,255,0.08), 0px 8.9px 8.9px rgba(94,212,255,0.13), 0px 2.54px 5.08px rgba(94,212,255,0.15)",
  },
  // ... 9 more color variants
};

const GlassButton = React.forwardRef(({ className, children, variant = "blue", ...props }, ref) => {
  const { border, inner, shadow } = glassStyles[variant];
  return (
    <button
      ref={ref}
      className={cn("relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.98]", className)}
      style={{ background: border, borderRadius: "100px", border: "none" }}
      {...props}
    >
      {/* Gradient border trick: outer = border gradient, inner span = fill */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3px] rounded-[100px]"
        style={{ background: inner, boxShadow: shadow, backdropFilter: "blur(4.5px)" }}
      />
      <span className="relative z-10">{children || "Glass Button"}</span>
    </button>
  );
});

export default GlassButton;`;

const allVariants: GlassVariant[] = [
  "blue",
  "purple",
  "emerald",
  "rose",
  "amber",
  "cyan",
  "lime",
  "slate",
  "red",
  "indigo",
];

const GlassPreview = ({
  variant,
  setVariant,
  showBorderGradient,
  showInnerFill,
  showBoxShadow,
  showBackdropBlur,
}: {
  variant: GlassVariant;
  setVariant: (v: GlassVariant) => void;
  showBorderGradient: boolean;
  showInnerFill: boolean;
  showBoxShadow: boolean;
  showBackdropBlur: boolean;
}) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="mb-2">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as GlassVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-7 gap-1 rounded-none border-dashed px-2 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="center" className="min-w-28">
            {allVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        className="relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.98] cursor-pointer"
        style={{
          background: showBorderGradient
            ? `linear-gradient(90deg, rgba(255,255,255,0.6) 0%, ${getVariantColor(variant, 0.6)} 52.26%, rgba(255,255,255,0.6) 100%)`
            : "rgba(255,255,255,0.15)",
          borderRadius: "100px",
          border: "none",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-[100px]"
          style={{
            background: showInnerFill
              ? `linear-gradient(263.57deg, ${getVariantTint(variant, 0.4)} 10.17%, ${getVariantColor(variant, 0.4)} 48.94%, ${getVariantTint(variant, 0.4)} 103.12%)`
              : "transparent",
            boxShadow: showBoxShadow
              ? `0px 36.86px 13.98px ${getVariantColor(variant, 0.02)}, 0px 20.34px 12.71px ${getVariantColor(variant, 0.08)}, 0px 8.9px 8.9px ${getVariantColor(variant, 0.13)}, 0px 2.54px 5.08px ${getVariantColor(variant, 0.15)}`
              : "none",
            backdropFilter: showBackdropBlur ? "blur(4.5px)" : "none",
          }}
        />
        <span className="relative z-10">
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </span>
      </button>

      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span
          className={showBorderGradient ? "text-green-500" : "text-red-400"}
        >
          border: {showBorderGradient ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showInnerFill ? "text-green-500" : "text-red-400"}>
          fill: {showInnerFill ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showBoxShadow ? "text-green-500" : "text-red-400"}>
          shadow: {showBoxShadow ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showBackdropBlur ? "text-green-500" : "text-red-400"}>
          blur: {showBackdropBlur ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

function getVariantColor(variant: GlassVariant, alpha: number): string {
  const colors: Record<GlassVariant, string> = {
    blue: `rgba(16,191,255,${alpha})`,
    purple: `rgba(168,85,247,${alpha})`,
    emerald: `rgba(16,185,129,${alpha})`,
    rose: `rgba(244,63,94,${alpha})`,
    amber: `rgba(245,158,11,${alpha})`,
    cyan: `rgba(6,182,212,${alpha})`,
    lime: `rgba(132,204,22,${alpha})`,
    slate: `rgba(100,116,139,${alpha})`,
    red: `rgba(239,68,68,${alpha})`,
    indigo: `rgba(99,102,241,${alpha})`,
  };
  return colors[variant];
}

function getVariantTint(variant: GlassVariant, alpha: number): string {
  const tints: Record<GlassVariant, string> = {
    blue: `rgba(199,240,255,${alpha})`,
    purple: `rgba(243,232,255,${alpha})`,
    emerald: `rgba(209,250,229,${alpha})`,
    rose: `rgba(255,228,230,${alpha})`,
    amber: `rgba(254,243,199,${alpha})`,
    cyan: `rgba(207,250,254,${alpha})`,
    lime: `rgba(236,252,203,${alpha})`,
    slate: `rgba(226,232,240,${alpha})`,
    red: `rgba(254,226,226,${alpha})`,
    indigo: `rgba(224,231,255,${alpha})`,
  };
  return tints[variant];
}

const GlassContent = ({
  showBorderGradient,
  setShowBorderGradient,
  showInnerFill,
  setShowInnerFill,
  showBoxShadow,
  setShowBoxShadow,
  showBackdropBlur,
  setShowBackdropBlur,
}: {
  showBorderGradient: boolean;
  setShowBorderGradient: React.Dispatch<React.SetStateAction<boolean>>;
  showInnerFill: boolean;
  setShowInnerFill: React.Dispatch<React.SetStateAction<boolean>>;
  showBoxShadow: boolean;
  setShowBoxShadow: React.Dispatch<React.SetStateAction<boolean>>;
  showBackdropBlur: boolean;
  setShowBackdropBlur: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">
          How the Glass Button Works
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          The glass button uses a gradient border trick: the outer element has a
          gradient background that acts as the border, while an inner span with{" "}
          <strong>inset-[3px]</strong> creates the frosted glass fill. This 3px
          gap reveals the outer gradient underneath, creating a smooth gradient
          border without actual CSS border properties.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold">Border Gradient</h4>
          </div>
          <ToggleButton
            toggle={showBorderGradient}
            setToggle={setShowBorderGradient}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The outer <strong>button</strong> element has a horizontal gradient as
          its background — white edges fading into the accent color at the
          center. This gradient is only visible through the 3px gap between the
          button edge and the inner span, creating the illusion of a gradient
          border.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`// Outer button background = border color
background: linear-gradient(
  90deg,
  rgba(255, 255, 255, 0.6) 0%,
  rgba(16, 191, 255, 0.6) 52.26%,
  rgba(255, 255, 255, 0.6) 100%
);
border-radius: 100px;`}
          </pre>
        </div>
        <div className="flex gap-1">
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(255, 255, 255, 0.6)" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(16, 191, 255, 0.6)" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(255, 255, 255, 0.6)" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off to see: without the gradient, the border area becomes a
          flat semi-transparent surface.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold">Inner Fill Gradient</h4>
          </div>
          <ToggleButton toggle={showInnerFill} setToggle={setShowInnerFill} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An absolutely positioned <strong>span</strong> with{" "}
          <strong>inset-[3px]</strong> sits inside the button. Its own gradient
          gives the frosted glass look — tinted edges with a stronger accent in
          the center. The 3px inset is what reveals the outer gradient as a
          &quot;border&quot;.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`// Inner span = glass fill
<span
  className="absolute inset-[3px] rounded-[100px]"
  style={{
    background: linear-gradient(
      263.57deg,
      rgba(199, 240, 255, 0.4) 10.17%,
      rgba(0, 187, 255, 0.4) 48.94%,
      rgba(199, 240, 255, 0.4) 103.12%
    ),
  }}
/>`}
          </pre>
        </div>
        <div className="flex gap-1">
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(199, 240, 255, 0.4)" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(0, 187, 255, 0.4)" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(199, 240, 255, 0.4)" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: without the inner fill, the button becomes fully
          transparent revealing the border gradient across the entire area.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold">Layered Box Shadow</h4>
          </div>
          <ToggleButton toggle={showBoxShadow} setToggle={setShowBoxShadow} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Four box-shadow layers at different sizes create a soft, natural glow
          beneath the button. Each layer uses the variant&apos;s accent color at
          decreasing opacities — from 0.02 (widest) to 0.15 (tightest) —
          producing the &quot;floating&quot; depth effect.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`box-shadow:
  0px 36.86px 13.98px rgba(94,212,255, 0.02),
  0px 20.34px 12.71px rgba(94,212,255, 0.08),
  0px  8.9px  8.9px  rgba(94,212,255, 0.13),
  0px  2.54px 5.08px rgba(94,212,255, 0.15);`}
          </pre>
        </div>
        <div className="flex gap-1">
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(94, 212, 255, 0.02)" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(94, 212, 255, 0.08)" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(94, 212, 255, 0.13)" }}
          />
          <div
            className="h-6 flex-1 rounded-sm"
            style={{ background: "rgba(94, 212, 255, 0.15)" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the button loses its floating glow and sits flat.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              4
            </span>
            <h4 className="text-sm font-semibold">Backdrop Blur</h4>
          </div>
          <ToggleButton
            toggle={showBackdropBlur}
            setToggle={setShowBackdropBlur}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>backdrop-filter: blur(4.5px)</strong> on the inner span blurs
          anything behind the button, completing the frosted glass illusion.
          This is what makes content underneath appear diffused through the
          button surface.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`backdrop-filter: blur(4.5px);`}
          </pre>
        </div>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Layer Stack</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showBorderGradient ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Border Gradient
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showInnerFill ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Inner Fill
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showBoxShadow ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Box Shadow
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showBackdropBlur ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Backdrop Blur
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Glass Effect
          </span>
        </div>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Variant System</h4>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Each variant swaps three values — <strong>border</strong> (outer
          gradient), <strong>inner</strong> (fill gradient), and{" "}
          <strong>shadow</strong> (glow color) — while keeping the same
          structure. This makes it trivial to add new color themes without
          touching layout or animation code.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              "blue",
              "purple",
              "emerald",
              "rose",
              "amber",
              "cyan",
              "lime",
              "slate",
              "red",
              "indigo",
            ] as const
          ).map((v) => (
            <div
              key={v}
              className="flex items-center gap-1.5 px-2 py-1 border border-dashed"
            >
              <div
                className="size-3 rounded-full shrink-0"
                style={{ background: getVariantColor(v, 0.8) }}
              />
              <span className="text-[10px] capitalize">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const GlassButtonTutorial = () => {
  const [variant, setVariant] = useState<GlassVariant>("blue");
  const [showBorderGradient, setShowBorderGradient] = useState(true);
  const [showInnerFill, setShowInnerFill] = useState(true);
  const [showBoxShadow, setShowBoxShadow] = useState(true);
  const [showBackdropBlur, setShowBackdropBlur] = useState(true);
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
              registryName="glass-button"
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
                  value={GLASS_SOURCE}
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
                <GlassPreview
                  variant={variant}
                  setVariant={setVariant}
                  showBorderGradient={showBorderGradient}
                  showInnerFill={showInnerFill}
                  showBoxShadow={showBoxShadow}
                  showBackdropBlur={showBackdropBlur}
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
          <GlassContent
            showBorderGradient={showBorderGradient}
            setShowBorderGradient={setShowBorderGradient}
            showInnerFill={showInnerFill}
            setShowInnerFill={setShowInnerFill}
            showBoxShadow={showBoxShadow}
            setShowBoxShadow={setShowBoxShadow}
            showBackdropBlur={showBackdropBlur}
            setShowBackdropBlur={setShowBackdropBlur}
          />
        </div>
      </div>
    </div>
  );
};

export default GlassButtonTutorial;
