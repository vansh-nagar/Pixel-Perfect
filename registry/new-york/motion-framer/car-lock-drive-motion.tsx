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

    await carControls.start({
      x: 420,
      transition: { duration: 0.6, ease: [0.42, 0, 0.7, 0.2] },
    });

    carControls.set({ x: -420 });
    await new Promise((r) => setTimeout(r, 120));

    await carControls.start({
      x: 0,
      transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
    });

    setDriving(false);
  };

  const handleLock = () => {
    if (driving) return;
  };

  return (
    <div
      className="relative w-[320px] h-[300px] overflow-hidden [--car-bg:#FAFAFA] [--car-hl:rgba(255,255,255,0.95)] [--car-ground:rgba(0,0,0,0.06)] [--car-track:#E4E4E7] [--car-thumb:#FFFFFF] [--car-icon-active:#171717] [--car-icon-idle:#A1A1AA] dark:[--car-bg:#1C1C1F] dark:[--car-hl:rgba(255,255,255,0.05)] dark:[--car-ground:rgba(255,255,255,0.08)] dark:[--car-track:#2E2E33] dark:[--car-thumb:#56565E] dark:[--car-icon-active:#FAFAFA] dark:[--car-icon-idle:#71717A]"
      style={{
        background: "var(--car-bg)",
        borderRadius: "28px",
        boxShadow:
          "0 1px 0 var(--car-hl) inset, 0 -1px 0 rgba(0,0,0,0.12) inset, 0 24px 40px -16px rgba(0,0,0,0.30), 0 4px 12px -2px rgba(0,0,0,0.16)",
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top: "60%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, var(--car-ground) 25%, var(--car-ground) 75%, transparent 100%)",
        }}
      />

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

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div
          className="relative grid grid-cols-2 items-center rounded-full"
          style={{
            background: "var(--car-track)",
            boxShadow:
              "inset 0 1px 2px rgba(0,0,0,0.20), 0 1px 0 var(--car-hl)",
            width: 116,
            height: 40,
            padding: 4,
          }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 54,
              top: 4,
              bottom: 4,
              left: 4,
              background: "var(--car-thumb)",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.18), 0 6px 14px -4px rgba(0,0,0,0.28), 0 1px 0 var(--car-hl) inset",
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
                style={{
                  color: !driving
                    ? "var(--car-icon-active)"
                    : "var(--car-icon-idle)",
                }}
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
                style={{
                  color: driving
                    ? "var(--car-icon-active)"
                    : "var(--car-icon-idle)",
                }}
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
