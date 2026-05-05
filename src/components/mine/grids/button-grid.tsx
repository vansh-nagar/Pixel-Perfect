"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MorphButton from "../../../../registry/new-york/buttons/morph-button";
import MorphImageButton from "../../../../registry/new-york/buttons/morph-image-button";
import ThreedButton from "../../../../registry/new-york/buttons/3d-button";
import type { ThreedVariant } from "../../../../registry/new-york/buttons/3d-button";
import ShinyButton from "../../../../registry/new-york/buttons/shiny-button";
import BorderGradientButton from "../../../../registry/new-york/buttons/border-gradient-button";
import MouseFollowerButton from "../../../../registry/new-york/buttons/mouse-follower-button";
import PremiumButton from "../../../../registry/new-york/buttons/premium-button";
import type { PremiumVariant } from "../../../../registry/new-york/buttons/premium-button";
import OrangePremiumButton from "../../../../registry/new-york/buttons/orange-premium-button";
import type { OrangePremiumVariant } from "../../../../registry/new-york/buttons/orange-premium-button";
import StripeButton from "../../../../registry/new-york/buttons/stripe-button";
import LearnMoreButtion from "../../../../registry/new-york/buttons/learn-more-buttion";
import ToggleButton from "../../../../registry/new-york/buttons/toggle-buttion";
import AbhinavBentoButton from "../../../../registry/new-york/buttons/abhinav-bento-button";
import PixelCreditsButton from "@/components/pixel-perfect/pixel-credits-button";
import VisitButton from "../../../../registry/new-york/buttons/visit-button";
import { Spinner } from "@/components/ui/spinner";
import GooeyButton from "registry/new-york/buttons/goe-button";
import BlurToggleButton from "../../../../registry/new-york/buttons/blur-toggle-button";
import BlueChromeButton from "../../../../registry/new-york/buttons/blue-chrome-button";
import type { BlueChromeVariant } from "../../../../registry/new-york/buttons/blue-chrome-button";
import MatteShadowButton from "../../../../registry/new-york/buttons/matte-shadow-button";
import MetalButton from "../../../../registry/new-york/buttons/metal-button";
import type { MetalVariant } from "../../../../registry/new-york/buttons/metal-button";
import GlassButton from "../../../../registry/new-york/buttons/glass-button";
import type { GlassVariant } from "../../../../registry/new-york/buttons/glass-button";
import LiquidGradientButton from "../../../../registry/new-york/buttons/liquid-gradient-button";
import type { LiquidGradientVariant } from "../../../../registry/new-york/buttons/liquid-gradient-button";
import RadialGradientButton from "../../../../registry/new-york/buttons/radial-gradient-button";
import type { RadialGradientVariant } from "../../../../registry/new-york/buttons/radial-gradient-button";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CopyDropdown from "../copy-dropdown";
import LiquidGlassButton from "registry/new-york/buttons/liquid-glass-button";
// import FramerCtaButton from "../../../../registry/new-york/buttons/framer-cta-button";
// import SoftPillButton from "../../../../registry/new-york/buttons/soft-pill-button";
// import BookDemoButton from "../../../../registry/new-york/buttons/book-demo-button";

const threedVariants: ThreedVariant[] = [
  "amber",
  "emerald",
  "rose",
  "sky",
  "violet",
  "slate",
  "coral",
  "mint",
];

const ThreedButtonWrapper = () => {
  const [variant, setVariant] = useState<ThreedVariant>("amber");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as ThreedVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {threedVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ThreedButton threedVariant={variant}>Click Me</ThreedButton>
    </>
  );
};

const premiumVariants: PremiumVariant[] = [
  "neutral",
  "dark",
  "gold",
  "mint",
  "rose",
  "sky",
  "lavender",
  "sand",
];

const PremiumButtonWrapper = () => {
  const [variant, setVariant] = useState<PremiumVariant>("neutral");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as PremiumVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {premiumVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <PremiumButton premiumVariant={variant}>Hover Me</PremiumButton>
    </>
  );
};

const orangePremiumVariants: OrangePremiumVariant[] = [
  "orange",
  "pink",
  "emerald",
  "violet",
  "sky",
  "ocean",
  "gold",
  "magenta",
];

const OrangePremiumButtonWrapper = () => {
  const [variant, setVariant] = useState<OrangePremiumVariant>("orange");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as OrangePremiumVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {orangePremiumVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <OrangePremiumButton orangeVariant={variant}>
        Hover Me
      </OrangePremiumButton>
    </>
  );
};

const metalVariants: MetalVariant[] = [
  "silver",
  "chrome",
  "gold",
  "copper",
  "bronze",
  "titanium",
  "rose-gold",
  "gunmetal",
];

const MetalButtonWrapper = () => {
  const [metal, setMetal] = useState<MetalVariant>("silver");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={metal}
          onValueChange={(v) => setMetal(v as MetalVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {metalVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <MetalButton metal={metal}>
        {metal.charAt(0).toUpperCase() + metal.slice(1)}
      </MetalButton>
    </>
  );
};

const glassVariants: GlassVariant[] = [
  "blue",
  "purple",
  "emerald",
  "rose",
  "amber",
  "cyan",
  "lime",
  "slate",
  "red",
  "indigo",
];

const GlassButtonWrapper = () => {
  const [variant, setVariant] = useState<GlassVariant>("blue");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as GlassVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {glassVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <GlassButton variant={variant}>
        {variant.charAt(0).toUpperCase() + variant.slice(1)}
      </GlassButton>
    </>
  );
};

const blueChromeVariants: BlueChromeVariant[] = [
  "blue",
  "cyan",
  "indigo",
  "violet",
  "emerald",
  "amber",
  "rose",
  "silver",
];

const BlueChromeButtonWrapper = () => {
  const [variant, setVariant] = useState<BlueChromeVariant>("blue");
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as BlueChromeVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {blueChromeVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <BlueChromeButton variant={variant}>
        {variant.charAt(0).toUpperCase() + variant.slice(1)}
      </BlueChromeButton>
    </>
  );
};

const liquidGradientVariants: LiquidGradientVariant[] = [
  "pink",
  "cyan",
  "emerald",
  "amber",
  "crimson",
  "violet",
  "ocean",
  "sunset",
];

const LiquidGradientButtonWrapper = () => {
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState<LiquidGradientVariant>("violet");
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as LiquidGradientVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {liquidGradientVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <LiquidGradientButton
        variant={variant}
        loading={loading}
        onClick={() => setLoading(true)}
      >
        Login
      </LiquidGradientButton>
    </>
  );
};

const radialGradientVariants: RadialGradientVariant[] = [
  "blue",
  "purple",
  "emerald",
  "crimson",
  "amber",
  "cyan",
  "violet",
  "rose",
];

const RadialGradientButtonWrapper = () => {
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState<RadialGradientVariant>("blue");
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  return (
    <>
      <div className="absolute left-1.5 top-1.5 z-40">
        <Select
          value={variant}
          onValueChange={(v) => setVariant(v as RadialGradientVariant)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 rounded-none border-dashed px-1.5 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-28">
            {radialGradientVariants.map((v) => (
              <SelectItem key={v} value={v} className="text-xs capitalize">
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <RadialGradientButton
        variant={variant}
        loading={loading}
        onClick={() => setLoading(true)}
      >
        Login
      </RadialGradientButton>
    </>
  );
};

const ToggleButtonWrapper = () => {
  const [toggle, setToggle] = useState(false);
  return <ToggleButton toggle={toggle} setToggle={setToggle} />;
};

export const ButtonsArr = [
  // {
  //   name: "Book a Demo Button",
  //   description:
  //     "Lime square with dotted chevron animation that expands a dark panel on hover.",
  //   component: <BookDemoButton>Book a demo</BookDemoButton>,
  //   registryName: "book-demo-button",
  // },
  // {
  //   name: "Soft Pill Secondary",
  //   description: "Frosted-glass nav pill with layered highlights and gradient border.",
  //   component: <SoftPillButton variant="secondary">Philosophy</SoftPillButton>,
  //   registryName: "soft-pill-button",
  // },
  // {
  //   name: "Soft Pill Primary",
  //   description: "Dark frosted-glass CTA pill with subtle inner glow and metallic border.",
  //   component: <SoftPillButton variant="primary">Get in touch</SoftPillButton>,
  //   registryName: "soft-pill-button",
  // },
  // {
  //   name: "Book a Meeting Button",
  //   description: "Dark Framer-style CTA pill with Google Meet brand icon.",
  //   component: <FramerCtaButton variant="dark">Book a meeting</FramerCtaButton>,
  //   registryName: "framer-cta-button",
  // },
  // {
  //   name: "Send a Message Button",
  //   description: "Light Framer-style CTA pill with Telegram brand icon.",
  //   component: (
  //     <FramerCtaButton variant="light">Send a message</FramerCtaButton>
  //   ),
  //   registryName: "framer-cta-button",
  // },
  {
    name: "Liquid Glass Button",
    description:
      "A frosted glass button with conic gradient border and layered shadows.",
    component: <LiquidGlassButton />,
    registryName: "liquid-glass-button",
  },
  {
    name: "Pixel Credits Button",
    description: "A soft keycap-style button for Pixel Credits.",
    component: <PixelCreditsButton />,
    registryName: "pixel-credits-button",
  },
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <MorphButton>Hover Me</MorphButton>,
    registryName: "morph-button",
  },
  {
    name: "Morph Image Button",
    description: "A button that morphs an image mask on hover using GSAP.",
    component: <MorphImageButton>Hover Me</MorphImageButton>,
    registryName: "morph-image-button",
  },
  {
    name: "3D Button",
    description:
      "3D push button with press/hover physics and 8 color variants.",
    component: <ThreedButtonWrapper />,
    registryName: "3d-button",
  },
  {
    name: "Shiny Button",
    description: "A shiny button with hover effects.",
    component: <ShinyButton />,
    registryName: "shiny-button",
  },
  {
    name: "Mouse Follower Button",
    description: "A button that follows the mouse cursor with hover effects.",
    component: <MouseFollowerButton>Mouse follower</MouseFollowerButton>,
    registryName: "mouse-follower-button",
  },
  {
    name: "Border Gradient Button",
    description: "A button with a gradient border effect.",
    component: <BorderGradientButton />,
    registryName: "border-gradient-button",
  },
  {
    name: "Premium Button",
    description: "Neumorphic button with layered shadows and 8 color variants.",
    component: <PremiumButtonWrapper />,
    registryName: "premium-button",
  },
  {
    name: "Orange Premium Button",
    description: "Glossy gradient button with soft glow and 8 color variants.",
    component: <OrangePremiumButtonWrapper />,
    registryName: "orange-premium-button",
  },
  {
    name: "Blue Chrome Button",
    description:
      "A chrome-style button with layered glow border and smooth motion.",
    component: <BlueChromeButtonWrapper />,
    registryName: "blue-chrome-button",
  },
  {
    name: "Stripe Button",
    description: "A Stripe-inspired button with inset shadow effect.",
    component: <StripeButton>Click Me</StripeButton>,
    registryName: "stripe-button",
  },
  {
    name: "Learn More Button",
    description: "An animated learn more button with hover effects.",
    component: <LearnMoreButtion />,
    registryName: "learn-more-button",
  },
  {
    name: "Visit Button",
    description: "A compact button with label and icon swap on hover.",
    component: <VisitButton />,
    registryName: "visit-button",
  },
  {
    name: "Toggle Button",
    description: "An animated toggle switch with spring physics.",
    component: <ToggleButtonWrapper />,
    registryName: "toggle-button",
  },
  {
    name: "Abhinav Bento Button",
    description: "A large bento-style button.",
    component: (
      <AbhinavBentoButton>
        <Spinner />
      </AbhinavBentoButton>
    ),
    registryName: "abhinav-bento-button",
  },
  {
    name: "Gooey Button",
    description: "A gooey SVG filter button effect.",
    component: <GooeyButton />,
    registryName: "goe-button",
  },
  {
    name: "Blur Toggle Button",
    description: "A button with blur transition effect on toggle.",
    component: <BlurToggleButton />,
    registryName: "blur-toggle-button",
  },
  {
    name: "Matte Shadow Button",
    description: "A dark matte button with layered depth shadow.",
    component: <MatteShadowButton>Click Me</MatteShadowButton>,
    registryName: "matte-shadow-button",
  },
  {
    name: "Metal Button",
    description: "Metallic button with 8 metal variants.",
    component: <MetalButtonWrapper />,
    registryName: "metal-button",
  },
  {
    name: "Glass Button",
    description:
      "Frosted glass button with gradient border and 10 color variants.",
    component: <GlassButtonWrapper />,
    registryName: "glass-button",
  },
  {
    name: "Master Button",
    description:
      "Premium gradient button with image overlay and 8 color variants.",
    component: <LiquidGradientButtonWrapper />,
    registryName: "liquid-gradient-button",
  },
  {
    name: "Radial Gradient Button",
    description: "Radial gradient button with inset glow and 8 color variants.",
    component: <RadialGradientButtonWrapper />,
    registryName: "radial-gradient-button",
  },
];

const ButtonGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(ButtonsArr.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = ButtonsArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {paginatedItems.map((item, index) => (
          <div
            key={index}
            className="relative group border-b border-l border-dashed  aspect-square flex items-center justify-center "
          >
            <BorderDecorator />
            <div className=" z-30">{item.component}</div>

            <div className=" leading-1 absolute left-1.5  bottom-1.5 p-0.5">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
            <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
              <div className=" border-t border-dashed "></div>
              <CopyDropdown registryName={item.registryName} />
              <div />
              <div className=" border-r border-dashed h-full -mr-[0.5px] " />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-dashed rounded-none"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-none border-dashed ${
                  currentPage === page ? "" : ""
                }`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="border-dashed rounded-none"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ButtonGrid;

export const BorderDecorator = () => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] top-0 block size-6   border-dashed border-l border-t z-30"></span>
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-dashed border-r border-t z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-dashed border-b border-l z-30 "></span>
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b border-r border-dashed z-30"></span>

      <span className="absolute -top-px -right-[0.5px] z-30 border-b border-l block size-2 px-[38px] py-[20px] mt-px  border-dashed"></span>

      {/* Circular border */}
      <div className="absolute group-hover:animate-spin top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>

      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>

      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-linear-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
