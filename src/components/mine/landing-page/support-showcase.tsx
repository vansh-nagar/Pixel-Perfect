"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Shuffle } from "lucide-react";

import RainbowGlowingButton from "registry/new-york/buttons/rainbow-glowing-button";
import ShinyButton from "registry/new-york/buttons/shiny-button";
import BorderGradientButton from "registry/new-york/buttons/border-gradient-button";
import FramerCtaButton from "registry/new-york/buttons/framer-cta-button";
import BookDemoButton from "registry/new-york/buttons/book-demo-button";

const DONATE_URL =
  "https://buy.polar.sh/polar_cl_f2wnG1ytyvuNI3PIlhnvmlIm3Z7IKK25YZeqR49IQbB";

const styles = [
  { name: "Rainbow Glow", node: <RainbowGlowingButton>Donate Now</RainbowGlowingButton> },
  { name: "Shiny", node: <ShinyButton>Donate Now</ShinyButton> },
  { name: "Gradient Border", node: <BorderGradientButton>Donate Now</BorderGradientButton> },
  { name: "Framer CTA", node: <FramerCtaButton>Donate Now</FramerCtaButton> },
  { name: "Book Demo", node: <BookDemoButton>Donate Now</BookDemoButton> },
];

const SupportShowcase = () => {
  const [active, setActive] = useState(0);
  const controls = useAnimationControls();

  const bump = useCallback(() => {
    controls.start({
      scale: [1, 0.9, 1.06, 1],
      transition: { duration: 0.45, times: [0, 0.3, 0.65, 1], ease: "easeOut" },
    });
  }, [controls]);

  useEffect(() => {
    const id = window.setInterval(bump, 3000);
    return () => window.clearInterval(id);
  }, [bump]);

  const swap = () => {
    setActive((i) => (i + 1) % styles.length);
    bump();
  };

  const donate = () => {
    window.location.href = DONATE_URL;
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={swap}
        whileTap={{ scale: 0.9 }}
        whileHover={{ rotate: 90 }}
        title={`Swap button style — ${styles[active].name}`}
        aria-label="Swap button style"
        className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full border border-muted text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Shuffle size={14} />
      </motion.button>

      <motion.div
        onClick={donate}
        animate={controls}
        className="mt-1 cursor-pointer"
      >
        {styles[active].node}
      </motion.div>
    </>
  );
};

export default SupportShowcase;
