"use client";

/**
 * Key combo — a "Control + V" keycap pair. Each cap presses down when
 * its key is held on the real keyboard (or clicked); when both are down
 * a "Pasted" confirm pill fades in below. Listens for Control and V
 * globally on the window.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

type KeycapProps = {
  label: string;
  symbol?: string;
  pressed: boolean;
  width: number;
  onPress: () => void;
  onRelease: () => void;
};

const Keycap = ({
  label,
  symbol,
  pressed,
  width,
  onPress,
  onRelease,
}: KeycapProps) => {
  const tall = Boolean(symbol);
  return (
    <motion.button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={(e) => {
        // If the pointer leaves while not captured (rare), still release.
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) onRelease();
      }}
      aria-pressed={pressed}
      aria-label={label}
      className="relative grid cursor-pointer select-none place-items-center rounded-[14px]"
      style={{
        width,
        height: 76,
        touchAction: "manipulation",
      }}
      animate={{
        y: pressed ? 1.5 : 0,
        scale: pressed ? 0.96 : 1,
        backgroundColor: pressed ? "#F4F4F5" : "#FFFFFF",
        boxShadow: pressed
          ? "inset 0 1px 2px rgba(0,0,0,0.06), 0 0 0 rgba(0,0,0,0)"
          : "0 1px 0 rgba(255,255,255,0.95) inset, 0 1px 2px rgba(0,0,0,0.05), 0 6px 14px -6px rgba(0,0,0,0.10)",
      }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 28,
        mass: 0.5,
      }}
    >
      {tall ? (
        <div className="flex h-full w-full flex-col items-start justify-between px-3 py-2.5">
          <span className="text-[12px] font-medium text-neutral-700">
            {label}
          </span>
          <span className="text-[13px] font-medium text-neutral-500">
            {symbol}
          </span>
        </div>
      ) : (
        <span className="text-[22px] font-semibold text-neutral-700">
          {label}
        </span>
      )}
    </motion.button>
  );
};

const KeyComboMotion = () => {
  const [ctrl, setCtrl] = useState(false);
  const [v, setV] = useState(false);
  const allDown = ctrl && v;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setCtrl(true);
      if (e.key.toLowerCase() === "v") setV(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setCtrl(false);
      if (e.key.toLowerCase() === "v") setV(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div
      className="relative grid w-[320px] place-items-center overflow-hidden"
      style={{
        height: 300,
        background: "#FAFAFA",
        borderRadius: 28,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.95) inset, 0 -1px 0 rgba(0,0,0,0.03) inset, 0 24px 40px -16px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)",
        fontFamily: "ui-sans-serif, system-ui",
      }}
    >
      {/* Keycap row */}
      <div
        className="flex items-center gap-2 rounded-[20px] p-2.5"
        style={{
          background: "#E4E4E7",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <Keycap
          label="control"
          symbol="⌃"
          pressed={ctrl}
          width={86}
          onPress={() => setCtrl(true)}
          onRelease={() => setCtrl(false)}
        />
        <Keycap
          label="V"
          pressed={v}
          width={76}
          onPress={() => setV(true)}
          onRelease={() => setV(false)}
        />
      </div>

      {/* Hint / confirm swap */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-6">
        <AnimatePresence mode="wait" initial={false}>
          {allDown ? (
            <motion.div
              key="pasted"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.25, 0.8, 0.4, 1] }}
              className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-2.5 py-1"
            >
              <Check
                className="size-3 text-emerald-400"
                strokeWidth={3}
              />
              <span className="text-[11px] font-semibold tracking-tight text-white">
                Pasted
              </span>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="text-[10px] uppercase tracking-[0.14em] text-neutral-400"
            >
              Press the combo
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KeyComboMotion;
