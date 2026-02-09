"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

const ToggleButton = ({
  toggle = false,
  setToggle = () => {},
}: {
  toggle: boolean;
  setToggle: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className=" relative">
      <div
        className={`h-2 aspect-square rounded-full absolute -top-1 -right-3 ${toggle ? "bg-green-500" : "bg-red-500"}`}
      ></div>
      <motion.div
        onClick={() => {
          setToggle(!toggle);
        }}
        className="rounded-full w-20 flex items-center p-0.5 cursor-pointer"
        style={{
          background: "rgba(0, 0, 0, 0.08)",
          boxShadow:
            "0px 1px 0px rgba(255, 255, 255, 0.25), inset 0px 1px 2px rgba(0, 0, 0, 0.15)",
        }}
      >
        <motion.div
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          animate={{ x: toggle ? "100%" : "0%" }}
          className="h-9 w-9 border rounded-full bg-[#F4F4F4]"
          style={{
            boxShadow:
              "0.444584px 0.444584px 0.628737px -0.75px rgba(0, 0, 0, 0.26), 1.21072px 1.21072px 1.71222px -1.5px rgba(0, 0, 0, 0.247), 2.6583px 2.6583px 3.75941px -2.25px rgba(0, 0, 0, 0.23), 5.90083px 5.90083px 8.34503px -3px rgba(0, 0, 0, 0.192), 10px 10px 21.2132px -3.75px rgba(0, 0, 0, 0.055), inset 1px 1px 1px #FFFFFF, inset -1px -1px 0px rgba(0, 0, 0, 0.1)",
          }}
        />
      </motion.div>
    </div>
  );
};

export default ToggleButton;
