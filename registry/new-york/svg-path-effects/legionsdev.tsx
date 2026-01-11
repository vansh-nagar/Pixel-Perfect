"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/src/Flip";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import TextGradient from "registry/new-york/text/text-gradient";
gsap.registerPlugin(Flip);

const LegionsDev = () => {
  const Box = useRef<HTMLDivElement>(null);
  const tl2 = useRef<GSAPTimeline | null>(null);

  useGSAP(() => {
    const targets = gsap.utils.toArray<HTMLElement>(".target");
    const tl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        const first = targets[0];
        const state = Flip.getState(Box.current);

        first.appendChild(Box.current!);

        Flip.from(state, {
          duration: 0,
          ease: "power1.inOut",
          absolute: true,
        });
      },
    });

    tl.to(Box.current, { opacity: 1, duration: 1 });
    targets.forEach((t) => {
      tl.add(() => {
        const state = Flip.getState(Box.current);
        t.appendChild(Box.current!);

        Flip.from(state, {
          duration: 1,
          ease: "power1.inOut",
          absolute: true,
        });
      });
      tl.to({}, { duration: 3 });
    });
    tl.to(Box.current, { opacity: 0, duration: 1 });

    tl2.current = gsap.timeline({ paused: true });

    tl2.current.to(".c1", {
      y: -300,
      duration: 1,
      ease: "power1.inOut",
      opacity: 0,
      filter: "blur(10px)",
    });

    tl2.current.to(
      ".c2",
      {
        y: 300,
        duration: 1,
        ease: "power1.inOut",
        opacity: 0,
        filter: "blur(10px)",
      },
      "<"
    );

    tl2.current.to(".container", {
      rotateY: -35,
      rotateX: -50,
      z: 0,
      scale: 1.8,
      duration: 1.3,
      ease: "power2.inOut",
      delay: 0.3,
    });

    const innerBoxes = gsap.utils.toArray<HTMLElement>(".inner-box");
    tl2.current.to(innerBoxes, {
      y: -60,
      x: 30,
      z: 120,
      rotateX: -15,
      duration: 1.6,
      ease: "power2.out",
      delay: 0.3,
    });
  }, []);

  return (
    <div className=" flex flex-col justify-center items-center gap-10 py-4 perspective-distant w-full h-full">
      <div className=" fixed top-11 right-1 flex flex-col gap-2 z-50">
        <Button
          size={"icon"}
          className=" rounded-none border-dashed "
          variant={"outline"}
          onClick={() => {
            tl2.current?.reverse();
          }}
        >
          <X />
        </Button>
      </div>
      <div className="c1 h-[30vh] border w-[50vw] rounded-md border-dashed overflow-hidden p-2 blur-sm">
        <TextGradient> LIKE • FOLLOW • STAY</TextGradient>
      </div>
      <div className="w-[50vw] flex gap-32 items-center  ">
        <Button
          onClick={() => {
            tl2.current?.play();
          }}
          variant={"ghost"}
          className="-rotate-45 text-xs absolute  right-40 z-50"
        >
          Click To See <br /> Magiccccc
        </Button>
        <div className="container transform-style-preserve-3d will-change-transform grid  grid-cols-[repeat(auto-fit,minmax(200px,1fr))] rtl-grid grid-rows-2 gap-x-auto  gap-y-20">
          <div className="target col-start-3  border w-12 h-12 rounded-sm absolute">
            <div
              ref={Box}
              className="box border border-dashed w-12 h-12 rounded-sm bg-muted"
            ></div>
            <img
              src={
                "https://i.pinimg.com/736x/96/67/45/96674540dc22d71709af0d1f5a6ab0bb.jpg"
              }
              className="z-20 inner-box border border-dashed w-12 h-12 rounded-sm bg-accent-foreground absolute inset-0 object-cover"
            />
          </div>
          <div className="target col-start-4 border border-dashed w-12 h-12 rounded-sm relative">
            <img
              src={
                "https://i.pinimg.com/736x/5d/88/92/5d8892b048fec8ff924329da3ae5eff3.jpg"
              }
              className="z-20 inner-box border border-dashed w-12 h-12 rounded-sm bg-accent-foreground absolute inset-0 object-cover"
            />
          </div>
          <div className="target col-start-4 row-start-2 border border-dashed w-12 h-12 rounded-sm relative">
            <img
              src={
                "https://i.pinimg.com/474x/2e/22/af/2e22af08708a0c5246dc826809ffc2de.jpg"
              }
              className="z-20 inner-box border border-dashed w-12 h-12 rounded-sm bg-accent-foreground absolute inset-0 object-cover"
            />
          </div>
          <div className="target col-start-3   row-start-2  border border-dashed w-12 h-12 rounded-sm relative">
            <img
              src={
                "https://i.pinimg.com/736x/39/b8/82/39b882421b310e5c5c0ec0796a1cc235.jpg"
              }
              className="z-20 inner-box border border-dashed w-12 h-12 rounded-sm bg-accent-foreground absolute inset-0 object-cover"
            />
          </div>
          <div className="target col-start-2  row-start-2  border border-dashed w-12 h-12 rounded-sm relative">
            <img
              src={
                "https://i.pinimg.com/736x/34/39/14/343914a9eda9bc1b5f07d347fbb54843.jpg"
              }
              className="z-20 inner-box border border-dashed w-12 h-12 rounded-sm bg-accent-foreground absolute inset-0 object-cover"
            />
          </div>
          <div className="target col-start-1  row-start-2   border border-dashed w-12 h-12 rounded-sm relative">
            <img
              src={
                "https://i.pinimg.com/736x/16/63/44/166344ba0214b357e759ed537a0eba74.jpg"
              }
              className="z-20 inner-box border border-dashed w-12 h-12 rounded-sm bg-accent-foreground absolute inset-0 object-cover"
            />
          </div>
        </div>
      </div>
      <div className="c2 h-screen border w-[50vw] rounded-md border-dashed p-2 blur-sm">
        <TextGradient>
          Code • Ship • Repeat ★ Don’t just watch — build with me ★ ☆ Real
        </TextGradient>
      </div>
    </div>
  );
};

export default LegionsDev;
