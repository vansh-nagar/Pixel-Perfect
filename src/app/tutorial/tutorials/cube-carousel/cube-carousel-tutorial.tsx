"use client";

import React, { useEffect, useRef, useState } from "react";
import { Code, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleButton from "../../../../../registry/new-york/buttons/toggle-buttion";
import CopyDropdown from "@/components/mine/copy-dropdown";
import Editor from "@monaco-editor/react";

const CUBE_SOURCE = `"use client";

import { useEffect, useRef, useState } from "react";

const SLIDES = [
  { seed: "cube-01", title: "Terminal City" },
  { seed: "cube-02", title: "Salt Flats" },
  { seed: "cube-03", title: "Wavelength" },
  { seed: "cube-04", title: "Night Market" },
  { seed: "cube-05", title: "Overcast" },
  { seed: "cube-06", title: "Redshift" },
];

const C = {
  persp: 1600, // CSS perspective distance (px)
  w: 440,      // face width (px) — also the prism depth
  h: 300,      // face height (px)
  dip: 0.35,   // how hard the prism shrinks mid-rotation
};

const imageUrl = (seed) => \`https://picsum.photos/seed/\${seed}/900/620\`;

const CubeCarousel = () => {
  const scaleRef = useRef(null);
  const prismRef = useRef(null);
  const rot = useRef(0);
  const target = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let idle = 0;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging && ++idle > 230) {
        // ~3.8s of stillness -> quarter turn to the next face
        target.current = (Math.round(target.current / 90) + 1) * 90;
        idle = 0;
      }
      rot.current += (target.current - rot.current) * 0.085;

      const prism = prismRef.current;
      const scaler = scaleRef.current;
      if (prism && scaler) {
        prism.style.transform =
          \`translateZ(\${-C.w / 2}px) rotateY(\${-rot.current}deg)\`;
        // shrink at the halfway point of a turn, full size when settled
        const frac = Math.abs(rot.current / 90 - Math.round(rot.current / 90));
        scaler.style.transform = \`scale(\${1 - Math.min(0.5, frac) * C.dip})\`;
      }
      setStep((s) => {
        const sr = Math.round(rot.current / 90);
        return sr === s ? s : sr;
      });
    };
    tick();

    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      e.target.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      target.current -= dx * 0.28; // px -> degrees, unbounded either way
      idle = 0;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      target.current = Math.round(target.current / 90) * 90; // settle on a face
      idle = 0;
    };

    const scene = prismRef.current?.closest("[data-cube]");
    scene?.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      scene?.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Four physical faces cycle through N slides: face f shows the slide for the
  // nearest rotation step k with k = f (mod 4), so neighbours are always ready.
  const slideForFace = (f) => {
    const k = f + 4 * Math.round((step - f) / 4);
    return SLIDES[((k % SLIDES.length) + SLIDES.length) % SLIDES.length];
  };

  return (
    <div
      data-cube
      className="relative flex h-[80vh] w-full cursor-grab select-none
                 items-center justify-center overflow-hidden active:cursor-grabbing"
      style={{ perspective: \`\${C.persp}px\` }}
    >
      <div ref={scaleRef} style={{ willChange: "transform" }}>
        <div
          ref={prismRef}
          className="relative"
          style={{
            width: C.w,
            height: C.h,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {[0, 1, 2, 3].map((f) => {
            const slide = slideForFace(f);
            return (
              <div
                key={f}
                className="absolute inset-0 overflow-hidden rounded-lg bg-neutral-900
                           shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/20"
                style={{
                  transform: \`rotateY(\${f * 90}deg) translateZ(\${C.w / 2}px)\`,
                  backfaceVisibility: "hidden",
                }}
              >
                <img src={imageUrl(slide.seed)} alt={slide.title}
                  draggable={false} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0
                                bg-linear-to-t from-black/55 via-transparent to-transparent" />
                <p className="pointer-events-none absolute bottom-4 left-5 text-xs
                              font-medium uppercase tracking-[0.25em] text-white/90">
                  {slide.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* warm the cache so face reassignment never flashes */}
      <div className="hidden">
        {SLIDES.map((s) => (
          <img key={s.seed} src={imageUrl(s.seed)} alt="" aria-hidden />
        ))}
      </div>
    </div>
  );
};

export default CubeCarousel;`;

const SLIDES = [
  { seed: "cube-01", title: "Terminal City" },
  { seed: "cube-02", title: "Salt Flats" },
  { seed: "cube-03", title: "Wavelength" },
  { seed: "cube-04", title: "Night Market" },
  { seed: "cube-05", title: "Overcast" },
  { seed: "cube-06", title: "Redshift" },
];

const C = { persp: 900, w: 220, h: 150, dip: 0.35 };

const imageUrl = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;

const CubePreview = ({
  showPerspective,
  showFaces3d,
  showLerp,
  showDip,
}: {
  showPerspective: boolean;
  showFaces3d: boolean;
  showLerp: boolean;
  showDip: boolean;
}) => {
  const scaleRef = useRef<HTMLDivElement>(null);
  const prismRef = useRef<HTMLDivElement>(null);
  const rot = useRef(0);
  const target = useRef(0);
  const [step, setStep] = useState(0);
  const opts = useRef({ lerp: true, dip: true });

  useEffect(() => {
    opts.current.lerp = showLerp;
    opts.current.dip = showDip;
  }, [showLerp, showDip]);

  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let idle = 0;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging && ++idle > 230) {
        target.current = (Math.round(target.current / 90) + 1) * 90;
        idle = 0;
      }
      if (opts.current.lerp) {
        rot.current += (target.current - rot.current) * 0.085;
      } else {
        rot.current = target.current;
      }

      const prism = prismRef.current;
      const scaler = scaleRef.current;
      if (prism && scaler) {
        prism.style.transform = `translateZ(${-C.w / 2}px) rotateY(${-rot.current}deg)`;
        const frac = Math.abs(rot.current / 90 - Math.round(rot.current / 90));
        scaler.style.transform = opts.current.dip
          ? `scale(${1 - Math.min(0.5, frac) * C.dip})`
          : "scale(1)";
      }
      setStep((s) => {
        const sr = Math.round(rot.current / 90);
        return sr === s ? s : sr;
      });
    };
    tick();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      target.current -= dx * 0.28;
      idle = 0;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      target.current = Math.round(target.current / 90) * 90;
      idle = 0;
    };

    const scene = prismRef.current?.closest("[data-cube-tutorial]");
    scene?.addEventListener("pointerdown", onDown as EventListener);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      scene?.removeEventListener("pointerdown", onDown as EventListener);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const slideForFace = (f: number) => {
    const k = f + 4 * Math.round((step - f) / 4);
    return SLIDES[((k % SLIDES.length) + SLIDES.length) % SLIDES.length];
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        data-cube-tutorial
        className="relative flex h-[280px] w-full cursor-grab select-none items-center justify-center overflow-hidden active:cursor-grabbing"
        style={{
          perspective: showPerspective ? `${C.persp}px` : "none",
        }}
      >
        <div ref={scaleRef} style={{ willChange: "transform" }}>
          <div
            ref={prismRef}
            className="relative"
            style={{
              width: C.w,
              height: C.h,
              transformStyle: showFaces3d ? "preserve-3d" : "flat",
              willChange: "transform",
            }}
          >
            {[0, 1, 2, 3].map((f) => {
              const slide = slideForFace(f);
              return (
                <div
                  key={f}
                  className="absolute inset-0 overflow-hidden rounded-lg bg-neutral-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/20"
                  style={{
                    transform: showFaces3d
                      ? `rotateY(${f * 90}deg) translateZ(${C.w / 2}px)`
                      : "none",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(slide.seed)}
                    alt={slide.title}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
                  <p className="pointer-events-none absolute bottom-3 left-4 text-[10px] font-medium uppercase tracking-[0.25em] text-white/90">
                    {slide.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden">
          {SLIDES.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.seed} src={imageUrl(s.seed)} alt="" aria-hidden />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Drag to spin — release snaps to a face. Idle for ~4s and it advances
        itself.
      </p>

      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span className={showPerspective ? "text-green-500" : "text-red-400"}>
          perspective: {showPerspective ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showFaces3d ? "text-green-500" : "text-red-400"}>
          3d faces: {showFaces3d ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showLerp ? "text-green-500" : "text-red-400"}>
          lerp: {showLerp ? "on" : "off"}
        </span>
        <span>·</span>
        <span className={showDip ? "text-green-500" : "text-red-400"}>
          dip: {showDip ? "on" : "off"}
        </span>
      </div>
    </div>
  );
};

const CubeContent = ({
  showPerspective,
  setShowPerspective,
  showFaces3d,
  setShowFaces3d,
  showLerp,
  setShowLerp,
  showDip,
  setShowDip,
}: {
  showPerspective: boolean;
  setShowPerspective: React.Dispatch<React.SetStateAction<boolean>>;
  showFaces3d: boolean;
  setShowFaces3d: React.Dispatch<React.SetStateAction<boolean>>;
  showLerp: boolean;
  setShowLerp: React.Dispatch<React.SetStateAction<boolean>>;
  showDip: boolean;
  setShowDip: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-base font-semibold mb-2">
          How the Cube Carousel Works
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Slides live on the four faces of a 3D prism built entirely from CSS
          transforms. A <strong>requestAnimationFrame</strong> loop eases the
          rotation toward a target angle — drag moves the target, idleness
          bumps it a quarter turn — and the whole prism dips in scale mid-turn
          like it needs room to swing. No animation library involved: just
          perspective, preserve-3d, and one lerp.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              1
            </span>
            <h4 className="text-sm font-semibold">Perspective</h4>
          </div>
          <ToggleButton
            toggle={showPerspective}
            setToggle={setShowPerspective}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>perspective</strong> on the scene container places a virtual
          camera in front of the prism — nearer parts render larger, farther
          parts smaller. The distance controls how dramatic the foreshortening
          is: small values feel like a wide-angle lens, large values flatten
          toward orthographic.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`<div data-cube style={{ perspective: "1600px" }}>
  {/* everything inside is rendered through this camera */}
</div>`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the cube still rotates, but with no depth cue it looks
          like a flat card stretching sideways.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              2
            </span>
            <h4 className="text-sm font-semibold">Building the Prism</h4>
          </div>
          <ToggleButton toggle={showFaces3d} setToggle={setShowFaces3d} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Each of the four faces starts stacked at the same spot, then is
          rotated to its side (<strong>rotateY(f × 90deg)</strong>) and pushed
          outward by half the cube width (
          <strong>translateZ(w / 2)</strong>). The parent needs{" "}
          <strong>transform-style: preserve-3d</strong> or the faces flatten
          into its plane. The prism itself is pulled back by{" "}
          <strong>translateZ(-w / 2)</strong> so it spins around its centre,
          and <strong>backface-visibility: hidden</strong> culls faces
          pointing away from you.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`// prism
transformStyle: "preserve-3d"
transform: \`translateZ(\${-w / 2}px) rotateY(\${-rot}deg)\`

// each face f = 0..3
transform: \`rotateY(\${f * 90}deg) translateZ(\${w / 2}px)\`
backfaceVisibility: "hidden"`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: no rotateY/translateZ per face and no preserve-3d — the
          cube collapses into a single spinning card that vanishes edge-on.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              3
            </span>
            <h4 className="text-sm font-semibold">The Lerp Chase</h4>
          </div>
          <ToggleButton toggle={showLerp} setToggle={setShowLerp} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All motion comes from one line: every frame, the current rotation
          moves <strong>8.5%</strong> of the way toward the target. Dragging
          shifts the target (<strong>px × 0.28 → degrees</strong>), releasing
          snaps it to the nearest multiple of 90, and ~230 idle frames (about
          3.8s) bump it a quarter turn. The lerp turns all three into the same
          smooth ease-out — fast when far from the target, gentle on arrival.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`rot.current += (target.current - rot.current) * 0.085;

// drag        -> target -= dx * 0.28
// release     -> target = Math.round(target / 90) * 90
// ~3.8s idle  -> target = (Math.round(target / 90) + 1) * 90`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: rotation jumps straight to the target — 90° snaps with
          no glide.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-5 bg-foreground/5 text-[10px] font-bold">
              4
            </span>
            <h4 className="text-sm font-semibold">Mid-Turn Scale Dip</h4>
          </div>
          <ToggleButton toggle={showDip} setToggle={setShowDip} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A wrapper around the prism shrinks it as it turns.{" "}
          <strong>frac</strong> measures how far the rotation is from the
          nearest settled face (0 = resting, 0.5 = mid-turn), and scale drops
          by up to <strong>dip × 0.5 = 17.5%</strong> at the halfway point.
          The cube appears to lean back for room to swing, then lands at full
          size — free anticipation and settle from one line of math.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02]">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const frac = Math.abs(rot / 90 - Math.round(rot / 90)); // 0 -> 0.5
scaler.style.transform = \`scale(\${1 - Math.min(0.5, frac) * 0.35})\`;`}
          </pre>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Toggle off: the cube stays full size while turning — notice how much
          stiffer it feels.
        </p>
      </div>

      <div className="h-px border-t border-dashed" />

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">
          Bonus: 6 Slides on 4 Faces
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          The prism only has four faces, but any number of slides fits: face{" "}
          <strong>f</strong> always shows the slide for the nearest rotation
          step <strong>k</strong> with <strong>k ≡ f (mod 4)</strong>. As you
          turn, faces behind you are silently reassigned to upcoming slides,
          so the next image is always mounted before it swings into view. A
          hidden <strong>&lt;img&gt;</strong> list warms the browser cache so
          reassignment never flashes.
        </p>
        <div className="border border-dashed p-3 bg-foreground/[0.02] mt-3">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
            {`const slideForFace = (f) => {
  const k = f + 4 * Math.round((step - f) / 4);
  return SLIDES[((k % SLIDES.length) + SLIDES.length) % SLIDES.length];
};`}
          </pre>
        </div>
      </div>

      <div className="border border-dashed p-4">
        <h4 className="text-xs font-semibold mb-3">Layer Stack</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="px-2 py-1 border border-dashed bg-foreground/[0.03]">
            4 image faces
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showFaces3d ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Prism geometry
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showPerspective ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Perspective
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showLerp ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Lerp chase
          </span>
          <span>&#8594;</span>
          <span
            className={`px-2 py-1 border border-dashed transition-colors ${showDip ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-foreground/[0.03]"}`}
          >
            Scale dip
          </span>
          <span>&#8594;</span>
          <span className="px-2 py-1 border border-dashed bg-orange-500/10 text-orange-600 border-orange-500/30">
            Final carousel
          </span>
        </div>
      </div>
    </div>
  );
};

export const CubeCarouselTutorial = () => {
  const [showPerspective, setShowPerspective] = useState(true);
  const [showFaces3d, setShowFaces3d] = useState(true);
  const [showLerp, setShowLerp] = useState(true);
  const [showDip, setShowDip] = useState(true);
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[calc(100vh-120px)]">
      <div className="border-b border-dashed lg:border-b-0 lg:border-r flex flex-col lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-2 border-b border-dashed flex items-center justify-between shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Preview
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center relative min-h-[360px] sm:min-h-[400px] lg:min-h-0 p-4 sm:p-6">
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
              registryName="cube-carousel"
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
                  value={CUBE_SOURCE}
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
                className="relative w-full"
              >
                <CubePreview
                  showPerspective={showPerspective}
                  showFaces3d={showFaces3d}
                  showLerp={showLerp}
                  showDip={showDip}
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
          <CubeContent
            showPerspective={showPerspective}
            setShowPerspective={setShowPerspective}
            showFaces3d={showFaces3d}
            setShowFaces3d={setShowFaces3d}
            showLerp={showLerp}
            setShowLerp={setShowLerp}
            showDip={showDip}
            setShowDip={setShowDip}
          />
        </div>
      </div>
    </div>
  );
};

export default CubeCarouselTutorial;
