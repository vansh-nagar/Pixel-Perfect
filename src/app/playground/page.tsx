"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { LightDarkMode } from "@/components/ui/light-dark-mode";

const Page = () => {
  const Follower = useRef<HTMLDivElement | null>(null);
  const [isButtonHovering, setisButtonHovering] = useState(false);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      if (!Follower.current) return;

      Follower.current.animate(
        {
          transform: `translate(${e.clientX - 20}px, ${
            e.clientY - 20
          }px) scale(${isButtonHovering ? 1.3 : 1})`,
        },
        {
          duration: isButtonHovering ? 3000 : 300,
          fill: "forwards",
          easing: "ease-out",
        }
      );
    };

    window.addEventListener("mousemove", mouseMove);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
    };
  }, [isButtonHovering]);

  return (
    <div className=" h-screen w-full flex justify-center items-center flex-col gap-4">
      <div className=" absolute top-4 right-4 ">
        <LightDarkMode />
      </div>
      <div
        ref={Follower}
        className="w-10 aspect-square rounded-full absolute top-0 left-0 animate-spin border-dashed border border-white blur-[1px] z-40 pointer-events-none"
      />
      <Button
        onMouseEnter={() => {
          setisButtonHovering(true);
        }}
        onMouseLeave={() => {
          setisButtonHovering(false);
        }}
        className="shiny relative overflow-hidden bg-black text-white z-10 shadow-[inset_1px_1px_4px_0.1px_white,inset_-1px_-1px_4px_0.1px_white] "
      >
        Shiny Button
        <div className="h-20 bg-gradient-to-tr from-white to-black w-3 -rotate-45 origin-top left-0  top-0 absolute blur-sm "></div>
        <div className="h-20 bg-white w-1 -rotate-45 origin-top left-16  top-0 absolute blur-md"></div>
      </Button>

      <div className="bg-[radial-gradient(circle_at_center,rgba(34,211,238,1),rgba(139,92,246,1))] bg-clip-text text-transparent">
        Hello How Are You
      </div>

      <Button className=" animate-[spin-gradient_4s_linear_infinite]   bg-[length:300%_300%] relative bg-gradient-to-r from-pink-500 to-purple-600 p-[1.4px] rounded-lg ">
        <span className="relative z-10 bg-background w-full h-full rounded-md px-2 flex justify-center items-center text-white text-xs font-light ">
          Gradient Border
        </span>
      </Button>
    </div>
  );
};

export default Page;
