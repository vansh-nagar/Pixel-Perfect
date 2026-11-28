"use client";

/**
 * A CSS laptop whose lid swings open in 3D when it scrolls into view, with any content on its
 * screen. Built from layered gradients: a bezel with a tinted rim, a wallpaper screen, a thin
 * hinge strip that narrows as the lid rises, and a base slab with a thumb notch.
 *
 * The lid motion follows the classic CSS-MacBook trick: the lid starts folded flat
 * (rotateX -90.1deg about its bottom edge) inside a perspective container and rotates up to 0
 * over 1.5s on cubic-bezier(.76, 0, .24, 1), while the hinge strip under it narrows 100% → 92%.
 */

import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

const DESIGN_W = 900; // the laptop is drawn at this width, then scaled to fit its parent
const LID = { duration: 1.5, delay: 0.4, ease: [0.76, 0, 0.24, 1] as const };

export default function Laptop({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const still = useReducedMotion();

  // Scale the fixed-size drawing to the available width so it stays one crisp illustration.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setScale(Math.min(1, el.clientWidth / DESIGN_W)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const closed = { rotateX: -90.1 };
  const open = { rotateX: 0 };

  return (
    <div ref={wrapRef} className="w-full" style={{ height: 560 * scale }}>
      <div
        className="relative origin-top-left"
        style={{
          width: DESIGN_W,
          transform: `scale(${scale})`,
          perspective: 1600,
          perspectiveOrigin: "50% 100%",
        }}
      >
        {/* Lid: bezel + screen, hinged on its bottom edge. */}
        <motion.div
          className="relative mx-auto w-[88%] origin-bottom"
          initial={still ? open : closed}
          whileInView={open}
          viewport={{ once: true, amount: 0.4 }}
          transition={LID}
        >
          <div className="relative rounded-t-[22px] rounded-b-[6px] bg-[#0b0d1c] p-[14px] pb-[26px] shadow-[inset_0_0_0_2px_#4b5bff,inset_0_0_0_3px_rgba(255,255,255,0.08)]">
            {/* Camera notch dot */}
            <div className="absolute top-[5px] left-1/2 size-[4px] -translate-x-1/2 rounded-full bg-[#2a2f52]" />
            <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-[radial-gradient(120%_90%_at_12%_8%,#7d89ff_0%,#4148e6_28%,#2224a8_58%,#0d0e4d_100%)]">
              {/* Soft diagonal light over the wallpaper, like glass catching the room. */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.07)_50%,transparent_65%)]" />
              <div className="absolute inset-0 grid place-items-center p-6">
                {children}
              </div>
              {/* Glass glare over everything on screen, window included: a hard-edged
                  diagonal sheet from the top left (like a window reflected in the glass),
                  a softer band beside it, and a faint sheen along the top edge. */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.09)_40%,transparent_40.2%)] mix-blend-screen" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,transparent_45%,rgba(255,255,255,0.08)_51%,transparent_58%)] mix-blend-screen" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
            </div>
          </div>
        </motion.div>

        {/* Hinge strip: narrows as the lid opens. */}
        <motion.div
          className="relative mx-auto h-[6px] rounded-b-[3px] bg-[linear-gradient(180deg,#2c34b8,#1d238a)]"
          initial={still ? { width: "84%" } : { width: "92%" }}
          whileInView={{ width: "84%" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={LID}
        />

        {/* Base slab with a thumb notch and a long soft shadow. */}
        <div className="relative -mt-[2px] h-[22px] w-full rounded-t-[4px] rounded-b-[18px] bg-[linear-gradient(180deg,#6170ff_0%,#4453f2_35%,#2f3bd0_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-2px_3px_rgba(0,0,40,0.25),0_30px_40px_-12px_rgba(5,8,60,0.55),0_12px_16px_-8px_rgba(5,8,60,0.4)]">
          <div className="absolute top-0 left-1/2 h-[8px] w-[110px] -translate-x-1/2 rounded-b-[10px] bg-[linear-gradient(180deg,#2d38c4,#3f4de6)] shadow-[inset_0_-1px_2px_rgba(0,0,30,0.35)]" />
        </div>
      </div>
    </div>
  );
}
