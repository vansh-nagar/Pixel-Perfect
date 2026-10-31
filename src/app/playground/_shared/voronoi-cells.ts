import * as THREE from "three";

// Rounded Voronoi cells separated by even gaps (sizes in CSS px), drawn as a
// full-screen quad. Optional shockwaves bend the field and glaze the gaps with
// the accent; an optional hold point pinches it. Callers fill `uWaves` with
// (x, y, radius, strength) in top-left CSS px and `uHold` with (x, y, charge).

export const CELLS = { size: 260, gap: 12, smooth: 0.22, drift: 0.12, parallax: 0.25 };
export const CELLS_WAVES = 4;
const WAVE = { band: 70, push: 26 };
const PINCH = { strength: 0.18, reach: 320, glow: 200 };

const CELLS_VERTEX = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const CELLS_FRAGMENT = /* glsl */ `
  uniform vec3 uCell;
  uniform vec3 uGap;
  uniform vec3 uAccent;
  uniform float uPixelRatio;
  uniform vec2 uViewport;
  uniform float uTime;
  uniform float uOffset;
  uniform float uDrift;
  uniform vec4 uWaves[${CELLS_WAVES}];
  uniform vec3 uHold;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  // Seeds wander inside their grid square so the cells slowly reshape.
  vec2 seed(vec2 cell) {
    vec2 h = hash2(cell);
    return 0.5 + 0.38 * sin(uTime * uDrift + 6.2831 * h);
  }

  float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
  }

  void main() {
    // Work in top-left CSS px so wave and hold positions match the DOM.
    vec2 q = gl_FragCoord.xy / uPixelRatio;
    q.y = uViewport.y - q.y;
    float lit = 0.0;

    for (int i = 0; i < ${CELLS_WAVES}; i++) {
      vec4 w = uWaves[i]; // x, y, radius (px), strength
      if (w.w <= 0.0) continue;
      vec2 d = q - w.xy;
      float r = length(d);
      float front = (r - w.z) / ${WAVE.band.toFixed(1)};
      float k = exp(-front * front) * w.w;
      q -= d / max(r, 1.0) * k * ${WAVE.push.toFixed(1)};
      lit = max(lit, k);
    }
    if (uHold.z > 0.0) {
      vec2 d = uHold.xy - q;
      float r = length(d);
      q += d * uHold.z * ${PINCH.strength.toFixed(3)} * exp(-r / ${PINCH.reach.toFixed(1)});
      lit = max(lit, uHold.z * 0.35 * exp(-r / ${PINCH.glow.toFixed(1)}));
    }

    vec2 x = (vec2(q.x, uViewport.y - q.y) + vec2(uOffset, 0.0)) / ${CELLS.size.toFixed(1)};
    vec2 n = floor(x);
    vec2 f = fract(x);

    // Nearest seed.
    vec2 mg = vec2(0.0);
    vec2 mr = vec2(0.0);
    float md = 8.0;
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + seed(n + g) - f;
      float d = dot(r, r);
      if (d < md) { md = d; mr = r; mg = g; }
    }

    // Distance to the cell border; smooth-min across neighbours rounds the corners.
    float edge = 8.0;
    for (int j = -2; j <= 2; j++)
    for (int i = -2; i <= 2; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 r = g + seed(n + g) - f;
      vec2 diff = r - mr;
      if (dot(diff, diff) > 1e-5) edge = smin(edge, dot(0.5 * (mr + r), normalize(diff)), ${CELLS.smooth.toFixed(3)});
    }

    float edgePx = edge * ${CELLS.size.toFixed(1)};
    float aa = 0.75;
    float fill = smoothstep(${(CELLS.gap / 2).toFixed(2)} - aa, ${(CELLS.gap / 2).toFixed(2)} + aa, edgePx);
    vec3 gap = mix(uGap, uAccent, min(1.0, lit * 0.9));
    vec3 cell = mix(uCell, uAccent, lit * 0.12);
    gl_FragColor = vec4(mix(gap, cell, fill), 1.0);
    #include <colorspace_fragment>
  }
`;

/** Material for the cells quad. Colour uniforms share the passed instances, so `.set()` on them re-themes live. */
export function createCellsMaterial(colors: { cell: THREE.Color; gap: THREE.Color; accent?: THREE.Color }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCell: { value: colors.cell },
      uGap: { value: colors.gap },
      uAccent: { value: colors.accent ?? colors.gap },
      uPixelRatio: { value: 1 },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uOffset: { value: 0 },
      uDrift: { value: CELLS.drift },
      uWaves: { value: Array.from({ length: CELLS_WAVES }, () => new THREE.Vector4()) },
      uHold: { value: new THREE.Vector3() },
    },
    vertexShader: CELLS_VERTEX,
    fragmentShader: CELLS_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
}
