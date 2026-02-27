"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOURCE = `"use client";
import React, { useState } from "react";

const ThreedButton = ({ children }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // The 3D effect is built with CSS only.
  // The ::before pseudo-element creates the "depth" layer.
  // On hover, the button translates up (0.25em).
  // On press, it pushes down fully (0.75em).
  // The box-shadow on ::before shrinks to match the depth.

  return (
    <button
      className="btn-3d"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};`;

const ThreedPreview = ({
  showDepth,
  showHoverLift,
  showPressDown,
}: {
  showDepth: boolean;
  showHoverLift: boolean;
  showPressDown: boolean;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getTransform = () => {
    if (showPressDown && isPressed) return "translate(0em, 0.75em)";
    if (showHoverLift && isHovered) return "translate(0, 0.25em)";
    return "translate(0, 0)";
  };

  const getBeforeTransform = () => {
    if (showPressDown && isPressed) return "translate3d(0, 0, -1em)";
    if (showHoverLift && isHovered) return "translate3d(0, 0.5em, -1em)";
    return "translate3d(0, 0.75em, -1em)";
  };

  const getBeforeShadow = () => {
    if (showPressDown && isPressed) return "0 0 0 2px #d97706, 0 0 #fbbf24";
    if (showHoverLift && isHovered) return "0 0 0 2px #d97706, 0 0.5em 0 0 #fbbf24";
    return "0 0 0 2px #d97706, 0 0.625em 0 0 #fbbf24";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-center">
        <button
          className="relative inline-block cursor-pointer outline-none border-2 border-amber-600 font-semibold text-amber-900 uppercase px-5 py-3 rounded-xl"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 150ms cubic-bezier(0, 0, 0.58, 1), background 150ms cubic-bezier(0, 0, 0.58, 1)",
            background: isPressed || isHovered ? "#fde047" : "#fef3c7",
            transform: getTransform(),
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
        >
          {showDepth && (
            <span
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: "#f59e0b",
                boxShadow: getBeforeShadow(),
                transform: getBeforeTransform(),
                transition: "transform 150ms cubic-bezier(0, 0, 0.58, 1), box-shadow 150ms cubic-bezier(0, 0, 0.58, 1)",
              }}
            />
          )}
          <span className="relative z-10">Click Me</span>
        </button>
      </div>

      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className={showDepth ? "text-green-500" : "text-red-400"}>
          depth: {showDepth ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showHoverLift ? "text-green-500" : "text-red-400"}>
          hover lift: {showHoverLift ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showPressDown ? "text-green-500" : "text-red-400"}>
          press: {showPressDown ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const ThreedContent = ({
  showDepth, setShowDepth,
  showHoverLift, setShowHoverLift,
  showPressDown, setShowPressDown,
}: {
  showDepth: boolean; setShowDepth: React.Dispatch<React.SetStateAction<boolean>>;
  showHoverLift: boolean; setShowHoverLift: React.Dispatch<React.SetStateAction<boolean>>;
  showPressDown: boolean; setShowPressDown: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="flex flex-col gap-6 text-sm leading-relaxed">
    <div>
      <h3 className="text-base font-semibold mb-2">How the 3D Button Works</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        This button creates a physical &quot;pushable&quot; feel using pure CSS.
        A pseudo-element behind the button acts as a 3D depth layer.
        On hover the button lifts, on press it pushes down.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
          <h4 className="text-sm font-semibold">::before Depth Layer</h4>
        </div>
        <ToggleButton toggle={showDepth} setToggle={setShowDepth} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The <strong>::before pseudo-element</strong> is positioned with{" "}
        <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">transform: translate3d(0, 0.75em, -1em)</code>.
        This pushes it behind and below the button, creating the illusion of thickness.
        The amber <strong>box-shadow</strong> reinforces the 3D depth.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`.btn-3d::before {
  background: #f59e0b;
  border-radius: 0.75em;
  box-shadow: 0 0 0 2px #d97706,
              0 0.625em 0 0 #fbbf24;
  transform: translate3d(0, 0.75em, -1em);
}`}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to see: the button becomes flat with no perceived depth.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
          <h4 className="text-sm font-semibold">Hover Lift</h4>
        </div>
        <ToggleButton toggle={showHoverLift} setToggle={setShowHoverLift} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        On hover, the button translates up by <strong>0.25em</strong>, making it
        appear to rise slightly. The depth layer adjusts its shadow and
        position to match, maintaining the 3D illusion.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`// Hover state
transform: translate(0, 0.25em);
// ::before adjusts
box-shadow: 0 0 0 2px #d97706,
            0 0.5em 0 0 #fbbf24;`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
          <h4 className="text-sm font-semibold">Press Down</h4>
        </div>
        <ToggleButton toggle={showPressDown} setToggle={setShowPressDown} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        On mousedown, the button translates down by <strong>0.75em</strong>,
        fully compressing the depth layer. The shadow reduces to zero,
        simulating a physical button press.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`// Pressed state
transform: translate(0em, 0.75em);
// ::before flattens
box-shadow: 0 0 0 2px #d97706, 0 0 #fbbf24;
transform: translate3d(0, 0, -1em);`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="border border-dashed p-4">
      <h4 className="text-xs font-semibold mb-3">State Machine</h4>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">Rest</span>
        <span>&#8594;</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showHoverLift ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>
          Hover Lift
        </span>
        <span>&#8594;</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showPressDown ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>
          Press Down
        </span>
        <span>&#8594;</span>
        <span className="px-2 py-1 border border-dashed bg-amber-500/10 text-amber-600 border-amber-500/30">
          Release
        </span>
      </div>
    </div>
  </div>
);

export const ThreedButtonTutorial = () => {
  const [showDepth, setShowDepth] = useState(true);
  const [showHoverLift, setShowHoverLift] = useState(true);
  const [showPressDown, setShowPressDown] = useState(true);
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
            <CopyDropdown registryName="3d-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <ThreedPreview showDepth={showDepth} showHoverLift={showHoverLift} showPressDown={showPressDown} />
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
          <ThreedContent showDepth={showDepth} setShowDepth={setShowDepth} showHoverLift={showHoverLift} setShowHoverLift={setShowHoverLift} showPressDown={showPressDown} setShowPressDown={setShowPressDown} />
        </div>
      </div>
    </div>
  );
};

export default ThreedButtonTutorial;
