"use client";

import React, { useState } from "react";
import { CheckCircle2, X, Sparkles, Brain, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuary2 } from "../sanctuary2-context";
import { PostSessionFeeling } from "../sanctuary2-types";

const FEELING_OPTIONS: PostSessionFeeling[] = [
  "Calm",
  "Focused",
  "Relaxed",
  "Still anxious",
  "Still frustrated",
  "Neutral",
  "Tired",
];

export function CompletionModal() {
  const {
    isCompletionOpen,
    lastCompletedRecord,
    closeCompletionModal,
    saveCompletedSession,
  } = useSanctuary2();

  const [selectedFeeling, setSelectedFeeling] = useState<PostSessionFeeling>("Focused");
  const [intensity, setIntensity] = useState<number>(3);
  const [reflectionText, setReflectionText] = useState("");

  if (!isCompletionOpen || !lastCompletedRecord) return null;

  const handleSave = () => {
    saveCompletedSession({
      afterFeeling: selectedFeeling,
      afterIntensity: intensity,
      reflectionNotes: reflectionText,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0D]/90 backdrop-blur-xl p-4 text-[#F5F5F5] select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111318] border border-[#232733] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#232733] pb-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-[#36C98F] flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Session Completed
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {lastCompletedRecord.sessionTitle || "Meditation"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCompletionModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#171A21] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Session Summary Metadata */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#171A21] border border-[#232733] text-center font-mono">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Duration</span>
            <span className="text-sm font-semibold text-white">{lastCompletedRecord.durationMinutes ?? 10} min</span>
          </div>
          <div className="border-x border-[#232733]">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Technique</span>
            <span className="text-xs font-semibold text-zinc-200 truncate block px-1">
              {lastCompletedRecord.technique ?? "Mindfulness"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Status</span>
            <span className="text-xs font-semibold text-[#36C98F]">100% Complete</span>
          </div>
        </div>

        {/* Question 1: How do you feel now? */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
            How do you feel right now?
          </label>
          <div className="flex flex-wrap gap-2">
            {FEELING_OPTIONS.map((feeling) => {
              const isSelected = selectedFeeling === feeling;
              return (
                <button
                  key={feeling}
                  type="button"
                  onClick={() => setSelectedFeeling(feeling)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#FF3548] border-[#FF3548] text-white shadow-sm"
                      : "bg-[#171A21] border-[#232733] text-zinc-400 hover:text-white hover:border-zinc-600"
                  )}
                >
                  {feeling}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 2: How intense is your emotional state now? (1-10 slider) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span className="text-zinc-300">Emotional Intensity Now</span>
            <span className="font-mono text-sm text-[#FF3548]">{intensity} / 10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg accent-[#FF3548] bg-[#232733] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>1 (Very Calm / Settled)</span>
            <span>10 (Overwhelming / Agitated)</span>
          </div>
        </div>

        {/* Question 3: Optional reflection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 block">
            What did you notice during this session? <span className="text-zinc-500 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="e.g. Felt a sudden urge to check the charts around minute 3, but acknowledged it and let it pass..."
            className="w-full rounded-xl bg-[#171A21] border border-[#232733] px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-[#FF3548] transition-colors resize-none"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF3548] hover:bg-[#E0283A] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FF3548]/30 transition-all cursor-pointer"
          >
            <span>Save Reflection & Return</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}

