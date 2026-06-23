"use client";

/**
 * A magnetic button that eases toward the cursor inside its zone, demonstrating GSAP's overwrite modes (true / false / "auto") against an idle CustomWiggle loop.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";

gsap.registerPlugin(CustomEase, CustomWiggle);

export type MagneticMode = "plain" | "false" | "true" | "auto";

const STRENGTH = 0.4; // how hard the button is pulled toward the cursor
const LABEL_STRENGTH = 0.24; // label trails a touch less for a parallax feel

const MagneticButton = ({
  mode = "auto",
  children = "Hover Me",
}: {
  mode?: MagneticMode;
  children?: ReactNode;
}) => {
  const zoneRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const btn = btnRef.current;
    const label = labelRef.current;
    if (!zone || !btn || !label) return;

    const overwrite = mode === "true" ? true : mode === "false" ? false : "auto";
    const isFalse = mode === "false";
    const hasWiggle = mode === "true" || mode === "auto";

    if (hasWiggle) {
      gsap.to(btn, {
        rotation: 12,
        duration: 1.5,
        repeat: -1,
        ease: "wiggle({wiggles:8,type:easeOut})",
      });
    }

    const onMove = (e: MouseEvent) => {
      const rect = zone.getBoundingClientRect();
      const mapX = gsap.utils.mapRange(
        rect.left,
        rect.right,
        -rect.width / 2,
        rect.width / 2,
        e.clientX,
      );
      const mapY = gsap.utils.mapRange(
        rect.top,
        rect.bottom,
        -rect.height / 2,
        rect.height / 2,
        e.clientY,
      );

      gsap.to(btn, {
        x: mapX * STRENGTH,
        y: mapY * STRENGTH,
        duration: isFalse ? 1.5 : 0.4,
        ease: "power2.out",
        overwrite,
      });
      gsap.to(label, {
        x: mapX * LABEL_STRENGTH,
        y: mapY * LABEL_STRENGTH,
        duration: isFalse ? 1.5 : 0.4,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const onLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: isFalse ? 0.15 : 0.7,
        ease: isFalse ? "power2.out" : "elastic.out(1,0.4)",
        overwrite,
      });
      gsap.to(label, {
        x: 0,
        y: 0,
        duration: isFalse ? 0.15 : 0.7,
        ease: isFalse ? "power2.out" : "elastic.out(1,0.4)",
        overwrite: true,
      });
    };

    zone.addEventListener("mousemove", onMove);
    zone.addEventListener("mouseleave", onLeave);
    return () => {
      zone.removeEventListener("mousemove", onMove);
      zone.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf([btn, label]);
    };
  }, [mode]);

  return (
    <div ref={zoneRef} className="grid h-40 w-40 place-items-center">
      <button
        ref={btnRef}
        className="rounded-full bg-neutral-900 px-7 py-3 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-neutral-900"
      >
        <span ref={labelRef} className="inline-block">
          {children}
        </span>
      </button>
    </div>
  );
};

export default MagneticButton;
