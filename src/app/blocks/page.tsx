import React from "react";
import { TabsNavigation } from "@/components/mine/blocks/tabs-navigation";
import { Navbar } from "@/components/mine/landing-page/navbar";

const Page = () => {
  return (
    <div className="relative w-full grid min-h-screen grid-cols-[1fr_1rem_auto_1rem_1fr] grid-rows-[auto_auto_1px_1fr] [--pattern-fg:var(--color-gray-950)]/5 dark:bg-black dark:[--pattern-fg:var(--color-white)]/10">
      <div className="col-start-3 row-start-1 flex w-[90vw] px-6  py-3 flex-col relative">
        <Navbar />
      </div>
      <div className="col-start-3 row-start-2 w-[90vw] p-3">
        <TabsNavigation />
      </div>
      <div className="pointer-events-none -right-px col-start-2 row-span-full row-start-1 border-x mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>
      <div className="pointer-events-none relative -left-px col-start-4 row-span-full row-start-1 border-x border-x-[--pattern-fg] mask-y-from-93% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>
      <div className="pointer-events-none relative -bottom-px col-span-full col-start-1 row-start-2 mask-x-from-97% border-t border-dashed"></div>
      <div className="pointer-events-none relative -top-px col-span-full col-start-1 row-start-4 mask-x-from-99% border-b border-dashed"></div>
    </div>
  );
};

export default Page;
