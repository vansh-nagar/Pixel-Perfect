"use client";

/**
 * Car lock/drive — a side-view car sits inside a card with a pill switch
 * below it. Pressing "drive" springs the thumb right and runs a one-shot
 * driving animation: the car accelerates out the right edge, teleports
 * off-screen left, then decelerates back into its resting position.
 * The switch resets to "locked" once the animation finishes.
 */

import { motion, useAnimationControls } from "framer-motion";
import { Lock, Power } from "lucide-react";
import { useState } from "react";

const CAR_IMG =
  "https://a.storyblok.com/f/322327/2616x712/b2f39db28a/cz25w12ix0010-911-carrera-gts-side.png/m/2616x712/smart/filters:format(avif)?dpl=dpl_AHR3Thhn9JKV9Dr5mGEDexMkWjPU";

const CarLockDriveMotion = () => {
  const [driving, setDriving] = useState(false);
  const carControls = useAnimationControls();

  const handleDrive = async () => {
    if (driving) return;
    setDriving(true);

    // Phase 1: accelerate out the right edge
    await carControls.start({
      x: 420,
      transition: { duration: 0.6, ease: [0.42, 0, 0.7, 0.2] },
    });

    // Teleport off-screen left (card has overflow-hidden, so it's invisible)
    carControls.set({ x: -420 });
    await new Promise((r) => setTimeout(r, 120));

    // Phase 2: decelerate back into resting position
    await carControls.start({
      x: 0,
      transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
    });

    setDriving(false);
  };

  const handleLock = () => {
    if (driving) return;
    // Already locked at rest; this is just here to dim the right button visually.
  };

  return (
    <div
      className="relative w-[320px] h-[300px] overflow-hidden"
      style={{
        background: "#FAFAF7",
        borderRadius: "28px",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.95) inset, 0 -1px 0 rgba(0,0,0,0.03) inset, 0 24px 40px -16px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)",
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      {/* Faint ground line */}
      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top: "60%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.06) 75%, transparent 100%)",
        }}
      />

      {/* Car — marginLeft offsets the image's internal whitespace bias so
          the visual car-center lines up with the card center at rest. */}
      <motion.img
        src={CAR_IMG}
        alt="Car side view"
        draggable={false}
        initial={{ x: 0 }}
        animate={carControls}
        className="pointer-events-none absolute select-none"
        style={{
          top: "30%",
          left: "50%",
          width: 360,
          marginLeft: -168,
          filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.14))",
        }}
      />

      {/* Pill switch */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div
          className="relative grid grid-cols-2 items-center rounded-full"
          style={{
            background: "#EFEEEA",
            boxShadow:
              "inset 0 1px 2px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8)",
            width: 116,
            height: 40,
            padding: 4,
          }}
        >
          {/* Thumb */}
          <motion.div
            className="absolute rounded-full bg-white"
            style={{
              width: 54,
              top: 4,
              bottom: 4,
              left: 4,
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.08), 0 6px 14px -4px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.9) inset",
            }}
            animate={{ x: driving ? 54 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          />

          <button
            type="button"
            onClick={handleLock}
            disabled={driving}
            aria-pressed={!driving}
            aria-label="Lock"
            className="relative z-10 grid h-full place-items-center disabled:cursor-not-allowed cursor-pointer"
          >
            <motion.span
              animate={{ scale: !driving ? 1 : 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
            >
              <Lock
                className="size-4"
                style={{ color: !driving ? "#171717" : "#A8A8A2" }}
                strokeWidth={2.2}
              />
            </motion.span>
          </button>

          <button
            type="button"
            onClick={handleDrive}
            disabled={driving}
            aria-pressed={driving}
            aria-label="Drive"
            className="relative z-10 grid h-full place-items-center disabled:cursor-not-allowed cursor-pointer"
          >
            <motion.span
              animate={{ scale: driving ? 1 : 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
            >
              <Power
                className="size-4"
                style={{ color: driving ? "#171717" : "#A8A8A2" }}
                strokeWidth={2.2}
              />
            </motion.span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarLockDriveMotion;
