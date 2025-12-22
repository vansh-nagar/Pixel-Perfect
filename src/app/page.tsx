import ComponentsShowcase from "@/components/mine/landing-page/components-showcase";
import { Footer } from "@/components/mine/landing-page/footer";
import { HeroSection } from "@/components/mine/landing-page/herosection";
import { Navbar } from "@/components/mine/landing-page/navbar";
import SocialProof from "@/components/mine/landing-page/social-proof";
import StackUsed from "@/components/mine/landing-page/stack-used";
import StarBorder from "@/components/mine/landing-page/star-border";

const page = () => {
  return (
    <div className="relative w-full grid min-h-screen grid-cols-[1fr_1rem_auto_1rem_1fr] grid-rows-[auto_1px_auto_1px_auto_1px_auto_1px_auto_1px_auto_1px_auto_1px_auto_1px] [--pattern-fg:var(--color-gray-950)]/5 dark:bg-black dark:[--pattern-fg:var(--color-white)]/10">
      {/* Row 1: Navbar */}
      <div className="col-start-3 row-start-1 flex w-[90vw] px-3 sm:px-6 py-3 flex-col relative overflow-hidden">
        <Navbar />
        <StarBorder />
      </div>

      <div className="pointer-events-none  relative  col-span-full col-start-1 row-start-2 mask-x-from-99% border-b z-50 " />

      {/* Row 2: Hero Section */}
      <div className="col-start-3 row-start-3 flex flex-col w-[90vw]   gap-2">
        <HeroSection />
      </div>

      <div className="pointer-events-none  relative  col-span-full col-start-1 row-start-4 mask-x-from-99% border-b z-50 " />

      {/* Filler Section */}
      <div className="col-start-3 row-start-5 py-6 relative overflow-hidden">
        <StarBorder />
      </div>

      <div className="pointer-events-none  relative  col-span-full col-start-1 row-start-6 mask-x-from-99% border-b z-50 " />

      {/* Row 3: Stack Used Section */}
      <div className="col-start-3 row-start-7 flex flex-col w-[90vw] gap-2">
        <StackUsed />
      </div>

      <div className="pointer-events-none  relative  col-span-full col-start-1 row-start-8 mask-x-from-99% border-b z-50 " />

      {/* Filler Section 2 */}
      <div className="col-start-3 row-start-9 py-6 relative overflow-hidden">
        <StarBorder />
      </div>

      <div className="pointer-events-none  relative  col-span-full col-start-1 row-start-10 mask-x-from-99% border-b z-50 " />

      {/* Row 4: Component Section */}
      <div className="col-start-3 row-start-11 flex flex-col w-[90vw]">
        <ComponentsShowcase />
      </div>

      <div className="pointer-events-none  relative  col-span-full col-start-1 row-start-12 mask-x-from-99% border-b z-50 " />

      {/* <div className="col-start-3 row-start-13 flex flex-col w-[90vw]">
        <SocialProof />
      </div> */}

      {/* Filler Section 2 */}
      <div className="col-start-3 row-start-13 py-6 relative overflow-hidden">
        <StarBorder />
      </div>

      <div className="pointer-events-none  relative  col-span-full col-start-1 row-start-14 mask-x-from-99% border-b z-50 " />

      {/* Row 6: Footer */}
      <div className="col-start-3 row-start-15 flex flex-col w-[90vw] gap-2 relative overflow-hidden">
        <Footer />
        <StarBorder />
      </div>

      {/* Decorative borders - row span full */}
      <div className="pointer-events-none -right-px col-start-2 row-span-full row-start-1 border-x mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed z-50"></div>
      <div className="pointer-events-none relative -left-px col-start-4 row-span-full row-start-1 border-x border-x-[--pattern-fg] mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed z-50"></div>

      {/* Horizontal borders */}
      <div className="pointer-events-none relative -bottom-px col-span-full col-start-1 row-start-2 mask-x-from-97% z-50 "></div>
      <div className="pointer-events-none relative  col-span-full col-start-1 row-start-4 mask-x-from-99% border-b z-50 "></div>
    </div>
  );
};

export default page;
