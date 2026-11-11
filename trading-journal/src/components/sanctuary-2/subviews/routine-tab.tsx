"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Bell,
  BellOff,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Sun,
  Zap,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuary2 } from "../sanctuary2-context";
import { RoutineItem } from "../sanctuary2-types";

export function RoutineTab() {
  const {
    routineItems,
    toggleRoutineItem,
    updateRoutineDuration,
    startMeditation,
  } = useSanctuary2();

  const activeRoutinesCount = routineItems.filter((r) => r.enabled).length;
  const totalRoutineMinutes = routineItems
    .filter((r) => r.enabled)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const getContextIcon = (ctx: RoutineItem["tradingContext"]) => {
    switch (ctx) {
      case "morning":
        return <Sun size={16} className="text-amber-400" />;
      case "pre-market":
        return <Zap size={16} className="text-[#36C98F]" />;
      case "post-market":
        return <Moon size={16} className="text-indigo-400" />;
      default:
        return <Clock size={16} className="text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3548]/10 border border-[#FF3548]/25 text-[#FF3548] text-xs font-mono font-medium tracking-wide mb-2">
            <Calendar size={13} />
            <span>Trading Schedule Alignment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            My Daily Mental Routine
          </h1>
          <p className="text-xs sm:text-sm text-[#9296A1] mt-1 max-w-xl">
            Configure conditioning milestones around London & New York volatility windows. Protect your capital by cultivating baseline discipline before market open.
          </p>
        </div>

        {/* Routine Summary Badge */}
        <div className="p-4 rounded-2xl bg-[#171A21] border border-[#232733] font-mono flex items-center gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase">Active Slots</span>
            <span className="text-white font-bold">{activeRoutinesCount} of {routineItems.length}</span>
          </div>
          <div className="border-l border-[#232733] pl-4">
            <span className="text-zinc-500 block text-[10px] uppercase">Daily Budget</span>
            <span className="text-[#36C98F] font-bold">{totalRoutineMinutes} min/day</span>
          </div>
        </div>
      </div>

      {/* Routine Cards List */}
      <div className="space-y-4">
        {routineItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-3xl border p-6 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5",
              item.enabled
                ? "bg-[#171A21] border-[#232733]"
                : "bg-[#111318]/60 border-[#1f232d] opacity-60"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-[#111318] border border-[#232733] flex items-center justify-center shrink-0 mt-0.5">
                {getContextIcon(item.tradingContext)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {item.name}
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#111318] text-zinc-400 border border-[#232733]">
                    {item.tradingContext}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Scheduled for {item.preferredTime} · {item.durationMinutes} minutes · {item.technique}
                </p>
              </div>
            </div>

            {/* Right controls: Duration Selector, Reminder, Toggle, Start */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Duration Pills */}
              <div className="flex items-center bg-[#111318] border border-[#232733] rounded-xl p-1 gap-1">
                {[5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={!item.enabled}
                    onClick={() => updateRoutineDuration(item.id, mins)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer disabled:cursor-not-allowed",
                      item.durationMinutes === mins
                        ? "bg-[#FF3548] text-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Start Immediate Session */}
              <button
                type="button"
                disabled={!item.enabled}
                onClick={() => startMeditation(item.sessionId, item.durationMinutes)}
                className="px-3.5 py-2 rounded-xl bg-[#232733] hover:bg-[#FF3548] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={11} className="fill-current ml-0.5" />
                <span>Start</span>
              </button>

              {/* Enable / Disable Toggle */}
              <button
                type="button"
                onClick={() => toggleRoutineItem(item.id)}
                className={cn(
                  "px-3 py-2 rounded-xl border text-xs font-mono transition-colors cursor-pointer",
                  item.enabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-[#111318] border-[#232733] text-zinc-500"
                )}
              >
                {item.enabled ? "Active" : "Disabled"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Routine Scheduling Guidelines Box */}
      <div className="rounded-3xl bg-[#171A21] border border-[#232733] p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Professional Execution Rules
        </h3>
        <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
          <li>
            <strong className="text-zinc-200">Never meditate mid-execution:</strong> Complete pre-market preparation 15 minutes before the economic calendar news print or session open.
          </li>
          <li>
            <strong className="text-zinc-200">Single vs Multi-Session:</strong> If you only trade the New York open, disable the London pre-market slot to avoid cognitive fatigue.
          </li>
          <li>
            <strong className="text-zinc-200">Post-Market Boundary:</strong> A 5-minute Body Scan guarantees you do not carry drawdown anger or win euphoria into personal interactions.
          </li>
        </ul>
      </div>

    </div>
  );
}

