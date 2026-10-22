"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  GitBranch,
  GitCommit,
  History,
  Layers,
  LineChart,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RefinementLogItem, Strategy } from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyRefinementTabProps {
  strategy: Strategy;
  onUpdateStrategy: (updated: Partial<Strategy>) => void;
}

export function StrategyRefinementTab({
  strategy,
  onUpdateStrategy,
}: StrategyRefinementTabProps) {
  const [showAddIteration, setShowAddIteration] = useState(false);
  const [versionInput, setVersionInput] = useState("");
  const [summaryInput, setSummaryInput] = useState("");
  const [hypothesisInput, setHypothesisInput] = useState("");
  const [sampleInput, setSampleInput] = useState<number>(20);

  const refinements = strategy.refinements || [];

  const handleAddIteration = () => {
    if (!summaryInput.trim() || !hypothesisInput.trim()) return;

    const newRefinement: RefinementLogItem = {
      id: "ref_" + Date.now(),
      version: versionInput.trim() || `v${(parseFloat(strategy.version.replace("v", "")) + 0.1).toFixed(1)}`,
      date: new Date().toISOString().split("T")[0],
      changeSummary: summaryInput.trim(),
      hypothesis: hypothesisInput.trim(),
      tradesSampled: sampleInput || 20,
      status: "TESTING",
    };

    onUpdateStrategy({
      version: newRefinement.version,
      refinements: [newRefinement, ...refinements],
    });

    setVersionInput("");
    setSummaryInput("");
    setHypothesisInput("");
    setShowAddIteration(false);
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Edge Drift Diagnostic & Health Calibration ─── */}
      <div className="rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <LineChart size={15} />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Edge Drift & Calibration Monitor
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Detect statistical degradation before drawdown damages account capital.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Stable Expectancy (+0.18R vs baseline)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-border/40 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">
              Theoretical vs Realized Win Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-foreground">
                {strategy.winRateTarget}%
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                / 62.5% real
              </span>
            </div>
            <p className="text-[10px] text-emerald-400">
              Within expected variance (&plusmn;3.5%)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-border/40 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">
              Expectancy Drift
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-400">
                +{strategy.expectancyR}R
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                vs +0.70R baseline
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Sample of {strategy.sampleSize} trades
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-border/40 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">
              Execution Slippage Decay
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-400">
                -0.08R
              </span>
              <span className="text-xs text-muted-foreground">average</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Mostly on market fills during news
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. Continuous Strategy Iteration Log (Changelog & Hypotheses) ─── */}
      <div className="rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <GitBranch size={15} />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Strategy Refinement Journal & Version History
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Audit trail of rules adjusted, hypotheses tested, and observed performance impact.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddIteration(true)}
            className="h-8 px-2.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white press-scale"
          >
            <Plus size={13} className="mr-1" />
            Log Refinement
          </Button>
        </div>

        {/* Add Refinement Modal / Inline Form */}
        {showAddIteration && (
          <div className="mt-4 p-4 rounded-xl border border-violet-500/40 bg-violet-500/[0.04] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-violet-500/20">
              <span className="text-xs font-semibold text-violet-300">
                New Strategy Refinement Iteration
              </span>
              <button
                type="button"
                onClick={() => setShowAddIteration(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  New Version Tag
                </label>
                <Input
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  placeholder="e.g. v1.3"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-muted-foreground block mb-1">
                  Change Summary
                </label>
                <Input
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                  placeholder="e.g. Tightened Asian range filter to maximum 35 pips"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">
                Quantitative Hypothesis (Why will this improve expectancy?)
              </label>
              <textarea
                value={hypothesisInput}
                onChange={(e) => setHypothesisInput(e.target.value)}
                placeholder="Document your hypothesis before running sample trades..."
                className="w-full text-xs p-2 rounded-lg bg-card border border-border/70 text-foreground resize-none h-16 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Test Sample:</span>
                <input
                  type="number"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(Number(e.target.value))}
                  className="h-7 w-16 text-xs bg-card border border-border/70 rounded px-2 font-mono"
                />
                <span className="text-[10px] text-muted-foreground">trades</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddIteration(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddIteration}
                  className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                >
                  Commit Iteration
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Refinement Timeline */}
        <div className="mt-5 space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
          {refinements.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No strategy refinements logged yet. Document changes as you test hypotheses.
            </p>
          ) : (
            refinements.map((ref) => {
              const statusBadges = {
                IMPLEMENTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                TESTING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                REVERTED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
              };

              return (
                <div key={ref.id} className="relative flex items-start gap-4 pl-8 group">
                  {/* Timeline Node */}
                  <span className="absolute left-1.5 top-1 size-3 rounded-full bg-violet-500 border-2 border-background" />

                  <div className="flex-1 p-3.5 rounded-xl border border-border/50 bg-white/[0.02] hover:bg-white/[0.04] transition-colors space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                          {ref.version}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {ref.changeSummary}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Calendar size={11} />
                          {ref.date}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border",
                            statusBadges[ref.status]
                          )}
                        >
                          {ref.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/90">Hypothesis:</strong>{" "}
                        {ref.hypothesis}
                      </p>
                      {ref.impactObserved && (
                        <p className="text-emerald-400/90 leading-relaxed">
                          <strong className="text-emerald-400">Observed Impact:</strong>{" "}
                          {ref.impactObserved}
                        </p>
                      )}
                    </div>

                    {ref.tradesSampled && (
                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                        Evaluated across <strong>{ref.tradesSampled}</strong> logged executions
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── 3. Cognitive Traps & Psychology Traps for this Strategy ─── */}
      <div className="rounded-2xl border border-border/70 bg-card/40 p-5 backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-border/50">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Brain size={15} />
          </span>
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-foreground uppercase">
              Psychological Guardrails & Setup-Specific Traps
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border/40 space-y-1">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
              <AlertTriangle size={13} className="text-amber-400" />
              Front-Running the Trigger
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Traders often buy before the displacement candle body actually closes. Always wait for candle close confirmation.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-border/40 space-y-1">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
              <AlertTriangle size={13} className="text-amber-400" />
              Revenge Re-Entry on Stop
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              If stopped out once, do not re-enter immediately at market. Require a brand new structural trigger or honor the 2-stop kill switch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
