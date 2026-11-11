"use client";

import React, { useState } from "react";
import {
  Play,
  Flame,
  Clock,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
  Check,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuary2 } from "../sanctuary2-context";
import { EmotionalFeeling } from "../sanctuary2-types";
import { MEDITATION_SESSIONS } from "../sanctuary2-data";

const READINESS_OPTIONS: EmotionalFeeling[] = [
  "Calm",
  "Focused",
  "Anxious",
  "Frustrated",
  "Excited",
  "Tired",
  "Impatient",
];

export function OverviewTab() {
  const {
    todayCompletedMinutes,
    dailyTargetMinutes,
    streakDays,
    sessionHistory,
    readinessCheckins,
    startMeditation,
    saveReadinessCheckin,
  } = useSanctuary2();

  // Readiness Check-in local form state
  const [selectedFeelings, setSelectedFeelings] = useState<EmotionalFeeling[]>(["Focused"]);
  const [checkinIntensity, setCheckinIntensity] = useState<number>(4);
  const [checkinSavedToast, setCheckinSavedToast] = useState(false);

  const remainingMinutes = Math.max(0, dailyTargetMinutes - todayCompletedMinutes);
  const progressPercent = Math.min(100, Math.round((todayCompletedMinutes / dailyTargetMinutes) * 100));

  const toggleFeeling = (f: EmotionalFeeling) => {
    if (selectedFeelings.includes(f)) {
      if (selectedFeelings.length > 1) {
        setSelectedFeelings((prev) => prev.filter((item) => item !== f));
      }
    } else {
      setSelectedFeelings((prev) => [...prev, f]);
    }
  };

  const handleSaveCheckin = () => {
    saveReadinessCheckin(selectedFeelings, checkinIntensity);
    setCheckinSavedToast(true);
    setTimeout(() => setCheckinSavedToast(false), 3000);
  };

  // Weekly stats calculations
  const totalWeeklyMinutes = sessionHistory.reduce((acc, curr) => acc + curr.durationMinutes, 0) + todayCompletedMinutes;
  const totalSessionsCompleted = sessionHistory.length;
  const avgBeforeIntensity =
    sessionHistory.length > 0
      ? (sessionHistory.reduce((acc, s) => acc + (s.beforeIntensity ?? 5), 0) / sessionHistory.length).toFixed(1)
      : "6.2";
  const avgAfterIntensity =
    sessionHistory.length > 0
      ? (sessionHistory.reduce((acc, s) => acc + s.afterIntensity, 0) / sessionHistory.length).toFixed(1)
      : "2.8";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ─── HERO HEADER ─── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#171A21] via-[#111318] to-[#090A0D] border border-[#232733] p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#FF3548]/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3548]/10 border border-[#FF3548]/25 text-[#FF3548] text-xs font-mono font-medium tracking-wide mb-3">
            <Brain size={13} />
            <span>EdgePro Mental Conditioning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Train your mind. Execute with discipline.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#9296A1] font-normal leading-relaxed">
            Build the mental consistency required to trade your plan. Develop emotional regulation, loss acceptance, and sustained focus under market volatility.
          </p>
        </div>
      </div>

      {/* ─── SECTION: DAILY MENTAL TRAINING + MENTAL READINESS CHECK (2 COLS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Daily Mental Training (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-[#171A21] border border-[#232733] p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#232733]">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-[#FF3548]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Daily Mental Training
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#E9B44C] text-xs font-mono font-medium">
                <Flame size={13} className="fill-current" />
                <span>{streakDays} Day Streak</span>
              </div>
            </div>

            {/* Target vs Completed Numbers */}
            <div className="grid grid-cols-3 gap-3 my-5 text-center font-mono">
              <div className="p-3 rounded-2xl bg-[#111318] border border-[#232733]">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Target</span>
                <span className="text-lg font-bold text-white mt-1 block">{dailyTargetMinutes}m</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#111318] border border-[#232733]">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Completed</span>
                <span className="text-lg font-bold text-[#36C98F] mt-1 block">{todayCompletedMinutes}m</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#111318] border border-[#232733]">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Remaining</span>
                <span className="text-lg font-bold text-zinc-300 mt-1 block">{remainingMinutes}m</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Daily Completion</span>
                <span className="text-white font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#111318] rounded-full overflow-hidden border border-[#232733]">
                <div
                  className="h-full bg-gradient-to-r from-[#FF3548] to-[#36C98F] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-[#232733] flex items-center justify-between text-xs text-zinc-400">
            <span>Trading session readiness:</span>
            <span className="font-semibold text-[#36C98F] flex items-center gap-1">
              <Shield size={13} />
              {progressPercent >= 50 ? "Conditioned & Primed" : "Needs 5m Pre-Market"}
            </span>
          </div>
        </div>

        {/* Mental Readiness Check (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232733]">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#FF3548]" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Mental Readiness Check
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Pre-session somatic emotional audit
                </span>
              </div>
            </div>
            {checkinSavedToast && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#36C98F] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-in fade-in">
                <CheckCircle2 size={12} />
                Logged!
              </span>
            )}
          </div>

          {/* Question: How are you feeling right now? */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-2">
              How are you feeling right now? <span className="text-zinc-500">(Select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {READINESS_OPTIONS.map((feeling) => {
                const isSelected = selectedFeelings.includes(feeling);
                return (
                  <button
                    key={feeling}
                    type="button"
                    onClick={() => toggleFeeling(feeling)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#FF3548]/15 border-[#FF3548] text-[#FF3548] shadow-xs"
                        : "bg-[#111318] border-[#232733] text-zinc-400 hover:text-white hover:border-zinc-700"
                    )}
                  >
                    {feeling}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question: Intensity slider 1-10 */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Emotional Intensity:</span>
              <span className="font-mono font-semibold text-[#FF3548]">{checkinIntensity} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={checkinIntensity}
              onChange={(e) => setCheckinIntensity(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg accent-[#FF3548] bg-[#111318] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>1 (Clear & Calm)</span>
              <span>5 (Moderate Charge)</span>
              <span>10 (Severe Tilt / Stress)</span>
            </div>
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center justify-between">
            <p className="text-[11px] text-zinc-500 max-w-sm">
              Recorded to compare pre-trade impulses with post-trade execution clarity.
            </p>
            <button
              type="button"
              onClick={handleSaveCheckin}
              className="px-4 py-2 rounded-xl bg-[#232733] hover:bg-[#FF3548] text-white hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              Save Check-in
            </button>
          </div>
        </div>

      </div>

      {/* ─── SECTION: TODAY'S RECOMMENDED ROUTINE (3 CARDS) ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Today's Recommended Routine
            </h2>
            <p className="text-xs text-[#9296A1]">
              Structured sessions aligned with daily intraday trading milestones
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Morning Focus */}
          <div className="group relative rounded-3xl bg-[#171A21] border border-[#232733] hover:border-[#FF3548]/40 p-5 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl shadow-md">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                <span className="text-[#FF3548] font-semibold uppercase tracking-wider">Card 1 · Morning Focus</span>
                <span className="px-2 py-0.5 rounded-md bg-[#111318] border border-[#232733]">10 min</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#FF3548] transition-colors">
                Focused-Attention
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Develop attention and reduce distraction. Repeatedly bring awareness back to the breath.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#232733] flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Attention Training</span>
              <button
                type="button"
                onClick={() => startMeditation("focused-attention", 10)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF3548] hover:bg-[#E0283A] text-white text-xs font-semibold shadow-md shadow-[#FF3548]/25 transition-transform hover:scale-102 cursor-pointer"
              >
                <Play size={11} className="fill-current ml-0.5" />
                <span>Start Session</span>
              </button>
            </div>
          </div>

          {/* Card 2: Pre-Market Preparation */}
          <div className="group relative rounded-3xl bg-[#171A21] border border-[#232733] hover:border-emerald-500/40 p-5 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl shadow-md">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                <span className="text-[#36C98F] font-semibold uppercase tracking-wider">Card 2 · Pre-Market</span>
                <span className="px-2 py-0.5 rounded-md bg-[#111318] border border-[#232733]">5 min</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#36C98F] transition-colors">
                Mindfulness Preparation
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Recognize emotional states before entering the market. Observe thoughts as information, not instructions.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#232733] flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Emotional Regulation</span>
              <button
                type="button"
                onClick={() => startMeditation("mindfulness", 5)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#36C98F] hover:bg-[#2EB37E] text-[#090A0D] text-xs font-bold shadow-md shadow-[#36C98F]/25 transition-transform hover:scale-102 cursor-pointer"
              >
                <Play size={11} className="fill-current ml-0.5" />
                <span>Start Session</span>
              </button>
            </div>
          </div>

          {/* Card 3: Post-Market Recovery */}
          <div className="group relative rounded-3xl bg-[#171A21] border border-[#232733] hover:border-amber-500/40 p-5 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl shadow-md">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                <span className="text-[#E9B44C] font-semibold uppercase tracking-wider">Card 3 · Post-Market</span>
                <span className="px-2 py-0.5 rounded-md bg-[#111318] border border-[#232733]">5 min</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#E9B44C] transition-colors">
                Body Scan Recovery
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Recognize physical tension in shoulders and jaw. Downregulate nervous system and leave trade stress behind.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#232733] flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Stress Recovery</span>
              <button
                type="button"
                onClick={() => startMeditation("body-scan", 5)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E9B44C] hover:bg-[#D4A342] text-[#090A0D] text-xs font-bold shadow-md shadow-[#E9B44C]/25 transition-transform hover:scale-102 cursor-pointer"
              >
                <Play size={11} className="fill-current ml-0.5" />
                <span>Start Session</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── SECTION: WEEKLY TRAINING OVERVIEW ─── */}
      <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-[#232733] pb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Weekly Training Overview
            </h3>
            <span className="text-[11px] text-[#9296A1]">
              Aggregated training volume and autonomic consistency metrics
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">Past 7 Days</span>
        </div>

        {/* 5 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
          <div className="p-4 rounded-2xl bg-[#111318] border border-[#232733]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Total Minutes</span>
            <span className="text-xl font-bold text-white mt-1 block">{totalWeeklyMinutes} min</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#111318] border border-[#232733]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Completed</span>
            <span className="text-xl font-bold text-[#FF3548] mt-1 block">{totalSessionsCompleted} sessions</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#111318] border border-[#232733]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Avg Pre-Intensity</span>
            <span className="text-xl font-bold text-amber-400 mt-1 block">{avgBeforeIntensity} / 10</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#111318] border border-[#232733]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Avg Post-Intensity</span>
            <span className="text-xl font-bold text-[#36C98F] mt-1 block">{avgAfterIntensity} / 10</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#111318] border border-[#232733]">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Consistency</span>
            <span className="text-xl font-bold text-[#36C98F] mt-1 block">85%</span>
          </div>
        </div>

        {/* Important Scientific Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#111318]/60 border border-[#232733] text-zinc-400 text-xs leading-relaxed">
          <AlertCircle size={16} className="text-zinc-500 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-zinc-300">Disclaimer:</span> Mental conditioning exercises develop emotional awareness, impulse resistance, and sustained attention. They are not financial advice and do not predict market direction or guarantee trading profitability.
          </p>
        </div>
      </div>

    </div>
  );
}

