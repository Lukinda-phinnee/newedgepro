"use client";

import React, { useState, useEffect } from "react";
import {
  Wind,
  Play,
  Pause,
  RotateCcw,
  Square,
  AlertCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BREATHING_EXERCISES, BreathingPatternDef } from "../sanctuary2-data";
import { sanctuary2Audio } from "../sanctuary2-audio";

export function BreathingTab() {
  const [selectedExercise, setSelectedExercise] = useState<BreathingPatternDef>(
    BREATHING_EXERCISES[0]
  );
  const [isActive, setIsActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(selectedExercise.durationMinutes * 60);

  // Dynamic phase & counter
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [phaseCounter, setPhaseCounter] = useState(selectedExercise.inhaleSec);

  // Switch exercise
  const handleSelectExercise = (ex: BreathingPatternDef) => {
    setIsActive(false);
    sanctuary2Audio.stop();
    setSelectedExercise(ex);
    setSecondsRemaining(ex.durationMinutes * 60);
    setPhase("Inhale");
    setPhaseCounter(ex.inhaleSec);
  };

  // Main countdown timer
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActive(false);
          sanctuary2Audio.playGentleChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  // Breathing Cycle Pacer
  useEffect(() => {
    if (!isActive) return;

    const breathTimer = setInterval(() => {
      setPhaseCounter((prev) => {
        if (prev <= 1) {
          // Switch to next phase
          setPhase((curr) => {
            switch (curr) {
              case "Inhale":
                if (selectedExercise.holdSec > 0) return "Hold";
                return "Exhale";
              case "Hold":
                return "Exhale";
              case "Exhale":
                if (selectedExercise.restSec > 0) return "Rest";
                return "Inhale";
              case "Rest":
                return "Inhale";
            }
          });

          // Set next count
          switch (phase) {
            case "Inhale":
              return selectedExercise.holdSec > 0 ? selectedExercise.holdSec : selectedExercise.exhaleSec;
            case "Hold":
              return selectedExercise.exhaleSec;
            case "Exhale":
              return selectedExercise.restSec > 0 ? selectedExercise.restSec : selectedExercise.inhaleSec;
            case "Rest":
              return selectedExercise.inhaleSec;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breathTimer);
  }, [isActive, phase, selectedExercise]);

  const togglePlay = () => {
    if (isActive) {
      setIsActive(false);
      sanctuary2Audio.stop();
    } else {
      setIsActive(true);
      sanctuary2Audio.play("wind");
      sanctuary2Audio.setVolume(0.35);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    sanctuary2Audio.stop();
    setSecondsRemaining(selectedExercise.durationMinutes * 60);
    setPhase("Inhale");
    setPhaseCounter(selectedExercise.inhaleSec);
  };

  const handleStopEmergency = () => {
    handleReset();
  };

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Dynamic animation scale for circle
  const getScale = () => {
    if (!isActive) return "scale-100";
    if (phase === "Inhale") return "scale-130 duration-[4000ms]";
    if (phase === "Hold") return "scale-130 duration-300";
    if (phase === "Exhale") return "scale-90 duration-[6000ms]";
    return "scale-90 duration-300";
  };

  const getPhaseColor = () => {
    if (phase === "Inhale") return "border-emerald-500/50 text-[#36C98F] shadow-[0_0_40px_rgba(54,201,143,0.3)]";
    if (phase === "Hold") return "border-amber-500/50 text-[#E9B44C] shadow-[0_0_30px_rgba(233,180,76,0.3)]";
    if (phase === "Exhale") return "border-[#FF3548]/50 text-[#FF3548] shadow-[0_0_40px_rgba(255,53,72,0.3)]";
    return "border-zinc-700 text-zinc-400";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3548]/10 border border-[#FF3548]/25 text-[#FF3548] text-xs font-mono font-medium tracking-wide mb-2">
          <Wind size={13} />
          <span>Somatic Autonomic Regulation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Breathing Exercises
        </h1>
        <p className="text-xs sm:text-sm text-[#9296A1] mt-1 max-w-2xl">
          Direct physiological intervention for downregulating acute market adrenaline and restoring prefrontal cortex executive decision-making.
        </p>
      </div>

      {/* 3 Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BREATHING_EXERCISES.map((ex) => {
          const isSelected = selectedExercise.id === ex.id;
          return (
            <div
              key={ex.id}
              onClick={() => handleSelectExercise(ex)}
              className={cn(
                "rounded-3xl border p-5 cursor-pointer transition-all flex flex-col justify-between shadow-lg",
                isSelected
                  ? "bg-[#171A21] border-[#FF3548] ring-1 ring-[#FF3548]/40"
                  : "bg-[#111318] border-[#232733] hover:border-zinc-700"
              )}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                  <span className={isSelected ? "text-[#FF3548] font-bold" : "text-zinc-400"}>
                    {ex.durationMinutes} min protocol
                  </span>
                  {isSelected && (
                    <span className="size-2 rounded-full bg-[#FF3548] animate-ping" />
                  )}
                </div>
                <h3 className="text-base font-bold text-white">{ex.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {ex.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#232733] text-[11px] font-mono text-zinc-500">
                Pacing: {ex.inhaleSec}s in · {ex.holdSec ? `${ex.holdSec}s hold · ` : ""}{ex.exhaleSec}s out
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Breathing Arena */}
      <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-8 flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden shadow-2xl">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-[#FF3548]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Selected Protocol Badge & Timer */}
        <div className="flex items-center justify-between w-full max-w-md border-b border-[#232733] pb-4 mb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">Active Protocol</span>
            <span className="text-sm font-bold text-white">{selectedExercise.name}</span>
          </div>
          <div className="font-mono text-xl font-bold text-[#FF3548] bg-[#111318] px-3.5 py-1 rounded-xl border border-[#232733]">
            {formatMinSec(secondsRemaining)}
          </div>
        </div>

        {/* Animated Expanding / Contracting Circle */}
        <div className="relative flex items-center justify-center size-64 my-6">
          {/* Static reference ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#232733]" />

          {/* Dynamic Breathing Circle */}
          <div
            className={cn(
              "size-44 rounded-full border-2 bg-gradient-to-br from-[#111318] to-[#090A0D] flex flex-col items-center justify-center transition-all ease-in-out text-center p-3 select-none",
              getScale(),
              getPhaseColor()
            )}
          >
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              {isActive ? phase : "Ready"}
            </span>
            <div className="text-3xl font-mono font-extrabold text-white mt-1">
              {isActive ? `${phaseCounter}s` : "Start"}
            </div>
          </div>
        </div>

        {/* Sensory Instruction Prompt */}
        <p className="text-xs font-mono text-zinc-400 text-center max-w-md mb-6 h-6">
          {isActive
            ? phase === "Inhale"
              ? selectedExercise.cueInhale
              : phase === "Hold"
              ? selectedExercise.cueHold
              : phase === "Exhale"
              ? selectedExercise.cueExhale
              : selectedExercise.cueRest
            : selectedExercise.purpose}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-2xl bg-[#111318] hover:bg-[#232733] text-zinc-400 hover:text-white border border-[#232733] transition-colors cursor-pointer"
            title="Reset exercise"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="px-6 py-3 rounded-2xl bg-[#FF3548] hover:bg-[#E0283A] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FF3548]/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isActive ? (
              <>
                <Pause size={14} className="fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-current ml-0.5" />
                <span>Begin Breathwork</span>
              </>
            )}
          </button>

          {/* Safety immediate stop */}
          <button
            type="button"
            onClick={handleStopEmergency}
            className="p-3 rounded-2xl bg-[#111318] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-[#232733] transition-colors cursor-pointer"
            title="Stop immediately if lightheaded or dizzy"
          >
            <Square size={16} />
          </button>
        </div>

        {/* Safety Note */}
        <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          <ShieldAlert size={13} className="text-amber-500" />
          <span>Safety Notice: Stop immediately if you feel dizzy, breathless, or uncomfortable.</span>
        </div>

      </div>

    </div>
  );
}

