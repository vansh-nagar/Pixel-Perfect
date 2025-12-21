const Intersection2 = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="relative w-full h-full grid  grid-cols-[1fr_1rem_auto_1rem_1fr] grid-rows-[1fr_1px_auto_1px_1fr] [--pattern-fg:var(--color-gray-950)]/5 dark:bg-transparent dark:[--pattern-fg:var(--color-white)]/10">
        <div className="col-start-3 row-start-3 flex max-w-lg flex-col relative">
          {children}
        </div>
        <div className=" -right-px col-start-2 row-span-full row-start-1 border-x  mask-y-from-60% bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>
        <div className="relative -left-px col-start-4 row-span-full row-start-1 border-x border-x-(--pattern-fg)  mask-y-from-60%  bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed"></div>
        <div className="relative -bottom-px col-span-full col-start-1 row-start-2    mask-x-from-60% border-t  border-dashed"></div>
        <div className="relative -top-px col-span-full col-start-1 row-start-4    mask-x-from-60%  border-b border-dashed"></div>
      </div>
    </>
  );
};

export default Intersection2;

import React from "react";
