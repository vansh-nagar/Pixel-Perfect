/**
 * A door that swings open on hover with a springy 3D hinge, revealing a glowing light behind it.
 */
"use client";

import { motion } from "framer-motion";

const doorVariants = {
  rest: { rotateY: 0 },
  open: { rotateY: -105 },
};

const SwingDoorReveal = () => {
  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="open"
      className="cursor-pointer"
      style={{ perspective: 900 }}
    >
      <div
        className="relative h-32 w-24 rounded-sm border-2 border-foreground/40 bg-foreground/5 p-[3px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* the room behind the door */}
        <div className="absolute inset-[3px] flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[1px]">
          <motion.div
            className="size-6 rounded-full bg-foreground blur-md"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
          <span className="text-[8px] uppercase tracking-widest text-foreground/70">
            hello
          </span>
        </div>

        {/* the door */}
        <motion.div
          variants={doorVariants}
          transition={{ type: "spring", stiffness: 150, damping: 13 }}
          className="absolute inset-[3px] flex items-center justify-center rounded-[1px] border border-foreground/25 bg-muted"
          style={{ transformOrigin: "left center" }}
        >
          <span className="text-[8px] uppercase tracking-widest text-foreground/50">
            hover
          </span>
          <div className="absolute right-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-foreground/50" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SwingDoorReveal;
