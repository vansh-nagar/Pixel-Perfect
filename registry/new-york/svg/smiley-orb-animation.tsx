"use client";

import { motion } from "motion/react";

export function SmileyOrbAnimation() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 900 720"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.g
        style={{ transformOrigin: "113px 113px" }}
        initial={{ x: 533.374, y: 247.09 }}
        animate={{ x: [533.374, 610.849, 104.622], y: [247.09, 227.49, 150.567] }}
        transition={{
          x: {
            duration: 5,
            times: [0, 0.2041, 0.5013],
            ease: [
              [0.42, 0, 0.58, 1],
              [0.42, 0, 0.58, 1],
            ],
            repeat: Infinity,
            repeatType: "loop",
          },
          y: {
            duration: 5,
            times: [0, 0.2041, 0.5013],
            ease: [
              [0.42, 0, 0.58, 1],
              [0.42, 0, 0.58, 1],
            ],
            repeat: Infinity,
            repeatType: "loop",
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
          <g fill="none">
            <motion.g
              initial={{ rotate: -0.367 }}
              animate={{ rotate: [-0.367, -161.469, -440.54] }}
              transition={{
                rotate: {
                  duration: 5,
                  times: [0, 0.2032, 0.5011],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
              }}
              xmlns="http://www.w3.org/2000/svg"
              filter="url(#filter0_i_971_7993)"
              style={{ transformOrigin: "113px 113px" }}
            >
              <path
                d="M91.4595 26.5015C102.568 12.8345 123.432 12.8345 134.54 26.5015C140.447 33.7678 149.618 37.5668 158.932 36.6049C176.451 34.7958 191.204 49.5488 189.395 67.0678C188.433 76.382 192.232 85.5535 199.498 91.4595C213.165 102.568 213.165 123.432 199.498 134.54C192.232 140.447 188.433 149.618 189.395 158.932C191.204 176.451 176.451 191.204 158.932 189.395C149.618 188.433 140.447 192.232 134.54 199.498C123.432 213.165 102.568 213.165 91.4595 199.498C85.5535 192.232 76.382 188.433 67.0678 189.395C49.5488 191.204 34.7958 176.451 36.6049 158.932C37.5668 149.618 33.7678 140.447 26.5015 134.54C12.8345 123.432 12.8345 102.568 26.5015 91.4595C33.7678 85.5535 37.5668 76.382 36.6049 67.0678C34.7958 49.5488 49.5488 34.7958 67.0678 36.6049C76.382 37.5668 85.5535 33.7678 91.4595 26.5015Z"
                fill="#50B9FF"
              />
              <motion.path
                initial={{ x: -0.067, y: 0.065 }}
                animate={{ x: -0.067, y: 0.065 }}
                d="M91.4595 26.5015C102.568 12.8345 123.432 12.8345 134.54 26.5015C140.447 33.7678 149.618 37.5668 158.932 36.6049C176.451 34.7958 191.204 49.5488 189.395 67.0678C188.433 76.382 192.232 85.5535 199.498 91.4595C213.165 102.568 213.165 123.432 199.498 134.54C192.232 140.447 188.433 149.618 189.395 158.932C191.204 176.451 176.451 191.204 158.932 189.395C149.618 188.433 140.447 192.232 134.54 199.498C123.432 213.165 102.568 213.165 91.4595 199.498C85.5535 192.232 76.382 188.433 67.0678 189.395C49.5488 191.204 34.7958 176.451 36.6049 158.932C37.5668 149.618 33.7678 140.447 26.5015 134.54C12.8345 123.432 12.8345 102.568 26.5015 91.4595C33.7678 85.5535 37.5668 76.382 36.6049 67.0678C34.7958 49.5488 49.5488 34.7958 67.0678 36.6049C76.382 37.5668 85.5535 33.7678 91.4595 26.5015Z"
                fill="url(#paint0_radial_971_7993)"
                style={{ transformOrigin: "113px 113px" }}
              />
            </motion.g>
            <motion.circle
              initial={{ x: 0.593, y: -0.74 }}
              animate={{ x: [0.593, 46.575, -19.023], y: [-0.74, -6.284, -24.451] }}
              transition={{
                x: {
                  duration: 5,
                  times: [0, 0.2045, 0.5013],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
                y: {
                  duration: 5,
                  times: [0, 0.2045, 0.5013],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
              }}
              xmlns="http://www.w3.org/2000/svg"
              cx="80.5"
              cy="112.5"
              r="7.5"
              fill="#00558E"
              style={{ transformOrigin: "80.5px 112.5px" }}
            />
            <motion.circle
              initial={{ x: -0.002, y: 0.043 }}
              animate={{ x: [-0.002, 39.321, -26.85], y: [0.043, -9.168, -21.934] }}
              transition={{
                x: {
                  duration: 5,
                  times: [0, 0.2045, 0.5013],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
                y: {
                  duration: 5,
                  times: [0, 0.2045, 0.5013],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
              }}
              xmlns="http://www.w3.org/2000/svg"
              cx="130.5"
              cy="112.5"
              r="7.5"
              fill="#00558E"
              style={{ transformOrigin: "130.5px 112.5px" }}
            />
            <motion.path
              initial={{ x: 0.094, y: -0.11, rotate: 3.657 }}
              animate={{
                x: [0.094, 44.641, -23.788],
                y: [-0.11, -5.205, -21.012],
                rotate: 3.657,
              }}
              transition={{
                x: {
                  duration: 5,
                  times: [0, 0.2045, 0.5013],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
                y: {
                  duration: 5,
                  times: [0, 0.2045, 0.5013],
                  ease: [
                    [0.42, 0, 0.58, 1],
                    [0.42, 0, 0.58, 1],
                  ],
                  repeat: Infinity,
                  repeatType: "loop",
                },
              }}
              xmlns="http://www.w3.org/2000/svg"
              d="M90 127C97.2727 139 112.727 139 120 127"
              stroke="#057BC9"
              strokeWidth="8"
              strokeLinecap="round"
              style={{ transformOrigin: "105px 131.5px" }}
            />
            <defs xmlns="http://www.w3.org/2000/svg">
              <filter
                id="filter0_i_971_7993"
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
                  result="effect1_innerShadow_971_7993"
                />
              </filter>
              <radialGradient
                id="paint0_radial_971_7993"
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

export default SmileyOrbAnimation;
