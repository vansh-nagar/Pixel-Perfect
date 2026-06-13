'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

const SRC = '/bend-image-reveal.gif'
const IMG_ASPECT = 540 / 304
const BASE_H = 200 // plane height in px (orthographic zoom 1 => 1 unit = 1px)
const BASE_W = BASE_H * IMG_ASPECT
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// the whole image is one texture on a subdivided plane; the GPU bends the vertices
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uBendX;
  uniform float uBendY;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float px = uv.x * 2.0 - 1.0; // -1 (left)   .. +1 (right)
    float py = uv.y * 2.0 - 1.0; // -1 (bottom) .. +1 (top)
    pos.y += uBendY * px * px;   // moving vertically -> left/right edges trail
    pos.x += uBendX * py * py;   // moving horizontally -> top/bottom edges trail
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTex;
  void main() {
    gl_FragColor = texture2D(uTex, vUv);
  }
`

function MouseImage() {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  const uniforms = useMemo(
    () => ({
      uTex: { value: null as THREE.Texture | null },
      uBendX: { value: 0 },
      uBendY: { value: 0 },
    }),
    []
  )

  useEffect(() => {
    new THREE.TextureLoader().load(SRC, (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.magFilter = THREE.NearestFilter
      setTexture(t)
    })
  }, [])

  // attach the texture once the mesh/material has actually mounted
  useEffect(() => {
    if (texture && matRef.current) matRef.current.uniforms.uTex.value = texture
  }, [texture])

  // where the cursor is (target) vs. where the image actually is (lags behind)
  const target = useRef({ x: 0, y: 0 })
  const state = useRef({ x: 0, y: 0, bx: 0, by: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX - size.width / 2
      target.current.y = -(e.clientY - size.height / 2) // three.js: +y up
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [size.width, size.height])

  useFrame(() => {
    const mesh = meshRef.current
    const mat = matRef.current
    if (!mesh || !mat) return

    // smoothly chase the cursor (the lag IS the "air resistance")
    const prevX = state.current.x
    const prevY = state.current.y
    state.current.x = lerp(state.current.x, target.current.x, 0.1)
    state.current.y = lerp(state.current.y, target.current.y, 0.1)
    mesh.position.set(state.current.x, state.current.y, 0)

    // bend opposite to travel, smoothed so it settles when the cursor stops
    const vx = state.current.x - prevX
    const vy = state.current.y - prevY
    state.current.bx = lerp(state.current.bx, gsap.utils.clamp(-45, 45, -vx * 1.5), 0.15)
    state.current.by = lerp(state.current.by, gsap.utils.clamp(-45, 45, -vy * 1.5), 0.15)
    mat.uniforms.uBendX.value = state.current.bx
    mat.uniforms.uBendY.value = state.current.by
  })

  if (!texture) return null
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[BASE_W, BASE_H, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

const Page = () => {
  return (
    <div className="h-screen w-full bg-background">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <MouseImage />
      </Canvas>
    </div>
  )
}

export default Page
