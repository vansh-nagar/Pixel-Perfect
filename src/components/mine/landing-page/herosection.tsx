"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React, { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export const HeroSection = () => {
  const container = useRef(null);
  return (
    <div className="  grid-cols-2 grid pt-[75px] h-screen w-full">
      <div className="  flex  flex-col items-start justify-center  ">
        {" "}
        <span className=" text-8xl font-bold   text-shadow-2xs">
          Build Stunning Websites in Minutes
        </span>
        <span className=" text-xl mt-4  text-muted-foreground font-pixelify">
          {" "}
          Build beautiful, responsive interfaces in minutes. A pixel-perfect
          React component library for modern web apps.
        </span>
        <div className=" flex gap-3 mt-10">
          <Link href={"https://pixelperfect.mintlify.app/"}>
            <Button className="font-pixelify">Browse Components</Button>
          </Link>
          <Button variant={"outline"} className="font-pixelify">
            Want Custom Components?
          </Button>
        </div>
      </div>
      <div
        ref={container}
        className=" border relative my-4  font-pixelify p-2 "
      >
        <motion.div
          animate={{ x: 200 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className=" h-20 w-20"
          drag
          dragConstraints={container}
        >
          components preview
        </motion.div>

        <div className=" absolute  top-0 left-0 -translate-y-1/2 -translate-x-1/2">
          <Plus size={15} className=" text-muted-foreground" />
        </div>
        <div className="  absolute  top-0 right-0 -translate-y-1/2 translate-x-1/2">
          <Plus size={15} className=" text-muted-foreground" />
        </div>
        <div className="  absolute  bottom-0 left-0 translate-y-1/2 -translate-x-1/2">
          <Plus size={15} className=" text-muted-foreground" />
        </div>
        <div className=" absolute  bottom-0 right-0 translate-y-1/2 translate-x-1/2">
          <Plus size={15} className=" text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};
