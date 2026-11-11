"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Brain,
  BarChart3,
  Activity,
  Shield,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  Flame,
} from "lucide-react";
import { useSanctuary2 } from "../sanctuary2-context";

export function InsightsTab() {
  const { sessionHistory, streakDays, todayCompletedMinutes } = useSanctuary2();

  const totalMinutes = sessionHistory.reduce((a, b) => a + b.durationMinutes, 0) + todayCompletedMinutes;
  const avgDuration =
    sessionHistory.length > 0
      ? Math.round(totalMinutes / (sessionHistory.length || 1))
      : 8;

  const avgPre =
    sessionHistory.length > 0
      ? (sessionHistory.reduce((a, b) => a + (b.beforeIntensity ?? 6), 0) / sessionHistory.length).toFixed(1)
      : "6.5";

  const avgPost =
    sessionHistory.length > 0
      ? (sessionHistory.reduce((a, b) => a + b.afterIntensity, 0) / sessionHistory.length).toFixed(1)
      : "2.7";

  const deltaImprovement = (parseFloat(avgPre) - parseFloat(avgPost)).toFixed(1);

  // Common reported states breakdown
  const emotionCounts = {
    Focused: 14,
    Calm: 11,
    Relaxed: 8,
    Anxious: 6,
    Frustrated: 4,
    Impatient: 3,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3548]/10 border border-[#FF3548]/25 text-[#FF3548] text-xs font-mono font-medium tracking-wide mb-2">
          <BarChart3 size={13} />
          <span>Performance Analytics</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Mental Conditioning Insights
        </h1>
        <p className="text-xs sm:text-sm text-[#9296A1] mt-1 max-w-2xl">
          Quantitative tracking of autonomic down-regulation, emotional intensity shifts, and routine adherence consistency.
        </p>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-[#171A21] border border-[#232733] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Weekly Consistency</span>
            <Flame size={16} className="text-[#E9B44C]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-white">88%</div>
            <span className="text-[11px] text-[#36C98F] font-mono mt-0.5 block">+12% vs last week</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Streak: {streakDays} active trading days</span>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-[#171A21] border border-[#232733] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Avg Duration</span>
            <Activity size={16} className="text-[#FF3548]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-white">{avgDuration}m</div>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">Recommended: 8-12m</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Total Volume: {totalMinutes}m logged</span>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-[#171A21] border border-[#232733] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pre vs Post Shift</span>
            <ArrowDownRight size={16} className="text-[#36C98F]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-[#36C98F]">-{deltaImprovement} pts</div>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">
              {avgPre} down to {avgPost} / 10
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">58% somatic charge reduction</span>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-[#171A21] border border-[#232733] shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Impulse Incidents</span>
            <Shield size={16} className="text-[#36C98F]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-white">0</div>
            <span className="text-[11px] text-[#36C98F] font-mono mt-0.5 block">Zero checklist breaches</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">100% adherence to plan risk</span>
        </div>

      </div>

      {/* Emotional Intensity Delta Comparison Chart Box */}
      <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232733] pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Emotional Intensity Before vs. After Conditioning
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparative visualization of nervous system activation before opening charts versus after meditation
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#FF3548]">
              <span className="size-2.5 rounded-full bg-[#FF3548]" />
              Before (Average {avgPre})
            </span>
            <span className="flex items-center gap-1.5 text-[#36C98F]">
              <span className="size-2.5 rounded-full bg-[#36C98F]" />
              After (Average {avgPost})
            </span>
          </div>
        </div>

        {/* Bar Comparison Chart */}
        <div className="space-y-4 pt-2">
          {[
            { label: "Monday (Pre-London FOMO)", pre: 7.8, post: 3.0 },
            { label: "Tuesday (Post-Stop Loss Tilt)", pre: 8.5, post: 3.2 },
            { label: "Wednesday (Pre-CPI Release)", pre: 6.9, post: 2.5 },
            { label: "Thursday (NY Open Over-leverage Urge)", pre: 7.2, post: 2.8 },
            { label: "Friday (Post-Market Decompression)", pre: 5.4, post: 2.0 },
          ].map((bar, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">{bar.label}</span>
                <span className="text-zinc-400">
                  <span className="text-[#FF3548] font-semibold">{bar.pre}</span> →{" "}
                  <span className="text-[#36C98F] font-semibold">{bar.post}</span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#111318] overflow-hidden flex p-0.5 gap-1 border border-[#232733]">
                {/* Pre bar */}
                <div
                  className="h-full bg-[#FF3548]/70 rounded-full transition-all duration-500"
                  style={{ width: `${bar.pre * 10}%` }}
                />
                {/* Post marker */}
                <div
                  className="h-full bg-[#36C98F] rounded-full transition-all duration-500"
                  style={{ width: `${bar.post * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reported States Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Emotion Frequency */}
        <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Most Frequently Reported Emotional States
          </h3>
          <p className="text-xs text-zinc-400">
            Distribution of psychological states self-assessed during check-ins over the past 30 days.
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(emotionCounts).map(([emotion, count]) => (
              <div key={emotion} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">{emotion}</span>
                  <span className="text-zinc-400">{count} times</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#111318] overflow-hidden border border-[#232733]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      ["Focused", "Calm", "Relaxed"].includes(emotion)
                        ? "bg-[#36C98F]"
                        : "bg-[#FF3548]"
                    )}
                    style={{ width: `${(count / 15) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Trading Rule Adherence & Non-Causation Notice */}
        <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Rule Adherence Integration
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Correlated with trades logged in your EdgePro Trading Journal.
            </p>

            <div className="space-y-3 mt-4 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-[#111318] border border-[#232733] flex items-center justify-between">
                <span className="text-zinc-400">Days with Pre-Market Meditation:</span>
                <span className="font-bold text-[#36C98F]">96% Rule Adherence</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111318] border border-[#232733] flex items-center justify-between">
                <span className="text-zinc-400">Days without Pre-Market Meditation:</span>
                <span className="font-bold text-[#FF3548]">71% Rule Adherence</span>
              </div>
            </div>
          </div>

          {/* Scientific Disclaimer Note */}
          <div className="p-4 rounded-2xl bg-[#111318] border border-[#232733] text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2.5">
            <Info size={15} className="text-zinc-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-zinc-300">Methodological Note:</strong> Correlation does not demonstrate direct causation. Meditation trains emotional non-reactivity and attentional focus, which supports consistent trade plan adherence. Profitability remains dependent on strategy edge, execution, and risk control.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
