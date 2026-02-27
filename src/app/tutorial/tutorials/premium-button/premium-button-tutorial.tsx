"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOURCE = `import React from "react";

const PremiumButton = ({ children }) => {
  return (
    <button
      className="bg-muted px-4 py-3 rounded-md cursor-pointer font-medium"
      style={{
        boxShadow:
          // Five layered outer shadows (increasing spread)
          "0.44px 0.44px 0.63px -1px rgba(0,0,0,0.26), " +
          "1.21px 1.21px 1.71px -1.5px rgba(0,0,0,0.247), " +
          "2.66px 2.66px 3.76px -2.25px rgba(0,0,0,0.23), " +
          "5.9px 5.9px 8.35px -3px rgba(0,0,0,0.192), " +
          "10px 10px 21.21px -3.75px rgba(0,0,0,0.055), " +
          // Bottom fill shadow
          "-0.5px -0.5px 0px rgba(0,0,0,0.05), " +
          // Inner highlights (top-left light, bottom-right dark)
          "inset 1px 1px 1px #FFFFFF, " +
          "inset -1px -1px 1px rgba(0,0,0,0.15)",
      }}
    >
      {children || "Premium Button"}
    </button>
  );
};

export default PremiumButton;`;

const PremiumPreview = ({
  showOuterShadows,
  showInnerHighlight,
  showInnerDark,
}: {
  showOuterShadows: boolean;
  showInnerHighlight: boolean;
  showInnerDark: boolean;
}) => {
  const buildShadow = () => {
    const parts: string[] = [];
    if (showOuterShadows) {
      parts.push("0.444584px 0.444584px 0.628737px -1px rgba(0,0,0,0.26)");
      parts.push("1.21072px 1.21072px 1.71222px -1.5px rgba(0,0,0,0.247)");
      parts.push("2.6583px 2.6583px 3.75941px -2.25px rgba(0,0,0,0.23)");
      parts.push("5.90083px 5.90083px 8.34503px -3px rgba(0,0,0,0.192)");
      parts.push("10px 10px 21.2132px -3.75px rgba(0,0,0,0.055)");
      parts.push("-0.5px -0.5px 0px rgba(0,0,0,0.05)");
    }
    if (showInnerHighlight) {
      parts.push("inset 1px 1px 1px #FFFFFF");
    }
    if (showInnerDark) {
      parts.push("inset -1px -1px 1px rgba(0,0,0,0.15)");
    }
    return parts.length > 0 ? parts.join(", ") : "none";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        className="bg-muted px-6 py-3 rounded-md cursor-pointer font-medium text-sm transition-all active:scale-95"
        style={{ boxShadow: buildShadow() }}
      >
        Premium Button
      </button>

      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className={showOuterShadows ? "text-green-500" : "text-red-400"}>depth: {showOuterShadows ? "on" : "off"}</span>
        <span>·</span>
        <span className={showInnerHighlight ? "text-green-500" : "text-red-400"}>highlight: {showInnerHighlight ? "on" : "off"}</span>
        <span>·</span>
        <span className={showInnerDark ? "text-green-500" : "text-red-400"}>dark edge: {showInnerDark ? "on" : "off"}</span>
      </div>
    </div>
  );
};

const PremiumContent = ({
  showOuterShadows, setShowOuterShadows,
  showInnerHighlight, setShowInnerHighlight,
  showInnerDark, setShowInnerDark,
}: {
  showOuterShadows: boolean; setShowOuterShadows: React.Dispatch<React.SetStateAction<boolean>>;
  showInnerHighlight: boolean; setShowInnerHighlight: React.Dispatch<React.SetStateAction<boolean>>;
  showInnerDark: boolean; setShowInnerDark: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="flex flex-col gap-6 text-sm leading-relaxed">
    <div>
      <h3 className="text-base font-semibold mb-2">How the Premium Shadow Works</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        This button uses a carefully crafted multi-layer box-shadow to simulate
        depth and materiality. Five outer shadows with progressively larger
        spreads create natural light falloff, while inset shadows simulate a
        beveled edge.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
          <h4 className="text-sm font-semibold">Multi-Layer Outer Shadows</h4>
        </div>
        <ToggleButton toggle={showOuterShadows} setToggle={setShowOuterShadows} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Five outer shadows with <strong>increasing blur and decreasing
        opacity</strong> simulate natural light diffusion. Each layer uses a
        negative spread to keep the shadow tight. The smallest shadow (0.44px)
        creates a crisp edge while the largest (10px) provides soft ambient
        occlusion.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`/* Layer 1: crisp edge */  0.44px  blur:0.63px  alpha:0.26
/* Layer 2: near shadow */ 1.21px  blur:1.71px  alpha:0.247
/* Layer 3: mid shadow */  2.66px  blur:3.76px  alpha:0.23
/* Layer 4: far shadow */  5.90px  blur:8.35px  alpha:0.192
/* Layer 5: ambient */     10px    blur:21.2px  alpha:0.055`}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to see: the button looks completely flat without depth.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
          <h4 className="text-sm font-semibold">Inner Highlight (Top-Left)</h4>
        </div>
        <ToggleButton toggle={showInnerHighlight} setToggle={setShowInnerHighlight} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A white <strong>inset shadow</strong> at the top-left corner simulates
        light coming from above-left. This creates the illusion of a slightly
        raised, beveled surface.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`inset 1px 1px 1px #FFFFFF`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
          <h4 className="text-sm font-semibold">Inner Dark Edge (Bottom-Right)</h4>
        </div>
        <ToggleButton toggle={showInnerDark} setToggle={setShowInnerDark} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A dark <strong>inset shadow</strong> at the bottom-right creates the
        opposite edge of the bevel. Together with the highlight, this pair
        creates a convincing 3D surface.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`inset -1px -1px 1px rgba(0,0,0,0.15)`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="border border-dashed p-4">
      <h4 className="text-xs font-semibold mb-3">Shadow Stack</h4>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className={`px-2 py-1 border border-dashed transition-colors ${showOuterShadows ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>5x Outer</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showInnerHighlight ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Highlight</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showInnerDark ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Dark Edge</span>
        <span>=</span>
        <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">Premium</span>
      </div>
    </div>
  </div>
);

export const PremiumButtonTutorial = () => {
  const [showOuterShadows, setShowOuterShadows] = useState(true);
  const [showInnerHighlight, setShowInnerHighlight] = useState(true);
  const [showInnerDark, setShowInnerDark] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 h-[calc(100vh-120px)]">
      <div className="border-r border-dashed flex flex-col">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Preview</p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[400px]">
          <div className="flex bg-background items-center gap-1.5 absolute top-2 right-2 z-50">
            <button onClick={() => setShowCode(!showCode)} className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed rounded-none transition-colors cursor-pointer ${showCode ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}>
              {showCode ? <Eye className="size-3" /> : <Code className="size-3" />}
              {showCode ? "Preview" : "Code"}
            </button>
            <CopyDropdown registryName="premium-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <PremiumPreview showOuterShadows={showOuterShadows} showInnerHighlight={showInnerHighlight} showInnerDark={showInnerDark} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="absolute top-0 left-0 block size-5 border-l border-t border-dashed border-muted-foreground" />
          <span className="absolute top-0 right-0 block size-5 border-r border-t border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 left-0 block size-5 border-l border-b border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 right-0 block size-5 border-r border-b border-dashed border-muted-foreground" />
        </div>
      </div>
      <div className="flex flex-col min-h-0">
        <div className="px-4 py-2 border-b border-dashed shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Tutorial</p>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <PremiumContent showOuterShadows={showOuterShadows} setShowOuterShadows={setShowOuterShadows} showInnerHighlight={showInnerHighlight} setShowInnerHighlight={setShowInnerHighlight} showInnerDark={showInnerDark} setShowInnerDark={setShowInnerDark} />
        </div>
      </div>
    </div>
  );
};

export default PremiumButtonTutorial;
