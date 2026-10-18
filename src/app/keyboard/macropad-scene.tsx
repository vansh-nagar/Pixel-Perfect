"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LABEL, LAYERS } from "./art/macropad-svg";
import { Figure, FooterButton, IllArt, finishIntro, liveKit, skipIntro, useScene } from "./ill-art";

gsap.registerPlugin(useGSAP);

const IDLE_MS = 5000;
const START = "2021";

export function MacropadScene() {
  const scene = useScene({ playOnView: true });
  const { rootRef, sectionRef, introRef } = scene;
  const api = useRef<{ drop: () => void; reset: () => void } | null>(null);

  useGSAP(
    () => {
      const el = rootRef.current;
      if (!el || skipIntro(el, scene)) return;
      const display = el.querySelector<HTMLElement>('[data-layer="display"]');
      const caps = gsap.utils.toArray<SVGGElement>(".key:not(.off)", el);
      gsap.set(el, { autoAlpha: 0 });
      introRef.current = gsap
        .timeline({
          paused: true,
          defaults: { ease: "expo.out" },
          onComplete: () => {
            finishIntro(scene, caps, [el, display]);
            api.current?.drop();
          },
        })
        .fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
        .from(display, { y: -16, opacity: 0, duration: 0.8 }, 0.3)
        .fromTo(caps, { visibility: "hidden" }, { visibility: "visible", duration: 0.01, stagger: 0.12 }, 0.55)
        .from(caps, { y: -22, duration: 0.6, ease: "back.out(1.7)", stagger: 0.12 }, 0.55);
    },
    { scope: rootRef },
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const kit = liveKit(el, scene, IDLE_MS);
    const keys = [...el.querySelectorAll<SVGGElement>(".key")];
    const cap = el.querySelector<SVGGElement>("#key-3")!;
    const digits = [...el.querySelectorAll<SVGTextElement>(".digit")];
    const caret = el.querySelector<SVGRectElement>(".caret")!;
    const X = digits.map((d) => Number(d.getAttribute("x")));
    let text = START;

    const render = () => {
      digits.forEach((d, i) => (d.textContent = text[i] ?? ""));
      caret.setAttribute("x", String(text.length ? X[text.length - 1] + 7 : X[0] - 7));
    };
    const type = (ch: string) => {
      text = text.length < 4 ? text + ch : text.slice(1) + ch;
      render();
    };
    const back = () => {
      text = text.slice(0, -1);
      render();
    };
    const capOff = () => cap.classList.contains("off");
    const drop = () => {
      if (!capOff()) return;
      cap.classList.remove("off");
      cap.classList.add("drop");
      kit.later(() => {
        cap.classList.remove("drop");
        if (text.length === 4) back();
        kit.later(() => {
          kit.press(cap, 110);
          type("2");
        }, 260);
      }, kit.reduce ? 0 : 640);
    };
    const reset = () => {
      cap.classList.add("off");
      text = START;
      render();
    };
    api.current = {
      drop,
      reset: () => {
        kit.touch();
        reset();
      },
    };

    kit.on(el, "click", (e) => {
      if (!scene.introDoneRef.current) return;
      kit.touch();
      const k = (e.target as Element).closest<SVGGElement>(".key");
      if (k) type(k.dataset.legend!);
      else if ((e.target as Element).closest("#switch")) drop();
    });
    let flip = 0;
    kit.onKey("keydown", (e) => {
      const match = keys.filter((k) => k.dataset.legend === e.key && !k.classList.contains("off"));
      if (e.key === "Backspace") back();
      else if (e.key === "r" || e.key === "R") reset();
      else if (match.length) {
        kit.press(match[flip++ % match.length], 110);
        type(e.key);
      } else return;
      kit.touch();
    });

    kit.ghost(async () => {
      if (!capOff()) {
        reset();
        await kit.sleep(1300);
      }
      if (kit.idle()) drop();
      await kit.sleep(3500);
    });

    return kit.dispose;
  }, [rootRef, scene]);

  return (
    <Figure sectionRef={sectionRef} footer={<FooterButton onClick={() => api.current?.reset()}>Reset</FooterButton>}>
      <IllArt
        hostRef={rootRef}
        label={LABEL}
        layers={LAYERS}
        className="w-[min(92vw,78vh,760px)] [&_svg]:overflow-visible [&_.key:not(.off)]:cursor-pointer [&_#switch]:cursor-pointer"
      />
    </Figure>
  );
}
