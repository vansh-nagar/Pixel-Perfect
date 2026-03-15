"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

const textContent =
  "Aliquip cillum ut magna officia dolore labore in anim eiusmod veniam duis nostrud velit ut anim. Magna sint mollit Lorem esse duis non culpa.";

const Page = () => {
  const firstRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let flipTimer = 0;
    let textTimer = 0;
    let isActive = true;

    const first = firstRef.current;
    const second = secondRef.current;
    const box = boxRef.current;
    const text = textRef.current;

    if (!first || !second || !box || !text) {
      return;
    }

    const words = text.querySelectorAll("[data-word]");

    gsap.set(words, {
      opacity: 0,
      filter: "blur(8px)",
    });

    // @ts-ignore
    void import("gsap/dist/Flip.js").then((flipModule) => {
      if (!isActive) {
        return;
      }

      const flipPlugin = flipModule.Flip ?? flipModule.default;

      gsap.registerPlugin(flipPlugin);

      flipTimer = window.setTimeout(() => {
        const state = flipPlugin.getState(box);

        second.appendChild(box);

        flipPlugin.from(state, {
          duration: 1,
          ease: "power4.inOut",
        });

        textTimer = window.setTimeout(() => {
          gsap.to(words, {
            opacity: 1,
            filter: "blur(0px)",
            stagger: 0.05,
            duration: 0.45,
            ease: "power2.out",
          });
        }, 880);
      }, 600);
    });

    return () => {
      isActive = false;
      window.clearTimeout(flipTimer);
      window.clearTimeout(textTimer);
    };
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center gap-20">
      <div
        ref={firstRef}
        className="flex h-24 w-24 items-center justify-center absolute"
      >
        <motion.div
          ref={boxRef}
          initial={{ opacity: 0, scale: 0.4, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.5 }}
          className="h-20 w-20 rounded-full"
          style={{
            background:
              "radial-gradient(45.33% 46.43% at 41.69% 50%, #0140FF 0%, rgba(1, 64, 255, 0) 100%), radial-gradient(28.41% 117.96% at 7.72% 28.75%, #A6FDFF 0%, rgba(255, 255, 255, 0) 100%), radial-gradient(37.39% 69.19% at 107.79% 0%, #0075FF 0%, rgba(0, 66, 255, 0) 100%), radial-gradient(54.38% 89.75% at 83.46% 89.75%, #26F9FF 0%, rgba(0, 69, 255, 0.6) 100%), #0140FF",
          }}
        />
      </div>
      <div className="flex flex-col gap-6 text-3xl">
        <div
          ref={secondRef}
          className="flex h-24 w-24 items-center justify-center"
        />
        <span ref={textRef} className="w-md flex flex-wrap gap-x-2">
          {textContent.split(" ").map((word, index) => (
            <span key={`${word}-${index}`} data-word>
              {word}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default Page;
