"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useDialKit } from "dialkit";

import { AnimatedBeam } from "@/registry/magicui/animated-beam";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — beam intro
 *
 * Read top-to-bottom. Each value is ms after trigger.
 *
 *    0ms   waiting for scroll into view
 *  200ms   two nodes pop in, scale 0.4 → 1.0 (staggered 120ms)
 *  700ms   beam fades in and begins its looping sweep
 *
 *  Click anywhere to replay.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  nodesAppear: 200, // the two endpoint dots pop in
  beamReveal: 400, // beam fades in + starts looping
};

/* Endpoint nodes (the two dots) */
const NODES = {
  initialScale: 0.4, // scale before popping in
  finalScale: 1, // resting scale
  stagger: 0.12, // seconds between left and right
  spring: { type: "spring" as const, stiffness: 500, damping: 25 }, // snappy pop
};

/* Beam reveal */
const BEAM = {
  spring: { type: "spring" as const, stiffness: 200, damping: 30 }, // smooth fade-in
};

const Page = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [stage, setStage] = useState(0);
  const [replayTrigger, setReplayTrigger] = useState(0);

  useEffect(() => {
    if (!isInView) {
      setStage(0);
      return;
    }

    setStage(0);
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setStage(1), TIMING.nodesAppear));
    timers.push(setTimeout(() => setStage(2), TIMING.beamReveal));

    return () => timers.forEach(clearTimeout);
  }, [isInView, replayTrigger]);

  // Live controls for the AnimatedBeam — grouped into folders.
  // Each value is [default, min, max]; bare hex strings become color pickers,
  // and a bare boolean becomes a toggle.
  const params = useDialKit("AnimatedBeam", {
    timing: {
      duration: [4, 0.5, 10], // seconds for one sweep
      delay: [0, 0, 5],
    },
    beam: {
      curvature: [0, -200, 200], // arc height of the path
      pathWidth: [2, 1, 12],
      pathOpacity: [0.2, 0, 1], // the static track behind the beam
      reverse: false, // sweep direction
    },
    colors: {
      pathColor: "#808080", // static track color
      gradientStartColor: "#ffaa40",
      gradientStopColor: "#9c40ff",
    },
    offsets: {
      startXOffset: [0, -100, 100],
      startYOffset: [0, -100, 100],
      endXOffset: [0, -100, 100],
      endYOffset: [0, -100, 100],
    },
  });

  const endpoints = [
    { ref: fromRef, key: "from" },
    { ref: toRef, key: "to" },
  ];

  return (
    <div
      className="grid min-h-screen cursor-pointer place-items-center bg-background p-6"
      onClick={() => setReplayTrigger((n) => n + 1)}
    >
      <div
        ref={containerRef}
        className="relative flex w-full max-w-lg items-center justify-between px-10"
      >
        {endpoints.map(({ ref, key }, i) => (
          <motion.div
            key={key}
            ref={ref}
            className="size-3 rounded-full bg-foreground"
            initial={{ scale: NODES.initialScale, opacity: 0 }}
            animate={{
              scale: stage >= 1 ? NODES.finalScale : NODES.initialScale,
              opacity: stage >= 1 ? 1 : 0,
            }}
            transition={{ ...NODES.spring, delay: i * NODES.stagger }}
          />
        ))}

        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 2 ? 1 : 0 }}
          transition={BEAM.spring}
        >
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={fromRef}
            toRef={toRef}
            duration={params.timing.duration}
            delay={params.timing.delay}
            curvature={params.beam.curvature}
            pathWidth={params.beam.pathWidth}
            pathOpacity={params.beam.pathOpacity}
            reverse={params.beam.reverse}
            pathColor={params.colors.pathColor}
            gradientStartColor={params.colors.gradientStartColor}
            gradientStopColor={params.colors.gradientStopColor}
            startXOffset={params.offsets.startXOffset}
            startYOffset={params.offsets.startYOffset}
            endXOffset={params.offsets.endXOffset}
            endYOffset={params.offsets.endYOffset}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Page;
