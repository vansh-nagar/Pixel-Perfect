"use client";

import { useEffect, useRef } from "react";

interface GlowingTile {
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
}

export function HeroGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowingTilesRef = useRef<GlowingTile[]>([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 153.5;
    let gridWidth = 0;
    let gridHeight = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gridWidth = Math.ceil(canvas.width / gridSize);
      gridHeight = Math.ceil(canvas.height / gridSize);
    };

    const drawGrid = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const lineColor = "rgba(200, 200, 200, 0.1)";
      const starColor = "rgba(200, 200, 200, 0.25)";

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = starColor;

      const drawStar = (
        cx: number,
        cy: number,
        outerRadius: number,
        innerRadius: number
      ) => {
        const points = 4;
        let rot = (Math.PI / 2) * 3;
        let step = Math.PI / points;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < points * 2; i++) {
          const x =
            cx + Math.cos(rot) * (i % 2 === 0 ? outerRadius : innerRadius);
          const y =
            cy + Math.sin(rot) * (i % 2 === 0 ? outerRadius : innerRadius);
          ctx.lineTo(x, y);
          rot += step;
        }

        ctx.closePath();
        ctx.fill();
      };

      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          drawStar(x, y, 8, 4);
        }
      }

      for (const tile of glowingTilesRef.current) {
        const opacity = tile.opacity;

        ctx.shadowColor = `rgba(0, 0, 0, ${0.3 * opacity})`;
        ctx.shadowBlur = 30 * opacity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = `rgba(0, 0, 0, ${0.02 * opacity})`;
        ctx.fillRect(tile.x * gridSize, tile.y * gridSize, gridSize, gridSize);

        ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 * opacity})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          tile.x * gridSize,
          tile.y * gridSize,
          gridSize,
          gridSize
        );

        if (opacity > 0.5) {
          const centerX = tile.x * gridSize + gridSize / 2;
          const centerY = tile.y * gridSize + gridSize / 2;
          const logoSize = 10 * opacity;

          ctx.fillStyle = `#a3a3a3`;

          ctx.fillRect(
            centerX - logoSize / 2,
            centerY - logoSize,
            logoSize + 3,
            logoSize / 2
          );

          // Left bbbloockk
          ctx.fillRect(
            centerX - logoSize,
            centerY - logoSize / 2,
            logoSize / 2,
            logoSize + 8
          );

          ctx.fillRect(
            centerX - logoSize / 2 - 2,
            centerY + 8,
            logoSize - 1,
            logoSize / 2
          );

          // Right bbbloockk
          ctx.save();
          ctx.translate(centerX + logoSize / 2, centerY - logoSize / 2);
          ctx.fillRect(2, 0, logoSize / 2, logoSize);

          // Right-angle triangleeeeeeeeeeee
          ctx.beginPath();
          ctx.moveTo(2, logoSize); // bottom-left corner
          ctx.lineTo(2 + logoSize / 2, logoSize + 1); // bottom-right
          ctx.lineTo(2, logoSize - 2 + logoSize / 2); // vertical down
          ctx.closePath();
          ctx.fill();

          ctx.restore();

          // Bottom bbbloockk
          ctx.fillRect(
            centerX - logoSize + 10,
            centerY + logoSize / 3,
            logoSize / 1.5,
            logoSize / 2
          );
        }
      }

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    };

    const animate = () => {
      drawGrid();

      glowingTilesRef.current = glowingTilesRef.current.map((tile) => {
        tile.opacity += (tile.targetOpacity - tile.opacity) * 0.1;
        return tile;
      });

      glowingTilesRef.current = glowingTilesRef.current.filter(
        (tile) => tile.opacity > 0.01
      );

      if (Math.random() < 0.03 && glowingTilesRef.current.length < 5) {
        const x = Math.floor(Math.random() * gridWidth);
        const y = Math.floor(Math.random() * gridHeight);
        glowingTilesRef.current.push({
          x,
          y,
          opacity: 0,
          targetOpacity: 1,
        });

        setTimeout(() => {
          const tile = glowingTilesRef.current.find(
            (t) => t.x === x && t.y === y
          );
          if (tile) {
            tile.targetOpacity = 0;
          }
        }, 2000);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full dark:invert "
    />
  );
}
