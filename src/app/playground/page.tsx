"use client";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import { motion } from "motion/react";

const Page = () => {
  return (
    <div className=" min-h-screen flex flex-col justify-center items-center">
      <div className=" fixed top-4 right-4">
        <LightDarkMode />
      </div>

      <motion.div
        initial={{ scale: 0.5, y: 30, opacity: 0, filter: "blur(10px)" }}
        whileInView={{ scale: 1, y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        viewport={{ once: true }}
      >
        hello
      </motion.div>
    </div>
  );
};

export default Page;
