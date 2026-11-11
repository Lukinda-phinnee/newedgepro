"use client";

import React, { useState } from "react";
import {
  History,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  FileText,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctuary2 } from "../sanctuary2-context";
import { MeditationTechnique } from "../sanctuary2-types";

export function HistoryTab() {
  const { sessionHistory } = useSanctuary2();
  const [filterTechnique, setFilterTechnique] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = sessionHistory.filter((item) => {
    const matchesTech = filterTechnique === "all" || item.technique === filterTechnique;
    const matchesSearch =
      item.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reflectionNotes && item.reflectionNotes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.afterFeeling.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTech && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3548]/10 border border-[#FF3548]/25 text-[#FF3548] text-xs font-mono font-medium tracking-wide mb-2">
            <History size={13} />
            <span>Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Session History & Reflections
          </h1>
          <p className="text-xs sm:text-sm text-[#9296A1] mt-1 max-w-xl">
            Detailed log of completed conditioning repetitions, qualitative market reflections, and emotional state shifts.
          </p>
        </div>

        {/* Count Badge */}
        <div className="px-4 py-2 rounded-2xl bg-[#171A21] border border-[#232733] font-mono text-xs text-zinc-300">
          Total Recorded: <span className="font-bold text-[#FF3548]">{sessionHistory.length}</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#171A21] border border-[#232733]">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: "all", label: "All Sessions" },
            { id: "focused-attention", label: "Attention" },
            { id: "mindfulness", label: "Mindfulness" },
            { id: "body-scan", label: "Body Scan" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTechnique(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                filterTechnique === tab.id
                  ? "bg-[#FF3548] text-white shadow-xs"
                  : "text-zinc-400 hover:text-white hover:bg-[#111318]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections or states..."
            className="w-full bg-[#111318] border border-[#232733] rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-[#FF3548]"
          />
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#171A21] border border-[#232733] space-y-2">
            <History size={32} className="mx-auto text-zinc-600" />
            <h3 className="text-sm font-semibold text-zinc-300">No session records match</h3>
            <p className="text-xs text-zinc-500">
              Complete a guided meditation session to record your emotional shifts and qualitative insights.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-[#171A21] border border-[#232733] p-5 sm:p-6 shadow-lg space-y-4 hover:border-zinc-700 transition-all"
            >
              {/* Top Row: Title, Date, Duration */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232733] pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[#36C98F] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {item.sessionTitle}
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {item.completedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-[#111318] border border-[#232733] text-zinc-300">
                    {item.durationMinutes} min
                  </span>
                  <span className="text-[#36C98F] font-semibold">100% Completed</span>
                </div>
              </div>

              {/* Emotional State Comparison (Before vs After) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#111318] border border-[#232733] text-xs">
                {/* Before */}
                <div className="flex items-center justify-between pr-3 sm:border-r border-[#232733]">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">Before Session</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300 font-medium">
                      {item.beforeFeelings?.join(", ") || "Moderate Charge"}
                    </span>
                    <span className="font-mono text-[#FF3548] font-bold">
                      {item.beforeIntensity ?? 6}/10
                    </span>
                  </div>
                </div>

                {/* After */}
                <div className="flex items-center justify-between sm:pl-3">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">After Session</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-medium">
                      {item.afterFeeling}
                    </span>
                    <span className="font-mono text-[#36C98F] font-bold">
                      {item.afterIntensity}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Reflection Note */}
              {item.reflectionNotes && (
                <div className="flex items-start gap-2.5 text-xs text-zinc-300 bg-[#111318]/50 p-3.5 rounded-2xl border border-[#232733]">
                  <FileText size={15} className="text-zinc-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed italic">
                    "{item.reflectionNotes}"
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

