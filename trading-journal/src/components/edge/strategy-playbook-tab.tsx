"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  FileText,
  Lightbulb,
  Percent,
  Plus,
  Shield,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChecklistItem, DisqualifierItem, Strategy } from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyPlaybookTabProps {
  strategy: Strategy;
  onUpdateStrategy: (updated: Partial<Strategy>) => void;
}

export function StrategyPlaybookTab({
  strategy,
  onUpdateStrategy,
}: StrategyPlaybookTabProps) {
  // Local state for checking items during live evaluation
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newChecklistPhase, setNewChecklistPhase] = useState<
    "PRE_CONDITION" | "TRIGGER" | "CONFIRMATION"
  >("TRIGGER");
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checklist = strategy.entryChecklist || [];
  const completedCount = checklist.filter((item) => checkedItems[item.id]).length;
  const isAplusReady =
    checklist.length > 0 &&
    checklist
      .filter((item) => item.required)
      .every((item) => checkedItems[item.id]);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: "c_" + Date.now(),
      label: newChecklistText.trim(),
      phase: newChecklistPhase,
      required: true,
    };
    onUpdateStrategy({
      entryChecklist: [...checklist, newItem],
    });
    setNewChecklistText("");
    setIsAddingChecklistItem(false);
  };

  const handleDeleteChecklistItem = (id: string) => {
    onUpdateStrategy({
      entryChecklist: checklist.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. The Core Thesis / Edge Premise ─── */}
      <div className="rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Lightbulb size={15} />
            </span>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Core Thesis & Market Anomaly
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Market Regime: <strong className="text-foreground">{strategy.marketRegime}</strong>
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
            {strategy.thesis ||
              "No detailed thesis documented yet. Define why institutional participants create this pricing imbalance."}
          </p>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Target Universe:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {strategy.assetUniverse.map((sym) => (
                <span
                  key={sym}
                  className="px-2 py-0.5 rounded bg-white/[0.05] border border-border/50 font-mono text-violet-300 font-medium"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. A+ Setup Confluence Checklist (Interactive Execution Simulator) ─── */}
      <div className="rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={15} />
              </span>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                A+ Execution Confluence Checklist
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Verify every structural condition before order submission. Non-negotiable criteria.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">
                Criteria Met
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {completedCount} / {checklist.length}
              </span>
            </div>

            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-colors",
                isAplusReady
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-white/[0.04] text-muted-foreground border-border/40"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isAplusReady ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"
                )}
              />
              {isAplusReady ? "A+ Qualified" : "Incomplete"}
            </div>
          </div>
        </div>

        {/* Checklist items by Phase */}
        <div className="mt-4 space-y-2.5">
          {checklist.map((item) => {
            const isChecked = !!checkedItems[item.id];
            const phaseBadges = {
              PRE_CONDITION: { label: "Pre-Condition", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
              TRIGGER: { label: "Trigger", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              CONFIRMATION: { label: "Confirmation", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
            };
            const phase = phaseBadges[item.phase] || phaseBadges.TRIGGER;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all group",
                  isChecked
                    ? "bg-emerald-500/[0.04] border-emerald-500/30"
                    : "bg-white/[0.02] border-border/50 hover:border-border"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border transition-colors mt-0.5",
                    isChecked
                      ? "bg-emerald-500 border-emerald-500 text-black shadow-sm"
                      : "border-border/80 bg-white/[0.02] hover:border-violet-400"
                  )}
                >
                  {isChecked && <Check size={13} strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border",
                        phase.color
                      )}
                    >
                      {phase.label}
                    </span>
                    {item.required && (
                      <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1 rounded">
                        Mandatory
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      "text-xs mt-1 leading-relaxed",
                      isChecked ? "text-foreground line-through opacity-80" : "text-foreground/90 font-medium"
                    )}
                  >
                    {item.label}
                  </p>

                  {item.notes && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                      Note: {item.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 p-1 transition-opacity"
                  title="Remove criterion"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}

          {/* Add Checklist Item Form */}
          {isAddingChecklistItem ? (
            <div className="p-3 rounded-xl border border-violet-500/40 bg-violet-500/[0.03] space-y-2 mt-3">
              <div className="flex items-center gap-2">
                <select
                  value={newChecklistPhase}
                  onChange={(e) =>
                    setNewChecklistPhase(
                      e.target.value as "PRE_CONDITION" | "TRIGGER" | "CONFIRMATION"
                    )
                  }
                  className="h-8 text-xs bg-card border border-border/70 rounded-lg px-2 text-foreground font-mono"
                >
                  <option value="PRE_CONDITION">Phase: Pre-Condition</option>
                  <option value="TRIGGER">Phase: Trigger</option>
                  <option value="CONFIRMATION">Phase: Confirmation</option>
                </select>
                <Input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="e.g. 5m Displacement candle closes outside Asian high"
                  className="h-8 text-xs flex-1"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingChecklistItem(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddChecklistItem}
                  className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                >
                  Add Criterion
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingChecklistItem(true)}
              className="mt-2 text-xs border-dashed border-border/80 text-muted-foreground hover:text-foreground w-full"
            >
              <Plus size={13} className="mr-1.5" />
              Add Setup Criterion
            </Button>
          )}
        </div>
      </div>

      {/* ─── 3. Invalidation & Profit Staging Rules ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invalidation Rules */}
        <div className="rounded-2xl border border-border/70 bg-card/40 p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-border/50">
            <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Target size={15} />
            </span>
            <div>
              <h4 className="text-xs font-semibold tracking-tight text-foreground uppercase">
                Stop Loss & Invalidation
              </h4>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground font-mono uppercase">
                Stop Placement Law
              </span>
              <p className="text-foreground/90 font-medium mt-0.5 leading-relaxed">
                {strategy.stopLossLogic || "1 tick beyond the sweep high/low + 1 pip spread allowance."}
              </p>
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">
                Hard Structural Invalidation
              </span>
              <p className="text-rose-400/90 font-medium mt-0.5 leading-relaxed">
                {strategy.invalidationRule || "A 5m candle closing beyond the sweep candle wick immediately voids the thesis."}
              </p>
            </div>
          </div>
        </div>

        {/* Profit Staging */}
        <div className="rounded-2xl border border-border/70 bg-card/40 p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-border/50">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={15} />
            </span>
            <div>
              <h4 className="text-xs font-semibold tracking-tight text-foreground uppercase">
                Profit Taking & Scaling
              </h4>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-border/30">
                <span className="text-[10px] text-muted-foreground block">TP1 Target</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {strategy.exitStrategy?.tp1Ratio || 1.5}R
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Scale {strategy.exitStrategy?.tp1Percent || 50}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.03] border border-border/30">
                <span className="text-[10px] text-muted-foreground block">TP2 Target</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {strategy.exitStrategy?.tp2Ratio || 3.0}R
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Scale {strategy.exitStrategy?.tp2Percent || 35}%
                </span>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-muted-foreground">
              <strong className="text-foreground">Breakeven Protocol:</strong>{" "}
              {strategy.exitStrategy?.breakevenRule || "Move stop to entry after TP1 hits."}
            </div>

            {strategy.exitStrategy?.runnerRule && (
              <div className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">Runner Management:</strong>{" "}
                {strategy.exitStrategy.runnerRule}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 4. Disqualifiers & Anti-Patterns (When to Stand Down) ─── */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/[0.05] p-5 backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-rose-500/20">
          <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
            <AlertOctagon size={15} />
          </span>
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-foreground uppercase">
              Disqualifiers & Anti-Patterns (Stand Down Protocol)
            </h4>
          </div>
        </div>

        <div className="space-y-2">
          {strategy.disqualifiers.map((dis, idx) => (
            <div
              key={dis.id || idx}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/20 border border-rose-500/20"
            >
              <AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-medium text-foreground/90">{dis.condition}</p>
                {dis.explanation && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {dis.explanation}
                  </p>
                )}
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase shrink-0">
                {dis.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
