"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin);

const cars = [
  { color: "#3b82f6", glow: "rgba(59,130,246,1)", delay: 0 },
  { color: "#ef4444", glow: "rgba(239,68,68,1)", delay: 0.5 },
  { color: "#22c55e", glow: "rgba(34,197,94,1)", delay: 1 },
  { color: "#f59e0b", glow: "rgba(245,158,11,1)", delay: 1.5 },
  { color: "#a855f7", glow: "rgba(168,85,247,1)", delay: 2 },
].map((car) => ({
  ...car,
  duration: 18 + Math.random() * 8,
}));

const RACE_PATH =
  "M209.612 152.197H7.61217C5.1123 152.197 2.07643 152.697 1.11217 148.197C-0.387784 141.197 13.6122 139.197 19.6122 132.197C25.6122 125.197 15.7162 110.184 15.1122 105.697C11.6123 79.6968 22.6122 3.69687 35.1122 1.19687C47.6122 -1.30313 54.6122 20.6969 64.6122 29.6969C74.6122 38.6969 83.1122 38.1969 85.6122 44.1969C88.1122 50.1969 80.6122 59.6969 80.6122 66.6969C80.6122 72.2969 103.946 86.0302 115.612 92.1969C121.112 95.6968 115.279 100.697 112.112 100.697C96.4455 98.6969 63.8122 94.6969 58.6122 94.6969C52.1122 94.6969 42.1122 103.697 41.6122 110.197C41.2122 115.397 51.4455 116.364 56.6122 116.197C87.2788 116.364 152.012 116.597 165.612 116.197C182.612 115.697 180.112 104.197 178.612 92.1969C177.412 82.5969 166.112 77.5302 160.612 76.1969C148.612 72.6968 137.112 66.6969 131.612 62.1969C127.212 58.5969 128.112 52.0301 129.112 49.1968C134.112 36.5301 145.512 11.4968 151.112 12.6968C156.712 13.8968 166.612 25.6968 169.612 31.6968L223.612 134.197C230.112 148.197 217.112 152.697 209.612 152.197Z";

export default function F1Racing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ringsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      if (!pathRef.current) return;

      const laps = new Array(cars.length).fill(0);
      const progresses = new Array(cars.length).fill(0);
      let currentLeader = 0;

      const updateColors = () => {
        const totalDistances = progresses.map((p, i) => laps[i] + p);

        let leaderIndex = 0;
        let maxDist = -1;
        totalDistances.forEach((d, i) => {
          if (d > maxDist) {
            maxDist = d;
            leaderIndex = i;
          }
        });

        if (leaderIndex !== currentLeader) {
          currentLeader = leaderIndex;
        }

        carsRef.current.forEach((car, i) => {
          if (!car) return;
          const ping = car.firstElementChild as HTMLElement | null;
          if (i === leaderIndex) {
            car.style.background = `radial-gradient(circle, ${cars[i].color}, ${cars[i].color}dd)`;
            if (ping) ping.style.display = "block";
          } else {
            car.style.background = "black";
            if (ping) ping.style.display = "none";
          }
        });

        ringsRef.current.forEach((ring, i) => {
          if (!ring) return;
          gsap.to(ring, {
            opacity: i === leaderIndex ? 1 : 0,
            scale: i === leaderIndex ? 1 : 0.5,
            duration: 0.3,
            overwrite: "auto",
          });
        });
      };

      carsRef.current.forEach((car, i) => {
        if (!car || !pathRef.current) return;
        const ring = ringsRef.current[i];

        const targets = [car, ring].filter(Boolean) as HTMLDivElement[];
        targets.forEach((target) => {
          gsap.to(target, {
            motionPath: {
              path: pathRef.current!,
              align: pathRef.current!,
              alignOrigin: [0.5, 0.5],
              autoRotate: false,
            },
            duration: cars[i].duration,
            ease: "none",
            repeat: -1,
            delay: cars[i].delay,
            onStart: () => {
              target.style.visibility = "visible";
            },
            onUpdate:
              target === car
                ? function (this: gsap.core.Tween) {
                    progresses[i] = this.progress();
                    updateColors();
                  }
                : undefined,
            onRepeat:
              target === car
                ? () => {
                    laps[i]++;
                  }
                : undefined,
            onComplete: () => {
              target.style.visibility = "hidden";
            },
          });
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="flex justify-center h-screen items-center relative"
    >
      {cars.map((car, i) => (
        <div
          key={`ring-${i}`}
          ref={(el) => {
            ringsRef.current[i] = el;
          }}
          className="h-9 w-9 absolute pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: `2px dashed ${car.color}`,
              animationDuration: "3s",
            }}
          />
        </div>
      ))}

      {cars.map((car, i) => (
        <div
          key={i}
          ref={(el) => {
            carsRef.current[i] = el;
          }}
          className="h-5 w-5 rounded-full absolute"
          style={{
            background: `radial-gradient(circle, ${car.color}, ${car.color}dd)`,
            visibility: "hidden",
          }}
        >
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: car.color, opacity: 0.5 }}
          />
        </div>
      ))}

      <svg
        width="500"
        height="500"
        viewBox="0 0 227 154"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path ref={pathRef} d={RACE_PATH} stroke="black" strokeWidth="2" />

        <text
          x="-2"
          y="145"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
          textAnchor="end"
        >
          Turn 01
        </text>
        <text
          x="28"
          y="-2"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
          textAnchor="end"
        >
          Turn 02
        </text>
        <text
          x="74"
          y="24"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
        >
          Turn 03
        </text>
        <text
          x="92"
          y="42"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
        >
          Turn 04
        </text>
        <text
          x="120"
          y="88"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
        >
          Turn 05
        </text>
        <text
          x="32"
          y="108"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
          textAnchor="end"
        >
          Turn 06
        </text>
        <text
          x="185"
          y="88"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
        >
          Turn 07
        </text>
        <text
          x="124"
          y="65"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
          textAnchor="end"
        >
          Turn 08
        </text>
        <text
          x="155"
          y="7"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
        >
          Turn 09
        </text>
        <text
          x="217"
          y="134"
          className="fill-muted-foreground"
          fontSize="4.5"
          fontFamily="monospace"
          opacity="0.5"
          textAnchor="end"
        >
          Turn 10
        </text>
      </svg>
    </div>
  );
}
