"use client";
import { Button } from "@/components/ui/button";

const ShinyButton = () => {
  return (
    <div className="overflow-hidden rounded-md">
      <style>{`

        .shiny-wrapper {
          position: relative;
          display: inline-block;
          overflow: hidden;
        }

        .shiny-wrapper .shiny-mask {
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.6);
          transform: translateX(-100%) rotate(45deg);
          pointer-events: none;
          z-index: 10;
        }

        .shiny-wrapper:hover .shiny-mask {
          animation: shiny-mask 0.4s ease-out;
        }

        @keyframes shiny-mask {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) rotate(45deg);
          }
        }
      `}</style>

      <div className="shiny-wrapper">
        <Button className="relative z-0 ">Hover Me</Button>
        <span className="shiny-mask"></span>
      </div>
    </div>
  );
};

export default ShinyButton;
