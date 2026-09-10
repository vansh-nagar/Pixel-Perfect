"use client";

import Image from "next/image";
import { CodeXml } from "lucide-react";
import { type CSSProperties, useId, useRef, useState } from "react";
import styles from "./design-engineer-card.module.css";

const assets = "/playground/design-engineer";

// Stable variation keeps hydration deterministic and the fall loosely scattered.
const particles = Array.from({ length: 32 }, (_, index) => ({
  left: `${(index * 37.7 + 3) % 100}%`,
  "--size": `${14 + (index % 4) * 4}px`,
  "--duration": `${12 + (index % 7)}s`,
  "--delay": `${-((index * 2.3) % (12 + (index % 7)))}s`,
  "--drift": `${((index * 29) % 150) - 75}px`,
  "--spin": `${index % 2 ? -360 : 360}deg`,
  color: ["#c4f0d3", "#fffef9", "#a9baff"][index % 3],
}) as CSSProperties);

function FallingParticles() {
  return (
    <div className={styles.particles} aria-hidden="true">
      {particles.map((style, index) => (
        <span key={index} className={styles.particle} style={style}>
          <svg viewBox="0 0 24 24" fill="none">
            <g stroke="#172147" strokeWidth="1.8" strokeLinejoin="round">
              {index % 4 === 0 && <ellipse cx="12" cy="12" rx="7" ry="5" fill="currentColor" />}
              {index % 4 === 1 && <rect x="8" y="3" width="7" height="18" rx="1.5" fill="currentColor" />}
              {index % 4 === 2 && <path d="m12 3 8 9-8 9-8-9Z" fill="currentColor" />}
              {index % 4 === 3 && <path d="M4 6c9-7 0 19 16 11l-3-5c-7 5 1-16-13-11Z" fill="currentColor" />}
            </g>
          </svg>
        </span>
      ))}
    </div>
  );
}

export function DesignEngineerCard({ recordingExpanded }: { recordingExpanded?: boolean } = {}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const card = useRef<HTMLButtonElement>(null);
  const silhouetteId = useId().replace(/:/g, "");
  const expanded = recordingExpanded ?? (hovered || focused || pinned);

  return (
    <section className={styles.scene} data-expanded={expanded} aria-label="Personal design engineer card">
      <FallingParticles />
      <div className={styles.stage}>
        <button
          ref={card}
          type="button"
          className={styles.card}
          aria-label="Reveal my design engineer illustration"
          aria-pressed={expanded}
          onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }}
          onPointerLeave={() => setHovered(false)}
          onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) setFocused(true); }}
          onBlur={() => { setFocused(false); setPinned(false); }}
          onClick={() => setPinned(!pinned)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setHovered(false);
              setFocused(false);
              setPinned(false);
              card.current?.blur();
            }
          }}
        >
          <span className={styles.media}>
            <span className={styles.photoFrame}>
              <Image src={`${assets}/photo-enhanced.png`} alt="Vansh, by a rooftop pool at night" fill priority unoptimized className={styles.photo} />
            </span>

            <span className={`${styles.prop} ${styles.browserWindow}`} aria-hidden="true">
              <span className={styles.windowBar}><i /><i /><i /></span>
              <span className={styles.windowBody}><i /><i /><i /><b /></span>
            </span>

            <span className={`${styles.prop} ${styles.curve}`} aria-hidden="true">
              <svg viewBox="0 0 160 100" fill="none"><path d="M14 82C53 82 65 18 145 18" stroke="currentColor" strokeWidth="3"/><path d="M14 82V18H145" stroke="currentColor" strokeOpacity=".35" strokeDasharray="4 4"/><rect x="9" y="77" width="10" height="10" fill="#bff0d3" stroke="#15204b" strokeWidth="2"/><rect x="140" y="13" width="10" height="10" fill="#bff0d3" stroke="#15204b" strokeWidth="2"/><circle cx="14" cy="18" r="4" fill="#fffdf7"/></svg>
            </span>

            <svg width="0" height="0" aria-hidden="true" className={styles.maskDefinitions}>
              <defs>
                <clipPath id={silhouetteId} clipPathUnits="objectBoundingBox">
                  <path d="M.377 .091 C.365 .057 .411 .035 .444 .033 C.465 .007 .504 .015 .526 .023 C.556 .006 .598 .015 .622 .029 C.652 .036 .678 .052 .681 .077 C.706 .103 .683 .139 .675 .161 L.658 .232 C.651 .257 .634 .28 .624 .29 L.626 .322 C.72 .342 .796 .363 .836 .407 C.888 .439 .91 .477 .926 .526 L.966 .624 C.98 .647 .961 .667 .944 .674 L.778 .702 L.77 .868 L.775 .99 L.199 .99 C.181 .922 .18 .878 .15 .828 C.112 .766 .09 .718 .086 .666 L.05 .652 C.041 .648 .045 .635 .05 .62 L.105 .49 C.128 .426 .191 .383 .252 .362 L.354 .327 L.366 .27 C.351 .241 .353 .207 .357 .18 C.35 .155 .359 .117 .377 .091 Z" />
                </clipPath>
              </defs>
            </svg>
            <span className={styles.portraitBounds} aria-hidden="true">
              <span className={styles.portrait} style={{ clipPath: `url(#${silhouetteId})` }}>
                <Image src={`${assets}/portrait.png`} alt="" fill sizes="(max-width: 600px) 90vw, 460px" />
              </span>
            </span>
            <span className={`${styles.prop} ${styles.laptop}`} aria-hidden="true">
              <Image src={`${assets}/laptop.png`} alt="" fill sizes="220px" />
            </span>
            <span className={`${styles.prop} ${styles.pen}`} aria-hidden="true">
              <Image src={`${assets}/vector-pen.png`} alt="" fill sizes="160px" />
            </span>

            <span className={`${styles.prop} ${styles.cursor}`} aria-hidden="true">
              <svg viewBox="0 0 72 88" fill="none"><path d="M8 5L61 47L38 52L29 76L8 5Z" fill="#bff0d3" stroke="#15204b" strokeWidth="4" strokeLinejoin="round"/></svg>
            </span>
            <span className={`${styles.prop} ${styles.codeToken}`} aria-hidden="true"><CodeXml size={32} strokeWidth={2} /></span>
            <span className={`${styles.prop} ${styles.swatches}`} aria-hidden="true"><i /><i /><i /></span>
          </span>

          <span className={styles.details}>
            <span className={styles.title}>design engineer<span>.</span></span>
          </span>
        </button>
      </div>

    </section>
  );
}
