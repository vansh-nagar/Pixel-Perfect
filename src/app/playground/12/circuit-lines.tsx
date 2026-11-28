/**
 * Faint blueprint lines behind the laptop with one pulse of light that tells a story, on a
 * loop: it drops in from the top of the screen, pings the node on the frame, splits both ways
 * around the frame, meets itself at a bottom node, then leaves along the side rails.
 *
 * Every beam is its line stroked again with a single short dash (pathLength = 1). Moving the
 * dash offset from +len (dash parked before the start) to -1 (parked past the end) slides it
 * along the whole line at a constant speed; each beam's keyframes only move during its slot
 * in the shared cycle, so the hand-offs line up. Pure SVG + CSS.
 */

const W = 1200;
const H = 800;
const CX = W / 2;
const T = 6; // seconds per cycle

// Outer frame geometry.
const X0 = 90;
const X1 = 1110;
const Y0 = 90; // top edge, where the drop lands
const Y1 = 730; // bottom edge, where the two halves meet
const R = 44;
const INNER = `M200 150H1000A30 30 0 0 1 1030 180V640A30 30 0 0 1 1000 670H200A30 30 0 0 1 170 640V180A30 30 0 0 1 200 150Z`;

// The frame split at the top node into two equal halves that both end at the bottom node.
const HALF_L = `M${CX} ${Y0}H${X0 + R}A${R} ${R} 0 0 0 ${X0} ${Y0 + R}V${Y1 - R}A${R} ${R} 0 0 0 ${X0 + R} ${Y1}H${CX}`;
const HALF_R = `M${CX} ${Y0}H${X1 - R}A${R} ${R} 0 0 1 ${X1} ${Y0 + R}V${Y1 - R}A${R} ${R} 0 0 1 ${X1 - R} ${Y1}H${CX}`;
const MID = (Y0 + Y1) / 2;
// The drop and rails run far past the plate so they leave the screen instead of ending mid-air.
const DROP = `M${CX} -800V${Y0}`;
const RAIL_L = `M${X0} ${MID}H-1600`;
const RAIL_R = `M${X1} ${MID}H${W + 1600}`;

const LINES = [HALF_L, HALF_R, INNER, DROP, RAIL_L, RAIL_R];

const BEAMS = [
  [DROP, 0.06, "cl-drop"],
  [HALF_L, 0.12, "cl-half"],
  [HALF_R, 0.12, "cl-half"],
  [RAIL_L, 0.05, "cl-rail"],
  [RAIL_R, 0.05, "cl-rail"],
] as const;

export default function CircuitLines() {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <style>{`
        .cl-beam { animation: var(--name) ${T}s linear infinite; stroke-dashoffset: var(--len); }
        /* drop: 0-18% of the cycle */
        @keyframes cl-drop { 0% { stroke-dashoffset: var(--len); } 18%, 100% { stroke-dashoffset: -1; } }
        /* around the frame: 18-62% */
        @keyframes cl-half { 0%, 18% { stroke-dashoffset: var(--len); } 62%, 100% { stroke-dashoffset: -1; } }
        /* out along the rails, as the halves pass the middle of each side: 40-75% */
        @keyframes cl-rail { 0%, 40% { stroke-dashoffset: var(--len); } 75%, 100% { stroke-dashoffset: -1; } }
        .cl-ping { transform-box: fill-box; transform-origin: center; opacity: 0; animation: var(--name) ${T}s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
        @keyframes cl-ping-top { 0%, 17% { transform: scale(1); opacity: 0; } 18% { opacity: 0.7; } 42%, 100% { transform: scale(2.8); opacity: 0; } }
        @keyframes cl-ping-bottom { 0%, 61% { transform: scale(1); opacity: 0; } 62% { opacity: 0.7; } 86%, 100% { transform: scale(2.8); opacity: 0; } }
        .cl-core { animation: var(--name) ${T}s ease-out infinite; }
        @keyframes cl-flash-top { 0%, 16% { fill-opacity: 0.6; } 18% { fill-opacity: 1; } 30%, 100% { fill-opacity: 0.6; } }
        @keyframes cl-flash-bottom { 0%, 60% { fill-opacity: 0.6; } 62% { fill-opacity: 1; } 74%, 100% { fill-opacity: 0.6; } }
        @media (prefers-reduced-motion: reduce) { .cl-beam, .cl-ping, .cl-core { animation: none; } .cl-beam, .cl-ping { opacity: 0; } }
      `}</style>
      <defs>
        <filter id="cl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* The static lines. */}
      <g fill="none" stroke="white" strokeOpacity={0.1} strokeWidth={1}>
        {LINES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* The pulse. */}
      <g
        fill="none"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.85}
        filter="url(#cl-glow)"
      >
        {BEAMS.map(([d, len, name]) => (
          <path
            key={`${name}${d}`}
            d={d}
            pathLength={1}
            strokeDasharray={`${len} 2`}
            className="cl-beam"
            style={{ "--len": len, "--name": name } as React.CSSProperties}
          />
        ))}
      </g>

      {/* Nodes: top where the pulse lands, bottom where the halves meet. */}
      {(
        [
          [Y0, "top"],
          [Y1, "bottom"],
        ] as const
      ).map(([cy, at]) => (
        <g key={at}>
          <circle
            cx={CX}
            cy={cy}
            r={9}
            className="cl-ping"
            fill="none"
            stroke="white"
            style={{ "--name": `cl-ping-${at}` } as React.CSSProperties}
          />
          <circle
            cx={CX}
            cy={cy}
            r={9}
            fill="#2a2ccf"
            stroke="white"
            strokeOpacity={0.35}
          />
          <circle
            cx={CX}
            cy={cy}
            r={3}
            fill="white"
            className="cl-core"
            style={{ "--name": `cl-flash-${at}` } as React.CSSProperties}
          />
        </g>
      ))}
    </svg>
  );
}
