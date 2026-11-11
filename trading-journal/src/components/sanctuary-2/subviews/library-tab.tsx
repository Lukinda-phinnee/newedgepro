"use client";

import React, { useState } from "react";
import {
  Play,
  Clock,
  Sparkles,
  Shield,
  Brain,
  Layers,
  ChevronDown,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuary2 } from "../sanctuary2-context";
import { MEDITATION_SESSIONS } from "../sanctuary2-data";
import { MeditationSessionDef } from "../sanctuary2-types";

export function LibraryTab() {
  const { startMeditation } = useSanctuary2();
  const [selectedDuration, setSelectedDuration] = useState<{ [key: string]: number }>({
    "focused-attention": 10,
    "mindfulness": 5,
    "body-scan": 5,
  });

  const handleDurationSelect = (sessionId: string, mins: number) => {
    setSelectedDuration((prev) => ({ ...prev, [sessionId]: mins }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3548]/10 border border-[#FF3548]/25 text-[#FF3548] text-xs font-mono font-medium tracking-wide mb-2">
          <Layers size={13} />
          <span>Core Methodology</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Guided Sessions Library
        </h1>
        <p className="text-xs sm:text-sm text-[#9296A1] mt-1 max-w-2xl">
          Three neuro-cognitive meditation techniques developed specifically for intraday Forex traders to regulate impulse, sharpen attention, and eliminate emotional drift.
        </p>
      </div>

      {/* 3 Core Meditation Cards */}
      <div className="space-y-6">
        {MEDITATION_SESSIONS.map((session, index) => {
          const duration = selectedDuration[session.id] ?? session.defaultDurationMinutes;

          return (
            <div
              key={session.id}
              className="rounded-3xl bg-[#171A21] border border-[#232733] hover:border-zinc-700/80 p-6 sm:p-8 shadow-xl transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                
                {/* Left Column: Technique Info, Science, Trading Context */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#111318] text-[#FF3548] border border-[#232733]">
                      Technique {index + 1}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {session.category}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      {session.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                      {session.shortDescription}
                    </p>
                  </div>

                  {/* Scientific Purpose Box */}
                  <div className="p-4 rounded-2xl bg-[#111318] border border-[#232733] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                      <Brain size={13} className="text-[#36C98F]" />
                      <span>Scientific Purpose</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {session.scientificPurpose}
                    </p>
                  </div>

                  {/* Trading Applications Tags */}
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                      Targeted Trading Challenges
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {session.tradingApplications.map((app, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl bg-[#111318] border border-[#232733] text-[11px] text-zinc-300 font-sans"
                        >
                          • {app}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expected Outcome */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                    <span className="font-semibold text-zinc-300">Expected Outcome:</span>
                    <span>{session.expectedOutcome}</span>
                  </div>
                </div>

                {/* Right Column: Stages overview, Duration select, Start button */}
                <div className="lg:w-80 shrink-0 flex flex-col justify-between p-5 rounded-2xl bg-[#111318] border border-[#232733] space-y-5">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                      Session Structure
                    </span>
                    <div className="space-y-2 mt-3">
                      {session.stages.map((stg) => (
                        <div
                          key={stg.id}
                          className="flex items-center justify-between text-xs font-mono py-1 border-b border-[#232733]/60 last:border-0"
                        >
                          <span className="text-zinc-300">
                            {stg.stageNumber}. {stg.title}
                          </span>
                          <span className="text-zinc-500">
                            {Math.round(stg.durationSeconds / 60) > 0
                              ? `${Math.round(stg.durationSeconds / 60)}m`
                              : `${stg.durationSeconds}s`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">
                      Select Duration
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[5, 10, 15].map((mins) => {
                        const isChosen = duration === mins;
                        return (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => handleDurationSelect(session.id, mins)}
                            className={cn(
                              "py-1.5 rounded-xl text-xs font-mono font-medium border transition-colors cursor-pointer",
                              isChosen
                                ? "bg-[#FF3548] border-[#FF3548] text-white shadow-xs"
                                : "bg-[#171A21] border-[#232733] text-zinc-400 hover:text-white"
                            )}
                          >
                            {mins} min
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommended Context */}
                  <div className="text-[11px] text-zinc-400 font-mono bg-[#171A21] p-2.5 rounded-xl border border-[#232733]">
                    <span className="text-zinc-500 block text-[9px] uppercase">Best Timing</span>
                    {session.recommendedTradingContext}
                  </div>

                  {/* Start Button */}
                  <button
                    type="button"
                    onClick={() => startMeditation(session, duration)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF3548] hover:bg-[#E0283A] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FF3548]/30 transition-transform hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    <Play size={12} className="fill-current ml-0.5" />
                    <span>Start Guided Session</span>
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

