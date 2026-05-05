"use client";
import React from "react";
import { motion } from "framer-motion";
import { AnimatedCirclesWithLine } from "do-not-share/AnimatedCirclesWithLine";
import GithubReceipt from "do-not-share/github-recipt";

const Page = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <GithubReceipt />
    </div>
  );
};

export default Page;
