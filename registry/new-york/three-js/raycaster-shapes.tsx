"use client";

/**
 * Geometries on a 3D plane: a raycaster lights up the hovered shape's edges with a Fresnel rim shader, and clicking pops it up and spins it.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

// Rim/edge shader: simple diffuse base + a Fresnel term that glows on the
// silhouette (the "edges" of the shape from the camera's view). `uHovered`
// ramps that rim from a faint outline to a bright glow when the raycaster
// reports this shape as the one under the cursor.
const RIM_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  void main() {
    // Object-space position — continuous across every face, unlike per-face uv.
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const RIM_FRAG = /* glsl */ `
  uniform vec3 uColor;     // current colour (paint "from")
  uniform vec3 uColorTo;   // new colour being painted in ("to")
  uniform vec3 uLightDir;
  uniform vec3 uRimColor;
  uniform float uHovered;
  uniform float uPaint;     // 0 → 1 brush-stroke reveal progress
  uniform float uNoiseScale;
  uniform float uRadius;    // geometry bounding radius (normalises the sweep)
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;

  // Procedural noise for organic, paper-bleed brush edges (from paint-reveal).
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
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);

    // Paint-reveal brush mask driven by a CONTINUOUS object-space coordinate
    // (not per-face uv), so the brush front sweeps the whole shape uniformly.
    // Sweep up the local Y axis → bottom-to-top reveal.
    float s = vLocalPos.y / (2.0 * uRadius) + 0.5; // ~0 at the base, ~1 at the top
    float rn = fbm(vLocalPos.xz * uNoiseScale) * 0.12;
    float maskValue = s + rn;
    float threshold = mix(-0.25, 1.25, uPaint);
    float paintAmt = 1.0 - smoothstep(threshold - 0.06, threshold + 0.02, maskValue);
    vec3 shapeColor = mix(uColor, uColorTo, paintAmt);
    // darker "wet" line right at the advancing brush edge
    float wet = smoothstep(0.0, 0.06, abs(maskValue - threshold));
    shapeColor *= mix(0.7, 1.0, wet);

    float diff = max(dot(N, normalize(uLightDir)), 0.0);
    vec3 base = shapeColor * (0.25 + 0.75 * diff);
    // Fresnel: 1 at the grazing-angle edges, 0 facing the camera.
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float rim = fres * (0.12 + uHovered * 2.2);
    vec3 col = base + uRimColor * rim;
    gl_FragColor = vec4(col, 1.0);
  }
`;

type ShapeAnim = {
  baseY: number;
  baseRot: THREE.Euler;
  clickStart: number | null;
  paintStart: number | null;
  spinX: number;
  spinY: number;
  spinZ: number;
  popH: number;
  radiusSet: boolean;
};

type ShapeProps = {
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  children: ReactNode;
};

const Shape = ({ position, color, rotation, children }: ShapeProps) => {
  const ref = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: RIM_VERT,
        fragmentShader: RIM_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uColorTo: { value: new THREE.Color(color) },
          uLightDir: { value: new THREE.Vector3(5, 8, 5).normalize() },
          uRimColor: { value: new THREE.Color("#bfe9ff") },
          uHovered: { value: 0 },
          uPaint: { value: 0 },
          uNoiseScale: { value: 1.2 },
          uRadius: { value: 1 },
        },
      }),
    [color],
  );

  // Tag the mesh so the scene-wide raycast/animation loop can find it.
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.userData.anim = {
      baseY: mesh.position.y,
      baseRot: mesh.rotation.clone(),
      clickStart: null,
      paintStart: null,
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      popH: 0,
      radiusSet: false,
    } satisfies ShapeAnim;
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh ref={ref} position={position} rotation={rotation} material={material}>
      {children}
    </mesh>
  );
};

const Scene = () => {
  const hoveredRef = useRef<THREE.Mesh | null>(null);

  // Click the hovered shape → pop it up and spin it a random number of whole
  // turns, then it settles back. Scoped to the canvas so clicks elsewhere on
  // the page don't trigger it.
  useEffect(() => {
    const TAU = Math.PI * 2;
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLCanvasElement)) return;
      const m = hoveredRef.current;
      if (!m) return;
      const d = m.userData.anim as ShapeAnim;
      const t = performance.now() / 1000;

      // Pop up + spin.
      d.clickStart = t;
      d.popH = 1.0 + Math.random() * 0.9;
      d.spinX = TAU * (Math.random() < 0.5 ? 0 : 1);
      d.spinY = TAU * (1 + Math.floor(Math.random() * 2));
      d.spinZ = TAU * (Math.random() < 0.5 ? 0 : 1);

      // Paint-reveal to a new random colour. Commit any in-progress paint as the
      // new "from", then sweep toward a fresh random "to".
      const mat = m.material as THREE.ShaderMaterial;
      mat.uniforms.uColor.value.copy(mat.uniforms.uColorTo.value);
      mat.uniforms.uColorTo.value.setHSL(Math.random(), 0.7, 0.55);
      mat.uniforms.uPaint.value = 0;
      d.paintStart = t;
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useFrame((state) => {
    // Collect the tagged shapes by traversing the scene (a frame-local value).
    const shapes: THREE.Mesh[] = [];
    state.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.userData.anim)
        shapes.push(o as THREE.Mesh);
    });

    // Raycast from the camera through the cursor to find the hovered shape.
    state.raycaster.setFromCamera(state.pointer, state.camera);
    const hits = state.raycaster.intersectObjects(shapes, false);
    const hovered = (hits[0]?.object as THREE.Mesh | undefined) ?? null;
    hoveredRef.current = hovered;

    const now = performance.now() / 1000;
    for (const m of shapes) {
      const d = m.userData.anim as ShapeAnim;

      const mat = m.material as THREE.ShaderMaterial;

      // Normalise the paint sweep to the geometry size (computed once).
      if (!d.radiusSet) {
        m.geometry.computeBoundingSphere();
        mat.uniforms.uRadius.value = m.geometry.boundingSphere?.radius ?? 1;
        d.radiusSet = true;
      }

      // Edge-glow on the hovered shape.
      const u = mat.uniforms.uHovered;
      u.value += ((m === hovered ? 1 : 0) - u.value) * 0.15;

      // Paint-reveal progress: sweep the new colour in, then commit it.
      if (d.paintStart !== null) {
        const pp = Math.min((now - d.paintStart) / 1.1, 1);
        mat.uniforms.uPaint.value = pp;
        if (pp >= 1) {
          d.paintStart = null;
          mat.uniforms.uColor.value.copy(mat.uniforms.uColorTo.value);
          mat.uniforms.uPaint.value = 0;
        }
      }

      // One-shot pop (hop up and back down) + spin on click.
      if (d.clickStart !== null) {
        const p = Math.min((now - d.clickStart) / 0.9, 1);
        const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic for the spin
        const arc = Math.sin(p * Math.PI); // 0 → up → 0 for the hop
        m.position.y = d.baseY + arc * d.popH;
        m.rotation.set(
          d.baseRot.x + d.spinX * ease,
          d.baseRot.y + d.spinY * ease,
          d.baseRot.z + d.spinZ * ease,
        );
        if (p >= 1) {
          d.clickStart = null;
          m.position.y = d.baseY;
          m.rotation.copy(d.baseRot);
        }
      }
    }

    state.gl.domElement.style.cursor = hovered ? "pointer" : "auto";
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />

      {/* Ground plane + grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <gridHelper args={[12, 12, "#374151", "#374151"]} />

      {/* Shapes with the rim/edge shader, detected via raycaster */}
      <Shape position={[-2.2, 0.5, -1]} color="#6366f1">
        <boxGeometry args={[1, 1, 1]} />
      </Shape>

      <Shape position={[0, 0.6, 1]} color="#ec4899">
        <sphereGeometry args={[0.6, 32, 32]} />
      </Shape>

      <Shape position={[2.2, 0.7, -0.5]} color="#f59e0b">
        <coneGeometry args={[0.6, 1.4, 32]} />
      </Shape>

      <Shape
        position={[-1, 0.55, 1.8]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#10b981"
      >
        <torusGeometry args={[0.5, 0.2, 16, 48]} />
      </Shape>

      <Shape position={[1.4, 0.6, 1.6]} color="#38bdf8">
        <cylinderGeometry args={[0.45, 0.45, 1.2, 32]} />
      </Shape>

      <Shape position={[0.4, 0.6, -2]} color="#a78bfa">
        <icosahedronGeometry args={[0.65, 0]} />
      </Shape>

      <OrbitControls enableDamping makeDefault />
    </>
  );
};

const RaycasterShapes = () => {
  return (
    <div className="h-full w-full bg-neutral-900">
      <Canvas camera={{ position: [6, 5, 6], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  );
};

export default RaycasterShapes;
