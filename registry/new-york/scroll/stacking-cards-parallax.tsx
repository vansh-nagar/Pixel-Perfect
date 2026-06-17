"use client";

/**
 * A scroll-driven stacking card parallax — sticky cards pin and scale down as later cards scroll up over them, building a layered depth stack.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

function findScroller(el: HTMLElement): HTMLElement | undefined {
  let node = el.parentElement;
  while (node) {
    if (node.hasAttribute("data-lenis-prevent")) return node;
    const oy = getComputedStyle(node).overflowY;
    if (
      (oy === "auto" || oy === "scroll") &&
      node.scrollHeight > node.clientHeight
    )
      return node;
    node = node.parentElement;
  }
  return undefined;
}

type CardData = {
  title: string;
  description: string;
  color: string;
};

const cards: CardData[] = [
  {
    title: "Matthias Leidinger",
    description:
      "Originally hailing from Austria, Berlin-based photographer Matthias Leidinger is a young creative brimming with talent and ideas.",
    color: "#BBACAF",
  },
  {
    title: "Clément Chapillon",
    description:
      "A story on the border between reality and imaginary, about the contradictory feelings that the insularity of a rocky, arid, and wild territory provokes.",
    color: "#977F6D",
  },
  {
    title: "Zissou",
    description:
      "Though he views photography as a medium for storytelling, Zissou's images don't insist on a narrative — both crisp and ethereal, encoded with an ambiguity.",
    color: "#C2491D",
  },
  {
    title: "Mathias Svold",
    description:
      "The coastlines of Denmark documented in tonal colors — an ongoing project investigating how humans interact with and disrupt the Danish coast.",
    color: "#B62429",
  },
  {
    title: "Mark Rammers",
    description:
      "A mesmerizing, meditative journey into the origins of regret and the uncertainty of stepping into new unknowns, captured while in residency in Lanzarote.",
    color: "#88A28D",
  },
];

type CardProps = {
  i: number;
  title: string;
  description: string;
  color: string;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
};

const Card = ({
  i,
  title,
  description,
  color,
  progress,
  range,
  targetScale,
}: CardProps) => {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div className="sticky top-0 flex h-screen items-center justify-center">
      <motion.div
        style={{
          backgroundColor: color,
          scale,
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className="relative flex h-[500px] w-[90%] max-w-[1000px] flex-col rounded-[25px] p-12 text-neutral-900 [transform-origin:top]"
      >
        <h2 className="m-0 text-center text-[28px] font-semibold">{title}</h2>
        <div className="mt-10 flex h-full gap-12">
          <div className="relative top-[10%] w-2/5">
            <p className="text-base leading-relaxed">{description}</p>
            <span className="mt-4 flex items-center gap-1.5">
              <span className="cursor-pointer text-xs underline">See more</span>
              <svg
                width="22"
                height="12"
                viewBox="0 0 22 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.5303 6.53033C21.8232 6.23744 21.8232 5.76256 21.5303 5.46967L16.7574 0.696699C16.4645 0.403806 15.9896 0.403806 15.6967 0.696699C15.4038 0.989592 15.4038 1.46447 15.6967 1.75736L19.9393 6L15.6967 10.2426C15.4038 10.5355 15.4038 11.0104 15.6967 11.3033C15.9896 11.5962 16.4645 11.5962 16.7574 11.3033L21.5303 6.53033ZM0 6.75L21 6.75V5.25L0 5.25L0 6.75Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </div>

          <div className="relative h-full w-3/5 overflow-hidden rounded-[25px] bg-black/15" />
        </div>
      </motion.div>
    </div>
  );
};

const Stack = ({ scroller }: { scroller: HTMLElement }) => {
  const scrollerRef = useRef<HTMLElement>(scroller);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollerRef,
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef}>
      {cards.map((card, i) => {
        const targetScale = 1 - (cards.length - i) * 0.05;
        return (
          <Card
            key={card.title}
            i={i}
            {...card}
            progress={scrollYProgress}
            range={[i * 0.25, 1]}
            targetScale={targetScale}
          />
        );
      })}
    </div>
  );
};

const StackingCardsParallax = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (rootRef.current) setScroller(findScroller(rootRef.current) ?? null);
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      {scroller && <Stack scroller={scroller} />}
    </div>
  );
};

export default StackingCardsParallax;
