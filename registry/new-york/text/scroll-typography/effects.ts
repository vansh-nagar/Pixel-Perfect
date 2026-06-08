/**
 * Scroll-typography effect builders — faithful GSAP ScrollTrigger ports of the
 * 29 effects from Codrops' "On-Scroll Typography Animations" (sets 1 & 2).
 */

import gsap from "gsap";

export type FxId =
  | "fx1" | "fx2" | "fx3" | "fx4" | "fx5" | "fx6" | "fx7" | "fx8" | "fx9" | "fx10"
  | "fx11" | "fx12" | "fx13" | "fx14" | "fx15" | "fx16" | "fx17" | "fx18" | "fx19" | "fx20"
  | "fx21" | "fx22" | "fx23" | "fx24" | "fx25" | "fx26" | "fx27" | "fx28" | "fx29";

/** Everything a builder needs; supplied by the engine. */
export type EffectCtx = {
  /** The heading element (Codrops' `title`). */
  root: HTMLElement;
  /** Block wrapper around the heading — the element pinned by pinned effects. */
  stage: HTMLElement;
  /** Flat list of every character span (class `st-char`). */
  chars: HTMLElement[];
  /** Word spans (class `st-word`); each contains its own `st-char`s. */
  words: HTMLElement[];
  /** Resolved scroll container — an element, or `undefined` for the window. */
  scroller: Element | undefined;
  /** Injects `scroller` + `pinType` into a ScrollTrigger config. */
  makeST: (cfg: Record<string, unknown>) => any;
};

export type EffectBuilder = (ctx: EffectCtx) => void;

export type EffectInfo = {
  name: string;
  description: string;
  /** Pinned effects need extra scroll runway and auto pin-spacing. */
  pinned: boolean;
  /** Default editorial heading; `\n` becomes a new centered line. */
  sample: string;
};

/* ───────────────────────── helpers ───────────────────────── */

const wordChars = (word: HTMLElement) =>
  Array.from(word.querySelectorAll<HTMLElement>(".st-char"));

/** Set `perspective` on the parents of the given elements (Codrops sets it on `char.parentNode`). */
const perspectiveOnParents = (els: HTMLElement[], value: number) => {
  const parents = new Set<HTMLElement>();
  els.forEach((el) => el.parentElement && parents.add(el.parentElement));
  parents.forEach((p) => gsap.set(p, { perspective: value }));
};

/**
 * Wrap each char in an overflow-hidden inline-block span (Codrops' `.char-wrap`),
 * giving fx11/fx12 their mask-reveal. Mirrors Codrops' `wrapElements`.
 */
const wrapCharsForMask = (chars: HTMLElement[]) => {
  chars.forEach((char) => {
    const parent = char.parentElement;
    if (!parent) return;
    const wrap = document.createElement("span");
    wrap.className = "st-char-wrap";
    wrap.style.display = "inline-block";
    wrap.style.position = "relative";
    wrap.style.overflow = "hidden";
    parent.appendChild(wrap);
    wrap.appendChild(char);
  });
};

/** Codrops' triangular "distance from centre" index used by fx22/fx24/fx28. */
const mirrorIndex = (position: number, total: number) =>
  position < Math.ceil(total / 2)
    ? position
    : Math.ceil(total / 2) - Math.abs(Math.floor(total / 2) - position) - 1;

const lettersAndSymbols = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o",
  "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "!", "@", "#", "$",
  "%", "^", "&", "*", "-", "_", "+", "=", ";", ":", "<", ">", ",",
];

/* ───────────────────────── builders ───────────────────────── */

export const EFFECTS: Record<FxId, EffectBuilder> = {
  // fx1 — spin + scale in, per character
  fx1: ({ chars, root, makeST }) => {
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", opacity: 0, scale: 0.6, rotationZ: () => gsap.utils.random(-20, 20) },
      {
        ease: "power4", opacity: 1, scale: 1, rotation: 0, stagger: 0.4,
        scrollTrigger: makeST({ trigger: root, start: "center+=20% bottom", end: "+=50%", scrub: true }),
      }
    );
  },

  // fx2 — stretched chars rise into place
  fx2: ({ chars, root, makeST }) => {
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: "50% 0%" },
      {
        duration: 1, ease: "back.inOut(2)", opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1, stagger: 0.03,
        scrollTrigger: makeST({ trigger: root, start: "center bottom+=50%", end: "bottom top+=40%", scrub: true }),
      }
    );
  },

  // fx3 — vertical unfold (scaleY 0 → 1 from the top edge)
  fx3: ({ chars, root, makeST }) => {
    gsap.fromTo(
      chars,
      { willChange: "transform", transformOrigin: "50% 0%", scaleY: 0 },
      {
        ease: "back", opacity: 1, scaleY: 1, yPercent: 0, stagger: 0.03,
        scrollTrigger: makeST({ trigger: root, start: "center bottom-=5%", end: "top top-=20%", scrub: true }),
      }
    );
  },

  // fx4 — each word's letters fan out from / collapse to the word centre
  fx4: ({ words, makeST }) => {
    words.forEach((word) => {
      gsap.fromTo(
        wordChars(word),
        { willChange: "opacity, transform", x: (pos: number, _t: HTMLElement, arr: HTMLElement[]) => 150 * (pos - arr.length / 2) },
        {
          ease: "power1.inOut", x: 0, stagger: { grid: "auto", from: "center" },
          scrollTrigger: makeST({ trigger: word, start: "center bottom+=30%", end: "top top+=15%", scrub: true }),
        }
      );
    });
  },

  // fx5 — random scatter assemble
  fx5: ({ chars, root, makeST }) => {
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", opacity: 0, xPercent: () => gsap.utils.random(-200, 200), yPercent: () => gsap.utils.random(-150, 150) },
      {
        ease: "power1.inOut", opacity: 1, xPercent: 0, yPercent: 0, stagger: { each: 0.05, grid: "auto", from: "random" },
        scrollTrigger: makeST({ trigger: root, start: "center bottom+=10%", end: "bottom center", scrub: 0.9 }),
      }
    );
  },

  // fx6 — 3D flip up, per word
  fx6: ({ words, makeST }) => {
    words.forEach((word) => {
      const chars = wordChars(word);
      perspectiveOnParents(chars, 2000);
      gsap.fromTo(
        chars,
        { willChange: "opacity, transform", opacity: 0, rotationX: -90, yPercent: 50 },
        {
          ease: "power1.inOut", opacity: 1, rotationX: 0, yPercent: 0, stagger: { each: 0.03, from: 0 },
          scrollTrigger: makeST({ trigger: word, start: "center bottom+=40%", end: "bottom center-=30%", scrub: 0.9 }),
        }
      );
    });
  },

  // fx7 — 3D swing in around the Y axis, from the end of each word
  fx7: ({ words, makeST }) => {
    words.forEach((word) => {
      const chars = wordChars(word);
      perspectiveOnParents(chars, 2000);
      gsap.fromTo(
        chars,
        { willChange: "opacity, transform", transformOrigin: "100% 50%", opacity: 0, rotationY: -90, z: -300 },
        {
          ease: "expo", opacity: 1, rotationY: 0, z: 0, stagger: { each: 0.06, from: "end" },
          scrollTrigger: makeST({ trigger: word, start: "bottom bottom+=20%", end: "bottom top", scrub: 1 }),
        }
      );
    });
  },

  // fx8 — scramble decode (play on enter, not scrubbed)
  fx8: ({ chars, root, makeST }) => {
    chars.forEach((char, position) => {
      const initialHTML = char.innerHTML;
      gsap.fromTo(
        char,
        { opacity: 0 },
        {
          duration: 0.03,
          innerHTML: () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)],
          repeat: 1,
          repeatRefresh: true,
          opacity: 1,
          repeatDelay: 0.03,
          delay: (position + 1) * 0.18,
          onComplete: () => gsap.set(char, { innerHTML: initialHTML, delay: 0.03 }),
          scrollTrigger: makeST({
            trigger: root,
            start: "top bottom",
            end: "bottom center",
            toggleActions: "play resume resume reset",
            onEnter: () => gsap.set(char, { opacity: 0 }),
          }),
        }
      );
    });
  },

  // fx9 — letters start stacked at the container centre, then fan out to place
  fx9: ({ words, scroller, makeST }) => {
    const vp = scroller
      ? scroller.getBoundingClientRect()
      : { left: 0, width: window.innerWidth };
    const centerX = vp.left + vp.width / 2;
    words.forEach((word) => {
      gsap.fromTo(
        wordChars(word),
        {
          willChange: "transform",
          scaleX: 0,
          x: (_i: number, target: HTMLElement) => {
            const r = target.getBoundingClientRect();
            return centerX - (r.left + r.width / 2);
          },
        },
        {
          ease: "power1.inOut", scaleX: 1, x: 0,
          scrollTrigger: makeST({ trigger: word, start: "top bottom", end: "top top", scrub: true, invalidateOnRefresh: true }),
        }
      );
    });
  },

  // fx10 — blur into focus, random order (play on enter)
  fx10: ({ chars, root, makeST }) => {
    gsap.fromTo(
      chars,
      { willChange: "opacity", opacity: 0, filter: "blur(20px)" },
      {
        duration: 0.25, ease: "power1.inOut", opacity: 1, filter: "blur(0px)", stagger: { each: 0.05, from: "random" },
        scrollTrigger: makeST({ trigger: root, start: "top bottom", end: "center center", toggleActions: "play resume resume reset" }),
      }
    );
  },

  // fx11 — mask slide in from the right (play on enter)
  fx11: ({ chars, root, makeST }) => {
    wrapCharsForMask(chars);
    gsap.fromTo(
      chars,
      { willChange: "transform", transformOrigin: "0% 50%", xPercent: 105 },
      {
        duration: 1, ease: "expo", xPercent: 0, stagger: 0.042,
        scrollTrigger: makeST({ trigger: root, start: "top bottom", end: "top top+=10%", toggleActions: "play resume resume reset" }),
      }
    );
  },

  // fx12 — skewed, stretched streak in from the left
  fx12: ({ chars, root, makeST }) => {
    wrapCharsForMask(chars);
    gsap.fromTo(
      chars,
      { willChange: "transform", xPercent: -250, rotationZ: 45, scaleX: 6, transformOrigin: "100% 50%" },
      {
        duration: 1, ease: "power2", xPercent: 0, rotationZ: 0, scaleX: 1, stagger: -0.06,
        scrollTrigger: makeST({ trigger: root, start: "top bottom+=10%", end: "bottom top+=10%", scrub: true }),
      }
    );
  },

  // fx13 — 3D flip + tumble in
  fx13: ({ chars, root, makeST }) => {
    perspectiveOnParents(chars, 2000);
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", opacity: 0, rotationY: 180, xPercent: -40, yPercent: 100 },
      {
        ease: "power4.inOut", opacity: 1, rotationY: 0, xPercent: 0, yPercent: 0, stagger: { each: -0.03, from: 0 },
        scrollTrigger: makeST({ trigger: root, start: "center bottom", end: "bottom center-=30%", scrub: 0.9 }),
      }
    );
  },

  // fx14 — pinned: whole line slides in while letters rise + scale down
  fx14: ({ chars, root, stage, makeST }) => {
    gsap.fromTo(
      root,
      { willChange: "transform", xPercent: 100 },
      {
        ease: "none", xPercent: 0,
        scrollTrigger: makeST({ trigger: root, scrub: true, start: "center center", end: "+=100%", pin: stage }),
      }
    );
    gsap.fromTo(
      chars,
      { willChange: "transform", scale: 3, yPercent: -900 },
      {
        ease: "back(2)", scale: 1, yPercent: 0, stagger: 0.05,
        scrollTrigger: makeST({ trigger: root, start: "center center", end: "+=100%", scrub: 1.9 }),
      }
    );
  },

  // fx15 — pinned: whole line slides in while letters do a deep 3D X-flip
  fx15: ({ chars, root, stage, makeST }) => {
    perspectiveOnParents(chars, 2000);
    gsap.fromTo(
      root,
      { willChange: "transform", xPercent: -80 },
      {
        ease: "none", xPercent: 0,
        scrollTrigger: makeST({ trigger: root, scrub: true, start: "center center", end: "+=100%", pin: stage }),
      }
    );
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", transformOrigin: "50% 50% -200px", rotationX: 380, opacity: 0 },
      {
        ease: "expo.inOut", rotationX: 0, z: 0, opacity: 1, stagger: -0.03,
        scrollTrigger: makeST({ trigger: root, start: "center center", end: "+=140%", scrub: 1.2 }),
      }
    );
  },

  // fx16 — whole line tilts level while words brighten
  fx16: ({ root, words, makeST }) => {
    gsap.fromTo(
      root,
      { transformOrigin: "0% 50%", rotate: 3 },
      {
        ease: "none", rotate: 0,
        scrollTrigger: makeST({ trigger: root, start: "top bottom", end: "top top", scrub: true }),
      }
    );
    gsap.fromTo(
      words,
      { willChange: "opacity", opacity: 0.1 },
      {
        ease: "none", opacity: 1, stagger: 0.05,
        scrollTrigger: makeST({ trigger: root, start: "top bottom-=20%", end: "center top+=20%", scrub: true }),
      }
    );
  },

  // fx17 — random 3D settle
  fx17: ({ chars, root, makeST }) => {
    perspectiveOnParents(chars, 1000);
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", opacity: 0, rotateX: () => gsap.utils.random(-120, 120), z: () => gsap.utils.random(-200, 200) },
      {
        ease: "none", opacity: 1, rotateX: 0, z: 0, stagger: 0.02,
        scrollTrigger: makeST({ trigger: root, start: "top bottom", end: "bottom top", scrub: true }),
      }
    );
  },

  // fx18 — depth push-in
  fx18: ({ chars, root, makeST }) => {
    perspectiveOnParents(chars, 1000);
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", opacity: 0.2, z: -800 },
      {
        ease: "back.out(1.2)", opacity: 1, z: 0, stagger: 0.04,
        scrollTrigger: makeST({ trigger: root, start: "top bottom", end: "bottom top", scrub: true }),
      }
    );
  },

  // fx19 — top-down 3D flip
  fx19: ({ chars, root, makeST }) => {
    perspectiveOnParents(chars, 1000);
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", transformOrigin: "50% 0%", opacity: 0, rotationX: -90, z: -200 },
      {
        ease: "power1", opacity: 1, stagger: 0.05, rotationX: 0, z: 0,
        scrollTrigger: makeST({ trigger: root, start: "center bottom", end: "bottom top+=20%", scrub: true }),
      }
    );
  },

  // fx20 — bottom-up 3D flip, random order
  fx20: ({ chars, root, makeST }) => {
    perspectiveOnParents(chars, 1000);
    gsap.fromTo(
      chars,
      { willChange: "opacity, transform", transformOrigin: "50% 100%", opacity: 0, rotationX: 90 },
      {
        ease: "power4", opacity: 1, stagger: { each: 0.03, from: "random" }, rotationX: 0,
        scrollTrigger: makeST({ trigger: root, start: "center bottom", end: "bottom top+=20%", scrub: true }),
      }
    );
  },

  // fx21 — multi-axis depth swarm, per word
  fx21: ({ words, makeST }) => {
    words.forEach((word) => {
      const chars = wordChars(word);
      perspectiveOnParents(chars, 2000);
      gsap.fromTo(
        chars,
        {
          willChange: "opacity, transform",
          opacity: 0,
          y: (pos: number, _t: HTMLElement, arr: HTMLElement[]) => -40 * Math.abs(pos - arr.length / 2),
          z: () => gsap.utils.random(-1500, -600),
          rotationX: () => gsap.utils.random(-500, -200),
        },
        {
          ease: "power1.inOut", opacity: 1, y: 0, z: 0, rotationX: 0, stagger: { each: 0.06, from: "center" },
          scrollTrigger: makeST({ trigger: word, start: "top bottom", end: "top top+=15%", scrub: true }),
        }
      );
    });
  },

  // fx22 — spiral converge, per word
  fx22: ({ words, makeST }) => {
    words.forEach((word) => {
      const chars = wordChars(word);
      const charsTotal = chars.length;
      perspectiveOnParents(chars, 1000);
      gsap.fromTo(
        chars,
        {
          willChange: "transform",
          x: (position: number) => {
            const factor = mirrorIndex(position, charsTotal);
            return (charsTotal % 2 ? Math.abs(Math.ceil(charsTotal / 2) - 1 - factor) : Math.abs(Math.ceil(charsTotal / 2) - factor)) * 200 * (position < charsTotal / 2 ? -1 : 1);
          },
          y: (position: number) => mirrorIndex(position, charsTotal) * 60,
          rotationY: -270,
          rotationZ: (position: number) => {
            const factor = mirrorIndex(position, charsTotal);
            return position < charsTotal / 2 ? Math.abs(factor - charsTotal / 2) * 8 : -1 * Math.abs(factor - charsTotal / 2) * 8;
          },
        },
        {
          ease: "power2.inOut", x: 0, y: 0, rotationZ: 0, rotationY: 0, scale: 1,
          scrollTrigger: makeST({ trigger: word, start: "top bottom+=40%", end: "top top+=15%", scrub: true }),
        }
      );
    });
  },

  // fx23 — scale up + spread, alternating direction per word
  fx23: ({ words, makeST }) => {
    words.forEach((word, wordPosition) => {
      gsap.fromTo(
        wordChars(word),
        {
          willChange: "transform",
          scale: 0.01,
          x: (pos: number, _t: HTMLElement, arr: HTMLElement[]) => (wordPosition % 2 ? pos * 50 : (arr.length - pos - 1) * -50),
        },
        {
          ease: "power4", scale: 1, x: 0,
          scrollTrigger: makeST({ trigger: word, start: "center bottom", end: "bottom top-=40%", scrub: true }),
        }
      );
    });
  },

  // fx24 — elastic rebound from below, from the centre out
  fx24: ({ chars, root, makeST }) => {
    const charsTotal = chars.length;
    gsap.fromTo(
      chars,
      { willChange: "transform", y: (position: number) => (charsTotal / 2 - mirrorIndex(position, charsTotal) + 6) * 130 },
      {
        ease: "elastic.out(.4)", y: 0, stagger: { amount: 0.1, from: "center" },
        scrollTrigger: makeST({ trigger: root, start: "top bottom", end: "bottom top-=50%", scrub: true }),
      }
    );
  },

  // fx25 — pinned: letters grow vertically over a long scroll
  fx25: ({ chars, root, stage, makeST }) => {
    gsap.fromTo(
      chars,
      { willChange: "transform", transformOrigin: "50% 100%", scaleY: 0 },
      {
        ease: "power3.in", opacity: 1, scaleY: 1, stagger: 0.05,
        scrollTrigger: makeST({ trigger: root, start: "center center", end: "+=500%", scrub: true, pin: stage }),
      }
    );
  },

  // fx26 — pinned: each word grows vertically in turn, alternating origins
  fx26: ({ words, root, stage, makeST }) => {
    const tl = gsap.timeline({
      scrollTrigger: makeST({ trigger: root, start: "center center", end: "+=100%", scrub: true, pin: stage }),
    });
    words.forEach((word, wordPosition) => {
      tl.fromTo(
        wordChars(word),
        {
          willChange: "transform",
          // Repo's `!wordPosition % 2` is truthy only for word 0, so only the
          // first word grows from the top edge; the rest grow from the bottom.
          transformOrigin: wordPosition === 0 ? "50% 0%" : "50% 100%",
          scaleY: 0,
        },
        { ease: "power1.inOut", scaleY: 1, stagger: { amount: 0.3, from: "center" } },
        0
      );
    });
  },

  // fx27 — pinned: words swarm in from deep 3D space, random order
  fx27: ({ words, root, stage, makeST }) => {
    perspectiveOnParents(words, 1000);
    gsap.fromTo(
      words,
      {
        willChange: "opacity, transform",
        z: () => gsap.utils.random(500, 950),
        opacity: 0,
        xPercent: () => gsap.utils.random(-100, 100),
        yPercent: () => gsap.utils.random(-10, 10),
        rotationX: () => gsap.utils.random(-90, 90),
      },
      {
        ease: "expo", opacity: 1, rotationX: 0, rotationY: 0, xPercent: 0, yPercent: 0, z: 0, stagger: { each: 0.006, from: "random" },
        scrollTrigger: makeST({ trigger: root, start: "center center", end: "+=300%", scrub: true, pin: stage }),
      }
    );
  },

  // fx28 — blur + scale settle, centre-weighted, per word
  fx28: ({ words, makeST }) => {
    words.forEach((word) => {
      const chars = wordChars(word);
      const charsTotal = chars.length;
      gsap.fromTo(
        chars,
        {
          willChange: "transform, filter",
          transformOrigin: "50% 100%",
          scale: (position: number) => gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0.5, 2.1, mirrorIndex(position, charsTotal)),
          y: (position: number) => gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0, 60, mirrorIndex(position, charsTotal)),
          rotation: (position: number) => {
            const factor = mirrorIndex(position, charsTotal);
            return position < charsTotal / 2
              ? gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), -4, 0, factor)
              : gsap.utils.mapRange(0, Math.ceil(charsTotal / 2), 0, 4, factor);
          },
          filter: "blur(12px) opacity(0)",
        },
        {
          ease: "power2.inOut", y: 0, rotation: 0, scale: 1, filter: "blur(0px) opacity(1)", stagger: { amount: 0.15, from: "center" },
          scrollTrigger: makeST({ trigger: word, start: "top bottom+=40%", end: "top top+=15%", scrub: true }),
        }
      );
    });
  },

  // fx29 — letters pop from a corner, alternating corner + direction per word
  fx29: ({ words, makeST }) => {
    words.forEach((word, pos) => {
      gsap.fromTo(
        wordChars(word),
        { willChange: "transform", transformOrigin: `${pos % 2 ? 0 : 100}% ${pos % 2 ? 100 : 0}%`, scale: 0 },
        {
          ease: "power4", scale: 1, stagger: { each: 0.03, from: pos % 2 ? "end" : "start" },
          scrollTrigger: makeST({ trigger: word, start: "top bottom-=10%", end: "top top", scrub: true }),
        }
      );
    });
  },
};

/* ───────────────────────── catalog metadata ───────────────────────── */

export const EFFECT_ORDER: FxId[] = [
  "fx1", "fx2", "fx3", "fx4", "fx5", "fx6", "fx7", "fx8", "fx9", "fx10",
  "fx11", "fx12", "fx13", "fx14", "fx15", "fx16", "fx17", "fx18", "fx19", "fx20",
  "fx21", "fx22", "fx23", "fx24", "fx25", "fx26", "fx27", "fx28", "fx29",
];

export const EFFECT_INFO: Record<FxId, EffectInfo> = {
  fx1: { name: "Spin & Scale In", description: "Letters spin upright and scale up to settle.", pinned: false, sample: "Beyond Meaning" },
  fx2: { name: "Stretch Rise", description: "Stretched letters squash-rise into place.", pinned: false, sample: "Heavenly Pleasure" },
  fx3: { name: "Vertical Unfold", description: "Letters unfold upward from a flat top edge.", pinned: false, sample: "Blossoms Have Fallen" },
  fx4: { name: "Word Spread", description: "Each word's letters fan out from its centre.", pinned: false, sample: "Human Gratitude" },
  fx5: { name: "Scatter Assemble", description: "Letters fly in from random offsets and lock together.", pinned: false, sample: "Intentionally Dramatic" },
  fx6: { name: "Flip Up 3D", description: "Letters flip up around the X axis, per word.", pinned: false, sample: "Blooming Flowers" },
  fx7: { name: "Swing In 3D", description: "Letters swing in around the Y axis from the word's end.", pinned: false, sample: "Unfolding\nElegantly\nNaturally" },
  fx8: { name: "Scramble Decode", description: "Characters scramble through symbols, then resolve.", pinned: false, sample: "Midnight" },
  fx9: { name: "Centre Fan-Out", description: "Letters start stacked at centre and fan out to place.", pinned: false, sample: "Moon Transportation" },
  fx10: { name: "Blur Focus", description: "Letters resolve from heavy blur in random order.", pinned: false, sample: "Lucid Dreaming" },
  fx11: { name: "Mask Slide In", description: "Letters slide up from behind a mask, left to right.", pinned: false, sample: "The Routine" },
  fx12: { name: "Skew Streak In", description: "Stretched, skewed letters streak in from the left.", pinned: false, sample: "Night Time" },
  fx13: { name: "Flip & Tumble 3D", description: "Letters tumble and flip 180° into place.", pinned: false, sample: "Megascrapers" },
  fx14: { name: "Pinned Rise Build", description: "Pinned line slides in as letters rise and scale down.", pinned: true, sample: "Futuristic" },
  fx15: { name: "Pinned 3D Flip", description: "Pinned line slides in with a deep 3D letter flip.", pinned: true, sample: "Unintelligible" },
  fx16: { name: "Tilt & Brighten", description: "The line levels out while words brighten in sequence.", pinned: false, sample: "Out of Place" },
  fx17: { name: "Random 3D Settle", description: "Letters tumble in from random depth and rotation.", pinned: false, sample: "Stubborn Naivety" },
  fx18: { name: "Depth Push-In", description: "Letters push forward from far away with an overshoot.", pinned: false, sample: "Step Into the Light" },
  fx19: { name: "Top-Down Flip", description: "Letters flip down from above into place.", pinned: false, sample: "Intense Nature" },
  fx20: { name: "Bottom-Up Flip", description: "Letters flip up from below in random order.", pinned: false, sample: "Waking Life" },
  fx21: { name: "Multi-Axis Depth", description: "Letters converge from deep 3D space, centre out.", pinned: false, sample: "Beauty Remains" },
  fx22: { name: "Spiral Converge", description: "Letters spiral inward from a fanned arc.", pinned: false, sample: "Dance Into Existence" },
  fx23: { name: "Scale Spread", description: "Letters scale up from nothing, spreading per word.", pinned: false, sample: "Deeper Love Light" },
  fx24: { name: "Elastic Rebound", description: "Letters drop in and rebound elastically from centre.", pinned: false, sample: "Embrace" },
  fx25: { name: "Pinned Vertical Grow", description: "Pinned letters grow vertically over a long scroll.", pinned: true, sample: "Have a Heart" },
  fx26: { name: "Pinned Word Grow", description: "Pinned words grow vertically in turn from centre.", pinned: true, sample: "Cosmic Symphony" },
  fx27: { name: "Pinned 3D Swarm", description: "Pinned words swarm in from deep space, random order.", pinned: true, sample: "Because You Have Hands" },
  fx28: { name: "Blur Scale Settle", description: "Letters un-blur and scale down, centre-weighted.", pinned: false, sample: "Liberation" },
  fx29: { name: "Corner Pop", description: "Letters pop from alternating corners, per word.", pinned: false, sample: "Discipline Above Motivation" },
};
