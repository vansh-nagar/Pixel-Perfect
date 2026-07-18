"use client";

import React, { useEffect, useRef, useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const CLOCK_SOURCE = `"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const SRC = "/bend-image-reveal.gif";

const conicMask = (a) =>
  \`conic-gradient(from -90deg at 50% 50%,
    #000 0deg, #000 \${a}deg,
    transparent \${a}deg, transparent 360deg)\`;

const ClockMaskReveal = () => {
  const imgRef = useRef(null);

  const reveal = () => {
    const img = imgRef.current;
    if (!img) return;

    const state = { a: 0 };
    const apply = () => {
      const mask = conicMask(state.a);
      img.style.maskImage = mask;
      img.style.webkitMaskImage = mask;
    };
    apply();

    const tl = gsap.timeline();
    tl.to(state, { a: 360, duration: 1.2, ease: "power2.inOut", onUpdate: apply });
    tl.fromTo(
      img,
      { scale: 1.4, filter: "blur(16px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.inOut" },
      "<",
    );
  };

  useEffect(() => {
    reveal();
  }, []);

  return (
    <button
      onClick={reveal}
      className="relative aspect-video w-[40rem] max-w-[92%] cursor-pointer
                 overflow-hidden rounded-xl"
      aria-label="Replay reveal"
    >
      <img
        ref={imgRef}
        src={SRC}
        alt="reveal"
        className="size-full object-cover"
        style={{
          maskImage: conicMask(0),
          WebkitMaskImage: conicMask(0),
          transform: "scale(1.4)",
          filter: "blur(16px)",
        }}
      />
    </button>
  );
};

export default ClockMaskReveal;`;

const SRC = "/bend-image-reveal.gif";

const conicMask = (a: number) =>
  `conic-gradient(from -90deg at 50% 50%, #000 0deg, #000 ${a}deg, transparent ${a}deg, transparent 360deg)`;

const ClockPreview = ({
  showMask,
  showSweep,
  showSettle,
}: {
  showMask: boolean;
  showSweep: boolean;
  showSettle: boolean;
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [replayTick, setReplayTick] = useState(0);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    gsap.killTweensOf(img);
    const tl = gsap.timeline();
    const tweenTargets: object[] = [];

    if (showMask) {
      if (showSweep) {
        const state = { a: 0 };
        tweenTargets.push(state);
        const apply = () => {
          const mask = conicMask(state.a);
          img.style.maskImage = mask;
          img.style.webkitMaskImage = mask;
        };
        apply();
        tl.to(state, {
          a: 360,
          duration: 1.2,
          ease: "power2.inOut",
          onUpdate: apply,
        });
      } else {
        const mask = conicMask(120);
        img.style.maskImage = mask;
        img.style.webkitMaskImage = mask;
      }
    } else {
      img.style.maskImage = "none";
      img.style.webkitMaskImage = "none";
    }

    if (showSettle) {
      tl.fromTo(
        img,
        { scale: 1.4, filter: "blur(16px)" },
        { scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.inOut" },
        "<",
      );
    } else {
      gsap.set(img, { scale: 1, filter: "blur(0px)" });
    }

    return () => {
      tl.kill();
      tweenTargets.forEach((t) => gsap.killTweensOf(t));
    };
  }, [showMask, showSweep, showSettle, replayTick]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={() => setReplayTick((t) => t + 1)}
        className="relative aspect-video w-full max-w-[26rem] cursor-pointer overflow-hidden rounded-xl bg-foreground/[0.03]"
        aria-label="Replay reveal"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={SRC}
          alt="reveal"
          className="size-full object-cover"
        />
      </button>

      <p className="text-[10px] text-muted-foreground italic">
        Click the image to replay the reveal
      </p>

      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span className={showMask ? "text-green-500" : "text-red-400"}>
          mask: {showMask ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showSweep ? "text-green-500" : "text-red-400"}>
          sweep: {showSweep ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showSettle ? "text-green-500" : "text-red-400"}>
          zoom+blur: {showSettle ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const ClockContent = ({
  showMask,
  setShowMask,
  showSweep,
  setShowSweep,
  showSettle,
  setShowSettle,
}: {
  showMask: boolean;
  setShowMask: React.Dispatch<React.SetStateAction<boolean>>;
  showSweep: boolean;
  setShowSweep: React.Dispatch<React.SetStateAction<boolean>>;
  showSettle: boolean;
  setShowSettle: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">
          How the Clock Mask Reveal Works
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          A <strong>conic-gradient CSS mask</strong> hides the image except
          for a wedge, and GSAP sweeps that wedge&apos;s angle from 0° to 360°
          like a clock hand — uncovering the image angle by angle. In
          parallel, the image settles from oversized-and-blurred to sharp full
          frame, so the reveal feels like the picture is snapping into focus
          as the hand passes over it.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold">Conic-Gradient Mask</h4>
          </div>
          <ToggleButton toggle={showMask} setToggle={setShowMask} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>mask-image</strong> works on alpha: where the mask is opaque
          (<strong>#000</strong>) the image shows, where it&apos;s{" "}
          <strong>transparent</strong> the image is hidden. A conic gradient
          with hard stops at the same angle <strong>a</strong> produces a
          crisp pie wedge — no fuzzy edge — and{" "}
          <strong>from -90deg</strong> rotates the start to 12 o&apos;clock so
          the sweep begins at the top, like a real clock.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const conicMask = (a) =>
  \`conic-gradient(from -90deg at 50% 50%,
    #000 0deg, #000 \${a}deg,          /* visible wedge  */
    transparent \${a}deg, transparent 360deg)\`; /* hidden rest */`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: no mask — the image is fully visible the whole time.
          When on with the sweep off, the mask freezes at a 120° wedge so you
          can see its shape.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold">Sweeping the Angle</h4>
          </div>
          <ToggleButton toggle={showSweep} setToggle={setShowSweep} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You can&apos;t tween a mask-image string directly — the browser
          won&apos;t interpolate gradient stops between two arbitrary strings.
          The trick: tween a <strong>plain JS object</strong>{" "}
          <strong>{`{ a: 0 }`}</strong> to 360 and rebuild the gradient string
          in <strong>onUpdate</strong> every frame. GSAP happily animates any
          object property, so the mask gets a fresh string ~60 times a second
          with a proper <strong>power2.inOut</strong> ease.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const state = { a: 0 };
tl.to(state, {
  a: 360,
  duration: 1.2,
  ease: "power2.inOut",
  onUpdate: () => {
    img.style.maskImage = conicMask(state.a); // new string per frame
  },
});`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the wedge stays frozen — replay does nothing to the
          mask.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold">Zoom + Blur Settle</h4>
          </div>
          <ToggleButton toggle={showSettle} setToggle={setShowSettle} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Running alongside the sweep, the image itself animates from{" "}
          <strong>scale 1.4 + blur(16px)</strong> down to resting sharpness.
          The <strong>&quot;&lt;&quot;</strong> position parameter makes this
          tween start at the same time as the previous one instead of after
          it — one timeline, two synchronized motions. Same duration, same
          ease, so they land together.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`tl.fromTo(
  img,
  { scale: 1.4, filter: "blur(16px)" },
  { scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.inOut" },
  "<",  // start alongside the mask sweep
);`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the wedge sweeps over an already-sharp, already-sized
          image — notice how much flatter it feels.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Replay Pattern</h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          The whole image sits inside a <strong>&lt;button&gt;</strong> whose
          click handler simply runs <strong>reveal()</strong> again — the
          function resets the state object to 0 and builds a fresh timeline,
          so the effect is replayable forever. The initial inline style on the{" "}
          <strong>&lt;img&gt;</strong> (mask at 0°, scale 1.4, blurred)
          guarantees the first paint matches the animation&apos;s starting
          frame — no flash of the finished image before hydration.
        </p>
      </div>

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Layer Stack</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">
            Image
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showMask ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Conic mask
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showSweep ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Angle sweep
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showSettle ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Zoom + blur
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Final reveal
          </span>
        </div>
      </div>
    </div>
  );
};

export const ClockMaskRevealTutorial = () => {
  const [showMask, setShowMask] = useState(true);
  const [showSweep, setShowSweep] = useState(true);
  const [showSettle, setShowSettle] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[calc(100vh-120px)]">
      <div className="border-b border-dashed lg:border-b-0 lg:border-r flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Preview
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[320px] sm:min-h-[380px] lg:min-h-0 p-4 sm:p-6">
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
              registryName="clock-mask-reveal"
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
                  value={CLOCK_SOURCE}
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
                className="relative w-full flex justify-center"
              >
                <ClockPreview
                  showMask={showMask}
                  showSweep={showSweep}
                  showSettle={showSettle}
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
          <ClockContent
            showMask={showMask}
            setShowMask={setShowMask}
            showSweep={showSweep}
            setShowSweep={setShowSweep}
            showSettle={showSettle}
            setShowSettle={setShowSettle}
          />
        </div>
      </div>
    </div>
  );
};

export default ClockMaskRevealTutorial;
