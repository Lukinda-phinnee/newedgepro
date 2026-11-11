"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Brain,
  Layers,
  Calendar,
  Wind,
  History,
  BarChart3,
  Sliders,
  Play,
  Sparkles,
  ArrowLeft,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sanctuary2Provider, useSanctuary2 } from "./sanctuary2-context";
import { GuidedPlayerModal } from "./player/guided-player-modal";
import { CompletionModal } from "./player/completion-modal";

import { OverviewTab } from "./subviews/overview-tab";
import { LibraryTab } from "./subviews/library-tab";
import { RoutineTab } from "./subviews/routine-tab";
import { BreathingTab } from "./subviews/breathing-tab";
import { HistoryTab } from "./subviews/history-tab";
import { InsightsTab } from "./subviews/insights-tab";
import { SettingsTab } from "./subviews/settings-tab";

type SubTab =
  | "overview"
  | "library"
  | "routine"
  | "breathing"
  | "history"
  | "insights"
  | "settings";

export function Sanctuary2View() {
  return (
    <Sanctuary2Provider>
      <Sanctuary2Inner />
    </Sanctuary2Provider>
  );
}

function Sanctuary2Inner() {
  const [activeTab, setActiveTab] = useState<SubTab>("overview");
  const { streakDays, todayCompletedMinutes, dailyTargetMinutes, startMeditation } = useSanctuary2();

  const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "library", label: "Guided Sessions", icon: Layers },
    { id: "routine", label: "My Routine", icon: Calendar },
    { id: "breathing", label: "Breathing Exercises", icon: Wind },
    { id: "history", label: "Session History", icon: History },
    { id: "insights", label: "Performance Insights", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Sliders },
  ] as const;

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col xl:flex-row gap-6 overflow-y-auto no-scrollbar pb-16 text-[#F5F5F5] font-sans select-none">
      
      {/* ─── LEFT SUB-NAVIGATION RAIL / SIDEBAR ─── */}
      <aside className="shrink-0 xl:w-64 w-full flex xl:flex-col flex-col gap-4">
        
        {/* Module Header Card */}
        <div className="p-4 rounded-3xl bg-[#111318] border border-[#232733] shadow-md flex items-center justify-between xl:flex-col xl:items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-[#FF3548] to-[#991422] flex items-center justify-center text-white shadow-md shadow-[#FF3548]/30">
              <Brain size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF3548] font-bold">
                  EdgePro v2
                </span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Mental Conditioning
              </h2>
            </div>
          </div>

          {/* Quick Streak & Target pill */}
          <div className="flex items-center gap-2 xl:w-full xl:pt-3 xl:border-t xl:border-[#232733] text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 text-[#E9B44C]">
              <Flame size={12} className="fill-current" />
              {streakDays}d
            </span>
            <span>•</span>
            <span className="text-zinc-300">
              {todayCompletedMinutes}/{dailyTargetMinutes}m today
            </span>
          </div>
        </div>

        {/* Navigation Buttons List */}
        <nav
          aria-label="Sanctuary 2 Sub Navigation"
          className="p-2 rounded-3xl bg-[#111318] border border-[#232733] shadow-md flex xl:flex-col flex-row overflow-x-auto no-scrollbar gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                  isActive
                    ? "bg-[#171A21] text-white border border-[#FF3548]/50 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-[#171A21]/50 border border-transparent"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    isActive ? "text-[#FF3548]" : "text-zinc-400"
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Launch & Comparison Helper */}
        <div className="hidden xl:flex flex-col gap-3 p-4 rounded-3xl bg-[#111318] border border-[#232733]">
          <div className="text-[11px] text-zinc-400 font-mono">
            <span>Compare with Original:</span>
            <Link
              href="/sanctuary"
              className="mt-1 flex items-center justify-between text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <span>Sanctuary (v1)</span>
              <ArrowLeft size={12} className="rotate-180" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => startMeditation("focused-attention", 10)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF3548] hover:bg-[#E0283A] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#FF3548]/25 transition-transform hover:scale-102 cursor-pointer"
          >
            <Play size={12} className="fill-current ml-0.5" />
            <span>Quick Start 10m</span>
          </button>
        </div>

      </aside>

      {/* ─── MAIN ACTIVE TAB CONTENT CANVAS ─── */}
      <main className="flex-1 min-w-0">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "library" && <LibraryTab />}
        {activeTab === "routine" && <RoutineTab />}
        {activeTab === "breathing" && <BreathingTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "insights" && <InsightsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>

      {/* ─── MODALS ─── */}
      <GuidedPlayerModal />
      <CompletionModal />

    </div>
  );
}

