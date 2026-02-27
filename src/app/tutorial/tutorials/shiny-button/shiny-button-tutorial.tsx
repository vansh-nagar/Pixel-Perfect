"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOURCE = `"use client";
import React from "react";
import { Button } from "@/components/ui/button";

const ShinyButton = ({ children }) => {
  return (
    <div className="shiny-wrapper border overflow-hidden rounded-md">
      <style>{\`
        .shiny-wrapper {
          position: relative;
          display: inline-block;
          overflow: hidden;
        }
        .shiny-wrapper .shiny-mask {
          display: block;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(255, 255, 255, 0.6);
          transform: translateX(-100%) rotate(45deg);
          pointer-events: none;
          z-index: 10;
        }
        .shiny-wrapper:hover .shiny-mask {
          animation: shiny-mask 0.4s ease-out;
        }
        @keyframes shiny-mask {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
      \`}</style>
      <Button>{children ?? "Hover Me"}</Button>
      <span className="shiny-mask"></span>
    </div>
  );
};

export default ShinyButton;`;

const ShinyPreview = ({
  showShine,
  showRotation,
  showOverflow,
}: {
  showShine: boolean;
  showRotation: boolean;
  showOverflow: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <style>{`
        @keyframes shiny-tutorial {
          0% { transform: translateX(-100%) ${showRotation ? "rotate(45deg)" : "rotate(0deg)"}; }
          100% { transform: translateX(100%) ${showRotation ? "rotate(45deg)" : "rotate(0deg)"}; }
        }
      `}</style>
      <div
        className="relative inline-block border rounded-md"
        style={{ overflow: showOverflow ? "hidden" : "visible" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground cursor-pointer relative z-0">
          Hover Me
        </button>
        {showShine && (
          <span
            className="block absolute inset-0 pointer-events-none z-10"
            style={{
              background: "rgba(255, 255, 255, 0.6)",
              transform: `translateX(-100%) ${showRotation ? "rotate(45deg)" : "rotate(0deg)"}`,
              animation: hovered ? "shiny-tutorial 0.4s ease-out" : "none",
            }}
          />
        )}
      </div>

      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className={showShine ? "text-green-500" : "text-red-400"}>shine: {showShine ? "on" : "off"}</span>
        <span>·</span>
        <span className={showRotation ? "text-green-500" : "text-red-400"}>rotate: {showRotation ? "on" : "off"}</span>
        <span>·</span>
        <span className={showOverflow ? "text-green-500" : "text-red-400"}>clip: {showOverflow ? "on" : "off"}</span>
      </div>
    </div>
  );
};

const ShinyContent = ({
  showShine, setShowShine,
  showRotation, setShowRotation,
  showOverflow, setShowOverflow,
}: {
  showShine: boolean; setShowShine: React.Dispatch<React.SetStateAction<boolean>>;
  showRotation: boolean; setShowRotation: React.Dispatch<React.SetStateAction<boolean>>;
  showOverflow: boolean; setShowOverflow: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="flex flex-col gap-6 text-sm leading-relaxed">
    <div>
      <h3 className="text-base font-semibold mb-2">How the Shiny Button Works</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        A translucent white overlay sweeps across the button on hover using a
        CSS keyframe animation. The combination of rotation, overflow clipping,
        and a semi-transparent mask creates the classic &quot;shine&quot; effect.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
          <h4 className="text-sm font-semibold">Shine Mask</h4>
        </div>
        <ToggleButton toggle={showShine} setToggle={setShowShine} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        An absolutely positioned <strong>span</strong> covers the entire button area
        with <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">rgba(255,255,255,0.6)</code>.
        On hover, a keyframe animation slides it from left (-100%) to right (+100%).
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`.shiny-mask {
  background: rgba(255, 255, 255, 0.6);
  transform: translateX(-100%) rotate(45deg);
}
@keyframes shiny-mask {
  0%   { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}`}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to see: without the mask, the button is static on hover.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
          <h4 className="text-sm font-semibold">45 Degree Rotation</h4>
        </div>
        <ToggleButton toggle={showRotation} setToggle={setShowRotation} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The mask is rotated <strong>45 degrees</strong>, which creates a diagonal
        sweep instead of a flat horizontal one. This makes the effect look much
        more natural, like light reflecting off a glossy surface.
      </p>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to compare: a flat horizontal sweep vs. the diagonal one.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
          <h4 className="text-sm font-semibold">Overflow Clipping</h4>
        </div>
        <ToggleButton toggle={showOverflow} setToggle={setShowOverflow} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The wrapper uses <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">overflow: hidden</code> to
        clip the mask. Without this, the white overlay would be visible outside
        the button boundaries during its sweep.
      </p>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to see: the shine leaks out beyond the button edges.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="border border-dashed p-4">
      <h4 className="text-xs font-semibold mb-3">Effect Pipeline</h4>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">Hover</span>
        <span>&#8594;</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showShine ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Shine Mask</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showRotation ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Rotate 45deg</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showOverflow ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Clip</span>
        <span>&#8594;</span>
        <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">Shiny</span>
      </div>
    </div>
  </div>
);

export const ShinyButtonTutorial = () => {
  const [showShine, setShowShine] = useState(true);
  const [showRotation, setShowRotation] = useState(true);
  const [showOverflow, setShowOverflow] = useState(true);
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
            <CopyDropdown registryName="shiny-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <ShinyPreview showShine={showShine} showRotation={showRotation} showOverflow={showOverflow} />
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
          <ShinyContent showShine={showShine} setShowShine={setShowShine} showRotation={showRotation} setShowRotation={setShowRotation} showOverflow={showOverflow} setShowOverflow={setShowOverflow} />
        </div>
      </div>
    </div>
  );
};

export default ShinyButtonTutorial;
