import { useState } from "react";
import { gsap } from "gsap";
import ThreedButton from "../buttons/3d-button";

const Stagger1 = () => {
  const [fromIndex, setFromIndex] = useState<number>(0);
  const [animating, setAnimating] = useState(false);
  const gridno: [number, number] = [8, 8];

  const handleRipple = () => {
    if (animating) return;
    setAnimating(true);

    const nextIndex = (fromIndex + 1) % 64;
    setFromIndex(nextIndex);

    const blocks = gsap.utils.toArray<HTMLElement>(".blocks");

    gsap.to(blocks, {
      scale: 1,
      duration: 0.18,
      stagger: {
        each: 0.05,
        grid: gridno,
        from: fromIndex, // ⬅ start from current block index
        onStart() {
          const el = this.targets()[0] as HTMLElement;
          gsap.fromTo(
            el,
            { scale: 1, filter: "brightness(1)" },
            {
              scale: 0.7,
              filter: "brightness(1.5)",
              duration: 0.6,
              ease: "elastic.out(1, 0.3)",
              repeat: 3,
              yoyo: true,
            }
          );

          gsap.to(el, {
            scale: 1,
            duration: 0.18,
            ease: "back.inOut",
          });
        },
      },
      onComplete: () => setAnimating(false),
    });
  };

  return (
    <div>
      <div className=" w-[400px] flex flex-wrap gap-2">
        {Array.from({ length: 64 }).map((_, index) => (
          <div
            key={index}
            className={`blocks h-10 aspect-square rounded-md cursor-pointer ${
              index <= fromIndex ? "bg-[#f59e0b]" : "bg-accent"
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
          +1
        </ThreedButton>
      </div>
    </div>
  );
};

export default Stagger1;
