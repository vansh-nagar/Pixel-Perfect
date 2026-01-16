"use client";
import { BadgeDollarSign } from "lucide-react";
import React from "react";

const page = () => {
  return (
    <div className=" flex justify-center items-center h-screen">
      <div className=" flex justify-center items-center relative perspective-normal">
        <div className="h-40 aspect-square bg-red-600 rounded-xl rotate-x-45 rotate-z-45 blur-2xl translate-y-8"></div>
        <div className="h-40 aspect-square bg-red-600/20 rounded-xl rotate-x-45 rotate-z-45 absolute"></div>
        <div className="h-40 aspect-square bg-red-600/70 rounded-xl rotate-x-45 absolute -translate-y-4 rotate-z-45 flex justify-center items-center">
          <BadgeDollarSign size={90} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default page;
