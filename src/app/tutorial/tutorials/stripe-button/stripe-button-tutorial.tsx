"use client";

import React, { useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const SOURCE = `import React from "react";

const StripeButton = ({ children }) => {
  return (
    <button
      className="flex flex-row justify-center items-center px-4 py-2 gap-2
        rounded-lg cursor-pointer font-medium text-white text-sm"
      style={{
        background: "#635CFF",
        boxShadow: "inset 0px 2px 0px #7A74FF",
      }}
    >
      {children || "Stripe Button"}
    </button>
  );
};`;

const StripePreview = ({
  showBaseColor,
  showInsetShadow,
  showRounding,
}: {
  showBaseColor: boolean;
  showInsetShadow: boolean;
  showRounding: boolean;
}) => (
  <div className="flex flex-col items-center gap-6">
    <button
      className="flex flex-row justify-center items-center px-6 py-2.5 gap-2 cursor-pointer font-medium text-white text-sm transition-all active:scale-95"
      style={{
        background: showBaseColor ? "#635CFF" : "#6b7280",
        boxShadow: showInsetShadow ? "inset 0px 2px 0px #7A74FF" : "none",
        borderRadius: showRounding ? "0.5rem" : "0px",
      }}
    >
      Stripe Button
    </button>
    <div className="flex gap-3 text-[10px] text-muted-foreground">
      <span className={showBaseColor ? "text-green-500" : "text-red-400"}>brand: {showBaseColor ? "on" : "off"}</span>
      <span>·</span>
      <span className={showInsetShadow ? "text-green-500" : "text-red-400"}>inset: {showInsetShadow ? "on" : "off"}</span>
      <span>·</span>
      <span className={showRounding ? "text-green-500" : "text-red-400"}>round: {showRounding ? "on" : "off"}</span>
    </div>
  </div>
);

const StripeContent = ({
  showBaseColor, setShowBaseColor,
  showInsetShadow, setShowInsetShadow,
  showRounding, setShowRounding,
}: {
  showBaseColor: boolean; setShowBaseColor: React.Dispatch<React.SetStateAction<boolean>>;
  showInsetShadow: boolean; setShowInsetShadow: React.Dispatch<React.SetStateAction<boolean>>;
  showRounding: boolean; setShowRounding: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <div className="flex flex-col gap-6 text-sm leading-relaxed">
    <div>
      <h3 className="text-base font-semibold mb-2">How the Stripe Button Works</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Stripe buttons are deceptively simple. The &quot;premium&quot; feel comes
        from a single inset shadow at the top edge that creates a subtle
        highlight, mimicking a light source from above.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
          <h4 className="text-sm font-semibold">Brand Color</h4>
        </div>
        <ToggleButton toggle={showBaseColor} setToggle={setShowBaseColor} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Stripe uses their signature <strong>#635CFF</strong> purple. The flat,
        solid color with no gradient is key to the minimalist aesthetic.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`background: "#635CFF"`}
        </pre>
      </div>
      <div className="flex gap-1">
        <div className="h-6 flex-1 rounded-sm" style={{ background: "#635CFF" }} />
        <div className="h-6 flex-1 rounded-sm" style={{ background: "#7A74FF" }} />
      </div>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
          <h4 className="text-sm font-semibold">Inset Top Shadow</h4>
        </div>
        <ToggleButton toggle={showInsetShadow} setToggle={setShowInsetShadow} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The magic is a <strong>2px inset shadow</strong> at the top using a
        lighter purple (#7A74FF). With zero blur, this creates a crisp
        highlight line that simulates a beveled top edge. This one property
        transforms a flat button into a premium one.
      </p>
      <div className="border border-dashed p-3 bg-foreground/[0.02]">
        <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`boxShadow: "inset 0px 2px 0px #7A74FF"
            ^^^^  ^^^  ^^^  ^^^^^^^
            inset  Y   blur  lighter purple`}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Toggle off to see: the button becomes completely flat.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
          <h4 className="text-sm font-semibold">Border Radius</h4>
        </div>
        <ToggleButton toggle={showRounding} setToggle={setShowRounding} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The <strong>0.5rem border-radius</strong> softens the edges. Toggle it
        off to see how sharp corners change the character of the button.
      </p>
    </div>

    <div className="h-px border-t border-dashed" />

    <div className="border border-dashed p-4">
      <h4 className="text-xs font-semibold mb-3">Simplicity is the Key</h4>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className={`px-2 py-1 border border-dashed transition-colors ${showBaseColor ? "bg-purple-500/10 text-purple-600 border-purple-500/30" : "bg-foreground/[0.03]"}`}>#635CFF</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showInsetShadow ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>1 Inset</span>
        <span>+</span>
        <span className={`px-2 py-1 border border-dashed transition-colors ${showRounding ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>Rounded</span>
        <span>=</span>
        <span className="px-2 py-1 border border-dashed bg-purple-500/10 text-purple-600 border-purple-500/30">Stripe</span>
      </div>
    </div>
  </div>
);

export const StripeButtonTutorial = () => {
  const [showBaseColor, setShowBaseColor] = useState(true);
  const [showInsetShadow, setShowInsetShadow] = useState(true);
  const [showRounding, setShowRounding] = useState(true);
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
            <CopyDropdown registryName="stripe-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <StripePreview showBaseColor={showBaseColor} showInsetShadow={showInsetShadow} showRounding={showRounding} />
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
          <StripeContent showBaseColor={showBaseColor} setShowBaseColor={setShowBaseColor} showInsetShadow={showInsetShadow} setShowInsetShadow={setShowInsetShadow} showRounding={showRounding} setShowRounding={setShowRounding} />
        </div>
      </div>
    </div>
  );
};

export default StripeButtonTutorial;


