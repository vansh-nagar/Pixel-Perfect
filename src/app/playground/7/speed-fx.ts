/**
 * The "you're going fast" overlay, one full-screen pass after the scene:
 *
 *  - radial motion blur toward the vanishing point, stronger at the edges and with speed
 *  - chromatic split along the same rays
 *  - speed lines: thin streaks racing outward from the vanishing point past ~120 km/h
 *  - a vignette that closes in with speed, plus a pulse on hard hits (landings, kerbs)
 *  - fine film grain
 *
 * Runs on the linear HDR buffer before tone mapping, so streaks and blur keep their glow.
 */

import * as THREE from "three";

export const SpeedShader = {
  name: "SpeedShader",
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uSpeed: { value: 0 }, // 0..1
    uImpact: { value: 0 }, // 0..1, decays
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector2(0.5, 0.55) },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSpeed;
    uniform float uImpact;
    uniform float uTime;
    uniform vec2 uCenter;
    uniform float uAspect;
    varying vec2 vUv;

    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 dir = vUv - uCenter;
      vec2 adir = dir * vec2(uAspect, 1.0);
      float dist = length(adir);
      float edge = smoothstep(0.12, 0.85, dist);
      float s = uSpeed * uSpeed;

      // Radial blur + chromatic split: march toward the centre, red and blue spread apart.
      float blur = (0.085 * s + 0.03 * uImpact) * edge;
      float ca = (0.006 * s + 0.004 * uImpact) * edge;
      vec3 acc = vec3(0.0);
      float wsum = 0.0;
      float jitter = hash2(vUv * 913.0 + uTime) - 0.5;
      for (int i = 0; i < 14; i++) {
        float t = (float(i) + jitter) / 13.0;
        float w = 1.0 - 0.6 * t;
        vec2 base = vUv - dir * blur * t;
        acc.r += texture2D(tDiffuse, base + dir * ca).r * w;
        acc.g += texture2D(tDiffuse, base).g * w;
        acc.b += texture2D(tDiffuse, base - dir * ca).b * w;
        wsum += w;
      }
      vec3 col = acc / wsum;

      // Speed lines: angular bins, a few lit at a time, each a dash racing outward.
      float angle = atan(adir.y, adir.x);
      float bins = 140.0;
      float a = angle / 6.2831853 * bins;
      float bin = floor(a);
      float lit = step(0.86, hash(bin * 3.17 + floor(uTime * 6.0 + hash(bin) * 10.0)));
      float across = 1.0 - abs(fract(a) - 0.5) * 2.0;
      float thin = pow(across, 10.0);
      float phase = fract(dist * 1.6 - uTime * (2.2 + 2.5 * hash(bin + 7.0)) + hash(bin * 1.7));
      float dash = smoothstep(0.0, 0.08, phase) * smoothstep(0.55, 0.2, phase);
      float lines = lit * thin * dash * smoothstep(0.22, 0.75, dist) * smoothstep(0.4, 0.95, uSpeed);
      col += vec3(1.0, 0.97, 0.92) * lines * 0.55;

      // Vignette, tighter with speed and on impacts.
      float v = smoothstep(0.35, 1.05, dist);
      col *= 1.0 - v * (0.18 + 0.4 * s + 0.35 * uImpact);

      // Grain.
      col += (hash2(vUv * 1024.0 + fract(uTime) * 61.0) - 0.5) * 0.025;

      gl_FragColor = vec4(col, 1.0);
    }`,
};
