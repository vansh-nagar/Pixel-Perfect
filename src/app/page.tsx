import { Footer } from "@/components/mine/landing-page/footer";
import { HeroSection } from "@/components/mine/landing-page/herosection";
import { Navbar } from "@/components/mine/landing-page/navbar";

const page = () => {
  return (
    <div className="relative w-full grid min-h-screen grid-cols-[1fr_1rem_auto_1rem_1fr] grid-rows-[auto_auto_1px_auto_1px_auto] [--pattern-fg:var(--color-gray-950)]/5 dark:bg-black dark:[--pattern-fg:var(--color-white)]/10">
      {/* Row 1: Navbar */}
      <div className="col-start-3 row-start-1 flex w-[90vw] px-6 py-3 flex-col relative">
        <Navbar />
      </div>

      {/* Row 2: Hero Section */}
      <div className="col-start-3 row-start-2 flex flex-col w-[90vw] p-3 gap-2">
        <HeroSection />
      </div>

      <div className="pointer-events-none  relative -top-px col-span-full col-start-1 row-start-3 mask-x-from-99% border-b border-dashed"></div>

      {/* Row 4: Footer (row 3 is border, row 5 is border) */}
      <div className="col-start-3 row-start-4 flex flex-col w-[90vw] p-3 gap-2">
        <Footer />
      </div>

      {/* Decorative borders - row span full */}
      <div className="pointer-events-none -right-px col-start-2 row-span-full row-start-1 border-x mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>
      <div className="pointer-events-none relative -left-px col-start-4 row-span-full row-start-1 border-x border-x-[--pattern-fg] mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>

      {/* Horizontal borders */}
      <div className="pointer-events-none relative -bottom-px col-span-full col-start-1 row-start-2 mask-x-from-97% border-t border-dashed"></div>
      <div className="pointer-events-none relative -top-px col-span-full col-start-1 row-start-4 mask-x-from-99% border-b border-dashed"></div>
    </div>
  );
};

export default page;
