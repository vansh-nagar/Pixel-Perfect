"use client";

/**
 * Soft white invite card with clean subtle micro-animations on mount —
 * staggered fade-ups, a springy avatar pop, gentle yoga-icon wiggle, and a
 * lift on hover. No noise, no loops; mounts once and rests.
 */

import { motion } from "framer-motion";

const SPRING = { type: "spring", stiffness: 300, damping: 26 } as const;

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0 },
};

const YogaInviteCard = () => {
  return (
    <div
      className="relative grid h-80 w-[420px] place-items-center"
      style={{ fontFamily: "ui-sans-serif, system-ui" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        transition={SPRING}
        className="relative cursor-pointer bg-white"
        style={{
          width: 304,
          padding: "22px 24px 20px",
          borderRadius: 24,
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.025), 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -6px rgba(0,0,0,0.08), 0 32px 64px -20px rgba(0,0,0,0.14)",
        }}
      >
        <motion.div
          initial="hidden"
          animate="shown"
          transition={{ delayChildren: 0.12, staggerChildren: 0.06 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2.5">
            <motion.img
              variants={{
                hidden: { opacity: 0, scale: 0.4 },
                shown: { opacity: 1, scale: 1 },
              }}
              transition={{ type: "spring", stiffness: 420, damping: 20 }}
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces&auto=format&q=80"
              alt="Lisa Jones"
              className="size-9 shrink-0 rounded-full object-cover"
              style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08)" }}
            />
            <motion.span
              variants={fadeUp}
              className="text-[22px] font-semibold leading-none tracking-tight text-neutral-900"
            >
              Lisa Jones
            </motion.span>
          </div>

          <motion.p
            variants={fadeUp}
            className="mt-2.5 text-[15px] leading-tight text-neutral-400"
          >
            is going to join you for:
          </motion.p>

          <div className="mt-1 flex items-center gap-2">
            <motion.span
              variants={fadeUp}
              className="text-[20px] font-semibold leading-tight tracking-tight text-neutral-900"
            >
              Yoga: Sunset class
            </motion.span>
            <motion.div
              initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 380,
                damping: 16,
              }}
              whileHover={{
                rotate: [0, -8, 8, -4, 0],
                transition: { duration: 0.55, ease: "easeInOut" },
              }}
              className="grid size-7 shrink-0 place-items-center overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #F1EBF6 0%, #E0D2EC 100%)",
                borderRadius: 8,
                boxShadow:
                  "0 1px 1px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)",
              }}
            >
              <img
                src="https://api.iconify.design/noto:woman-in-lotus-position.svg"
                alt="Yoga"
                className="size-4"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.45, ease: "easeOut" }}
            className="my-4 h-px origin-left bg-neutral-200/80"
          />

          <motion.div
            initial="hidden"
            animate="shown"
            transition={{ delayChildren: 0.55, staggerChildren: 0.05 }}
            className="flex flex-col items-center text-center text-[14px] leading-[1.6] text-neutral-400"
          >
            <motion.span variants={fadeUp}>Sun Jun 21</motion.span>
            <motion.span variants={fadeUp}>8:00 pm – 9:00 pm</motion.span>
            <motion.span variants={fadeUp}>Brooklyn studio</motion.span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default YogaInviteCard;
