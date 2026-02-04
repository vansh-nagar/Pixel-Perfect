"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";

gsap.registerPlugin(CustomEase, DrawSVGPlugin, Physics2DPlugin);

const ORANGE_CENTER = { x: 400, y: 300 };
const NUM_PARTICLES = 23;

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const GoeButton: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const fillLineRef = useRef<SVGLineElement>(null);
  const circleFillRef = useRef<SVGPathElement>(null);
  const pContainerRef = useRef<SVGGElement>(null);
  const coreRef = useRef<SVGPathElement>(null);
  const stalkRef = useRef<SVGPathElement>(null);
  const leafRef = useRef<SVGPathElement>(null);
  const wholeOrangeRef = useRef<SVGGElement>(null);
  const particlePool = useRef<SVGUseElement[]>([]);

  useEffect(() => {
    if (
      !svgRef.current ||
      !fillLineRef.current ||
      !circleFillRef.current ||
      !pContainerRef.current ||
      !wholeOrangeRef.current
    )
      return;

    // Custom ease for orange roll
    CustomEase.create(
      "returning",
      "M0,0 C0.076,0.736 0.326,0.855 0.53,0.736 0.73,0.618 1,0 1,0",
    );

    // Show SVG
    gsap.set(svgRef.current, { visibility: "visible" });
    gsap.set(circleFillRef.current, { x: 356, y: 350 });

    // Create particles
    if (particlePool.current.length === 0) {
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "use");
        p.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          "#particle",
        );
        p.setAttribute("class", "particle");
        pContainerRef.current.appendChild(p);
        gsap.set(p, { scale: randomBetween(1, 7), autoAlpha: 0 });
        particlePool.current.push(p);
      }
    }

    function playParticles(obj: { x: number; y: number }) {
      for (let i = 0; i < particlePool.current.length; i++) {
        const p = particlePool.current[i];
        gsap.set(p, { x: obj.x, y: obj.y, transformOrigin: "50% 50%" });
        const tl = gsap.timeline();
        tl.set(p, { autoAlpha: 1 }).to(p, randomBetween(1, 23) / 10, {
          physics2D: {
            velocity: randomBetween(240, 370),
            angle: randomBetween(-130, -45),
            gravity: randomBetween(550, 600),
          },
          scale: 0,
          onComplete: () => {
            gsap.set(p, { scale: randomBetween(1, 3), alpha: 0 });
          },
          alpha: 1,
        });
      }
    }

    // Main timeline
    const mainTl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    mainTl
      .from(fillLineRef.current, {
        duration: 1,
        drawSVG: "0% 0%",
        ease: "power4.in",
        onComplete: () => playParticles({ x: 400, y: 344 }),
      })
      .to(
        circleFillRef.current,
        {
          duration: 5,
          x: -220,
          y: 220,
        },
        "-=0.05",
      )
      .to(
        fillLineRef.current,
        {
          duration: 0.3,
          drawSVG: "100% 100%",
          ease: "sine.in",
          onComplete: () => playParticles({ x: 400, y: 255 }),
        },
        "-=2.46",
      )
      .from(
        coreRef.current,
        {
          duration: 0.4,
          scale: 0,
          transformOrigin: "50% 50%",
        },
        "-=2.2",
      )
      .from(
        stalkRef.current,
        {
          duration: 1,
          scale: 0,
          transformOrigin: "20% 100%",
          ease: "elastic.out(0.84, 0.37)",
        },
        "-=2.2",
      )
      .from(
        leafRef.current,
        {
          duration: 2,
          scale: 0,
          transformOrigin: "0% 0%",
          rotation: 23,
          ease: "elastic.out(1.4, 0.37)",
        },
        "-=1.89",
      )
      .to(
        wholeOrangeRef.current,
        {
          duration: 0.6,
          rotation: -9,
          transformOrigin: "50% 100%",
          immediateRender: false,
          ease: "returning",
        },
        "-=2.3",
      )
      .to(wholeOrangeRef.current, {
        duration: 1,
        scale: 1.061,
        transformOrigin: "50% 100%",
        ease: "expo.in",
        onComplete: () => playParticles({ x: 400, y: 300 }),
      })
      .set(wholeOrangeRef.current, { autoAlpha: 0 });
  }, []);

  return (
    <div
      style={{
        background: "#222",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        style={{ width: "100vw", height: "100vh", visibility: "hidden" }}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <radialGradient
            id="mainOrangeGrad"
            cx="405.3708"
            cy="278.2636"
            r="78.7824"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#EDB320" />
            <stop offset="0.9378" stopColor="#FB5605" />
          </radialGradient>
          <g id="mainOrange">
            <path
              className="orange"
              fill="url(#mainOrangeGrad)"
              d="M453.7,302c0,26.5-24.4,47.5-53.7,47.5s-51.7-21-51.7-47.5s22.4-49.4,51.7-49.4 S453.7,275.5,453.7,302z"
            />
            <path
              className="mainCore"
              fill="#098003"
              d="M412,268.7c-8-5.3-14.9,0-14.9,0s8.1-4.5,0-9.8c8,5.3,14.9,0,14.9,0S404,263.4,412,268.7z"
            />
            <path
              className="mainStalk"
              fill="#0A9403"
              d="M415.6,226.1c0.8,6.4-9.2,21.7-9.3,33c0,1.1,0.1,3.4-0.5,4.4c-0.8,1.4-2.4,0.4-3-1.5 c-2.3-7,6.3-37.1,10.9-38.2C414.3,223.7,415.3,224.3,415.6,226.1z"
            />
            <path
              className="mainLeaf"
              fill="#0A9403"
              d="M418.4,233.2c3-5.1,25.6,1.7,41.4,13.5c4,3,6.1,4.6,5.7,6c-1.3,4.5-28.4,6.4-41.9-8.9 C421.9,241.9,416.7,236,418.4,233.2z"
            />
          </g>
          <radialGradient
            id="orangeGrad"
            cx="405.3708"
            cy="278.2636"
            r="78.7824"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#EDB320" />
            <stop offset="0.9378" stopColor="#FB5605" />
          </radialGradient>
          <circle
            id="particle"
            className="mainColor"
            cx="0"
            cy="0"
            r="2"
            fill="#3D472E"
          />
          <clipPath id="circleMask">
            <path
              className="orange"
              id="orange"
              d="M453.7,302c0,26.5-24.4,47.5-53.7,47.5s-51.7-21-51.7-47.5s22.4-49.4,51.7-49.4S453.7,275.5,453.7,302z"
            />
          </clipPath>
        </defs>
        <line
          className="fillLine lineColor"
          x1="400"
          x2="400"
          y1="54"
          y2="345"
          strokeWidth={5}
          stroke="url(#orangeGrad)"
          strokeLinecap="round"
          ref={fillLineRef}
        />
        <g ref={pContainerRef} className="pContainer" />
        <g ref={wholeOrangeRef} className="wholeOrange">
          <mask id="orangeAnimMask">
            <g clipPath="url(#circleMask)" className="fullCircle">
              <path
                ref={circleFillRef}
                className="circleFill"
                fill="#FFF"
                d="M600,8.1c0,0-14.6-0.6-19.7-1.1c-5-0.5-10.2-1-20.3-1s-15.3,0.5-20.3,1 c-5.1,0.5-9.8,1-19.7,1c-9.8,0-14.6-0.5-19.7-1c-5-0.5-10.2-1-20.3-1c-10.2,0-15.4,0.8-20.5,1.5c-5,0.8-9.8,1.5-19.5,1.5 c-9.7,0-14.4-0.9-19.4-1.9C415.5,6,410.3,5,400,5c-10.4,0-15.7,1.3-20.8,2.6c-4.9,1.2-9.6,2.4-19.2,2.4c-9.5,0-14.2-1.4-19.1-2.9 C335.8,5.6,330.5,4,320,4c-10.5,0-15.9,1.9-21.1,3.7C294,9.4,289.4,11,280,11c-9.4,0-14-1.8-18.8-3.8C256,5.2,250.6,3,240,3 c-10.7,0-16.1,2.4-21.3,4.8C213.8,10,209.3,12,200,12c-9.2,0-13.8-2.3-18.6-4.7C176.2,4.7,170.7,2,160,2c-10.9,0-16.6,3.4-21.7,6.5 c-4.7,2.8-9.2,5.5-18.3,5.5c-9,0-13.2-3-18.2-6.4C96.8,4,91,0,80,0C69,0,63.2,4,58.2,7.6C53.2,11,49,14,40,14s-13.2-3-18.2-6.4 C16.8,4,11,0,0,0v200h600h200V8.1H600z"
              />
            </g>
          </mask>
          <g mask="url(#orangeAnimMask)" className="hideOrange">
            <use xlinkHref="#orange" fill="url(#orangeGrad)" />
          </g>
          <path
            ref={coreRef}
            className="core hideOrange"
            fill="#098003"
            d="M412,268.7c-8-5.3-14.9,0-14.9,0s8.1-4.5,0-9.8c8,5.3,14.9,0,14.9,0S404,263.4,412,268.7z"
          />
          <path
            ref={stalkRef}
            className="stalk hideOrange"
            fill="#0A9403"
            d="M415.6,226.1c0.8,6.4-9.2,21.7-9.3,33c0,1.1,0.1,3.4-0.5,4.4c-0.8,1.4-2.4,0.4-3-1.5 c-2.3-7,6.3-37.1,10.9-38.2C414.3,223.7,415.3,224.3,415.6,226.1z"
          />
          <path
            ref={leafRef}
            className="leaf hideOrange"
            fill="#0A9403"
            d="M418.4,233.2c3-5.1,25.6,1.7,41.4,13.5c4,3,6.1,4.6,5.7,6c-1.3,4.5-28.4,6.4-41.9-8.9 C421.9,241.9,416.7,236,418.4,233.2z"
          />
        </g>
      </svg>
      <style>{`
        .mainColor { fill: #FE6A00; }
        .lineColor { stroke: #FE6A00; }
        .particle { pointer-events: none; }
      `}</style>
    </div>
  );
};

export default GoeButton;
