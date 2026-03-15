"use client";
import OrbitDotMotion from "registry/new-york/motion-framer/orbit-dot-motion";
import CoinSpinAnimation from "registry/new-york/motion-framer/coin-spin-animation";
import { motion } from "framer-motion";

const Page = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10">
      {/* <OrbitDotMotion /> */}
      {/* <CoinSpinAnimation /> */}
      <div className="w-[400px] h-[300px] bg-orange-500">
        <motion.div
          drag
          className="h-10 w-10 rounded-full border bg-background"
        ></motion.div>
      </div>
    </div>
  );
};

export default Page;
