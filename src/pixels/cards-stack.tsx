"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface CardStackAnimateProps {
  images?: string[];
  text: string;
}

const CardStackAnimate = ({
  images = [],
  text = "pixel perfect",
}: CardStackAnimateProps) => {
  const first = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({});
    const cards = gsap.utils.toArray(".card");

    tl.from(cards, {
      y: "100vh",
      stagger: 1,
      ease: "power3.out",
      duration: 1,

      scrollTrigger: {
        trigger: first.current,
        start: "top top",
        end: "3000",
        scrub: 1,
        pin: true,
      },
    });
  });

  return (
    <div className="w-full h-screen  ">
      <div
        ref={first}
        className="h-screen w-full flex items-center justify-center relative"
      >
        <div className=" text-4xl font-bold">{text}</div>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className={`card absolute h-[400px] w-[300px] rounded-xl shadow-lg py-4 px-5 overflow-hidden border-3
            `}
              style={{
                left: `calc(50% + ${(i - 2.5) * 80}px)`,
                transform: `translateX(-50%) rotate(${(i - 2.5) * 10}deg)`,
                backgroundImage: images[i] ? `url(${images[i]})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className=" flex justify-between">
                <div className=" relative cursor-pointer">
                  <Badge
                    className=" absolute  text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  "
                    size={30}
                  />
                  <div className="   text-xs text-white  font-bold ">
                    {i + 1}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CardStackAnimate;
