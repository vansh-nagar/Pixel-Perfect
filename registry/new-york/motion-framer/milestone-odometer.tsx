"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

const DIGIT_HEIGHT = 72;

const Roller = ({ digit, delay }: { digit: number; delay: number }) => {
  const y = useMotionValue(0);
  const prev = useRef(digit);

  useEffect(() => {
    const diff = (digit - prev.current + 10) % 10;
    prev.current = digit;
    if (diff === 0) return;

    const target = y.get() - diff * DIGIT_HEIGHT;

    const controls = animate(y, target, {
      type: "spring",
      stiffness: 180,
      damping: 24,
      delay,
      onComplete: () => {
        if (y.get() <= -10 * DIGIT_HEIGHT) {
          y.set(y.get() + 10 * DIGIT_HEIGHT);
        }
      },
    });

    return () => controls.stop();
  }, [digit, delay, y]);

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ height: DIGIT_HEIGHT }}
    >
      <motion.div className="flex flex-col" style={{ y }}>
        {Array.from({ length: 20 }).map((_, n) => (
          <div
            key={n}
            className="flex items-center justify-center font-semibold text-white"
            style={{
              height: DIGIT_HEIGHT,
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {n % 10}
          </div>
        ))}
      </motion.div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0) 100%)",
        }}
      />
    </div>
  );
};

const MilestoneOdometer = () => {
  const [value, setValue] = useState(100);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => (v >= 999 ? 100 : v + 1));
    }, 700);
    return () => clearInterval(id);
  }, []);

  const digits = String(value).padStart(3, "0").split("").map(Number);

  return (
    <div
      className="flex w-[300px] flex-col items-center gap-5 rounded-[28px] bg-white p-6"
      style={{
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(0,0,0,0.04), 0 24px 48px -16px rgba(0,0,0,0.18), 0 8px 18px -6px rgba(0,0,0,0.08)",
      }}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          background:
            "linear-gradient(180deg, #1c1c1c 0%, #050505 60%, #0a0a0a 100%)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(0,0,0,0.6) inset, 0 8px 18px -4px rgba(0,0,0,0.35)",
        }}
      >
        <div className="flex">
          {digits.map((d, i) => (
            <Roller key={i} digit={d} delay={i * 0.06} />
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-1/3 w-px"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-2/3 w-px"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      </div>
    </div>
  );
};

export default MilestoneOdometer;
