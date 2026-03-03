"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOURCE = `import React from "react";

const OrangePremiumButton = ({ children }) => {
  return (
    <button
      className="px-4 py-3 rounded-3xl cursor-pointer font-medium text-white"
      style={{
        background:
          "linear-gradient(0.1deg, rgba(255,74,74,0) 0.09%, rgba(255,36,36,0.2) 76.39%), " +
          "linear-gradient(360deg, #FFF16E 2.67%, #FF8A33 30.48%, #FF4A4A 51.8%), " +
          "#FF4A4A",
        backgroundBlendMode: "soft-light, normal, normal, normal",
        boxShadow:
          "0px 7.25px 7.5px rgba(255,245,153,0.3), " +
          "0px 5px 7.5px rgba(255,197,128,0.56), " +
          "inset 1px -1px 5px rgba(255,255,255,0.4), " +
          "inset -1px -1px 5px rgba(255,255,255,0.4), " +
          "inset -2px -2px 5px rgba(255,255,255,0.4), " +
          "inset 2px -2px 5px rgba(255,255,255,0.4)",
      }}
    >
      {children || "Cool Button"}
    </button>
  );
};

export default OrangePremiumButton;`;

const OrangePremiumPreview = ({
  showBaseGradient,
  showOverlayGradient,
  showOuterGlow,
  showInnerLight,
}: {
  showBaseGradient: boolean;
  showOverlayGradient: boolean;
  showOuterGlow: boolean;
  showInnerLight: boolean;
}) => {
  const buildBackground = () => {
    const layers: string[] = [];
    if (showOverlayGradient) {
      layers.push("linear-gradient(0.1deg, rgba(255,74,74,0) 0.09%, rgba(255,36,36,0.2) 76.39%)");
    }
    if (showBaseGradient) {
      layers.push("linear-gradient(360deg, #FFF16E 2.67%, #FF8A33 30.48%, #FF4A4A 51.8%)");
    }
    if (layers.length === 0) return "#FF4A4A";
    return layers.join(", ") + ", #FF4A4A";
  };

  const buildShadow = () => {
    const shadows: string[] = [];
    if (showOuterGlow) {
      shadows.push("0px 7.25px 7.5px rgba(255,245,153,0.3)");
      shadows.push("0px 5px 7.5px rgba(255,197,128,0.56)");
    }
    if (showInnerLight) {
      shadows.push("inset 1px -1px 5px rgba(255,255,255,0.4)");
      shadows.push("inset -1px -1px 5px rgba(255,255,255,0.4)");
      shadows.push("inset -2px -2px 5px rgba(255,255,255,0.4)");
      shadows.push("inset 2px -2px 5px rgba(255,255,255,0.4)");
    }
    return shadows.length > 0 ? shadows.join(", ") : "none";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        className="px-6 py-3 rounded-3xl cursor-pointer font-medium text-white text-sm transition-all active:scale-95"
        style={{
          background: buildBackground(),
          backgroundBlendMode: showOverlayGradient ? "soft-light, normal, normal, normal" : undefined,
          boxShadow: buildShadow(),
        }}
      >
        Cool Button
      </button>

      <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap justify-center">
        <span className={showBaseGradient ? "text-green-500" : "text-red-400"}>
          gradient: {showBaseGradient ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showOverlayGradient ? "text-green-500" : "text-red-400"}>
          overlay: {showOverlayGradient ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showOuterGlow ? "text-green-500" : "text-red-400"}>
          glow: {showOuterGlow ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showInnerLight ? "text-green-500" : "text-red-400"}>
          inner: {showInnerLight ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const OrangePremiumContent = ({
  showBaseGradient, setShowBaseGradient,
  showOverlayGradient, setShowOverlayGradient,
  showOuterGlow, setShowOuterGlow,
  showInnerLight, setShowInnerLight,
}: {
  showBaseGradient: boolean; setShowBaseGradient: React.Dispatch<React.SetStateAction<boolean>>;
  showOverlayGradient: boolean; setShowOverlayGradient: React.Dispatch<React.SetStateAction<boolean>>;
  showOuterGlow: boolean; setShowOuterGlow: React.Dispatch<React.SetStateAction<boolean>>;
  showInnerLight: boolean; setShowInnerLight: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="flex flex-col gap-6 text-sm leading-relaxed">
    <div>
      <h3 className="text-base font-semibold mb-2">How the Gradient Button Works</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        This button achieves its vibrant look through multiple stacked CSS
        gradients, blend modes, and layered box-shadows. Toggle each layer
        individually to understand how they contribute to the final result.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
          <h4 className="text-sm font-semibold">Base Gradient</h4>
        </div>
        <ToggleButton toggle={showBaseGradient} setToggle={setShowBaseGradient} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The primary gradient sweeps from <strong>yellow (#FFF16E)</strong> at
        the bottom through <strong>orange (#FF8A33)</strong> to{" "}
        <strong>red (#FF4A4A)</strong> at the top. This creates the warm,
        vibrant sunset effect.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`linear-gradient(360deg,
  #FFF16E 2.67%,   /* yellow at bottom */
  #FF8A33 30.48%,  /* orange */
  #FF4A4A 51.8%    /* red at top */
)`}
        </pre>
      </div>
      <div className="flex gap-1">
        <div className="h-6 flex-1 rounded-sm" style={{ background: "#FFF16E" }} />
        <div className="h-6 flex-1 rounded-sm" style={{ background: "#FF8A33" }} />
        <div className="h-6 flex-1 rounded-sm" style={{ background: "#FF4A4A" }} />
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to see: the button falls back to a flat #FF4A4A red.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
          <h4 className="text-sm font-semibold">Soft-Light Overlay</h4>
        </div>
        <ToggleButton toggle={showOverlayGradient} setToggle={setShowOverlayGradient} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A second gradient layer with <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">soft-light</code> blend
        mode is stacked on top. It subtly brightens the upper half, adding a
        warm glow that makes the color feel richer and more alive.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`linear-gradient(0.1deg,
  rgba(255,74,74,0) 0.09%,
  rgba(255,36,36,0.2) 76.39%
)
backgroundBlendMode: "soft-light"`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
          <h4 className="text-sm font-semibold">Outer Glow</h4>
        </div>
        <ToggleButton toggle={showOuterGlow} setToggle={setShowOuterGlow} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Two outer <strong>box-shadows</strong> create a colorful glow around the
        button. A warm yellow glow and an orange glow layer together to give the
        button a sense of emitting light.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`0px 7.25px 7.5px rgba(255,245,153,0.3),
0px 5px 7.5px rgba(255,197,128,0.56)`}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off: the button looks flat without the light diffusion.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">4</span>
          <h4 className="text-sm font-semibold">Inner Light Highlights</h4>
        </div>
        <ToggleButton toggle={showInnerLight} setToggle={setShowInnerLight} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Four <strong>inset shadows</strong> from different angles create a subtle
        inner highlight effect. This gives the button a glass-like quality, as if
        light is being caught on its rounded edges.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`inset  1px -1px 5px rgba(255,255,255,0.4),
inset -1px -1px 5px rgba(255,255,255,0.4),
inset -2px -2px 5px rgba(255,255,255,0.4),
inset  2px -2px 5px rgba(255,255,255,0.4)`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="border border-dashed p-4">
      <h4 className="text-xs font-semibold mb-3">Layer Stack</h4>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="px-2 py-1 border border-dashed bg-red-500/10 text-red-600 border-red-500/30">#FF4A4A Base</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showBaseGradient ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Gradient</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showOverlayGradient ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Soft-Light</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showOuterGlow ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Outer Glow</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showInnerLight ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Inner Light</span>
        <span>=</span>
        <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">Premium</span>
      </div>
    </div>
  </div>
);

export const OrangePremiumButtonTutorial = () => {
  const [showBaseGradient, setShowBaseGradient] = useState(true);
  const [showOverlayGradient, setShowOverlayGradient] = useState(true);
  const [showOuterGlow, setShowOuterGlow] = useState(true);
  const [showInnerLight, setShowInnerLight] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[calc(100vh-120px)]">
      <div className="border-b border-dashed lg:border-b-0 lg:border-r flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Preview</p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[280px] sm:min-h-[340px] lg:min-h-0 p-4 sm:p-6">
          <div className="flex bg-background items-center gap-1.5 absolute top-2 right-2 z-50">
            <button onClick={() => setShowCode(!showCode)} className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed rounded-none transition-colors cursor-pointer ${showCode ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}>
              {showCode ? <Eye className="size-3" /> : <Code className="size-3" />}
              {showCode ? "Preview" : "Code"}
            </button>
            <CopyDropdown registryName="orange-premium-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <OrangePremiumPreview showBaseGradient={showBaseGradient} showOverlayGradient={showOverlayGradient} showOuterGlow={showOuterGlow} showInnerLight={showInnerLight} />
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
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Tutorial</p>
        </div>
        <div className="p-4 sm:p-6 flex-1">
          <OrangePremiumContent
            showBaseGradient={showBaseGradient} setShowBaseGradient={setShowBaseGradient}
            showOverlayGradient={showOverlayGradient} setShowOverlayGradient={setShowOverlayGradient}
            showOuterGlow={showOuterGlow} setShowOuterGlow={setShowOuterGlow}
            showInnerLight={showInnerLight} setShowInnerLight={setShowInnerLight}
          />
        </div>
      </div>
    </div>
  );
};

export default OrangePremiumButtonTutorial;


