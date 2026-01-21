"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import MotionPathPlugin from "gsap/src/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

export default function MotionPathFixed() {
  const svgRef = useRef(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const c1 = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const path = containerRef.current?.querySelector("path");

      if (!path) return;
      const follower = gsap.utils.toArray<HTMLElement>(".div-image");

      follower.forEach((element, index) => {
        // Set initial opacity to 0
        gsap.set(element, { opacity: 0 });

        const tl = gsap.timeline({
          repeat: -1,
          delay: index * 2,
          repeatDelay: (follower.length - 1) * 2,
        });

        // First: Spawn (fade in)
        tl.to(element, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        });

        // Then: Move along path and fade out
        tl.to(
          element,
          {
            motionPath: {
              path,
              align: path,
              autoRotate: false,
              alignOrigin: [0, 0.4],
            },
            opacity: 0,
            duration: 4,
            ease: "none",
          },
          "-=0.2",
        ); // Slight overlap for smoother transition
      });
    },
    { scope: containerRef },
  );
  useGSAP(
    () => {
      gsap.to(".Laser", {
        y: 400,
        repeat: -1,
        duration: 1.5,
        ease: "power2.inOut",
        yoyo: true,
      });
    },
    { scope: c1 },
  );

  return (
    <div className="flex h-screen justify-center items-center">
      <div className=" absolute">
        <div ref={c1} className="">
          <svg ref={svgRef} width="300" height="672" viewBox="0 0 622 672">
            <rect
              y="0.5"
              width="111.664"
              height="309.808"
              rx="5.5"
              transform="matrix(0.866025 0.5 -0.866025 0.5 269.601 328.75)"
              fill="black"
              stroke="white"
            />
            <path
              d="M264.579 341.5C268.405 339.291 274.609 339.291 278.435 341.5L307.88 358.5C311.706 360.709 311.706 364.291 307.88 366.5L105.23 483.5C101.404 485.709 95.1999 485.709 91.3736 483.5L61.9287 466.5C58.1024 464.291 58.1024 460.709 61.9287 458.5L264.579 341.5Z"
              fill="black"
              stroke="white"
            />
            <rect
              width="34"
              height="18"
              transform="matrix(0.866025 0.5 0 1 61.9287 466.5)"
              fill="black"
              stroke="white"
            />
            <rect
              width="234"
              height="18"
              transform="matrix(0.866025 -0.5 0 1 105.229 483.5)"
              fill="black"
              stroke="white"
            />
            <path
              d="M59.0586 462.5C59.0586 464.062 60.1553 465.476 61.9283 466.5V484.5C60.1553 483.476 59.0586 482.062 59.0586 480.5V462.5Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M91.374 483.5C95.2004 485.709 101.404 485.709 105.23 483.5V501.5C101.404 503.709 95.2004 503.709 91.374 501.5V483.5Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M310.75 362.5C310.75 364.062 309.653 365.476 307.88 366.5V384.5C309.653 383.476 310.75 382.062 310.75 380.5V362.5Z"
              fill="black"
              stroke="white"
            />
            <rect
              x="0.433013"
              y="0.25"
              width="150.648"
              height="210.509"
              rx="5.5"
              transform="matrix(0.866025 -0.5 0 1 120.688 195.614)"
              fill="black"
              stroke="#3B3B3B"
            />
            <rect
              className=" animate-pulse"
              width="73.1635"
              height="19.9537"
              rx="4"
              transform="matrix(0.866025 -0.5 0 1 132.15 206.04)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="19.9537"
              height="19.9537"
              rx="4"
              transform="matrix(0.866025 -0.5 0 1 200.119 166.798)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 244.617)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 257.919)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 271.222)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 303.147)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 316.45)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 329.752)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 343.055)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="122.382"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 356.357)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="30.5956"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 369.66)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              width="73.1635"
              height="7.98147"
              rx="3.99073"
              transform="matrix(0.866025 -0.5 0 1 132.15 284.524)"
              fill="#D6D6D6"
            />
            <rect
              className=" animate-pulse"
              x="0.866025"
              width="62.8831"
              height="435.96"
              transform="matrix(0.866025 -0.5 0.866025 0.5 188.12 453.875)"
              fill="url(#paint0_linear_317_1839)"
              stroke="url(#paint1_linear_317_1839)"
            />
            <g className=" mask-r-from-0%">
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 198.727 459.634)"
                stroke="url(#paint2_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 207.918 464.942)"
                stroke="url(#paint3_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 217.111 470.249)"
                stroke="url(#paint4_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 226.307 475.555)"
                stroke="url(#paint5_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 235.498 480.863)"
                stroke="url(#paint6_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 244.688 486.17)"
                stroke="url(#paint7_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 253.879 491.477)"
                stroke="url(#paint8_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 263.074 496.785)"
                stroke="url(#paint9_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 272.264 502.092)"
                stroke="url(#paint10_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 281.458 507.399)"
                stroke="url(#paint11_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 290.649 512.706)"
                stroke="url(#paint12_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 299.843 518.014)"
                stroke="url(#paint13_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 309.034 523.32)"
                stroke="url(#paint14_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 318.226 528.628)"
                stroke="url(#paint15_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 327.419 533.935)"
                stroke="url(#paint16_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 336.614 539.243)"
                stroke="url(#paint17_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 345.802 544.55)"
                stroke="url(#paint18_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 354.997 549.856)"
                stroke="url(#paint19_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 364.187 555.164)"
                stroke="url(#paint20_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 373.38 560.47)"
                stroke="url(#paint21_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 382.573 565.778)"
                stroke="url(#paint22_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 391.767 571.085)"
                stroke="url(#paint23_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 400.958 576.393)"
                stroke="url(#paint24_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 410.152 581.7)"
                stroke="url(#paint25_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 419.344 587.007)"
                stroke="url(#paint26_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 428.537 592.314)"
                stroke="url(#paint27_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 437.727 597.622)"
                stroke="url(#paint28_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 446.92 602.929)"
                stroke="url(#paint29_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 456.113 608.236)"
                stroke="url(#paint30_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 465.305 613.543)"
                stroke="url(#paint31_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 474.499 618.85)"
                stroke="url(#paint32_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 483.691 624.157)"
                stroke="url(#paint33_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 492.883 629.465)"
                stroke="url(#paint34_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 502.074 634.771)"
                stroke="url(#paint35_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 511.266 640.078)"
                stroke="url(#paint36_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 520.46 645.386)"
                stroke="url(#paint37_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 529.651 650.693)"
                stroke="url(#paint38_linear_317_1839)"
              />
              <line
                y1="-0.5"
                x2="63.8831"
                y2="-0.5"
                transform="matrix(0.866025 -0.5 0.866025 0.5 538.845 656)"
                stroke="url(#paint39_linear_317_1839)"
              />
            </g>

            <rect
              width="17.5108"
              height="17.5108"
              transform="matrix(0.866025 0.5 -0.866025 0.5 274.13 0.5)"
              fill="#262626"
              stroke="white"
            />
            <rect
              width="17.5108"
              height="350.216"
              transform="matrix(0.866025 0.5 0 1 258.965 9.25537)"
              fill="#2E2E2E"
              stroke="white"
            />
            <rect
              width="17.5108"
              height="350.216"
              transform="matrix(0.866025 -0.5 0 1 274.13 18.0107)"
              fill="black"
              stroke="white"
            />
            <rect
              width="188.043"
              height="49.6402"
              transform="matrix(0.866025 -0.5 0 1 104.87 133.123)"
              fill="url(#paint40_linear_317_1839)"
              className="Laser"
            />
            <rect
              width="17.5108"
              height="17.5108"
              transform="matrix(0.866025 0.5 -0.866025 0.5 93.7686 103.813)"
              fill="#262626"
              stroke="white"
            />
            <rect
              width="17.5108"
              height="350.216"
              transform="matrix(0.866025 0.5 0 1 78.6035 112.569)"
              fill="#2E2E2E"
              stroke="white"
            />
            <rect
              width="17.5108"
              height="350.216"
              transform="matrix(0.866025 -0.5 0 1 93.7686 121.324)"
              fill="black"
              stroke="white"
            />

            {/* <g className="Walker">
            <path
              d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
              fill="black"
              stroke="white"
            />
            <rect
              width="28.2339"
              height="11.7641"
              transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
              fill="black"
              stroke="white"
            />
            <rect
              width="28.2339"
              height="11.7641"
              transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
              fill="black"
              stroke="white"
            />
            <rect
              width="28.2339"
              height="11.7641"
              transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
              fill="black"
              stroke="white"
            />
            <rect
              width="28.2339"
              height="11.7641"
              transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
              fill="black"
              stroke="white"
            />
            <path
              d="M4.77441 23.5283C4.77441 25.366 6.06455 27.0297 8.15043 28.234V39.9981C6.06455 38.7938 4.77441 37.1301 4.77441 35.2924V23.5283Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
              fill="black"
              stroke="white"
            />
            <g clipPath="url(#clip0_317_1772)">
              <path
                d="M57.0635 24.9582L33.2478 25.4165L33.6086 19.1665"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_317_1772">
                <rect
                  width="29"
                  height="31"
                  fill="white"
                  transform="matrix(0.866025 0.5 -0.866025 0.5 42.8467 9)"
                />
              </clipPath>
            </defs>
          </g> */}

            <g clipPath="url(#clip0_317_1839)">
              <path
                d="M86.501 131.624C88.572 132.82 90.251 131.851 90.251 129.459C90.251 127.068 88.572 124.16 86.501 122.964C84.4299 121.768 82.751 122.738 82.751 125.129C82.751 127.521 84.4299 130.429 86.501 131.624Z"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M85.001 126.428L88.001 128.16"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M86.501 125.562V129.026"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <g clipPath="url(#clip1_317_1839)">
              <path
                d="M86.501 460.624C88.572 461.82 90.251 460.851 90.251 458.459C90.251 456.068 88.572 453.16 86.501 451.964C84.4299 450.768 82.751 451.737 82.751 454.129C82.751 456.52 84.4299 459.428 86.501 460.624Z"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M85.001 455.428L88.001 457.16"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M86.501 454.562V458.026"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <circle
              cx="4"
              cy="4"
              r="4"
              transform="matrix(0.866025 -0.5 0 1 118.465 483.973)"
              fill="black"
              stroke="white"
            />
            <path
              d="M118.465 487.973C118.465 488.997 118.803 489.825 119.48 490.216L116.016 488.216C115.339 487.825 115.001 486.997 115.001 485.973L118.465 487.973Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M118.465 487.973C118.465 485.764 120.016 483.078 121.929 481.973L118.465 479.973C116.552 481.078 115.001 483.764 115.001 485.973L118.465 487.973Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M124.378 481.731C123.702 481.34 122.815 481.462 121.929 481.973L118.465 479.973C119.351 479.462 120.238 479.34 120.914 479.731L124.378 481.731Z"
              fill="black"
              stroke="white"
            />
            <circle
              cx="4"
              cy="4"
              r="4"
              transform="matrix(0.866025 -0.5 0 1 130.465 476.973)"
              fill="black"
              stroke="white"
            />
            <path
              d="M130.465 480.973C130.465 481.997 130.803 482.825 131.48 483.216L128.016 481.216C127.339 480.825 127.001 479.997 127.001 478.973L130.465 480.973Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M130.465 480.973C130.465 478.764 132.016 476.078 133.929 474.973L130.465 472.973C128.552 474.078 127.001 476.764 127.001 478.973L130.465 480.973Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M136.378 474.731C135.702 474.34 134.815 474.462 133.929 474.973L130.465 472.973C131.351 472.462 132.238 472.34 132.914 472.731L136.378 474.731Z"
              fill="black"
              stroke="white"
            />
            <circle
              cx="4"
              cy="4"
              r="4"
              transform="matrix(0.866025 -0.5 0 1 142.465 469.973)"
              fill="black"
              stroke="white"
            />
            <path
              d="M142.465 473.973C142.465 474.997 142.803 475.825 143.48 476.216L140.016 474.216C139.339 473.825 139.001 472.997 139.001 471.973L142.465 473.973Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M142.465 473.973C142.465 471.764 144.016 469.078 145.929 467.973L142.465 465.973C140.552 467.078 139.001 469.764 139.001 471.973L142.465 473.973Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M148.378 467.731C147.702 467.34 146.815 467.462 145.929 467.973L142.465 465.973C143.351 465.462 144.238 465.34 144.914 465.731L148.378 467.731Z"
              fill="black"
              stroke="white"
            />
            <rect
              width="66"
              height="6"
              rx="1"
              transform="matrix(0.866025 -0.5 0 1 248.465 409.118)"
              fill="black"
              stroke="white"
            />
            <rect
              width="4"
              height="4"
              transform="matrix(0.866025 0.5 0 1 245.001 408.118)"
              fill="black"
              stroke="white"
            />
            <rect
              width="64"
              height="4"
              transform="matrix(0.866025 -0.5 0.866025 0.5 245.867 406.618)"
              fill="black"
              stroke="white"
            />
            <path
              d="M248.465 414.118C248.465 414.374 248.55 414.581 248.719 414.679L245.255 412.679C245.086 412.581 245.001 412.374 245.001 412.118L248.465 414.118Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M248.465 410.118C248.465 409.566 248.853 408.894 249.331 408.618L245.867 406.618C245.389 406.894 245.001 407.566 245.001 408.118L248.465 410.118Z"
              fill="black"
              stroke="white"
            />
            <path
              d="M305.369 376.558C305.2 376.46 304.979 376.49 304.757 376.618L301.293 374.618C301.515 374.49 301.736 374.46 301.905 374.558L305.369 376.558Z"
              fill="black"
              stroke="white"
            />
            <defs>
              <linearGradient
                id="paint0_linear_317_1839"
                x1="31.9415"
                y1="-2.05298e-09"
                x2="32.177"
                y2="413.883"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0.235577" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_317_1839"
                x1="31.9415"
                y1="-2.2077e-08"
                x2="34.4588"
                y2="378.252"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" />
                <stop offset="1" stopColor="#999999" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint2_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint3_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint4_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint5_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint6_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint7_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint8_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint9_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint10_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint11_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint12_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint13_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint14_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint15_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint16_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint17_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint18_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint19_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint20_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint21_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint22_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint23_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint24_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint25_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint26_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint27_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint28_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint29_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint30_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint31_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint32_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint33_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint34_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint35_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint36_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint37_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint38_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint39_linear_317_1839"
                x1="31.9415"
                y1="0"
                x2="31.9415"
                y2="1"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.4" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint40_linear_317_1839"
                x1="95.0327"
                y1="-0.160732"
                x2="95.0093"
                y2="49.6407"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopOpacity="0" />
                <stop
                  offset="0.628377"
                  stopColor="#B80000"
                  stopOpacity="0.979792"
                />
                <stop offset="0.631664" stopColor="#BC0000" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
              <clipPath id="clip0_317_1839">
                <rect
                  width="10.3923"
                  height="10.3923"
                  fill="white"
                  transform="matrix(0.866025 0.5 0 1 82.001 119.5)"
                />
              </clipPath>
              <clipPath id="clip1_317_1839">
                <rect
                  width="10.3923"
                  height="10.3923"
                  fill="white"
                  transform="matrix(0.866025 0.5 0 1 82.001 448.5)"
                />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div
          ref={containerRef}
          className=" absolute w-[70px] h-[202px] bottom-[135px]  right-28"
        >
          {/* SVG PATH */}
          <svg
            width="150"
            height="202"
            viewBox="0 0 350 202"
            className=""
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="path"
              d="M 0 0 L 350 202"
              fill="none"
              stroke=""
              strokeOpacity="0.15"
            />
          </svg>

          <div className="div-image">
            <svg
              width="40"
              height="57"
              viewBox="0 0 82 57"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
                fill="black"
                stroke="white"
              />
              <path
                d="M4.77441 23.5283C4.77441 25.366 6.06455 27.0297 8.15043 28.234V39.9981C6.06455 38.7938 4.77441 37.1301 4.77441 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <g clip-path="url(#clip0_317_1772)">
                <path
                  d="M57.0635 24.9582L33.2478 25.4165L33.6086 19.1665"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_317_1772">
                  <rect
                    width="29"
                    height="31"
                    fill="white"
                    transform="matrix(0.866025 0.5 -0.866025 0.5 42.8467 9)"
                  />
                </clipPath>
              </defs>
            </svg>{" "}
          </div>
          <div className="div-image">
            <svg
              width="40"
              height="57"
              viewBox="0 0 82 57"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.15039 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.15039 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9023 42.3506)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9023 42.3506)"
                fill="black"
                stroke="white"
              />
              <path
                d="M4.77246 23.5283C4.77246 25.366 6.0626 27.0297 8.14848 28.234V39.9981C6.0626 38.7938 4.77246 37.1301 4.77246 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6025 42.3506C37.1039 44.9494 44.402 44.9494 48.9034 42.3506V54.1147C44.402 56.7136 37.1039 56.7136 32.6025 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6025 42.3506C37.1039 44.9494 44.402 44.9494 48.9034 42.3506V54.1147C44.402 56.7136 37.1039 56.7136 32.6025 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <g clip-path="url(#clip0_317_1767)">
                <path
                  d="M38.3952 31.1752C38.1507 32.7986 41.4516 35.2926 41.4516 35.2926C41.4516 35.2926 44.7526 32.7986 44.508 31.1752C44.3756 30.2634 43.0512 29.5105 41.4516 29.5164C40.6777 29.5268 39.9376 29.7019 39.3735 30.008C38.8094 30.3142 38.4611 30.7298 38.3952 31.1752Z"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M38.3943 31.1752C38.1497 32.7986 41.4507 35.2926 41.4507 35.2926C41.4507 35.2926 44.7516 32.7986 44.5071 31.1752C44.3746 30.2634 43.0502 29.5105 41.4507 29.5164C40.6767 29.5268 39.9366 29.7019 39.3726 30.008C38.8085 30.3142 38.4601 30.7298 38.3943 31.1752Z"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M44.5081 25.8812H38.3953C37.5309 24.7562 36.8653 23.5836 36.4086 22.3814C35.6977 20.6002 35.7879 18.7436 36.6706 16.9882C37.5533 15.2328 39.1992 13.637 41.4517 12.3525C44.2229 13.9524 48.2981 17.2228 46.5457 22.352C46.0726 23.5648 45.39 24.7471 44.5081 25.8812Z"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M44.5081 25.8812H38.3953C37.5309 24.7562 36.8653 23.5836 36.4086 22.3814C35.6977 20.6002 35.7879 18.7436 36.6706 16.9882C37.5533 15.2328 39.1992 13.637 41.4517 12.3525C44.2229 13.9524 48.2981 17.2228 46.5457 22.352C46.0726 23.5648 45.39 24.7471 44.5081 25.8812Z"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M38.3946 25.8811L33.3006 28.8222C33.3006 28.8222 30.7739 26.7164 31.263 25.2929C31.8131 23.7048 36.357 22.3519 36.357 22.3519"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M38.3946 25.8811L33.3006 28.8222C33.3006 28.8222 30.7739 26.7164 31.263 25.2929C31.8131 23.7048 36.357 22.3519 36.357 22.3519"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M44.5073 25.8815L49.6013 28.8225C49.6013 28.8225 52.128 26.7167 51.6389 25.2933C51.0888 23.7051 46.5449 22.3523 46.5449 22.3523"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M44.5073 25.8815L49.6013 28.8225C49.6013 28.8225 52.128 26.7167 51.6389 25.2933C51.0888 23.7051 46.5449 22.3523 46.5449 22.3523"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_317_1767">
                  <rect
                    width="28.2339"
                    height="28.2339"
                    fill="white"
                    transform="matrix(0.866025 -0.5 0.866025 0.5 17 24.1167)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="div-image">
            <svg
              width="40"
              height="57"
              viewBox="0 0 82 57"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.15039 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.15039 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9023 42.3506)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9023 42.3506)"
                fill="black"
                stroke="white"
              />
              <path
                d="M4.77246 23.5283C4.77246 25.366 6.0626 27.0297 8.14848 28.234V39.9981C6.0626 38.7938 4.77246 37.1301 4.77246 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6025 42.3506C37.1039 44.9494 44.402 44.9494 48.9034 42.3506V54.1147C44.402 56.7136 37.1039 56.7136 32.6025 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6025 42.3506C37.1039 44.9494 44.402 44.9494 48.9034 42.3506V54.1147C44.402 56.7136 37.1039 56.7136 32.6025 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <g clip-path="url(#clip0_317_1770)">
                <path
                  d="M23.923 20.1876C22.4396 21.044 21.5683 22.1836 21.5006 23.3557C21.4329 24.5278 22.1745 25.6364 23.5622 26.4376C24.9499 27.2388 26.87 27.6669 28.9001 27.6278C30.9302 27.5888 32.9041 27.0857 34.3875 26.2293C37.4749 24.4468 37.3645 21.4897 32.5111 21.2709C32.1322 18.4688 27.0104 18.4051 23.923 20.1876Z"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M34.3879 26.2291C32.9045 27.0855 32.0331 28.2251 31.9654 29.3972C31.8978 30.5693 32.6393 31.6779 34.027 32.4791C35.4147 33.2803 37.3348 33.7084 39.3649 33.6693C41.3951 33.6303 43.369 33.1272 44.8523 32.2708C47.9397 30.4883 47.8293 27.5312 42.9759 27.3124C42.5971 24.5103 37.4752 24.4466 34.3879 26.2291Z"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M32.5112 21.271C39.1359 21.337 46.7883 18.2118 51.1668 16.5418C50.2416 19.0818 46.2687 25.3389 42.9756 27.3127"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M53.8012 27.104C49.3119 24.5121 48.9359 21.2855 51.167 16.5415C57.1422 19.9913 56.4075 25.5992 53.8012 27.104Z"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_317_1770">
                  <rect
                    width="29"
                    height="31"
                    fill="white"
                    transform="matrix(0.866025 0.5 -0.866025 0.5 40.8467 8)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="div-image">
            <svg
              width="40"
              height="57"
              viewBox="0 0 82 57"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
                fill="black"
                stroke="white"
              />
              <path
                d="M4.77441 23.5283C4.77441 25.366 6.06455 27.0297 8.15043 28.234V39.9981C6.06455 38.7938 4.77441 37.1301 4.77441 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <g clip-path="url(#clip0_317_1771)">
                <path
                  d="M29.7943 30.4583C35.5737 33.7951 45.267 33.6085 51.4449 30.0417C57.6229 26.4748 57.946 20.8784 52.1666 17.5417C46.3873 14.2049 36.6939 14.3915 30.516 17.9583C24.338 21.5252 24.0149 27.1216 29.7943 30.4583Z"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M37.8409 22.1877L37.6966 24.6877L46.3568 24.521"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_317_1771">
                  <rect
                    width="29"
                    height="31"
                    fill="white"
                    transform="matrix(0.866025 0.5 -0.866025 0.5 41.8467 9)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="div-image">
            <svg
              width="40"
              height="57"
              viewBox="0 0 82 57"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M33.8238 4C37.6501 1.79086 43.8538 1.79086 47.6802 4L74.5759 19.5282C78.4022 21.7374 78.4022 25.3191 74.5759 27.5282L47.6801 43.0565C43.8538 45.2656 37.6501 45.2656 33.8237 43.0565L6.92805 27.5282C3.10171 25.3191 3.10172 21.7374 6.92806 19.5282L33.8238 4Z"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 0.5 0 1 8.14941 28.2339)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
                fill="black"
                stroke="white"
              />
              <rect
                width="28.2339"
                height="11.7641"
                transform="matrix(0.866025 -0.5 0 1 48.9014 42.3506)"
                fill="black"
                stroke="white"
              />
              <path
                d="M4.77441 23.5283C4.77441 25.366 6.06455 27.0297 8.15043 28.234V39.9981C6.06455 38.7938 4.77441 37.1301 4.77441 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M32.6016 42.3506C37.1029 44.9494 44.401 44.9494 48.9024 42.3506V54.1147C44.401 56.7136 37.1029 56.7136 32.6016 54.1147V42.3506Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <path
                d="M76.7295 23.5283C76.7295 25.366 75.4394 27.0297 73.3535 28.234V39.9981C75.4394 38.7938 76.7295 37.1301 76.7295 35.2924V23.5283Z"
                fill="black"
                stroke="white"
              />
              <g clip-path="url(#clip0_317_1771)">
                <path
                  d="M29.7943 30.4583C35.5737 33.7951 45.267 33.6085 51.4449 30.0417C57.6229 26.4748 57.946 20.8784 52.1666 17.5417C46.3873 14.2049 36.6939 14.3915 30.516 17.9583C24.338 21.5252 24.0149 27.1216 29.7943 30.4583Z"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M37.8409 22.1877L37.6966 24.6877L46.3568 24.521"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_317_1771">
                  <rect
                    width="29"
                    height="31"
                    fill="white"
                    transform="matrix(0.866025 0.5 -0.866025 0.5 41.8467 9)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
