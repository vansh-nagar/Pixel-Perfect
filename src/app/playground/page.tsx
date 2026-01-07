"use client";
import { Anton } from "next/font/google";
import Navbar from "@/components/rune-landing/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "gsap/src/SplitText";
import ScrollTrigger from "gsap/ScrollTrigger";
import { ShinyCtaButton } from "@/components/rune-landing/cta-button";
import IconFall from "@/components/rune-landing/icon-fall";
import { FloatingIcons } from "@/components/floating-icons";

const anton = Anton({ subsets: ["latin"], weight: "400" });

gsap.registerPlugin(SplitText, ScrollTrigger);

const page = () => {
  useGSAP(() => {
    const split = new SplitText(".gsap-text", { type: "words,chars" });

    gsap.from(split.chars, {
      duration: 1,
      opacity: 0,
      y: 300,
      ease: "back.out(1.7)",
      stagger: 0.05,
      delay: 0.5,
    });

    gsap.from(".container", {
      scale: 0.9,
      delay: 0.5,
      duration: 1,
      ease: "back.in",
    });

    gsap.to(".cover", {
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom bottom",
        pin: ".hero-section",
        scrub: 1,
      },
      y: 0,
      duration: 1,
    });
  });

  return (
    <div className=" bg-accent-foreground">
      <div className="container overflow-hidden  bg-background h-screen hero-section">
        <Navbar />
        <FloatingIcons />
        <section className="flex flex-col w-full  h-full justify-start items-center ">
          <span
            className={`text-[400px] ${anton.className} z-50 gsap-text overflow-hidden`}
          >
            RUNE
          </span>
          <span className={`text-6xl -mt-24 font-light z-50`}>
            Icons for every screen.{" "}
          </span>
          <div className=" mt-10 flex gap-4 z-50">
            <ShinyCtaButton />
            <ShinyCtaButton />
          </div>
        </section>
        <IconFall />
      </div>
      <div className="cover h-screen bg-accent-foreground"></div>
    </div>
  );
};

export default page;
