"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BreathingRingProps {
  phase: "Inhale" | "Hold" | "Exhale" | "Rest";
  counter: number;
  progressPercent: number; // 0 to 100 overall session progress
  techniqueName: string;
}

export function BreathingRing({
  phase,
  counter,
  progressPercent,
  techniqueName,
}: BreathingRingProps) {
  // Scale calculations for organic smooth expansion/contraction
  const getScaleClass = () => {
    switch (phase) {
      case "Inhale":
        return "scale-125 duration-[4000ms]";
      case "Hold":
        return "scale-125 duration-300";
      case "Exhale":
        return "scale-90 duration-[5000ms]";
      case "Rest":
        return "scale-90 duration-300";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "Inhale":
        return "text-[#36C98F] border-[#36C98F]/40 shadow-[0_0_35px_rgba(54,201,143,0.25)]";
      case "Hold":
        return "text-[#E9B44C] border-[#E9B44C]/40 shadow-[0_0_30px_rgba(233,180,76,0.25)]";
      case "Exhale":
        return "text-[#FF3548] border-[#FF3548]/40 shadow-[0_0_35px_rgba(255,53,72,0.25)]";
      case "Rest":
        return "text-zinc-400 border-zinc-700/60 shadow-[0_0_20px_rgba(255,255,255,0.05)]";
    }
  };

  return (
    <div className="relative flex items-center justify-center size-72 sm:size-84 select-none">
      {/* Outer Progress SVG Ring */}
      <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="#1F232D"
          strokeWidth="2.5"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="#FF3548"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray="289"
          strokeDashoffset={289 - (289 * progressPercent) / 100}
          fill="none"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Pulsing Breathing Aura */}
      <div
        className={cn(
          "absolute size-48 sm:size-56 rounded-full border bg-gradient-to-br from-[#171A21]/90 to-[#0F1116]/95 backdrop-blur-md flex flex-col items-center justify-center transition-all ease-in-out",
          getScaleClass(),
          getPhaseColor()
        )}
      >
        {/* Subtle breathing ripple */}
        <div className="text-center px-4">
          <span className="text-[10px] tracking-widest uppercase font-mono text-zinc-400 font-semibold block mb-0.5">
            {techniqueName}
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
            {phase}
          </div>
          <div className="text-sm font-mono text-zinc-400 mt-1">
            {counter}s
          </div>
        </div>
      </div>
    </div>
  );
}

