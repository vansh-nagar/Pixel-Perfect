"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useState, type ButtonHTMLAttributes } from "react";

const GROOVES = Array.from({ length: 28 }, (_, i) => 14 + i * 3.3);

const VinylPlayer = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="relative h-[505px] w-[350px] shrink-0 overflow-hidden rounded-[32px]"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #ececec 100%)",
        boxShadow:
          "inset 0 -4px 4px rgba(0,0,0,0.18), inset 0 4px 2px 2px #ffffff, 0 9px 20px rgba(0,0,0,0.37), 0 36px 36px rgba(0,0,0,0.18), 0 80px 48px rgba(0,0,0,0.09)",
      }}
    >
      <div className="absolute left-[25px] top-[27px] flex items-center gap-[6px]">
        <span className="text-[20px] leading-[23px] tracking-tight text-[#6e6e6e]">
          VN
        </span>
        <span
          className="block size-[12px] rounded-full bg-[#3ec440]"
          style={{
            boxShadow:
              "inset 0 -1px 2px rgba(0,0,0,0.25), 0 0 6px rgba(62,196,64,0.55)",
          }}
        />
      </div>

      <div
        className="absolute right-[-7px] top-[88px] h-[85px] w-[14px] rounded-[2px]"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #ababab 100%)",
          boxShadow:
            "0 4px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <div className="absolute inset-y-[3px] inset-x-0 flex flex-col justify-between">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} className="block h-px w-full bg-black/15" />
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="absolute left-[calc(50%-7.5px)] top-[55px] -translate-x-1/2"
      >
        <div
          className="relative size-[210px] rounded-full border-2 border-[#3f3d3d]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #1f1f1f 0%, #0a0a0a 60%, #000 100%)",
            boxShadow:
              "0 4px 6px rgba(0,0,0,0.4), inset 0 0 18px rgba(0,0,0,0.7)",
            animation: playing ? "spin 8s linear infinite" : undefined,
          }}
        >
          <svg
            viewBox="0 0 210 210"
            className="absolute inset-0 size-full"
            aria-hidden
          >
            {GROOVES.map((r) => (
              <circle
                key={r}
                cx="105"
                cy="105"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.045)"
                strokeWidth="0.6"
              />
            ))}
            <ellipse
              cx="60"
              cy="55"
              rx="52"
              ry="22"
              fill="rgba(255,255,255,0.05)"
            />
          </svg>

          <div className="absolute left-1/2 top-1/2 flex size-[14px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_0_3px_rgba(0,0,0,0.35)]">
            <span className="block size-[3px] rounded-full bg-black/80" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-[20px] top-[24px] z-10">
        <div
          className="relative size-[44px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #ffffff 0%, #b8b8b8 45%, #5e5e5e 100%)",
            boxShadow: "0 3px 5px rgba(0,0,0,0.32)",
          }}
        >
          <div
            className="absolute left-[6px] top-[6px] size-[32px] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #e6e6e6 0%, #8a8a8a 60%, #4a4a4a 100%)",
              boxShadow:
                "inset 0 1px 2px rgba(0,0,0,0.45), inset 0 -1px 1px rgba(255,255,255,0.2)",
            }}
          />
          <span
            className="absolute left-1/2 top-1/2 block size-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2a2a2a]"
            style={{ boxShadow: "inset 0 0 2px rgba(255,255,255,0.4)" }}
          />
        </div>

        <div
          className="absolute left-[22px] top-[36px] origin-top"
          style={{
            transform: `translateX(-50%) rotate(${playing ? "-14deg" : "6deg"})`,
            transition: "transform 900ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div
            className="h-[148px] w-[4px]"
            style={{
              background:
                "linear-gradient(90deg, #8a8a8a 0%, #f4f4f4 45%, #6a6a6a 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
            }}
          />
          <div
            className="absolute -top-[6px] left-1/2 -translate-x-1/2 h-[10px] w-[10px] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #f0f0f0 0%, #9a9a9a 70%, #555 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
          <div
            className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 h-[20px] w-[16px] rounded-[2px]"
            style={{
              background: "linear-gradient(180deg, #4a4a4a 0%, #161616 100%)",
              boxShadow:
                "0 2px 3px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          />
          <span className="absolute -bottom-[7px] left-1/2 block h-[4px] w-[1.5px] -translate-x-1/2 bg-[#1a1a1a]" />
        </div>
      </div>

      <div className="absolute left-1/2 top-[315px] flex w-[301px] -translate-x-1/2 items-center gap-[10px]">
        <AlbumArt />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-[20px] leading-[23px] text-black">
            I Wonder
          </p>
          <p className="truncate text-[14px] leading-[23px] text-[#808080]">
            Kanye West - I Wonder (Lyrics)
          </p>
        </div>
      </div>

      <div className="absolute left-1/2 top-[400px] flex -translate-x-1/2 items-center gap-[24px]">
        <ControlButton size={46} aria-label="Previous track">
          <SkipBack
            className="size-[16px] fill-[#333] text-[#333]"
            strokeWidth={0}
          />
        </ControlButton>
        <ControlButton
          size={69}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? (
            <Pause
              className="size-[26px] fill-[#222] text-[#222]"
              strokeWidth={0}
            />
          ) : (
            <Play
              className="size-[26px] translate-x-[2px] fill-[#222] text-[#222]"
              strokeWidth={0}
            />
          )}
        </ControlButton>
        <ControlButton size={46} aria-label="Next track">
          <SkipForward
            className="size-[16px] fill-[#333] text-[#333]"
            strokeWidth={0}
          />
        </ControlButton>
      </div>
    </div>
  );
};

const AlbumArt = () => (
  <div
    className="relative size-[53px] shrink-0 overflow-hidden rounded-[4px]"
    style={{
      background:
        "linear-gradient(135deg, #4f1d6e 0%, #a13fb8 35%, #ff5a64 70%, #ffa341 100%)",
      boxShadow:
        "0 2px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
    }}
  >
    <span className="absolute -right-2 top-1 block size-[22px] rounded-full bg-yellow-200/60 blur-[3px]" />
    <span className="absolute bottom-1 -left-1 block size-[20px] rounded-full bg-pink-300/55 blur-[3px]" />
    <span className="absolute right-2 bottom-2 block size-[10px] rounded-full bg-white/30 blur-[1px]" />
  </div>
);

interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size: number;
}

const ControlButton = ({
  size,
  children,
  className = "",
  style,
  ...props
}: ControlButtonProps) => (
  <button
    {...props}
    style={{
      width: size,
      height: size,
      background: "linear-gradient(180deg, #ffffff 0%, #e6e6e6 100%)",
      boxShadow:
        "0 2px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 2px rgba(0,0,0,0.08)",
      border: "1px solid #d4d4d4",
      ...style,
    }}
    className={`flex cursor-pointer items-center justify-center rounded-full transition-transform active:translate-y-[1px] ${className}`}
  >
    {children}
  </button>
);

export default VinylPlayer;
