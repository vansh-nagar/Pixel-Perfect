"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const MouseFollowerButton = ({
  children = "Shiny Button",
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const [isButtonHovering, setisButtonHovering] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      console.log(rect);

      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const maxMove = 8;

      const clampedX = Math.max(-maxMove, Math.min(maxMove, x / 2));
      const clampedY = Math.max(-maxMove, Math.min(maxMove, y / 2));

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
        },
      );
    };

    window.addEventListener("mousemove", mouseMove);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
    };
  }, [isButtonHovering]);

  return (
    <Button
      ref={buttonRef}
      onMouseEnter={() => {
        setisButtonHovering(true);
      }}
      onMouseLeave={() => {
        setisButtonHovering(false);
      }}
      className={`shiny relative overflow-hidden bg-black text-white z-10 shadow-[inset_1px_1px_4px_0.1px_white,inset_-1px_-1px_4px_0.1px_white] rounded-full hover:bg-black/60 ${className}`}
    >
      <span className="z-30">{children}</span>
      <div className="h-20 bg-gradient-to-tr from-white to-black w-3 -rotate-45 origin-top left-0  top-0 absolute blur-sm "></div>
      <div className="h-20 bg-white w-1 -rotate-45 origin-top left-16  top-0 absolute blur-md"></div>
    </Button>
  );
};

export default MouseFollowerButton;
