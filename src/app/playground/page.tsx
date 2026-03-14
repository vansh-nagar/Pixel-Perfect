"use client";

import { AnimatePresence, motion } from "framer-motion";

const Page = () => {
  return (
    <div className="h-screen w-full flex  justify-center items-center">
      <div className="">
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{
            duration: 3,
            ease: "easeIn",
            repeat: Infinity,
            repeatDelay: 0.2,
          }}
          className=" border h-13 w-13 rounded-full absolute border-[#5686FF]"
        ></motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{
            delay: 1.5,
            duration: 3,
            ease: "easeIn",
            repeat: Infinity,
            repeatDelay: 0.2,
          }}
          className=" border h-13 w-13 rounded-full absolute border-[#5686FF]"
        ></motion.div>

        <AnimatePresence>
          <motion.svg
            initial={{ opacity: 0, scale: 0, rotate: -90, filter: "blur(5px)" }}
            animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
            transition={{
              type: "spring",
              damping: 10,
              stiffness: 110,
              delay: 0.2,
            }}
            width="52"
            height="52"
            viewBox="0 0 52 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.5909 4.37592C24.1565 2.21749 27.3733 2.21749 28.9389 4.37592V4.37592C30.0273 5.87644 32.0178 6.40978 33.7106 5.65449V5.65449C36.1457 4.56803 38.9315 6.17646 39.2082 8.82851V8.82851C39.4005 10.6722 40.8576 12.1293 42.7013 12.3216V12.3216C45.3533 12.5983 46.9618 15.3841 45.8753 17.8192V17.8192C45.12 19.512 45.6533 21.5025 47.1539 22.5909V22.5909C49.3123 24.1565 49.3123 27.3733 47.1539 28.9389V28.9389C45.6533 30.0273 45.12 32.0178 45.8753 33.7106V33.7106C46.9618 36.1457 45.3533 38.9315 42.7013 39.2082V39.2082C40.8576 39.4005 39.4005 40.8576 39.2082 42.7013V42.7013C38.9315 45.3533 36.1457 46.9618 33.7106 45.8753V45.8753C32.0178 45.12 30.0273 45.6533 28.9389 47.1539V47.1539C27.3733 49.3123 24.1565 49.3123 22.5909 47.1539V47.1539C21.5025 45.6533 19.512 45.12 17.8192 45.8753V45.8753C15.3841 46.9618 12.5983 45.3533 12.3216 42.7013V42.7013C12.1293 40.8576 10.6722 39.4005 8.82851 39.2082V39.2082C6.17646 38.9315 4.56803 36.1457 5.65449 33.7106V33.7106C6.40978 32.0178 5.87644 30.0273 4.37592 28.9389V28.9389C2.21749 27.3733 2.21749 24.1565 4.37592 22.5909V22.5909C5.87644 21.5025 6.40978 19.512 5.65449 17.8192V17.8192C4.56803 15.3841 6.17646 12.5983 8.82851 12.3216V12.3216C10.6722 12.1293 12.1293 10.6722 12.3216 8.82851V8.82851C12.5983 6.17646 15.3841 4.56803 17.8192 5.65449V5.65449C19.512 6.40978 21.5025 5.87644 22.5909 4.37592V4.37592Z"
              fill="#5686FF"
            />
            <motion.path
              initial={{
                opacity: 0,
                pathLength: 0,
                pathOffset: 1,
              }}
              animate={{
                opacity: 1,
                pathLength: 1,
                pathOffset: 0,
              }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.8 }}
              d="M33.7651 20.2649L22.7651 31.2649L17.7651 26.2649"
              stroke="white"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </motion.svg>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Page;
