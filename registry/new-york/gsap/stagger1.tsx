import { useState } from "react";
import { gsap } from "gsap";
import ThreedButton from "../buttons/3d-button";

const Stagger1 = () => {
  const [fromIndex, setFromIndex] = useState<number>(0);
  const [animating, setAnimating] = useState(false);
  const gridno: [number, number] = [8, 8];

  const handleRipple = () => {
    const blocks = gsap.utils.toArray(".blocks") as HTMLElement[];
    gsap.set(blocks, { scale: 1, backgroundColor: "" });
    gsap.to(blocks, {
      scale: 0.6,
      backgroundColor: "#f59e0b",
      duration: 0.6,
      borderRadius: "30px",
      stagger: {
        each: 0.06,
        grid: gridno,
        from: fromIndex,
      },
      onComplete: () => {
        setTimeout(() => {
          gsap.to(blocks, {
            scale: 1,
            backgroundColor: "",
            duration: 0.6,
            borderRadius: "8px",
            stagger: {
              each: 0.06,
              grid: gridno,
              from: fromIndex + 1,
            },
            onComplete: () => {
              setAnimating(false);
            },
          });
        }, 400);
      },
    });
    setAnimating(true);
    setFromIndex((prev) => (prev + 1) % 64);
  };

  return (
    <div>
      <div className=" w-[400px] flex flex-wrap gap-2">
        {Array.from({ length: 64 }).map((_, index) => (
          <div
            key={index}
            className={`blocks h-10 aspect-square rounded-md cursor-pointer ${
              index <= fromIndex ? "bg-[#f59e0b]" : "bg-accent-foreground"
            }`}
            onClick={() => setFromIndex(index)}
            title={`Set as ripple center (${index})`}
          ></div>
        ))}
      </div>
      <div className="flex justify-center">
        <ThreedButton
          variant={"outline"}
          size={"sm"}
          className=" mt-6 text-xs active:scale-[0.94] transition-all  duration-200"
          onClick={handleRipple}
          disabled={animating}
        >
          +1 task
        </ThreedButton>
      </div>
    </div>
  );
};

export default Stagger1;
