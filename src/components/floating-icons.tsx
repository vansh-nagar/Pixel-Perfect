"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import * as Icons from "lucide-react";

const iconNames = [
  "Heart",
  "Star",
  "Zap",
  "Smile",
  "Music",
  "Cog",
  "Code",
  "Database",
  "Rocket",
  "Lock",
  "Bell",
  "Camera",
  "Globe",
  "Users",
  "Settings",
  "MessageSquare",
  "Share2",
  "Download",
  "Cloud",
  "Wind",
  "Radio",
  "Smartphone",
  "Cpu",
  "TrendingUp",
];

const colors = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
];

export function FloatingIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Animate each icon
    iconsRef.current.forEach((icon, index) => {
      const timeline = gsap.timeline({ repeat: -1 });
      const randomY = gsap.utils.random(-20, 20);
      const randomRotation = gsap.utils.random(-10, 10);
      const randomDuration = gsap.utils.random(4, 8);

      timeline
        .to(
          icon,
          {
            y: randomY,
            rotation: randomRotation,
            duration: randomDuration,
            ease: "sine.inOut",
          },
          0
        )
        .to(
          icon,
          {
            opacity: gsap.utils.random(0.3, 0.8),
            duration: randomDuration / 2,
            ease: "sine.inOut",
          },
          0
        );
    });

    return () => {
      gsap.killTweensOf(iconsRef.current);
    };
  }, []);

  const getIcon = (iconName: string, color: string) => {
    const IconComponent = Icons[
      iconName as keyof typeof Icons
    ] as React.ComponentType<any>;
    if (IconComponent) {
      return <IconComponent size={40} strokeWidth={1.5} style={{ color }} />;
    }
    return null;
  };

  const randomIcons = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    name: iconNames[Math.floor(Math.random() * iconNames.length)],
    top: `${Math.random() * 80 + 10}%`,
    left: `${Math.random() * 80 + 10}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {randomIcons.map((icon) => (
        <div
          key={icon.id}
          ref={(el) => {
            if (el) iconsRef.current[icon.id] = el;
          }}
          className="absolute opacity-50 transition-all duration-500"
          style={{
            top: icon.top,
            left: icon.left,
          }}
        >
          {getIcon(icon.name, icon.color)}
        </div>
      ))}
    </div>
  );
}
