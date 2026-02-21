"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";

const GooeyPreview = ({
  blur,
  colorMatrix,
  composite,
}: {
  blur: boolean;
  colorMatrix: boolean;
  composite: boolean;
}) => {
  const filterId = `goo-tutorial-${blur}-${colorMatrix}-${composite}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id={filterId}>
            {blur && (
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            )}
            {colorMatrix && (
              <feColorMatrix
                in={blur ? "blur" : "SourceGraphic"}
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
                result="goo"
              />
            )}
            {composite && (
              <feComposite
                in="SourceGraphic"
                in2={colorMatrix ? "goo" : blur ? "blur" : "SourceGraphic"}
                operator="atop"
              />
            )}
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center relative"
        style={{
          filter: blur || colorMatrix || composite ? `url(#${filterId})` : "none",
          zIndex: 1,
        }}
      >
        <motion.button
          className="h-15 px-20 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium cursor-pointer"
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
        >
          Gooey
        </motion.button>
        <motion.div
          className="absolute w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"
          initial={{ scale: 1, x: 0 }}
          animate={{ scale: 1.4, x: 135 }}
          transition={{ type: "tween", ease: [0.5, 0, 0, 1], duration: 1 }}
        >
          <Plus color="#fff" size={24} />
        </motion.div>
      </div>

      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className={blur ? "text-green-500" : "text-red-400"}>
          blur: {blur ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={colorMatrix ? "text-green-500" : "text-red-400"}>
          matrix: {colorMatrix ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={composite ? "text-green-500" : "text-red-400"}>
          composite: {composite ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const GooeyContent = ({
  blur,
  setBlur,
  colorMatrix,
  setColorMatrix,
  composite,
  setComposite,
}: {
  blur: boolean;
  setBlur: React.Dispatch<React.SetStateAction<boolean>>;
  colorMatrix: boolean;
  setColorMatrix: React.Dispatch<React.SetStateAction<boolean>>;
  composite: boolean;
  setComposite: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">How the Gooey Effect Works</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          The gooey effect uses an SVG filter chain with three primitives.
          Each one plays a critical role. Toggle them individually to see
          their contribution in the live preview.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">1</span>
            <h4 className="text-sm font-semibold">feGaussianBlur</h4>
          </div>
          <ToggleButton toggle={blur} setToggle={setBlur} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Applies a <strong>Gaussian blur</strong> of 5px to the entire source
          graphic. This softens the edges of both the button and the &quot;+&quot; circle
          so they bleed into each other when close, creating the raw material
          for the gooey merge.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`<feGaussianBlur
  in="SourceGraphic"
  stdDeviation="5"
  result="blur"
/>`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          → Toggle off to see: without blur, there&apos;s nothing soft for the
          color matrix to sharpen, so the gooey merge breaks entirely.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">2</span>
            <h4 className="text-sm font-semibold">feColorMatrix</h4>
          </div>
          <ToggleButton toggle={colorMatrix} setToggle={setColorMatrix} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This is the <strong>magic step</strong>. The matrix multiplies the
          alpha channel by 18 and subtracts 15. This dramatically boosts
          contrast on the blurred alpha. Semi-transparent blurred pixels become
          either fully opaque or fully transparent, creating a sharp &quot;liquid&quot;
          edge from the soft blur.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`<feColorMatrix
  in="blur"
  type="matrix"
  values="
    1 0 0 0 0    ← Red unchanged
    0 1 0 0 0    ← Green unchanged
    0 0 1 0 0    ← Blue unchanged
    0 0 0 18 -15 ← Alpha × 18 − 15
  "
  result="goo"
/>`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          → Toggle off: you get a blurry mess instead of the clean gooey shape.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">3</span>
            <h4 className="text-sm font-semibold">feComposite</h4>
          </div>
          <ToggleButton toggle={composite} setToggle={setComposite} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Composites the <strong>original sharp source</strong> back on top of
          the gooey result using{" "}
          <code className="px-1 py-0.5 bg-foreground/5 text-[10px]">operator=&quot;atop&quot;</code>.
          This keeps the crisp text and icons inside the button while
          preserving the gooey outer shape from step 2.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
{`<feComposite
  in="SourceGraphic"
  in2="goo"
  operator="atop"
/>`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          → Without this, you see the gooey shape but with blurry text.
          This step restores sharpness inside.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Full Filter Pipeline</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">
            SourceGraphic
          </span>
          <span>→</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${
              blur
                ? "bg-green-500/10 text-green-600 border-green-500/30"
                : "bg-foreground/[0.03]"
            }`}
          >
            Blur (5px)
          </span>
          <span>→</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${
              colorMatrix
                ? "bg-green-500/10 text-green-600 border-green-500/30"
                : "bg-foreground/[0.03]"
            }`}
          >
            Alpha ×18 −15
          </span>
          <span>→</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${
              composite
                ? "bg-green-500/10 text-green-600 border-green-500/30"
                : "bg-foreground/[0.03]"
            }`}
          >
            Composite
          </span>
          <span>→</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Gooey ✨
          </span>
        </div>
      </div>
    </div>
  );
};

export const GooeyButtonTutorial = () => {
  const [blur, setBlur] = useState(true);
  const [colorMatrix, setColorMatrix] = useState(true);
  const [composite, setComposite] = useState(true);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 h-full overflow-auto">
      <div className="border-r border-dashed flex flex-col sticky top-0 self-start h-screen max-h-[calc(100vh-60px)] stickey top-0">
        <div className="px-4 py-2 border-b border-dashed">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Preview
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 relative min-h-[400px]">
          <GooeyPreview blur={blur} colorMatrix={colorMatrix} composite={composite} />
          <span className="absolute top-0 left-0 block size-5 border-l border-t border-dashed border-muted-foreground" />
          <span className="absolute top-0 right-0 block size-5 border-r border-t border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 left-0 block size-5 border-l border-b border-dashed border-muted-foreground" />
          <span className="absolute bottom-0 right-0 block size-5 border-r border-b border-dashed border-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="px-4 py-2 border-b border-dashed">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Tutorial
          </p>
        </div>
        <div className="p-6">
          <GooeyContent
            blur={blur}
            setBlur={setBlur}
            colorMatrix={colorMatrix}
            setColorMatrix={setColorMatrix}
            composite={composite}
            setComposite={setComposite}
          />
        </div>
      </div>
    </div>
  );
};

export default GooeyButtonTutorial;
