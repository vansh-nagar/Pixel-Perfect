"use client";

import React, { useState, useRef } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

const MORPH_SOURCE = `"use client";
import React, { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import MorphSVGPlugin from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

const MorphButton = ({ children }) => {
  const buttonRef = useRef(null);
  useGSAP(() => {
    const start = "M 0 100 V 50 Q 50 0 100 50 V 100 z";
    const end = "M 0 100 V 0 Q 50 0 100 0 V 100 z";

    const tl = gsap.timeline({ paused: true });
    tl.to(".path", {
      morphSVG: start,
      ease: "power2.in",
    }).to(".path", {
      morphSVG: end,
      ease: "power2.out",
    });

    const tl2 = gsap.timeline({ paused: true });
    tl2.from(".text", { color: "#000000" }).to(".text", {
      color: "#ffffff",
      duration: 0.5,
      scale: 1.02,
      ease: "power2.inOut",
    });

    buttonRef.current?.addEventListener("mouseenter", () => {
      tl.play(); tl2.play();
    });
    buttonRef.current?.addEventListener("mouseleave", () => {
      tl.reverse(); tl2.reverse();
    });
  }, { scope: buttonRef });

  return (
    <button ref={buttonRef} className="relative overflow-hidden bg-white text-black px-3 py-1.5 rounded-md text-sm font-medium border">
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
          <path className="path" fill="#000000" d="M 0 100 V 100 Q 50 100 100 100 V 100 z" />
        </svg>
      </div>
      <div className="z-40 text">{children ?? "Hover Me"}</div>
    </button>
  );
};

export default MorphButton;`;

const MorphPreview = ({
  showSvgPath,
  showColorShift,
  showScale,
}: {
  showSvgPath: boolean;
  showColorShift: boolean;
  showScale: boolean;
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        ref={btnRef}
        className="relative overflow-hidden bg-white text-black px-6 py-3 rounded-md text-sm font-medium border cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          transform: showScale && hovered ? "scale(1.02)" : "scale(1)",
          transition: "transform 0.3s ease",
        }}
      >
        <div className="absolute inset-0" style={{ opacity: showSvgPath ? 1 : 0 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
            <path
              fill="#000000"
              d={hovered ? "M 0 100 V 0 Q 50 0 100 0 V 100 z" : "M 0 100 V 100 Q 50 100 100 100 V 100 z"}
              style={{ transition: "d 0.5s cubic-bezier(0.65, 0, 0.35, 1)" }}
            />
          </svg>
        </div>
        <span
          className="relative z-10"
          style={{
            color: showColorShift && hovered ? "#ffffff" : "#000000",
            transition: "color 0.3s ease",
          }}
        >
          Hover Me
        </span>
      </button>

      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className={showSvgPath ? "text-green-500" : "text-red-400"}>
          morph: {showSvgPath ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showColorShift ? "text-green-500" : "text-red-400"}>
          color: {showColorShift ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showScale ? "text-green-500" : "text-red-400"}>
          scale: {showScale ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const MorphContent = ({
  showSvgPath,
  setShowSvgPath,
  showColorShift,
  setShowColorShift,
  showScale,
  setShowScale,
}: {
  showSvgPath: boolean;
  setShowSvgPath: React.Dispatch<React.SetStateAction<boolean>>;
  showColorShift: boolean;
  setShowColorShift: React.Dispatch<React.SetStateAction<boolean>>;
  showScale: boolean;
  setShowScale: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">How the Morph Button Works</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          The morph button uses GSAP MorphSVG to animate an SVG path that acts
          as a background fill. On hover, the path morphs from the bottom edge
          upward to cover the entire button, while the text color shifts from
          black to white.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
            <h4 className="text-sm font-semibold">SVG Path Morph</h4>
          </div>
          <ToggleButton toggle={showSvgPath} setToggle={setShowSvgPath} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A black SVG <strong>path</strong> sits behind the text. Initially flat at the
          bottom, it morphs through a curved midpoint (the &quot;wave&quot; shape) and
          then fills the entire button. GSAP MorphSVG handles the smooth
          interpolation between path data strings.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`// Start: flat at bottom
"M 0 100 V 100 Q 50 100 100 100 V 100 z"

// Mid: curved wave
"M 0 100 V 50 Q 50 0 100 50 V 100 z"

// End: full fill
"M 0 100 V 0 Q 50 0 100 0 V 100 z"`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off to see: without the morph, there is no visual fill effect on hover.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
            <h4 className="text-sm font-semibold">Text Color Transition</h4>
          </div>
          <ToggleButton toggle={showColorShift} setToggle={setShowColorShift} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          As the black fill covers the button, the text color transitions from
          <strong> black to white</strong> so it remains visible. This is driven
          by a second GSAP timeline running in parallel with the morph.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`gsap.timeline({ paused: true })
  .from(".text", { color: "#000000" })
  .to(".text", {
    color: "#ffffff",
    duration: 0.5,
    ease: "power2.inOut",
  });`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the text stays black and disappears against the dark fill.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
            <h4 className="text-sm font-semibold">Subtle Scale</h4>
          </div>
          <ToggleButton toggle={showScale} setToggle={setShowScale} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A minor <strong>1.02x scale</strong> is applied to the text on hover,
          adding a subtle &quot;pop&quot; that enhances the premium feel. Small details
          like this make animations feel much more polished.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`tl2.to(".text", {
  scale: 1.02,
  ease: "power2.inOut",
});`}
          </pre>
        </div>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Animation Pipeline</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">Hover</span>
          <span>&#8594;</span>
          <span className={`px-2 py-1 border border-dashed transition-colors ${showSvgPath ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>
            Path Morph
          </span>
          <span>&#8594;</span>
          <span className={`px-2 py-1 border border-dashed transition-colors ${showColorShift ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>
            Color Shift
          </span>
          <span>&#8594;</span>
          <span className={`px-2 py-1 border border-dashed transition-colors ${showScale ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}>
            Scale
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Complete
          </span>
        </div>
      </div>
    </div>
  );
};

export const MorphButtonTutorial = () => {
  const [showSvgPath, setShowSvgPath] = useState(true);
  const [showColorShift, setShowColorShift] = useState(true);
  const [showScale, setShowScale] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[calc(100vh-120px)]">
      <div className="border-b border-dashed lg:border-b-0 lg:border-r flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Preview</p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[280px] sm:min-h-[340px] lg:min-h-0 p-4 sm:p-6">
          <div className="flex bg-background items-center gap-1.5 absolute top-2 right-2 z-50">
            <button
              onClick={() => setShowCode(!showCode)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed rounded-none transition-colors cursor-pointer ${showCode ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"}`}
            >
              {showCode ? <Eye className="size-3" /> : <Code className="size-3" />}
              {showCode ? "Preview" : "Code"}
            </button>
            <CopyDropdown registryName="morph-button" className="right-0 top-0" />
          </div>
          <AnimatePresence mode="wait">
            {showCode ? (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0">
                <Editor height="100%" defaultLanguage="typescript" value={MORPH_SOURCE} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", scrollBeyondLastLine: false, renderLineHighlight: "none", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, padding: { top: 16, bottom: 16 }, domReadOnly: true, contextmenu: false }} />
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <MorphPreview showSvgPath={showSvgPath} showColorShift={showColorShift} showScale={showScale} />
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
          <MorphContent
            showSvgPath={showSvgPath} setShowSvgPath={setShowSvgPath}
            showColorShift={showColorShift} setShowColorShift={setShowColorShift}
            showScale={showScale} setShowScale={setShowScale}
          />
        </div>
      </div>
    </div>
  );
};

export default MorphButtonTutorial;


