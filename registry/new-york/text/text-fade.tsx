"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Coalesce refreshes from many instances mounting/resizing in the same tick. */
let refreshTimer = 0;
function scheduleRefresh() {
  if (typeof window === "undefined") return;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 60);
}

/** Nearest scrollable ancestor (or a Lenis-prevented pane); `undefined` = window. */
function findScroller(el: HTMLElement): Element | undefined {
  let node = el.parentElement;
  while (node) {
    if (node.hasAttribute("data-lenis-prevent")) return node;
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight)
      return node;
    node = node.parentElement;
  }
  return undefined;
}

const TextFade = ({
  className,
  textContent,
}: {
  className?: string;
  textContent?: string;
}) => {
  const text = useRef<HTMLSpanElement>(null);
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = container.current;
    if (!text.current || !root) return;

    const split = new SplitText(text.current, { type: "words" });
    gsap.set(split.words, {
      opacity: 0.3,
      filter: "blur(1.3px)",
      color: "#b5cab7",
    });

    // Drive the word-by-word fade from the scroll position: words brighten as
    // the paragraph scrolls up through the viewport and dim again on scroll-up.
    const scroller = findScroller(root);
    gsap.to(split.words, {
      opacity: 1,
      color: "#f3efe6",
      filter: "blur(0px)",
      ease: "none",
      stagger: 0.1,
      scrollTrigger: {
        trigger: root,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1,
        ...(scroller ? { scroller, pinType: "transform" } : {}),
      },
    });

    scheduleRefresh();
    // Re-measure once webfonts settle (SplitText positions shift on swap-in).
    document.fonts?.ready.then(scheduleRefresh);

    // Element scrollers aren't tracked by ScrollTrigger's window resize listener.
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(scheduleRefresh, 120);
    });
    if (scroller instanceof Element) ro.observe(scroller);

    return () => {
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      split.revert();
    };
  });

  return (
    <div ref={container} className="h-full w-full">
      <span
        ref={text}
        className={`flex flex-wrap items-center justify-start gap-x-1.5${
          className ? ` ${className}` : ""
        }`}
      >
        {textContent ||
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim harum cupiditate provident nostrum temporibus officiis! Nostrum alias exercitationem molestiae dolorem quo natus iure deserunt magni ea dicta. Temporibus, totam doloribus!"}
      </span>
    </div>
  );
};

export default TextFade;
