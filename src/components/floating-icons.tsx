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

const mutedColor = "#9ca3af"; // Muted gray

export function FloatingIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Animate each icon
    iconsRef.current.forEach((icon, index) => {
      const iconData = randomIcons[index];
      if (!iconData) return;

      const timeline = gsap.timeline({ repeat: -1 });
      const randomY = gsap.utils.random(-20, 20);
      const randomDuration = gsap.utils.random(4, 8);

      timeline
        .to(
          icon,
          {
            y: randomY,
            rotation: iconData.rotation,
            duration: randomDuration,
            ease: "sine.inOut",
          },
          0
        )
        .to(
          icon,
          {
            opacity: iconData.opacity,
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

  const getIcon = (iconName: string, size: number, strokeWidth: number) => {
    const IconComponent = Icons[
      iconName as keyof typeof Icons
    ] as React.ComponentType<any>;
    if (IconComponent) {
      return (
        <IconComponent
          size={size}
          strokeWidth={strokeWidth}
          style={{ color: mutedColor }}
        />
      );
    }
    return null;
  };

  const randomIcons = [
    {
      id: 0,
      name: "Rocket",
      top: "10%",
      left: "20%",
      size: 300,
      strokeWidth: 2,
      rotation: 15,
      opacity: 0.6,
    },
    {
      id: 2,
      name: "Heart",
      top: "25%",
      left: "72%",
      size: 100,
      strokeWidth: 2,
      rotation: -10,
      opacity: 0.5,
    },
    {
      id: 3,
      name: "Zap",
      top: "50%",
      left: "60%",
      size: 200,
      strokeWidth: 2,
      rotation: 25,
      opacity: 0.7,
    },
    {
      id: 4,
      name: "Code",
      top: "50%",
      left: "2%",
      size: 150,
      strokeWidth: 2,
      rotation: -20,
      opacity: 0.4,
    },
    {
      id: 9,
      name: "Smile",
      top: "60%",
      left: "88%",
      size: 300,
      strokeWidth: 2,
      rotation: 10,
      opacity: 0.6,
    },
    {
      id: 10,
      name: "Settings",
      top: "85%",
      left: "15%",
      size: 100,
      strokeWidth: 2,
      rotation: 360,
      opacity: 0.5,
    },
  ];

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
          {getIcon(icon.name, icon.size, icon.strokeWidth)}
        </div>
      ))}
    </div>
  );
}
