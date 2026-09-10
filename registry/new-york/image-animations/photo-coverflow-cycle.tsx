/**
 * A cover-flow of photos that steps forward one at a time, the back of the deck blurred and dimmed.
 */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/image-animations/photo-${n}.jpg`);

/** How wide the deck fans out, as a multiple of one card's width. */
const SPREAD = 1;
/** The blur on the card furthest back, as a fraction of a card's width. */
const MAX_BLUR = 0.04;
/** How long one card takes to hand the front to the next. */
const STEP = 2.5;
/** The lag between neighbours as the whole deck steps around. */
const STEP_STAGGER = 0.075;
/** One full turn of the axis the deck is strung along. */
const TURN = 12;

/**
 * The step's ease: almost stationary, then a long glide into place.
 *
 * A symmetrical curve makes the deck look like it is being dragged. This holds
 * still long enough to read as a deliberate hand-off before it moves.
 */
const STEP_EASE = "M0,0 C0.625,0.05 0,1 1,1";

const PhotoCoverflowCycle = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-flow-item]");
      if (cards.length < 2) return;

      CustomEase.create("photoFlowStep", STEP_EASE);

      const count = cards.length;
      // One progress per card rather than one for the deck: that is what lets
      // them arrive one after another instead of marching in lockstep.
      const slots = cards.map(() => ({ progress: 0 }));
      const axis = { rotation: 0 };
      const open = { progress: 0 };

      const place = () => {
        const width = cards[0].offsetWidth;
        const reach = width * SPREAD * open.progress;
        const blurMax = MAX_BLUR * width;
        const cosR = Math.cos(axis.rotation);
        const sinR = Math.sin(axis.rotation);

        cards.forEach((card, i) => {
          const a = ((i - slots[i].progress) / count) * Math.PI * 2;
          // 1 at the front of the deck, 0 at the back. The exponent biases the
          // falloff so only the frontmost card is fully sharp.
          const front = Math.pow((Math.cos(a) + 1) / 2, 1.3);
          const along = Math.sin(a) * reach;

          gsap.set(card, {
            x: along * cosR,
            y: along * sinR,
            scale: gsap.utils.interpolate(0.2, 1, front),
            filter: `blur(${gsap.utils.interpolate(blurMax, 0, front)}px) brightness(${gsap.utils.interpolate(0.3, 1, front)})`,
            zIndex: Math.round(front * 1000),
          });
        });
      };

      place();

      const tl = gsap.timeline();
      tl.to(open, {
        progress: 1,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: place,
      });
      tl.to(
        axis,
        { rotation: Math.PI * 2, duration: TURN, ease: "none", repeat: -1, onUpdate: place },
        0,
      );

      // The deck advancing. Every card gains one slot, staggered, and the whole
      // thing schedules itself again — so the cycle never ends and never has to
      // know how many times it has run.
      const advance = () => {
        tl.add(
          gsap.to(slots, {
            progress: (i: number) => slots[i].progress + 1,
            duration: STEP,
            ease: "photoFlowStep",
            stagger: STEP_STAGGER,
            onUpdate: place,
            onComplete: advance,
          }),
        );
      };
      advance();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.pause();
        open.progress = 1;
        place();
      }
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative flex aspect-square w-full max-w-[min(90%,26rem)] items-center justify-center"
    >
      {PHOTOS.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          data-flow-item
          className="absolute size-[40%] rounded-2xl object-cover will-change-transform"
        />
      ))}
    </div>
  );
};

export default PhotoCoverflowCycle;
