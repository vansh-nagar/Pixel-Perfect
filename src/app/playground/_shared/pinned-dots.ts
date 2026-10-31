/**
 * Pinned-dot backdrop: a dot grid where dots near the pointer pull away from their pins on
 * a tether, a few dots inside a highlighted ring drift loose, and the grid sways with a
 * "lean" value (e.g. scroll speed). Dots are larger inside the ring. Sizes in CSS px.
 *
 * Usage: add the returned mesh to the scene (full-screen quad, drawn first), keep
 * uViewport / uPixelRatio in sync on resize, and drive uTime, uPointer, uPointerOn, uLean,
 * uOffset, uCenter and uCenterRadius each frame. Colour uniforms share the passed
 * instances, so `.set()` on them re-themes live.
 */

import * as THREE from "three";

export const PINS = { spacing: 54, small: 1.1, large: 3.4, reach: 170, maxPull: 0.42, loose: 0.1, parallax: 0.25 };

const PINS_VERTEX = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const PINS_FRAGMENT = /* glsl */ `
  uniform vec2 uViewport;
  uniform float uPixelRatio;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform float uLean;
  uniform float uOffset;
  uniform vec2 uCenter;
  uniform float uCenterRadius;
  uniform vec3 uBackground;
  uniform vec3 uDot;
  uniform vec3 uDotStrong;

  const float SP = ${PINS.spacing.toFixed(1)};

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // How far the dot pinned at anchor has been pulled, in px.
  vec2 pullOf(vec2 anchor, vec2 id) {
    vec2 o = vec2(0.0);
    vec2 d = uPointer - anchor;
    float dist = length(d);
    float pull = uPointerOn * smoothstep(${PINS.reach.toFixed(1)}, 0.0, dist);
    o += d / max(dist, 1e-3) * min(dist, ${PINS.maxPull.toFixed(2)} * SP) * pull;
    // A few dots inside the wheel's ring drift loose on their tethers.
    float h = hash(id);
    float inside = smoothstep(uCenterRadius, uCenterRadius * 0.8, length(anchor - uCenter));
    if (h < ${PINS.loose.toFixed(2)}) {
      float a = h * 62.83 + uTime * 0.6;
      o += vec2(cos(a), sin(a)) * SP * 0.28 * inside;
    }
    o.x += uLean * SP * 0.3 * (0.5 + 0.5 * sin(id.y * 0.7 + id.x * 0.3));
    return o;
  }

  float segment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 px = vec2(gl_FragCoord.x, uViewport.y * uPixelRatio - gl_FragCoord.y) / uPixelRatio;
    vec2 cell = floor((px + vec2(uOffset, 0.0)) / SP);
    float ink = 0.0;
    float strong = 0.0;
    // A pulled dot can leave its own cell, so check the neighbours too.
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 id = cell + vec2(float(i), float(j));
        vec2 anchor = (id + 0.5) * SP - vec2(uOffset, 0.0);
        vec2 o = pullOf(anchor, id);
        float big = smoothstep(uCenterRadius, uCenterRadius * 0.8, length(anchor - uCenter));
        float r = mix(${PINS.small.toFixed(2)}, ${PINS.large.toFixed(2)}, big);
        float moved = smoothstep(2.0, 6.0, length(o));
        float aa = 0.75;
        // A pulled dot grows a little, so the tether always ends on a clear dot.
        float rb = mix(r, max(r, 3.0), moved);
        float body = 1.0 - smoothstep(rb - aa, rb + aa, length(px - anchor - o));
        float pin = moved * (1.0 - smoothstep(r * 0.55 - aa, r * 0.55 + aa, length(px - anchor)));
        float tether = moved * (1.0 - smoothstep(0.5, 1.3, segment(px, anchor, anchor + o)));
        float v = max(body, max(pin, tether));
        ink = max(ink, v);
        strong = max(strong, v * big);
      }
    }
    gl_FragColor = vec4(mix(uBackground, mix(uDot, uDotStrong, strong), ink), 1.0);
    #include <colorspace_fragment>
  }
`;


export function createPinnedDots(colors: { background: THREE.Color; dot: THREE.Color; dotStrong: THREE.Color }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uViewport: { value: new THREE.Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(-1e4, -1e4) },
      uPointerOn: { value: 0 },
      uLean: { value: 0 },
      uOffset: { value: 0 },
      uCenter: { value: new THREE.Vector2() },
      uCenterRadius: { value: 1 },
      uBackground: { value: colors.background },
      uDot: { value: colors.dot },
      uDotStrong: { value: colors.dotStrong },
    },
    vertexShader: PINS_VERTEX,
    fragmentShader: PINS_FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, material, dispose: () => (mesh.geometry.dispose(), material.dispose()) };
}
