"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

const Page = () => {
  const [Count, setCount] = useState(0);
  const inc = () => {
    setCount(Count + 1);
  };
  useEffect(() => {
    const id = setTimeout(() => {
      inc();
    }, 100);
    return () => {
      clearTimeout(id);
    };
  }, []);

  return <div>{Count}</div>;
};

export default Page;
