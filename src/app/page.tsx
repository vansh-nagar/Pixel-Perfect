import ComponentsShowcase from "@/components/mine/landing-page/components-showcase";
import { Footer } from "@/components/mine/landing-page/footer";
import { HeroSection } from "@/components/mine/landing-page/herosection";
import { Navbar } from "@/components/mine/landing-page/navbar";
import SocialProof from "@/components/mine/landing-page/social-proof";
import StackUsed from "@/components/mine/landing-page/stack-used";
import StarBorder from "@/components/mine/landing-page/star-border";
import Pricing from "@/components/pricing";
import { LandingGrid } from "@/components/layout/landing-grid";
import { GradientBlur } from "@/components/mine/landing-page/gradient-blur";
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata = generatePageMetadata({
  title: "Pixel Perfect UI — Lightweight UI Library for React",
  description:
    "A lightweight, documentation-first UI library for React. Copy-paste bespoke components, animations, and effects built with Tailwind, Motion, and GSAP.",
  path: "/",
});

export default function Home() {
  return (
    <>
    <LandingGrid>
      <div className="px-3 sm:px-6 py-3 relative overflow-hidden">
        <Navbar />
        <StarBorder />
      </div>
      <div className="gap-2">
        <HeroSection />
      </div>
      <div className="py-6 relative overflow-hidden">
        <StarBorder />
      </div>
      <StackUsed />
      <div className="py-6 relative overflow-hidden">
        <StarBorder />
      </div>
      <ComponentsShowcase />
      <SocialProof />
      <div className="text-center text-lg">
        <Pricing />
      </div>
      <Footer />
    </LandingGrid>
    <GradientBlur className="hidden h-[60px] md:block" />
    </>
  );
}
