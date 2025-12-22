"use client";

import { useEffect, useRef } from "react";

export function ComponentGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 153.5;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    const drawGrid = () => {
      const lineColor = "rgba(100, 100, 100, 0.4)";
      const starColor = "rgba(100, 100, 100, 0.5)";

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;

      // Draw vertical lines for single row
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw top and bottom horizontal borders only
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 1);
      ctx.lineTo(canvas.width, canvas.height - 1);
      ctx.stroke();

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

      // Draw stars only at top and bottom intersections
      for (let x = 0; x <= canvas.width; x += gridSize) {
        drawStar(x, 0, 8, 4);
        drawStar(x, canvas.height, 8, 4);
      }
    };

    resizeCanvas();
    drawGrid();

    const handleResize = () => {
      resizeCanvas();
      drawGrid();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full max-h-full overflow-hidden dark:invert"
    />
  );
}
