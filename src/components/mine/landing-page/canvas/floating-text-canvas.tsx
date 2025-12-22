"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  opacity: number;
  size: number;
}

export const FloatingTextCanvas = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = [
      "+",
      "X",
      ".",
      "-",
      "=",
      "*",
      "/",
      "\\",
      "|",
      ":",
      ";",
      "^",
      "A",
      "#",
      "@",
      "!",
      "?",
      "<",
      ">",
      "[",
      "]",
      "{",
      "}",
      "(",
      ")",
      "0",
      "1",
      "Y",
      "V",
      "W",
      "M",
    ];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
      initParticles();
    };

    const initParticles = () => {
      const particleCount = Math.floor((canvas.width * canvas.height) / 2000);
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          char: chars[Math.floor(Math.random() * chars.length)],
          opacity: Math.random() * 0.3 + 0.1,
          size: Math.random() * 8 + 8,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particlesRef.current) {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < -20) particle.x = canvas.width + 20;
        if (particle.x > canvas.width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = canvas.height + 20;
        if (particle.y > canvas.height + 20) particle.y = -20;

        // Randomly change direction occasionally
        if (Math.random() < 0.005) {
          particle.vx = (Math.random() - 0.5) * 0.5;
          particle.vy = (Math.random() - 0.5) * 0.5;
        }

        // Randomly change character occasionally
        if (Math.random() < 0.002) {
          particle.char = chars[Math.floor(Math.random() * chars.length)];
        }

        // Draw character
        ctx.font = `${particle.size}px monospace`;
        ctx.fillStyle = `rgba(180, 180, 180, ${particle.opacity})`;
        ctx.fillText(particle.char, particle.x, particle.y);
      }

      animationIdRef.current = requestAnimationFrame(draw);
    };

    resizeCanvas();
    draw();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
};

export default FloatingTextCanvas;
