"use client";

import CoinSpinAnimation from "registry/new-york/motion-framer/coin-spin-animation";
import OrbitDotMotion from "registry/new-york/motion-framer/orbit-dot-motion";

const Page = () => {
  return (
    <div className="flex  gap-10 flex-col min-h-screen w-full items-center justify-center bg-background ">
      <CoinSpinAnimation />
      <OrbitDotMotion />

      <div className="w-md border p-4 flex flex-col">
        <img src="/card.png" alt="" />{" "}
        <h1 className="text-md mt-4">Event Timeline</h1>
        <span className="text-sm text-muted-foreground line-clamp-2 leading-tight">
          All signals and events flow into a single timeline, giving you a clear
          history of everything that happens.
        </span>
      </div>
    </div>
  );
};

export default Page;
