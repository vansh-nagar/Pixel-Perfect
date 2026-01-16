"use client";

import React, { useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/mine/landing-page/navbar";

const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

const STRING_COLORS = [
  { start: "rgb(139, 90, 43)", end: "rgb(205, 133, 63)" },
  { start: "rgb(160, 100, 50)", end: "rgb(218, 165, 92)" },
  { start: "rgb(180, 120, 60)", end: "rgb(230, 190, 110)" },
  { start: "rgb(192, 192, 192)", end: "rgb(255, 255, 255)" },
  { start: "rgb(200, 200, 200)", end: "rgb(255, 255, 255)" },
  { start: "rgb(210, 210, 210)", end: "rgb(255, 255, 255)" },
];

const STRING_WIDTHS = [4, 3.5, 3, 2.5, 2, 1.5];

interface GuitarStringProps {
  index: number;
  yPosition: number;
  frequency: number;
  color: { start: string; end: string };
  strokeWidth: number;
}

const GuitarString = ({
  index,
  yPosition,
  frequency,
  color,
  strokeWidth,
}: GuitarStringProps) => {
  const pathRef = useRef<SVGPathElement>(null);
  const hitRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<SVGGElement>(null);

  const startY = yPosition;
  const p0 = useRef({ x: 0, y: startY });
  const p1 = useRef({ x: 400, y: startY });
  const p2 = useRef({ x: 800, y: startY });
  const connected = useRef(false);
  const hasPlayed = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);

  const curveString = useCallback(() => {
    return `M${p0.current.x},${p0.current.y} Q${p1.current.x},${p1.current.y} ${p2.current.x},${p2.current.y}`;
  }, []);

  const playSound = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    const ctx = audioContext.current;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.4, now);

    const bodyResonance = ctx.createBiquadFilter();
    bodyResonance.type = "peaking";
    bodyResonance.frequency.setValueAtTime(100, now);
    bodyResonance.Q.setValueAtTime(2, now);
    bodyResonance.gain.setValueAtTime(3, now);
    bodyResonance.connect(masterGain);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(frequency < 150 ? 2000 : 4000, now);
    lowpass.Q.setValueAtTime(1, now);
    lowpass.connect(bodyResonance);

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(80, now);
    highpass.Q.setValueAtTime(0.5, now);
    highpass.connect(lowpass);

    const harmonics = [
      { ratio: 1, gain: 1.0, decay: 3.5 },
      { ratio: 2, gain: 0.5, decay: 2.5 },
      { ratio: 3, gain: 0.35, decay: 2.0 },
      { ratio: 4, gain: 0.25, decay: 1.5 },
      { ratio: 5, gain: 0.15, decay: 1.2 },
      { ratio: 6, gain: 0.1, decay: 1.0 },
      { ratio: 7, gain: 0.05, decay: 0.8 },
    ];

    harmonics.forEach(({ ratio, gain, decay }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      const harmonicFreq = frequency * ratio;
      if (harmonicFreq > 10000) return;

      osc.type = ratio === 1 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(harmonicFreq, now);

      const detune = (Math.random() - 0.5) * 4;
      osc.detune.setValueAtTime(detune, now);

      const attackTime = 0.002;
      const peakGain = gain * 0.15;

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
      oscGain.gain.setValueAtTime(peakGain * 0.8, now + attackTime + 0.01);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(oscGain);
      oscGain.connect(highpass);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });

    const noiseBuffer = ctx.createBuffer(
      1,
      ctx.sampleRate * 0.05,
      ctx.sampleRate
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(frequency * 2, now);
    noiseFilter.Q.setValueAtTime(5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + 0.05);
  }, [frequency]);

  const render = useCallback(() => {
    if (pathRef.current) {
      pathRef.current.setAttribute("d", curveString());
    }
    if (hitRef.current) {
      hitRef.current.setAttribute("d", curveString());
    }
  }, [curveString]);

  useGSAP(
    () => {
      gsap.ticker.add(render);

      const container = containerRef.current;
      const hit = hitRef.current;

      const handlePointerMove = (e: PointerEvent) => {
        if (!container) return;
        const svg = container.ownerSVGElement;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const y = (e.clientY - rect.top) * (500 / rect.height);

        const overPath = e.target === hit;
        const distanceFromString = Math.abs(y - startY);

        if (!connected.current && overPath) {
          connected.current = true;
          hasPlayed.current = false;
          gsap.killTweensOf(p1.current);
        }

        if (connected.current) {
          p1.current.y = y * 2 - (p0.current.y + p2.current.y) / 2;

          if (distanceFromString > 25 && !hasPlayed.current) {
            const displacement = Math.abs(p1.current.y - startY);
            if (displacement > 15) {
              playSound();
              hasPlayed.current = true;
            }
            connected.current = false;
            gsap.to(p1.current, {
              duration: 1.2,
              y: startY,
              ease: "elastic.out(1.2, 0.25)",
            });
          }
        }
      };

      const handlePointerLeave = () => {
        if (connected.current && !hasPlayed.current) {
          const displacement = Math.abs(p1.current.y - startY);
          if (displacement > 15) {
            playSound();
            hasPlayed.current = true;
          }
        }

        connected.current = false;
        gsap.to(p1.current, {
          duration: 1.2,
          y: startY,
          ease: "elastic.out(1.2, 0.25)",
        });
      };

      container?.addEventListener("pointermove", handlePointerMove);
      container?.addEventListener("pointerleave", handlePointerLeave);

      render();

      return () => {
        gsap.ticker.remove(render);
        container?.removeEventListener("pointermove", handlePointerMove);
        container?.removeEventListener("pointerleave", handlePointerLeave);
      };
    },
    { scope: containerRef }
  );

  return (
    <g ref={containerRef}>
      <Navbar />
      <defs>
        <linearGradient
          id={`grad-${index}`}
          x1="0"
          y1="0"
          x2="800"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={color.start} />
          <stop offset="0.5" stopColor={color.end} />
          <stop offset="1" stopColor={color.start} />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d={`M0,${yPosition} Q400,${yPosition} 800,${yPosition}`}
        stroke={`url(#grad-${index})`}
        strokeWidth={strokeWidth}
        fill="none"
        style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.3))" }}
      />
      <path
        ref={hitRef}
        d={`M0,${yPosition} Q400,${yPosition} 800,${yPosition}`}
        stroke="transparent"
        strokeWidth="40"
        fill="none"
      />
    </g>
  );
};

const Guitar = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  const stringSpacing = 60;
  const startYOffset = 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-8">
      <div className="relative w-full max-w-4xl">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-[450px] z-10 rounded-l-md"
          style={{
            background: "linear-gradient(to right, #2a1810, #4a2c1c, #3d2316)",
            boxShadow:
              "inset -2px 0 4px rgba(0,0,0,0.5), 2px 0 8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute right-0 top-0 w-1 h-full" />
        </div>
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-[450px] z-10 rounded-r-md"
          style={{
            background: "linear-gradient(to left, #2a1810, #4a2c1c, #3d2316)",
            boxShadow:
              "inset 2px 0 4px rgba(0,0,0,0.5), -2px 0 8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-amber-200/20 via-amber-100/10 to-amber-200/20" />
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 800 500"
          className="w-full rounded-lg overflow-hidden"
        >
          <defs>
            <linearGradient id="fretboardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a0f0a" />
              <stop offset="50%" stopColor="#2d1f15" />
              <stop offset="100%" stopColor="#1a0f0a" />
            </linearGradient>
            <linearGradient id="woodGrain" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(60, 40, 25, 0.3)" />
              <stop offset="25%" stopColor="rgba(80, 50, 30, 0.1)" />
              <stop offset="50%" stopColor="rgba(60, 40, 25, 0.3)" />
              <stop offset="75%" stopColor="rgba(80, 50, 30, 0.1)" />
              <stop offset="100%" stopColor="rgba(60, 40, 25, 0.3)" />
            </linearGradient>
            <pattern
              id="woodPattern"
              patternUnits="userSpaceOnUse"
              width="100"
              height="500"
            >
              <rect width="100" height="500" fill="url(#fretboardGrad)" />
              <rect width="100" height="500" fill="url(#woodGrain)" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="800" height="500" fill="url(#woodPattern)" />

          <rect x="0" y="0" width="800" height="500" fill="rgba(0,0,0,0.2)" />

          {[200, 400, 600].map((x) => (
            <g key={x}>
              <rect
                x={x - 4}
                y="60"
                width="8"
                height="380"
                fill="linear-gradient(to right, #8B7355, #C4A77D, #8B7355)"
                style={{
                  filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
                }}
              />
              <rect
                x={x - 4}
                y="60"
                width="8"
                height="380"
                fill="#C4A77D"
                opacity="0.9"
              />
              <rect
                x={x - 1}
                y="60"
                width="2"
                height="380"
                fill="#D4B78F"
                opacity="0.5"
              />
            </g>
          ))}

          {[300, 500, 700].map((x) => (
            <circle
              key={x}
              cx={x}
              cy="250"
              r="8"
              fill="#E8DCC8"
              opacity="0.4"
              style={{ filter: "blur(0.5px)" }}
            />
          ))}

          <rect
            x="0"
            y="55"
            width="800"
            height="4"
            fill="#4a3728"
            opacity="0.8"
          />
          <rect
            x="0"
            y="441"
            width="800"
            height="4"
            fill="#4a3728"
            opacity="0.8"
          />

          {STRING_FREQUENCIES.map((freq, i) => (
            <GuitarString
              key={i}
              index={i}
              yPosition={startYOffset + i * stringSpacing}
              frequency={freq}
              color={STRING_COLORS[i]}
              strokeWidth={STRING_WIDTHS[i]}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default Guitar;
