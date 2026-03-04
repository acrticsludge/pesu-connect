"use client";

import { motion, isValidMotionProp } from "framer-motion";
import React from "react";

interface AnimationWrapperProps {
  children: React.ReactNode;
  type?: "fadeInUp" | "slideInRight" | "slideInLeft" | "scaleIn";
  delay?: number;
  duration?: number;
  className?: string;
}

const variants = {
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

export default function AnimationWrapper({
  children,
  type = "fadeInUp",
  delay = 0,
  duration = 0.6,
  className = "",
}: AnimationWrapperProps) {
  return (
    <motion.div
      variants={variants[type]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
