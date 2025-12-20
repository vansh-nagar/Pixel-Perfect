"use client";
import React, { useState } from "react";

const ThreedButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex items-center justify-cente">
      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Rubik:700&display=swap');
        
        .btn-3d {
          position: relative;
          display: inline-block;
          cursor: pointer;
          outline: none;
          border: 2px solid #d97706;
          vertical-align: middle;
          font-size: 1rem;
          font-weight: 600;
          color: #78350f;
          text-transform: uppercase;
          padding: 0.6em 1.2em;
          border-radius: 0.75em;
          transform-style: preserve-3d;
          transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), background 150ms cubic-bezier(0, 0, 0.58, 1);
          background: ${
            isPressed ? "#fde047" : isHovered ? "#fde047" : "#fef3c7"
          };
          transform: ${
            isPressed
              ? "translate(0em, 0.75em)"
              : isHovered
              ? "translate(0, 0.25em)"
              : "translate(0, 0)"
          };
        }
        
        .btn-3d::before {
          position: absolute;
          content: '';
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f59e0b;
          border-radius: 0.75em;
          box-shadow: ${
            isPressed
              ? "0 0 0 2px #d97706, 0 0 #fbbf24"
              : isHovered
              ? "0 0 0 2px #d97706, 0 0.5em 0 0 #fbbf24"
              : "0 0 0 2px #d97706, 0 0.625em 0 0 #fbbf24"
          };
          transform: ${
            isPressed
              ? "translate3d(0, 0, -1em)"
              : isHovered
              ? "translate3d(0, 0.5em, -1em)"
              : "translate3d(0, 0.75em, -1em)"
          };
          transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
          pointer-events: none;
        }
      `}</style>

      <button
        className="btn-3d relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
      >
        <span className="relative z-10">Hover Me</span>
      </button>
    </div>
  );
};

export default ThreedButton;
