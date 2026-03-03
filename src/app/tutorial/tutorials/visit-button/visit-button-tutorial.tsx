"use client";

import React, { useState } from "react";
import { Code, Eye, ArrowUpRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOURCE = `import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";

const VisitButton = ({ label = "Visit", hoverLabel = "Add :)" }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.button
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      className="flex justify-between w-32 gap-2 px-4 py-2.5 rounded-md"
      style={{
        background: "#F4F4F4",
        boxShadow: "multi-layer premium shadow...",
      }}
    >
      <AnimatePresence mode="wait">
        {isHovering ? (
          <motion.span key="add"
            initial={{ y: 10, filter: "blur(1px)", opacity: 0 }}
            animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
            exit={{ y: -10, filter: "blur(1px)", opacity: 0 }}
          >{hoverLabel}</motion.span>
        ) : (
          <motion.span key="visit" ...>{label}</motion.span>
        )}
      </AnimatePresence>
      {/* Same pattern for icon swap */}
    </motion.button>
  );
};`;

const VisitPreview = ({
  showLabelSwap,
  showIconSwap,
  showBlurTransition,
}: {
  showLabelSwap: boolean;
  showIconSwap: boolean;
  showBlurTransition: boolean;
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.button
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        className="flex justify-between w-36 gap-2 px-4 py-2.5 rounded-md cursor-pointer font-medium text-sm"
        style={{
          background: "#F4F4F4",
          boxShadow: "0.444584px 0.444584px 0.628737px -1px rgba(0,0,0,0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(0,0,0,0.247), 2.6583px 2.6583px 3.75941px -2.25px rgba(0,0,0,0.23), 5.90083px 5.90083px 8.34503px -3px rgba(0,0,0,0.192), inset 1px 1px 1px #FFFFFF, inset -1px -1px 1px rgba(0,0,0,0.15)",
        }}
      >
        <AnimatePresence mode="wait">
          {showLabelSwap && isHovering ? (
            <motion.span
              key="add"
              initial={{ y: 10, filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0 }}
              animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
              exit={{ y: -10, filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              Add :)
            </motion.span>
          ) : (
            <motion.span
              key="visit"
              initial={{ y: 10, filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0 }}
              animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
              exit={{ y: -10, filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              Visit
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {showIconSwap && isHovering ? (
            <motion.div
              key="plus"
              initial={{ filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0, rotate: -45 }}
              animate={{ filter: "blur(0px)", opacity: 1, rotate: 0 }}
              exit={{ filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0, rotate: 45 }}
              transition={{ duration: 0.1 }}
            >
              <Plus size={18} />
            </motion.div>
          ) : (
            <motion.div
              key="arrow"
              initial={{ filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0, rotate: -45 }}
              animate={{ filter: "blur(0px)", opacity: 1, rotate: 0 }}
              exit={{ filter: showBlurTransition ? "blur(1px)" : "blur(0px)", opacity: 0, rotate: 45 }}
              transition={{ duration: 0.1 }}
            >
              <ArrowUpRight size={18} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className={showLabelSwap ? "text-green-500" : "text-red-400"}>label: {showLabelSwap ? "on" : "off"}</span>
        <span>·</span>
        <span className={showIconSwap ? "text-green-500" : "text-red-400"}>icon: {showIconSwap ? "on" : "off"}</span>
        <span>·</span>
        <span className={showBlurTransition ? "text-green-500" : "text-red-400"}>blur: {showBlurTransition ? "on" : "off"}</span>
      </div>
    </div>
  );
};

const VisitContent = ({
  showLabelSwap, setShowLabelSwap,
  showIconSwap, setShowIconSwap,
  showBlurTransition, setShowBlurTransition,
}: {
  showLabelSwap: boolean; setShowLabelSwap: React.Dispatch<React.SetStateAction<boolean>>;
  showIconSwap: boolean; setShowIconSwap: React.Dispatch<React.SetStateAction<boolean>>;
  showBlurTransition: boolean; setShowBlurTransition: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="flex flex-col gap-6 text-sm leading-relaxed">
    <div>
      <h3 className="text-base font-semibold mb-2">How the Visit Button Works</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        This button uses Framer Motion AnimatePresence to swap both the label
        and icon on hover with a smooth blur/slide transition. The
        <code className="px-1 py-0.5 bg-foreground/5 text-[10px] mx-1">mode=&quot;wait&quot;</code>
        ensures the exit animation finishes before the enter begins.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
          <h4 className="text-sm font-semibold">Label Swap</h4>
        </div>
        <ToggleButton toggle={showLabelSwap} setToggle={setShowLabelSwap} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        On hover, &quot;Visit&quot; slides up and out while &quot;Add :)&quot; slides in
        from below. Each label uses <strong>AnimatePresence</strong> with
        unique keys to trigger enter/exit animations.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`initial: { y: 10, opacity: 0 }
animate: { y: 0, opacity: 1 }
exit:    { y: -10, opacity: 0 }`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
          <h4 className="text-sm font-semibold">Icon Rotation Swap</h4>
        </div>
        <ToggleButton toggle={showIconSwap} setToggle={setShowIconSwap} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The icon uses the same AnimatePresence pattern but adds a
        <strong> rotation</strong>. The arrow exits with a 45-degree spin while
        the plus icon enters from -45 degrees, creating a playful twist.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`initial: { opacity: 0, rotate: -45 }
animate: { opacity: 1, rotate: 0 }
exit:    { opacity: 0, rotate: 45 }`}
        </pre>
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
          <h4 className="text-sm font-semibold">Blur Transition</h4>
        </div>
        <ToggleButton toggle={showBlurTransition} setToggle={setShowBlurTransition} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A subtle <strong>1px blur</strong> is applied during enter/exit, creating
        a depth-of-field effect. Elements appear to come into focus and then
        blur out, which adds a premium feel to what would otherwise be a
        simple opacity change.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`filter: "blur(1px)"  /* during transition */
filter: "blur(0px)"  /* at rest */`}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off: transitions are instant with no depth-of-field effect.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="border border-dashed p-4">
      <h4 className="text-xs font-semibold mb-3">Interaction Pattern</h4>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">Hover</span>
        <span>&#8594;</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showLabelSwap ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Label Swap</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showIconSwap ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Icon Spin</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showBlurTransition ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Blur</span>
      </div>
    </div>
  </div>
);

export const VisitButtonTutorial = () => {
  const [showLabelSwap, setShowLabelSwap] = useState(true);
  const [showIconSwap, setShowIconSwap] = useState(true);
  const [showBlurTransition, setShowBlurTransition] = useState(true);
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
            <CopyDropdown registryName="visit-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <VisitPreview showLabelSwap={showLabelSwap} showIconSwap={showIconSwap} showBlurTransition={showBlurTransition} />
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
          <VisitContent showLabelSwap={showLabelSwap} setShowLabelSwap={setShowLabelSwap} showIconSwap={showIconSwap} setShowIconSwap={setShowIconSwap} showBlurTransition={showBlurTransition} setShowBlurTransition={setShowBlurTransition} />
        </div>
      </div>
    </div>
  );
};

export default VisitButtonTutorial;


