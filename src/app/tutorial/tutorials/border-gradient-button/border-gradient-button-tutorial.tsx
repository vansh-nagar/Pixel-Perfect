"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOURCE = `import { Button } from "@/components/ui/button";

const BorderGradientButton = () => {
  return (
    <Button className="relative rounded-md animate-rainbow
      bg-[linear-gradient(45deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))]
      bg-[length:200%] active:scale-[0.95] group">
      <div className="z-0 absolute inset-[1.5px] bg-background/95
        group-hover:bg-background/40 backdrop-blur-3xl rounded-sm
        transition-all saturate-200" />
      <span className="z-10 text-foreground pointer-events-none">
        Gradient Border
      </span>
    </Button>
  );
};`;

const GradientBorderPreview = ({
  showGradient,
  showInnerFill,
  showAnimation,
}: {
  showGradient: boolean;
  showInnerFill: boolean;
  showAnimation: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        className="relative rounded-md px-4 py-2 text-sm font-medium cursor-pointer group"
        style={{
          background: showGradient
            ? "linear-gradient(45deg, #e2e2e2, #4f46e5, #ec4899, #eab308, #06b6d4)"
            : "#e5e7eb",
          backgroundSize: showAnimation ? "200%" : "100%",
          animation: showAnimation && showGradient ? "rainbow 4s linear infinite" : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <style>{`
          @keyframes rainbow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        {showInnerFill && (
          <div
            className="absolute rounded-sm transition-all duration-300"
            style={{
              inset: "1.5px",
              background: hovered ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(50px)",
            }}
          />
        )}
        <span className="relative z-10 text-foreground pointer-events-none">
          Gradient Border
        </span>
      </button>

      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className={showGradient ? "text-green-500" : "text-red-400"}>gradient: {showGradient ? "on" : "off"}</span>
        <span>·</span>
        <span className={showInnerFill ? "text-green-500" : "text-red-400"}>inner: {showInnerFill ? "on" : "off"}</span>
        <span>·</span>
        <span className={showAnimation ? "text-green-500" : "text-red-400"}>animate: {showAnimation ? "on" : "off"}</span>
      </div>
    </div>
  );
};

const GradientBorderContent = ({
  showGradient, setShowGradient,
  showInnerFill, setShowInnerFill,
  showAnimation, setShowAnimation,
}: {
  showGradient: boolean; setShowGradient: React.Dispatch<React.SetStateAction<boolean>>;
  showInnerFill: boolean; setShowInnerFill: React.Dispatch<React.SetStateAction<boolean>>;
  showAnimation: boolean; setShowAnimation: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="flex flex-col gap-6 text-sm leading-relaxed">
    <div>
      <h3 className="text-base font-semibold mb-2">How Gradient Borders Work</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        CSS does not natively support gradient borders. This technique uses a
        gradient as the button background, then places an inner fill element
        with a small inset (1.5px) to expose the gradient as a &quot;border&quot;.
        The gradient also animates for a rainbow effect.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
          <h4 className="text-sm font-semibold">Gradient Background</h4>
        </div>
        <ToggleButton toggle={showGradient} setToggle={setShowGradient} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The button itself gets a <strong>45-degree linear gradient</strong> with
        multiple color stops. This is the actual &quot;border&quot;, because the
        next layer will mask most of it, exposing only the edges.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`bg-[linear-gradient(45deg,
  var(--color-1),  /* neutral */
  var(--color-5),  /* indigo */
  var(--color-3),  /* pink */
  var(--color-4),  /* yellow */
  var(--color-2)   /* cyan */
)]`}
        </pre>
      </div>
      <div className="flex gap-1">
        <div className="h-4 flex-1 rounded-sm bg-gray-300" />
        <div className="h-4 flex-1 rounded-sm bg-indigo-500" />
        <div className="h-4 flex-1 rounded-sm bg-pink-500" />
        <div className="h-4 flex-1 rounded-sm bg-yellow-500" />
        <div className="h-4 flex-1 rounded-sm bg-cyan-500" />
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
          <h4 className="text-sm font-semibold">Inner Fill Mask</h4>
        </div>
        <ToggleButton toggle={showInnerFill} setToggle={setShowInnerFill} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A child div with <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">inset: 1.5px</code> covers
        the button with the background color (95% opacity). This leaves a 1.5px
        gap on all sides where the gradient shows through, creating the border.
        On hover, opacity drops to 40%, revealing the full gradient.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`<div className="absolute inset-[1.5px]
  bg-background/95
  group-hover:bg-background/40
  backdrop-blur-3xl" />`}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to see: the gradient fills the entire button surface.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
          <h4 className="text-sm font-semibold">Rainbow Animation</h4>
        </div>
        <ToggleButton toggle={showAnimation} setToggle={setShowAnimation} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The background is set to <strong>200% width</strong> and
        animated with <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">animate-rainbow</code>.
        This shifts the gradient position continuously, creating the flowing
        rainbow border effect.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`bg-[length:200%]
animate-rainbow /* shifts background-position */`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="border border-dashed p-4">
      <h4 className="text-xs font-semibold mb-3">Technique Stack</h4>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className={`px-2 py-1 border border-dashed transition-colors ${showGradient ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Gradient BG</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showInnerFill ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>1.5px Inset</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showAnimation ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Rainbow Loop</span>
        <span>=</span>
        <span className="px-2 py-1 border border-dashed bg-purple-500/10 text-purple-600 border-purple-500/30">Gradient Border</span>
      </div>
    </div>
  </div>
);

export const BorderGradientButtonTutorial = () => {
  const [showGradient, setShowGradient] = useState(true);
  const [showInnerFill, setShowInnerFill] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
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
            <CopyDropdown registryName="border-gradient-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <GradientBorderPreview showGradient={showGradient} showInnerFill={showInnerFill} showAnimation={showAnimation} />
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
          <GradientBorderContent showGradient={showGradient} setShowGradient={setShowGradient} showInnerFill={showInnerFill} setShowInnerFill={setShowInnerFill} showAnimation={showAnimation} setShowAnimation={setShowAnimation} />
        </div>
      </div>
    </div>
  );
};

export default BorderGradientButtonTutorial;


