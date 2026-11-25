"use client";

import { motion } from "framer-motion";

interface SlidingTabIndicatorProps {
  layoutId: string;
  className?: string;
}

export function SlidingTabIndicator({ layoutId, className = "" }: SlidingTabIndicatorProps) {
  return (
    <motion.span
      aria-hidden="true"
      layoutId={layoutId}
      className={`pointer-events-none absolute inset-0 z-[-1] rounded-lg bg-primary ${className}`}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
    />
  );
}
