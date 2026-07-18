"use client";

import React, { useEffect, useRef, useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const MATRIX_SOURCE = `"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function TextMatrixRain({
  children,
  className = "",
  duration = 2,
  repeat = true,
  accentColor = "#00ff00",
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useGSAP(
    () => {
      const el = textRef.current;
      const finalText = children;
      const matrixChars =
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ" +
        "マミムメモヤユヨラリルレロワヲン0123456789";
      const intervals = [];

      const runAnimation = () => {
        const charStates = new Array(finalText.length).fill(false);
        const charElements = [];

        // 1. split into per-char spans seeded with random glyphs
        el.innerHTML = "";
        finalText.split("").forEach((char) => {
          const span = document.createElement("span");
          span.style.display = "inline-block";
          span.style.color = accentColor;
          span.style.textShadow = \`0 0 10px \${accentColor}\`;
          span.textContent =
            char === " "
              ? "\\u00A0"
              : matrixChars[Math.floor(Math.random() * matrixChars.length)];
          el.appendChild(span);
          charElements.push(span);
        });

        charElements.forEach((span, i) => {
          if (finalText[i] === " ") return;

          // 3. left-to-right stagger with per-char jitter
          const lockDelay = i * 0.1 + Math.random() * 0.5;

          // 2. keep scrambling until this char locks
          const scrambleInterval = setInterval(() => {
            if (!charStates[i]) {
              span.textContent =
                matrixChars[Math.floor(Math.random() * matrixChars.length)];
            }
          }, 50);
          intervals.push(scrambleInterval);

          gsap.delayedCall(lockDelay, () => {
            clearInterval(scrambleInterval);
            charStates[i] = true;

            span.style.color = "";
            span.textContent = finalText[i];
            // 4. glow burst that fades as the char settles
            gsap.fromTo(
              span,
              { textShadow: \`0 0 20px \${accentColor}, 0 0 40px \${accentColor}\` },
              { duration: 0.5, textShadow: "0 0 0px transparent", ease: "power2.out" }
            );
          });
        });
      };

      runAnimation();

      let repeatInterval;
      if (repeat) {
        repeatInterval = setInterval(() => {
          intervals.forEach(clearInterval);
          intervals.length = 0;
          runAnimation();
        }, (duration + 1) * 1000);
      }

      return () => {
        if (repeatInterval) clearInterval(repeatInterval);
        intervals.forEach(clearInterval);
      };
    },
    { scope: containerRef, dependencies: [children, duration, repeat] }
  );

  return (
    <div ref={containerRef} className={className}>
      <span ref={textRef}>{children}</span>
    </div>
  );
}`;

const MATRIX_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
const ACCENT = "#00ff00";
const FINAL_TEXT = "PIXEL PERFECT";

const MatrixPreview = ({
  showGlyphs,
  showScramble,
  showLockIn,
  showFlash,
}: {
  showGlyphs: boolean;
  showScramble: boolean;
  showLockIn: boolean;
  showFlash: boolean;
}) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const intervals: ReturnType<typeof setInterval>[] = [];
    const calls: gsap.core.Tween[] = [];

    const runAnimation = () => {
      intervals.forEach(clearInterval);
      intervals.length = 0;
      calls.forEach((c) => c.kill());
      calls.length = 0;

      const charStates = new Array(FINAL_TEXT.length).fill(false);
      const charElements: HTMLSpanElement[] = [];

      el.innerHTML = "";
      FINAL_TEXT.split("").forEach((char) => {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        if (char === " ") {
          span.textContent = " ";
        } else if (showGlyphs) {
          span.style.color = ACCENT;
          span.style.textShadow = `0 0 10px ${ACCENT}`;
          span.textContent =
            MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        } else {
          span.textContent = char;
        }
        el.appendChild(span);
        charElements.push(span);
      });

      if (!showGlyphs) return;

      charElements.forEach((span, i) => {
        if (FINAL_TEXT[i] === " ") return;

        if (showScramble) {
          const scrambleInterval = setInterval(() => {
            if (!charStates[i]) {
              span.textContent =
                MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
            }
          }, 50);
          intervals.push(scrambleInterval);
        }

        if (showLockIn) {
          const lockDelay = i * 0.1 + Math.random() * 0.5;
          calls.push(
            gsap.delayedCall(lockDelay, () => {
              charStates[i] = true;
              span.style.color = "";
              span.textContent = FINAL_TEXT[i];
              if (showFlash) {
                gsap.fromTo(
                  span,
                  {
                    textShadow: `0 0 20px ${ACCENT}, 0 0 40px ${ACCENT}`,
                  },
                  {
                    duration: 0.5,
                    textShadow: "0 0 0px transparent",
                    ease: "power2.out",
                  },
                );
              } else {
                span.style.textShadow = "none";
              }
            }),
          );
        }
      });
    };

    runAnimation();
    const repeatInterval = setInterval(runAnimation, 3000);

    return () => {
      clearInterval(repeatInterval);
      intervals.forEach(clearInterval);
      calls.forEach((c) => c.kill());
    };
  }, [showGlyphs, showScramble, showLockIn, showFlash]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-xl border border-dashed bg-black px-8 py-10">
        <span
          ref={textRef}
          className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white"
        >
          {FINAL_TEXT}
        </span>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        The animation re-runs every 3 seconds
      </p>

      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span className={showGlyphs ? "text-green-500" : "text-red-400"}>
          glyphs: {showGlyphs ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showScramble ? "text-green-500" : "text-red-400"}>
          scramble: {showScramble ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showLockIn ? "text-green-500" : "text-red-400"}>
          lock-in: {showLockIn ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showFlash ? "text-green-500" : "text-red-400"}>
          flash: {showFlash ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const MatrixContent = ({
  showGlyphs,
  setShowGlyphs,
  showScramble,
  setShowScramble,
  showLockIn,
  setShowLockIn,
  showFlash,
  setShowFlash,
}: {
  showGlyphs: boolean;
  setShowGlyphs: React.Dispatch<React.SetStateAction<boolean>>;
  showScramble: boolean;
  setShowScramble: React.Dispatch<React.SetStateAction<boolean>>;
  showLockIn: boolean;
  setShowLockIn: React.Dispatch<React.SetStateAction<boolean>>;
  showFlash: boolean;
  setShowFlash: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">
          How the Matrix Rain Text Works
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          The text is split into one <strong>&lt;span&gt;</strong> per
          character, each seeded with a random Japanese katakana glyph in
          glowing green. A 50ms interval keeps re-randomizing every unlocked
          char, while staggered <strong>gsap.delayedCall</strong>s lock them
          to the real text left to right — each lock firing a glow burst that
          fades as the character settles. Decode-over-time, Matrix style.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold">Per-Char Spans + Glyphs</h4>
          </div>
          <ToggleButton toggle={showGlyphs} setToggle={setShowGlyphs} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The final string is split and rebuilt as inline-block spans — one
          per character — so each can animate independently. Every span starts
          as a <strong>random glyph from the pool</strong> (katakana + digits)
          in the accent color with a soft <strong>text-shadow glow</strong>.
          Spaces become <strong>&amp;nbsp;</strong> so the layout never
          collapses.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`finalText.split("").forEach((char) => {
  const span = document.createElement("span");
  span.style.display = "inline-block";
  span.style.color = accentColor;
  span.style.textShadow = \`0 0 10px \${accentColor}\`;
  span.textContent = char === " "
    ? "\\u00A0"
    : matrixChars[Math.floor(Math.random() * matrixChars.length)];
  el.appendChild(span);
});`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: plain static text — the foundation everything else
          builds on.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold">The Scramble Loop</h4>
          </div>
          <ToggleButton toggle={showScramble} setToggle={setShowScramble} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Each character gets its own <strong>setInterval</strong> that swaps
          in a new random glyph every <strong>50ms</strong> — fast enough to
          read as electronic noise. A <strong>charStates[i]</strong> flag
          guards the swap, so the moment a character locks, its interval
          becomes a no-op (and is cleared).
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const scrambleInterval = setInterval(() => {
  if (!charStates[i]) {
    span.textContent =
      matrixChars[Math.floor(Math.random() * matrixChars.length)];
  }
}, 50);`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: glyphs freeze in place — you can see the random seed
          without the churn.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold">Staggered Lock-In</h4>
          </div>
          <ToggleButton toggle={showLockIn} setToggle={setShowLockIn} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Each char resolves at <strong>i × 0.1s</strong> — a strict
          left-to-right sweep — plus <strong>random × 0.5s</strong> of jitter
          so the decode feels organic instead of mechanical.{" "}
          <strong>gsap.delayedCall</strong> fires the lock: clear the
          scramble, flip the state flag, restore the real character and its
          inherited color.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const lockDelay = i * 0.1 + Math.random() * 0.5;

gsap.delayedCall(lockDelay, () => {
  clearInterval(scrambleInterval);
  charStates[i] = true;
  span.style.color = "";        // back to inherited text color
  span.textContent = finalText[i];
});`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the text scrambles forever and never decodes.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              4
            </span>
            <h4 className="text-sm font-semibold">Lock Flash</h4>
          </div>
          <ToggleButton toggle={showFlash} setToggle={setShowFlash} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The moment a char locks, a <strong>gsap.fromTo</strong> slams its
          text-shadow to a double-halo glow (20px + 40px) and fades it to
          transparent over half a second with <strong>power2.out</strong>.
          It reads as a spark of energy discharging as each character clicks
          into place.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`gsap.fromTo(
  span,
  { textShadow: \`0 0 20px \${accent}, 0 0 40px \${accent}\` },
  { duration: 0.5, textShadow: "0 0 0px transparent", ease: "power2.out" }
);`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: characters snap to their final form with no glow burst
          — the decode loses its punch.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">
          Cleanup: Intervals Are Debt
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          This effect spawns one interval per character plus a repeat timer —
          all tracked in an array. Every re-run and the{" "}
          <strong>useGSAP</strong> cleanup clear them, otherwise a 13-char
          headline leaks 13 timers per loop. The rule: anything created with{" "}
          <strong>setInterval</strong> or <strong>delayedCall</strong> gets
          stored and killed, never fire-and-forget.
        </p>
      </div>

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Layer Stack</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">
            Plain text
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showGlyphs ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Glyph spans
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showScramble ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Scramble loop
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showLockIn ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Staggered lock
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showFlash ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Glow flash
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Final decode
          </span>
        </div>
      </div>
    </div>
  );
};

export const TextMatrixRainTutorial = () => {
  const [showGlyphs, setShowGlyphs] = useState(true);
  const [showScramble, setShowScramble] = useState(true);
  const [showLockIn, setShowLockIn] = useState(true);
  const [showFlash, setShowFlash] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[calc(100vh-120px)]">
      <div className="border-b border-dashed lg:border-b-0 lg:border-r flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Preview
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[300px] sm:min-h-[360px] lg:min-h-0 p-4 sm:p-6">
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
              registryName="text-matrix-rain"
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
                  value={MATRIX_SOURCE}
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
                className="relative"
              >
                <MatrixPreview
                  showGlyphs={showGlyphs}
                  showScramble={showScramble}
                  showLockIn={showLockIn}
                  showFlash={showFlash}
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
          <MatrixContent
            showGlyphs={showGlyphs}
            setShowGlyphs={setShowGlyphs}
            showScramble={showScramble}
            setShowScramble={setShowScramble}
            showLockIn={showLockIn}
            setShowLockIn={setShowLockIn}
            showFlash={showFlash}
            setShowFlash={setShowFlash}
          />
        </div>
      </div>
    </div>
  );
};

export default TextMatrixRainTutorial;
