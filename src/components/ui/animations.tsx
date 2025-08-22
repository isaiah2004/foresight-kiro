"use client";

import { PropsWithChildren } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Common variants
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(2px)" },
};

type Duration = "fast" | "normal" | "slow";
const durations: Record<Duration, number> = { fast: 0.15, normal: 0.25, slow: 0.4 };

export function FadeIn(
  { children, className, duration = "normal", ...rest }:
  PropsWithChildren<{ className?: string; duration?: Duration } & React.ComponentProps<typeof motion.div>>
) {
  return (
    <motion.div
      className={cn(className)}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: durations[duration], ease: "easeOut" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp(
  { children, className, duration = "normal", ...rest }:
  PropsWithChildren<{ className?: string; duration?: Duration } & React.ComponentProps<typeof motion.div>>
) {
  return (
    <motion.div
      className={cn(className)}
      variants={slideUpVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: durations[duration], ease: "easeOut" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition(
  { children, className, duration = "normal", ...rest }:
  PropsWithChildren<{ className?: string; duration?: Duration } & React.ComponentProps<typeof motion.main>>
) {
  return (
    <AnimatePresence mode="wait">
      <motion.main
        className={cn(className)}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: durations[duration], ease: "easeOut" }}
        {...rest}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

export { motion, AnimatePresence };
