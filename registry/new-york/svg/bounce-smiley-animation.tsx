"use client";

import { motion } from "motion/react";

export function BounceSmileyAnimation() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 280 613"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.g
        style={{ transformBox: "view-box", transformOrigin: "113px 113px" }}
        initial={{ x: 20.182, y: 671.07 }}
        animate={{ x: [20.182, 24.661], y: [671.07, 109.888] }}
        transition={{
          x: {
            type: "spring",
            stiffness: 16.5234375,
            damping: 4.1015625,
            mass: 1,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1.567,
          },
          y: {
            type: "spring",
            stiffness: 16.5234375,
            damping: 4.1015625,
            mass: 1,
            repeat: Infinity,
            repeatType: "loop",
            repeatDelay: 1.65,
          },
        }}
      >
        <svg
          x={0}
          y={0}
          width={226}
          height={226}
          viewBox="0 0 226 226"
          overflow="visible"
        >
          <g xmlns="http://www.w3.org/2000/svg" fill="none">
            <motion.g
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 226.382, 84.284, 100.226] }}
              transition={{
                rotate: {
                  duration: 5,
                  times: [0, 0.5915, 0.902, 1],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
              }}
              xmlns="http://www.w3.org/2000/svg"
              filter="url(#filter0_i_bounce_smiley)"
              style={{ transformBox: "view-box", transformOrigin: "113px 113px" }}
            >
              <path
                d="M91.4595 26.5015C102.568 12.8345 123.432 12.8345 134.54 26.5015C140.447 33.7678 149.618 37.5668 158.932 36.6049C176.451 34.7958 191.204 49.5488 189.395 67.0678C188.433 76.382 192.232 85.5535 199.498 91.4595C213.165 102.568 213.165 123.432 199.498 134.54C192.232 140.447 188.433 149.618 189.395 158.932C191.204 176.451 176.451 191.204 158.932 189.395C149.618 188.433 140.447 192.232 134.54 199.498C123.432 213.165 102.568 213.165 91.4595 199.498C85.5535 192.232 76.382 188.433 67.0678 189.395C49.5488 191.204 34.7958 176.451 36.6049 158.932C37.5668 149.618 33.7678 140.447 26.5015 134.54C12.8345 123.432 12.8345 102.568 26.5015 91.4595C33.7678 85.5535 37.5668 76.382 36.6049 67.0678C34.7958 49.5488 49.5488 34.7958 67.0678 36.6049C76.382 37.5668 85.5535 33.7678 91.4595 26.5015Z"
                fill="#50B9FF"
              />
              <path
                d="M91.4595 26.5015C102.568 12.8345 123.432 12.8345 134.54 26.5015C140.447 33.7678 149.618 37.5668 158.932 36.6049C176.451 34.7958 191.204 49.5488 189.395 67.0678C188.433 76.382 192.232 85.5535 199.498 91.4595C213.165 102.568 213.165 123.432 199.498 134.54C192.232 140.447 188.433 149.618 189.395 158.932C191.204 176.451 176.451 191.204 158.932 189.395C149.618 188.433 140.447 192.232 134.54 199.498C123.432 213.165 102.568 213.165 91.4595 199.498C85.5535 192.232 76.382 188.433 67.0678 189.395C49.5488 191.204 34.7958 176.451 36.6049 158.932C37.5668 149.618 33.7678 140.447 26.5015 134.54C12.8345 123.432 12.8345 102.568 26.5015 91.4595C33.7678 85.5535 37.5668 76.382 36.6049 67.0678C34.7958 49.5488 49.5488 34.7958 67.0678 36.6049C76.382 37.5668 85.5535 33.7678 91.4595 26.5015Z"
                fill="url(#paint0_radial_bounce_smiley)"
              />
            </motion.g>
            <circle
              xmlns="http://www.w3.org/2000/svg"
              cx="80.5"
              cy="112.5"
              r="7.5"
              fill="#00558E"
            />
            <motion.path
              initial={{
                d: "M 123 112.5 C 123 116.642 126.358 120 130.5 120 C 134.642 120 138 116.642 138 112.5 C 138 108.358 134.589 104.915 130.447 104.915 C 126.305 104.915 123 108.358 123 112.5 Z",
              }}
              animate={{
                d: [
                  "M 123 112.5 C 123 116.642 126.358 120 130.5 120 C 134.642 120 138 116.642 138 112.5 C 138 108.358 134.589 104.915 130.447 104.915 C 126.305 104.915 123 108.358 123 112.5 Z",
                  "M 123 112.5 C 123 116.642 126.358 120 130.5 120 C 134.642 120 138 116.642 138 112.5 C 138 108.358 134.85 117.69 130.708 117.69 C 126.565 117.69 123 108.358 123 112.5 Z",
                  "M 123 112.5 C 123 116.642 126.358 120 130.5 120 C 134.642 120 138 116.642 138 112.5 C 138 108.358 134.669 104.836 130.527 104.836 C 126.385 104.836 123 108.358 123 112.5 Z",
                ],
              }}
              transition={{
                d: {
                  duration: 5,
                  times: [0.5308, 0.5915, 0.6484],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
              }}
              xmlns="http://www.w3.org/2000/svg"
              fill="#00558E"
              style={{ transformBox: "view-box", transformOrigin: "130.5px 112.5px" }}
            />
            <path
              xmlns="http://www.w3.org/2000/svg"
              d="M90 127C97.2727 139 112.727 139 120 127"
              stroke="#057BC9"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <defs xmlns="http://www.w3.org/2000/svg">
              <filter
                id="filter0_i_bounce_smiley"
                x="16.251"
                y="16.2512"
                width="193.498"
                height="193.498"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset />
                <feGaussianBlur stdDeviation="15.65" />
                <feComposite
                  in2="hardAlpha"
                  operator="arithmetic"
                  k2="-1"
                  k3="1"
                />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"
                />
                <feBlend
                  mode="normal"
                  in2="shape"
                  result="effect1_innerShadow_bounce_smiley"
                />
              </filter>
              <radialGradient
                id="paint0_radial_bounce_smiley"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(113 113) rotate(90) scale(227)"
              >
                <stop stopColor="#28A9FF" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>
          </g>
        </svg>
      </motion.g>
    </svg>
  );
}

export default BounceSmileyAnimation;
