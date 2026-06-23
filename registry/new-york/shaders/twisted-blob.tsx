"use client";

/**
 * A vertex-twisted sphere with domain-warped noise — drag to spin.
 */


import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh, ShaderMaterial } from "three";
import GUI from "lil-gui";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFrequency;
  uniform float uAmplitude;
  uniform float uSpeed;
  uniform float uWarp;
  uniform float uTwist;
  uniform float uSpikes;
  uniform float uPulse;
  varying float vDisplacement;
  varying vec3 vNormal;

  // 3D simplex noise (Ashima / Ian McEwan), returns ~[-1, 1]
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1),
                                   dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1),
                            dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1),
                                  dot(p2, x2), dot(p3, x3)));
  }

  // fractal Brownian motion: stack octaves of noise for rich detail
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  // rotation matrix around the Y axis
  mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  }

  void main() {
    float t = uTime * uSpeed;
    vec3 p = position;

    // TWIST: rotate each vertex around Y more the higher it is
    p = rotateY(p.y * uTwist + t) * p;

    // DOMAIN WARP: offset the sample point by noise of the sample point
    vec3 warp = vec3(
      fbm(p * uFrequency + t),
      fbm(p * uFrequency + 5.2 - t),
      fbm(p * uFrequency + 9.3 + t * 0.5)
    );

    // fbm displacement through the warped field
    float n = fbm(p * uFrequency + warp * uWarp + t);

    // SPIKES: sharpen the noise into quills
    float spike = pow(abs(n), 3.0) * uSpikes;

    // PULSE: the whole body breathes
    float pulse = sin(t * 2.0) * uPulse;

    float displacement = n * uAmplitude + spike + pulse;
    vDisplacement = displacement;
    vNormal = normal;

    // push out along the original normal
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vDisplacement;
  varying vec3 vNormal;

  void main() {
    // cool palette: deep blue -> cyan -> violet, by displacement
    float m = clamp(vDisplacement * 1.5 + 0.5, 0.0, 1.0);
    vec3 deep  = vec3(0.02, 0.09, 0.30);
    vec3 cyan  = vec3(0.10, 0.62, 0.90);
    vec3 violet = vec3(0.50, 0.30, 0.95);
    vec3 col = mix(deep, cyan, smoothstep(0.0, 0.55, m));
    col = mix(col, violet, smoothstep(0.55, 1.0, m));

    // fake directional light so the geometry reads
    float light = clamp(
      dot(normalize(vNormal), normalize(vec3(0.5, 0.8, 0.6))) * 0.5 + 0.5,
      0.0, 1.0
    );
    col *= 0.55 + 0.45 * light;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const Blob = ({ interactive }: { interactive: boolean }) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFrequency: { value: 0.7 },
      uAmplitude: { value: 0.5 },
      uSpeed: { value: 0.639 },
      uWarp: { value: 0 },
      uTwist: { value: 8 },
      uSpikes: { value: 0 },
      uPulse: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
    }
    if (!interactive && meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
    }
  });

  useEffect(() => {
    if (!interactive) return;
    const material = materialRef.current;
    if (!material) return;
    const gui = new GUI();
    gui.domElement.style.zIndex = "10000"; // above the z-[9999] modal
    gui.add(material.uniforms.uFrequency, "value", 0, 5).name("frequency");
    gui.add(material.uniforms.uAmplitude, "value", 0, 2).name("amplitude");
    gui.add(material.uniforms.uSpeed, "value", 0, 3).name("speed");
    gui.add(material.uniforms.uWarp, "value", 0, 3).name("warp");
    gui.add(material.uniforms.uTwist, "value", 0, 8).name("twist");
    gui.add(material.uniforms.uSpikes, "value", 0, 2).name("spikes");
    gui.add(material.uniforms.uPulse, "value", 0, 1).name("pulse");
    gui.add(material, "wireframe");
    return () => gui.destroy();
  }, [interactive]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 200, 200]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const TwistedBlob = ({
  className,
  dpr = 2,
  interactive = false,
}: {
  className?: string;
  dpr?: number;
  interactive?: boolean;
}) => {
  return (
    <Canvas className={className} dpr={dpr} camera={{ position: [0, 0, 4] }}>
      <color attach="background" args={[0, 0, 0]} />
      <Blob interactive={interactive} />
      {interactive && <OrbitControls enablePan={false} enableZoom={false} />}
    </Canvas>
  );
};

export default TwistedBlob;
