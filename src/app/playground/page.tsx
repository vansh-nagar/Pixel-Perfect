"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useRef, useState } from "react";
import type { Group } from "three";

const MODEL_URL = "/model/polify.glb";

const LOGO_PATH =
  "M726.5 0L840.5 66.5L633.5 389H491L420 497.5H110L0 431L278 0H726.5ZM398 84.5L182.5 416.5H302.5L372 306H514L655.5 84.5H398Z";

// easeOutBack: overshoots past 1 then settles — slope 0 at the end, so the
// float can take over with no velocity jump.
const easeOutBack = (x: number, s = 1.70158) => {
  const c1 = s;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const INTRO_DUR = 1.3;

const Model = ({ play }: { play: boolean }) => {
  const { scene } = useGLTF(MODEL_URL);
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;

    // Hold below the frame until the logo intro hands off.
    if (!play) {
      g.position.y = -8;
      g.scale.setScalar(0.7);
      return;
    }
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    if (t < INTRO_DUR) {
      const p = t / INTRO_DUR;
      g.position.y = -8 * (1 - easeOutBack(p)); // rise with overshoot
      g.scale.setScalar(0.7 + 0.3 * easeOutBack(p, 2.2)); // pop in
      g.rotation.z = 0;
    } else {
      const ft = t - INTRO_DUR;
      const ramp = Math.min(ft / 1.2, 1); // ease the float in
      g.position.y = Math.sin(ft * 1.6) * 0.5 * ramp; // starts at 0 → seamless
      g.rotation.z = Math.sin(ft * 1.1) * 0.06 * ramp;
      g.scale.setScalar(1);
    }
  });

  return (
    <group ref={ref}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
};

useGLTF.preload(MODEL_URL);

const Page = () => {
  const [showLogo, setShowLogo] = useState(true);

  return (
    <div className="relative h-screen w-screen bg-neutral-900">
      <Canvas dpr={[1, 2]} camera={{ position: [12.4, -1.6, 0.6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Environment preset="city" />
          {/* Model rises only once the logo intro has played. */}
          <Model play={!showLogo} />
        </Suspense>
      </Canvas>

      {/* Logo mark intro: stroke draws on, fill fades in, then it lifts away. */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            key="logo"
            className="absolute inset-0 z-10 grid place-items-center bg-neutral-900"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <svg
              width="220"
              viewBox="0 0 841 498"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d={LOGO_PATH}
                fill="#D9D9D9"
                fillRule="evenodd"
                stroke="#D9D9D9"
                strokeWidth={6}
                initial={{ pathLength: 0, fillOpacity: 0 }}
                animate={{ pathLength: 1, fillOpacity: 1 }}
                transition={{
                  pathLength: { duration: 1.1, ease: "easeInOut" },
                  fillOpacity: { duration: 0.5, delay: 1.0 },
                }}
                onAnimationComplete={() => setShowLogo(false)}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Page;
