"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Heart, Shuffle } from "lucide-react";

import RefractionGlassButton from "registry/new-york/buttons/refraction-glass-button";
import SilverButton from "registry/new-york/buttons/silver-button";
import BevelButton from "registry/new-york/buttons/bevel-button";
import RainbowGlowingButton from "registry/new-york/buttons/rainbow-glowing-button";
import LiquidButton from "registry/new-york/buttons/liquid-button";
import BookDemoButton from "registry/new-york/buttons/book-demo-button";
import SoftPillButton from "registry/new-york/buttons/soft-pill-button";
import FramerCtaButton from "registry/new-york/buttons/framer-cta-button";
import LiquidGlassButton from "registry/new-york/buttons/liquid-glass-button";
import PixelCreditsButton from "@/components/pixel-perfect/pixel-credits-button";
import MorphButton from "registry/new-york/buttons/morph-button";
import MorphImageButton from "registry/new-york/buttons/morph-image-button";
import ThreedButton from "registry/new-york/buttons/3d-button";
import ShinyButton from "registry/new-york/buttons/shiny-button";
import MouseFollowerButton from "registry/new-york/buttons/mouse-follower-button";
import BorderGradientButton from "registry/new-york/buttons/border-gradient-button";
import PremiumButton from "registry/new-york/buttons/premium-button";
import OrangePremiumButton from "registry/new-york/buttons/orange-premium-button";
import BlueChromeButton from "registry/new-york/buttons/blue-chrome-button";
import StripeButton from "registry/new-york/buttons/stripe-button";
import VisitButton from "registry/new-york/buttons/visit-button";
import AbhinavBentoButton from "registry/new-york/buttons/abhinav-bento-button";
import MatteShadowButton from "registry/new-york/buttons/matte-shadow-button";
import MetalButton from "registry/new-york/buttons/metal-button";
import GlassButton from "registry/new-york/buttons/glass-button";
import LiquidGradientButton from "registry/new-york/buttons/liquid-gradient-button";
import MagneticButton from "registry/new-york/buttons/magnetic-button";

const DONATE_URL =
  "https://buy.polar.sh/polar_cl_f2wnG1ytyvuNI3PIlhnvmlIm3Z7IKK25YZeqR49IQbB";
// Prefill the Pay-What-You-Want amount to $3 (Polar expects the value in cents).
const DEFAULT_AMOUNT_CENTS = 300;
const CHECKOUT_URL = `${DONATE_URL}?amount=${DEFAULT_AMOUNT_CENTS}`;

const LABEL = "Donate Now";

const styles = [
  { name: "Refraction Glass", node: <RefractionGlassButton>{LABEL}</RefractionGlassButton> },
  { name: "Steel Pill", node: <SilverButton variant="steel">{LABEL}</SilverButton> },
  { name: "Pearl Pill", node: <SilverButton variant="pearl">{LABEL}</SilverButton> },
  { name: "Bevel", node: <BevelButton>{LABEL}</BevelButton> },
  { name: "Rainbow Glow", node: <RainbowGlowingButton>{LABEL}</RainbowGlowingButton> },
  { name: "Liquid", node: <LiquidButton>{LABEL}</LiquidButton> },
  { name: "Book a Demo", node: <BookDemoButton variant="lime">{LABEL}</BookDemoButton> },
  { name: "Soft Pill", node: <SoftPillButton variant="secondary">{LABEL}</SoftPillButton> },
  { name: "Soft Pill Primary", node: <SoftPillButton variant="primary">{LABEL}</SoftPillButton> },
  { name: "Framer CTA", node: <FramerCtaButton variant="dark">{LABEL}</FramerCtaButton> },
  { name: "Framer Light", node: <FramerCtaButton variant="light">{LABEL}</FramerCtaButton> },
  { name: "Liquid Glass", node: <LiquidGlassButton>{LABEL}</LiquidGlassButton> },
  { name: "Pixel Credits", node: <PixelCreditsButton>{LABEL}</PixelCreditsButton> },
  { name: "Morph", node: <MorphButton>{LABEL}</MorphButton> },
  { name: "Morph Image", node: <MorphImageButton>{LABEL}</MorphImageButton> },
  { name: "3D", node: <ThreedButton threedVariant="amber">{LABEL}</ThreedButton> },
  { name: "Shiny", node: <ShinyButton>{LABEL}</ShinyButton> },
  { name: "Mouse Follower", node: <MouseFollowerButton>{LABEL}</MouseFollowerButton> },
  { name: "Gradient Border", node: <BorderGradientButton>{LABEL}</BorderGradientButton> },
  { name: "Premium", node: <PremiumButton premiumVariant="neutral">{LABEL}</PremiumButton> },
  { name: "Orange Premium", node: <OrangePremiumButton orangeVariant="orange">{LABEL}</OrangePremiumButton> },
  { name: "Blue Chrome", node: <BlueChromeButton variant="blue">{LABEL}</BlueChromeButton> },
  { name: "Stripe", node: <StripeButton>{LABEL}</StripeButton> },
  { name: "Visit", node: <VisitButton label={LABEL} className="w-auto whitespace-nowrap" /> },
  { name: "Abhinav Bento", node: <AbhinavBentoButton><Heart className="size-6 fill-white text-white" /></AbhinavBentoButton> },
  { name: "Matte Shadow", node: <MatteShadowButton>{LABEL}</MatteShadowButton> },
  { name: "Metal", node: <MetalButton metal="silver">{LABEL}</MetalButton> },
  { name: "Glass", node: <GlassButton variant="blue">{LABEL}</GlassButton> },
  { name: "Master", node: <LiquidGradientButton variant="violet">{LABEL}</LiquidGradientButton> },
  { name: "Magnetic", node: <MagneticButton mode="auto">{LABEL}</MagneticButton> },
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

  const swap = useCallback(() => {
    setActive((i) => (i + 1) % styles.length);
    bump();
  }, [bump]);

  useEffect(() => {
    const id = window.setInterval(swap, 3000);
    return () => window.clearInterval(id);
  }, [swap]);

  const donate = () => {
    window.location.href = CHECKOUT_URL;
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
        className="mt-1 flex min-h-20 cursor-pointer items-center justify-center"
      >
        {styles[active].node}
      </motion.div>
    </>
  );
};

export default SupportShowcase;
