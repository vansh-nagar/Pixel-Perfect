"use client";

/**
 * A shader sky that glides from day to night — sun, moon, drifting clouds and stars, with an optional scrub slider.
 */


import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uT;          // 0 = day, 1 = night

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
    return v;
  }
  float cloudShape(vec2 p) {
    vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2)),
                  fbm(p + 4.0 * q + vec2(8.3, 2.8)));
    return fbm(p + 4.0 * r);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    float t = clamp(uT, 0.0, 1.0);

    // sky gradient day → night, with a warm dusk band peaking mid-scrub
    vec3 top = mix(vec3(0.26, 0.52, 0.92), vec3(0.02, 0.03, 0.12), t);
    vec3 bot = mix(vec3(0.88, 0.92, 1.0), vec3(0.14, 0.10, 0.26), t);
    float dusk = max(1.0 - abs(t - 0.5) * 2.0, 0.0);
    bot = mix(bot, vec3(0.99, 0.62, 0.45), dusk * 0.6);
    vec3 sky = mix(bot, top, smoothstep(0.0, 1.0, uv.y));

    // sun (day) arcing to a crescent moon (night)
    vec2 pos = mix(vec2(0.30, 0.72), vec2(0.72, 0.80), t);
    vec2 d = uv - pos; d.x *= aspect;
    float dist = length(d);
    float r = 0.07;
    float disc = 1.0 - smoothstep(r - 0.006, r, dist);
    vec2 d2 = uv - (pos + vec2(0.022, 0.014)); d2.x *= aspect;
    float carve = 1.0 - smoothstep(r - 0.006, r, length(d2));
    float body = mix(disc, clamp(disc - carve, 0.0, 1.0), smoothstep(0.5, 0.8, t));
    float glow = 0.02 / (dist * dist + 0.02);
    vec3 bodyCol = mix(vec3(1.0, 0.95, 0.78), vec3(0.93, 0.95, 1.0), t);
    sky += bodyCol * (body + glow * 0.3 * (1.0 - 0.5 * t));

    // twinkling stars fade in toward night
    vec2 sg = floor(uv * vec2(aspect, 1.0) * 150.0);
    float star = step(0.986, hash21(sg));
    float twinkle = 0.5 + 0.5 * sin(uTime * 3.0 + hash21(sg) * 6.2831);
    sky += star * twinkle * smoothstep(0.4, 1.0, t) * smoothstep(0.2, 1.0, uv.y);

    // drifting clouds, greying and thinning out at night
    vec2 cp = uv * vec2(2.2, 1.7) + vec2(uTime * 0.025, 0.0);
    float density = smoothstep(0.52, 0.8, cloudShape(cp));
    float dl = cloudShape(cp + vec2(-0.08, 0.1));
    float light = clamp((cloudShape(cp) - dl) * 4.0 + 0.55, 0.0, 1.0);
    vec3 cloudCol = mix(mix(vec3(0.62, 0.63, 0.72), vec3(1.0), light),
                        vec3(0.22, 0.22, 0.34), t);
    sky = mix(sky, cloudCol, density * (1.0 - 0.45 * t));

    gl_FragColor = vec4(sky, 1.0);
  }
`;

const DayNightSky = ({
  className,
  dpr = 2,
  controls = false,
}: {
  className?: string;
  dpr?: number;
  controls?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0.25);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uT: { value: valueRef.current },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "150px", threshold: 0 },
    );
    intersectionObserver.observe(container);

    let raf = 0;
    let shaderTime = 0;
    let last = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const now = performance.now();
      shaderTime += Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uTime.value = shaderTime;
      uniforms.uT.value = controls
        ? valueRef.current
        : 0.5 - 0.5 * Math.cos(shaderTime * 0.25);
      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    animate();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (canvas.parentNode === container) container.removeChild(canvas);
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [dpr, controls]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <div ref={containerRef} aria-hidden className="size-full" />
      {controls && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-8 z-10 mx-auto flex w-[min(28rem,80%)] flex-col items-center gap-2">
          <div className="flex w-full justify-between text-xs text-white/80 drop-shadow">
            <span>Day</span>
            <span>Night</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            aria-label="Scrub day to night"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/40 accent-white"
          />
        </div>
      )}
    </div>
  );
};

export default DayNightSky;
