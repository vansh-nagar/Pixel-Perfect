/**
 * Scroll-typography effect builders — faithful GSAP ScrollTrigger ports of the
 * 29 effects from Codrops' "On-Scroll Typography Animations" (sets 1 & 2).
 */

import gsap from "gsap";

export type FxId =
  | "fx1" | "fx2" | "fx3" | "fx8" | "fx9" | "fx10" | "fx13" | "fx18" | "fx19" | "fx20"
  | "fx21" | "fx22" | "fx27" | "fx28";

export type EffectCtx = {
  root: HTMLElement;
  stage: HTMLElement;
  chars: HTMLElement[];
  words: HTMLElement[];
  scroller: Element | undefined;
  makeST: (cfg: Record<string, unknown>) => any;
};

export type EffectBuilder = (ctx: EffectCtx) => void;

export type EffectInfo = {
  name: string;
  description: string;
  pinned: boolean;
  sample: string;
};

const wordChars = (word: HTMLElement) =>
  Array.from(word.querySelectorAll<HTMLElement>(".st-char"));

const perspectiveOnParents = (els: HTMLElement[], value: number) => {
  const parents = new Set<HTMLElement>();
  els.forEach((el) => el.parentElement && parents.add(el.parentElement));
  parents.forEach((p) => gsap.set(p, { perspective: value }));
};

const mirrorIndex = (position: number, total: number) =>
  position < Math.ceil(total / 2)
    ? position
    : Math.ceil(total / 2) - Math.abs(Math.floor(total / 2) - position) - 1;

const lettersAndSymbols = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o",
  "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "!", "@", "#", "$",
  "%", "^", "&", "*", "-", "_", "+", "=", ";", ":", "<", ">", ",",
];

export const EFFECTS: Record<FxId, EffectBuilder> = {
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

};

export const EFFECT_ORDER: FxId[] = [
  "fx1", "fx2", "fx3", "fx8", "fx9", "fx10",
  "fx13", "fx18", "fx19", "fx20",
  "fx21", "fx22", "fx27", "fx28", ];

export const EFFECT_INFO: Record<FxId, EffectInfo> = {
  fx1: { name: "Spin & Scale In", description: "Letters spin upright and scale up to settle.", pinned: false, sample: "hey vansh" },
  fx2: { name: "Stretch Rise", description: "Stretched letters squash-rise into place.", pinned: false, sample: "hey vansh" },
  fx3: { name: "Vertical Unfold", description: "Letters unfold upward from a flat top edge.", pinned: false, sample: "hey vansh" },
  fx8: { name: "Scramble Decode", description: "Characters scramble through symbols, then resolve.", pinned: false, sample: "hey vansh" },
  fx9: { name: "Centre Fan-Out", description: "Letters start stacked at centre and fan out to place.", pinned: false, sample: "hey vansh" },
  fx10: { name: "Blur Focus", description: "Letters resolve from heavy blur in random order.", pinned: false, sample: "hey vansh" },
  fx13: { name: "Flip & Tumble 3D", description: "Letters tumble and flip 180° into place.", pinned: false, sample: "hey vansh" },
  fx18: { name: "Depth Push-In", description: "Letters push forward from far away with an overshoot.", pinned: false, sample: "hey vansh" },
  fx19: { name: "Top-Down Flip", description: "Letters flip down from above into place.", pinned: false, sample: "hey vansh" },
  fx20: { name: "Bottom-Up Flip", description: "Letters flip up from below in random order.", pinned: false, sample: "hey vansh" },
  fx21: { name: "Multi-Axis Depth", description: "Letters converge from deep 3D space, centre out.", pinned: false, sample: "hey vansh" },
  fx22: { name: "Spiral Converge", description: "Letters spiral inward from a fanned arc.", pinned: false, sample: "hey vansh" },
  fx27: { name: "Pinned 3D Swarm", description: "Pinned words swarm in from deep space, random order.", pinned: true, sample: "hey vansh" },
  fx28: { name: "Blur Scale Settle", description: "Letters un-blur and scale down, centre-weighted.", pinned: false, sample: "hey vansh" },
};
