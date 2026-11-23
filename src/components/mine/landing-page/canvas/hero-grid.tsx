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

    // Target cell size; the real size is stretched so a whole number of
    // cells fills the section exactly (no half-cut row/column at the edges).
    const targetSize = 153.5;
    let width = 0;
    let height = 0;
    let gridWidth = 1;
    let gridHeight = 1;
    let cellW = targetSize;
    let cellH = targetSize;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gridWidth = Math.max(1, Math.round(width / targetSize));
      gridHeight = Math.max(1, Math.round(height / targetSize));
      cellW = width / gridWidth;
      cellH = height / gridHeight;
      glowingTilesRef.current = glowingTilesRef.current.filter(
        (t) => t.x < gridWidth && t.y < gridHeight
      );
    };

    const drawGrid = () => {
      const lineColor = "rgba(200, 200, 200, 0.1)";
      const starColor = "rgba(200, 200, 200, 0.25)";

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridWidth; i++) {
        const x = Math.round(i * cellW) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let j = 0; j <= gridHeight; j++) {
        const y = Math.round(j * cellH) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
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
        const step = Math.PI / points;

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

      for (let i = 0; i <= gridWidth; i++) {
        for (let j = 0; j <= gridHeight; j++) {
          drawStar(i * cellW, j * cellH, 8, 4);
        }
      }

      for (const tile of glowingTilesRef.current) {
        const opacity = tile.opacity;

        ctx.fillStyle = `rgba(0, 0, 0, ${0.02 * opacity})`;
        const tx = Math.round(tile.x * cellW) + 0.5;
        const ty = Math.round(tile.y * cellH) + 0.5;
        const tw = Math.round((tile.x + 1) * cellW) - Math.round(tile.x * cellW);
        const th = Math.round((tile.y + 1) * cellH) - Math.round(tile.y * cellH);
        ctx.fillRect(tx, ty, tw, th);

        ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 * opacity})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, tw, th);

        if (opacity > 0.5) {
          const centerX = tile.x * cellW + cellW / 2;
          const centerY = tile.y * cellH + cellH / 2;
          const logoSize = 10 * opacity;

          ctx.fillStyle = `#a3a3a3`;

          ctx.fillRect(
            centerX - logoSize / 2,
            centerY - logoSize,
            logoSize + 3,
            logoSize / 2
          );

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

          ctx.save();
          ctx.translate(centerX + logoSize / 2, centerY - logoSize / 2);
          ctx.fillRect(2, 0, logoSize / 2, logoSize);

          ctx.beginPath();
          ctx.moveTo(2, logoSize);
          ctx.lineTo(2 + logoSize / 2, logoSize + 1);
          ctx.lineTo(2, logoSize - 2 + logoSize / 2);
          ctx.closePath();
          ctx.fill();

          ctx.restore();

          ctx.fillRect(
            centerX - logoSize + 10,
            centerY + logoSize / 3,
            logoSize / 1.5,
            logoSize / 2
          );
        }
      }

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

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
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
