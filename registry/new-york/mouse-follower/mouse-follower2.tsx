"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const Page = () => {
  const followerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isButtonHovering, setisButtonHovering] = useState(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      if (!followerRef.current) return;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - 20;
      const mouseY = e.clientY - 20;

      console.log(mouseX, mouseY);

      followerRef.current.animate(
        {
          transform: `translate(${mouseX}px, ${mouseY}px) scale(${
            isButtonHovering ? 1.3 : 1
          })`,
        },
        {
          duration: isButtonHovering ? 3000 : 300,
          fill: "forwards",
          easing: "ease-out",
        }
      );

      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      console.log(rect);

      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const maxMove = 8;

      const clampedX = Math.max(-maxMove, Math.min(maxMove, x / 5));
      const clampedY = Math.max(-maxMove, Math.min(maxMove, y / 5));

      buttonRef.current.animate(
        {
          transform: isButtonHovering
            ? `translate(${clampedX}px, ${clampedY}px)`
            : `translate(0px, 0px)`,
        },
        {
          duration: 3000,
          fill: "forwards",
          easing: "ease-out",
        }
      );
    };

    window?.addEventListener("mousemove", mouseMove);

    return () => {
      window?.removeEventListener("mousemove", mouseMove);
    };
  }, [isButtonHovering]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex justify-center items-center cursor-none border  overflow-hidden"
    >
      <div
        ref={followerRef}
        className="w-10 aspect-square rounded-full fixed top-0 left-0 border-dashed border border-white blur-[1px] z-40 pointer-events-none"
      />
      <Button
        ref={buttonRef}
        onMouseEnter={() => {
          setisButtonHovering(true);
        }}
        onMouseLeave={() => {
          setisButtonHovering(false);
        }}
        className="shiny relative overflow-hidden bg-black text-white z-10 shadow-[inset_1px_1px_4px_0.1px_white,inset_-1px_-1px_4px_0.1px_white] rounded-full hover:bg-black/60"
      >
        <span className="z-30">Shiny Button</span>
        <div className="h-20 bg-gradient-to-tr from-white to-black w-3 -rotate-45 origin-top left-0  top-0 absolute blur-sm "></div>
        <div className="h-20 bg-white w-1 -rotate-45 origin-top left-16  top-0 absolute blur-md"></div>
      </Button>
    </div>
  );
};

export default Page;
