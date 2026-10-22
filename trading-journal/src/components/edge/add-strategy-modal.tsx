"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Plus,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CreateStrategyInput,
  Strategy,
  StrategyCategory,
  StrategyStatus,
} from "@/types/strategy";
import { cn } from "@/lib/utils";

interface AddStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: (saved: Strategy) => void;
}

const CATEGORIES: StrategyCategory[] = [
  "Liquidity Sweep",
  "Trend Continuation",
  "Breakout & Momentum",
  "Mean Reversion",
  "Range Bound",
  "News Catalyst",
];

const SESSION_OPTIONS = [
  "London Open",
  "New York AM",
  "New York PM",
  "Asia Session",
  "London Close",
];

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const STATUS_OPTIONS: { value: StrategyStatus; label: string; desc: string }[] = [
  { value: "ACTIVE", label: "Active", desc: "Deployed with full position sizing" },
  { value: "CALIBRATING", label: "Calibrating", desc: "Paper or reduced size while gathering data" },
];

// Spring for step transitions
const springStep = { type: "spring" as const, damping: 26, stiffness: 280 };

type Step = 1 | 2 | 3 | 4;

export function AddStrategyModal({
  open,
  onOpenChange,
  onSaveSuccess,
}: AddStrategyModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Step 1: Core Identity ───
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StrategyCategory>("Liquidity Sweep");
  const [status, setStatus] = useState<StrategyStatus>("CALIBRATING");
  const [assetInput, setAssetInput] = useState("");
  const [assets, setAssets] = useState<string[]>([]);
  const [marketRegime, setMarketRegime] = useState("High Volatility Trend");

  // ─── Step 2: Edge Targets ───
  const [winRateTarget, setWinRateTarget] = useState(60);
  const [expectancyR, setExpectancyR] = useState(0.85);
  const [edgeScore, setEdgeScore] = useState(75);

  // ─── Step 3: Risk Guardrails ───
  const [maxRiskPercent, setMaxRiskPercent] = useState(1.0);
  const [minRrRatio, setMinRrRatio] = useState(2.0);
  const [invalidationRule, setInvalidationRule] = useState("");
  const [killSwitchRule, setKillSwitchRule] = useState("");

  // ─── Step 4: Execution Window ───
  const [selectedSessions, setSelectedSessions] = useState<string[]>(["New York AM"]);
  const [killZoneStart, setKillZoneStart] = useState("09:30");
  const [killZoneEnd, setKillZoneEnd] = useState("11:30");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Tuesday", "Wednesday", "Thursday"]);
  const [newsBlackoutRule, setNewsBlackoutRule] = useState("Blackout 15m before/after high-impact news");
  const [thesis, setThesis] = useState("");

  const resetForm = () => {
    setStep(1);
    setName("");
    setCategory("Liquidity Sweep");
    setStatus("CALIBRATING");
    setAssetInput("");
    setAssets([]);
    setMarketRegime("High Volatility Trend");
    setWinRateTarget(60);
    setExpectancyR(0.85);
    setEdgeScore(75);
    setMaxRiskPercent(1.0);
    setMinRrRatio(2.0);
    setInvalidationRule("");
    setKillSwitchRule("");
    setSelectedSessions(["New York AM"]);
    setKillZoneStart("09:30");
    setKillZoneEnd("11:30");
    setSelectedDays(["Tuesday", "Wednesday", "Thursday"]);
    setNewsBlackoutRule("Blackout 15m before/after high-impact news");
    setThesis("");
    setError(null);
    setSaving(false);
  };

  const handleAddAsset = () => {
    const trimmed = assetInput.trim().toUpperCase();
    if (trimmed && !assets.includes(trimmed)) {
      setAssets((prev) => [...prev, trimmed]);
    }
    setAssetInput("");
  };

  const handleRemoveAsset = (sym: string) => {
    setAssets((prev) => prev.filter((a) => a !== sym));
  };

  const toggleSession = (session: string) => {
    setSelectedSessions((prev) =>
      prev.includes(session)
        ? prev.filter((s) => s !== session)
        : [...prev, session]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const canProceed = (s: Step): boolean => {
    switch (s) {
      case 1:
        return !!name.trim() && assets.length > 0;
      case 2:
        return winRateTarget > 0 && expectancyR > 0;
      case 3:
        return maxRiskPercent > 0 && minRrRatio > 0;
      case 4:
        return selectedSessions.length > 0 && selectedDays.length > 0;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const input: CreateStrategyInput = {
      accountId: null,
      name: name.trim(),
      category,
      version: "v1.0",
      status,
      description: null,
      thesis: thesis.trim() || null,
      assetUniverse: assets,
      marketRegime,
      edgeScore,
      expectancyR,
      winRateTarget,
      profitFactor: 2.1,
      sampleSize: 0,
      edgeStateNotes: null,
      maxRiskPercent,
      minRrRatio,
      invalidationRule: invalidationRule.trim() || null,
      stopLossLogic: null,
      killSwitchRule: killSwitchRule.trim() || null,
      tradingSessions: selectedSessions,
      killZoneStart,
      killZoneEnd,
      timeZone: "EST (UTC-5)",
      daysOfWeek: selectedDays,
      newsBlackoutRule: newsBlackoutRule.trim() || null,
      entryChecklist: [],
      disqualifiers: [],
      exitStrategy: {
        tp1Ratio: 1.5,
        tp1Percent: 50,
        tp2Ratio: 3.0,
        tp2Percent: 35,
        runnerRule: "Trail 15m structure pivot",
        breakevenRule: "Move to breakeven after TP1",
        timeStopMinutes: 45,
      },
      refinements: [],
    };

    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create strategy");
      }

      const { strategy } = await res.json();
      onSaveSuccess(strategy);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const stepLabels: Record<Step, { title: string; subtitle: string }> = {
    1: { title: "Core Identity", subtitle: "Name your edge and define its asset universe" },
    2: { title: "Edge Baseline Targets", subtitle: "Set statistical performance benchmarks" },
    3: { title: "Risk Guardrails", subtitle: "Define hard risk limits and invalidation rules" },
    4: { title: "Execution Window & Thesis", subtitle: "Time your edge and document the premise" },
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-xl">
        {/* Header */}
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Sparkles size={18} />
              </span>
              <div>
                <DialogTitle className="text-base">New Trading Strategy</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {stepLabels[step].subtitle}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { resetForm(); onOpenChange(false); }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-1.5 mt-5 mb-4">
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => { if (s < step) setStep(s); }}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[11px] font-bold border transition-all",
                    s === step
                      ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/30"
                      : s < step
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-white/[0.04] text-muted-foreground border-border/60"
                  )}
                >
                  {s < step ? <Check size={13} /> : s}
                </button>
                {s < 4 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 rounded-full",
                      s < step ? "bg-emerald-500/40" : "bg-border/50"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-5 pb-5 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={springStep}
            >
              {/* ─── Step 1: Core Identity ─── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Strategy Name *
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. London Liquidity Sweep & Displacement"
                      className="h-10 text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Setup Category
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-2 rounded-xl border text-center transition-all press-scale-sm",
                            category === cat
                              ? "bg-violet-500/15 text-violet-300 border-violet-500/50 font-semibold"
                              : "bg-white/[0.03] text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Asset Universe *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={assetInput}
                        onChange={(e) => setAssetInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAsset(); } }}
                        placeholder="Type symbol (e.g. NQ) and press Enter"
                        className="h-8 text-xs font-mono flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddAsset}
                        className="h-8 px-2.5 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                      >
                        <Plus size={13} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap min-h-[28px]">
                      {assets.map((sym) => (
                        <span
                          key={sym}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-mono"
                        >
                          {sym}
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(sym)}
                            className="text-muted-foreground hover:text-rose-400 ml-0.5"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      {assets.length === 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          Add at least one instrument
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Market Regime
                      </Label>
                      <Input
                        value={marketRegime}
                        onChange={(e) => setMarketRegime(e.target.value)}
                        placeholder="e.g. Session Expansion"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Initial Status
                      </Label>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatus(opt.value)}
                            className={cn(
                              "flex-1 text-[11px] font-medium px-2 py-2 rounded-xl border text-center transition-all",
                              status === opt.value
                                ? opt.value === "ACTIVE"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                                  : "bg-amber-500/15 text-amber-400 border-amber-500/40"
                                : "bg-white/[0.03] text-muted-foreground border-border/60 hover:text-foreground"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Step 2: Baseline Edge Targets ─── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Win Rate Target
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={winRateTarget}
                          onChange={(e) => setWinRateTarget(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-foreground focus:outline-none focus:border-violet-500"
                          min={1}
                          max={100}
                          step={1}
                        />
                        <span className="text-muted-foreground text-sm">%</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Expectancy (R)
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={expectancyR}
                          onChange={(e) => setExpectancyR(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-foreground focus:outline-none focus:border-violet-500"
                          min={-5}
                          max={10}
                          step={0.05}
                        />
                        <span className="text-muted-foreground text-sm">R</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Starting Score
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={edgeScore}
                          onChange={(e) => setEdgeScore(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-foreground focus:outline-none focus:border-violet-500"
                          min={0}
                          max={100}
                          step={5}
                        />
                        <span className="text-muted-foreground text-xs">/100</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-border/40">
                    <strong className="text-foreground">Expectancy formula:</strong>{" "}
                    E = (Win% × Avg Win R) − (Loss% × 1.0R). Set conservative initial
                    targets. You&apos;ll refine these with real trade data over your sample window.
                  </p>
                </div>
              )}

              {/* ─── Step 3: Risk Guardrails ─── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Max Risk per Trade
                      </Label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={maxRiskPercent}
                          onChange={(e) => setMaxRiskPercent(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-rose-400 focus:outline-none focus:border-violet-500"
                          min={0.1}
                          max={5}
                          step={0.25}
                        />
                        <span className="text-muted-foreground text-sm">% equity</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-white/[0.02] p-3.5 space-y-2">
                      <Label className="text-[10px] text-muted-foreground uppercase font-mono block">
                        Min Required R:R
                      </Label>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-sm">1 :</span>
                        <input
                          type="number"
                          value={minRrRatio}
                          onChange={(e) => setMinRrRatio(Number(e.target.value))}
                          className="h-8 w-16 text-center text-lg font-bold font-mono bg-transparent border-b border-border/60 text-emerald-400 focus:outline-none focus:border-violet-500"
                          min={0.5}
                          max={10}
                          step={0.5}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Structural Invalidation Rule
                    </Label>
                    <textarea
                      value={invalidationRule}
                      onChange={(e) => setInvalidationRule(e.target.value)}
                      placeholder="e.g. 5m candle close beyond the sweep wick extreme voids the thesis"
                      className="w-full text-xs p-2.5 rounded-xl bg-white/[0.03] border border-border/60 text-foreground resize-none h-16 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Kill-Switch / Cooling Off Protocol
                    </Label>
                    <Input
                      value={killSwitchRule}
                      onChange={(e) => setKillSwitchRule(e.target.value)}
                      placeholder="e.g. 2 consecutive stops freezes strategy for 24h"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ─── Step 4: Execution Window & Thesis ─── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Active Sessions
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {SESSION_OPTIONS.map((session) => (
                        <button
                          key={session}
                          type="button"
                          onClick={() => toggleSession(session)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all",
                            selectedSessions.includes(session)
                              ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
                              : "bg-white/[0.03] text-muted-foreground border-border/60 hover:text-foreground"
                          )}
                        >
                          {session}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Kill Zone Start
                      </Label>
                      <Input
                        type="time"
                        value={killZoneStart}
                        onChange={(e) => setKillZoneStart(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Kill Zone End
                      </Label>
                      <Input
                        type="time"
                        value={killZoneEnd}
                        onChange={(e) => setKillZoneEnd(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Active Days
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_OPTIONS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all",
                            selectedDays.includes(day)
                              ? "bg-violet-500/15 text-violet-300 border-violet-500/40"
                              : "bg-white/[0.03] text-muted-foreground border-border/60 hover:text-foreground"
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Edge Thesis — Why does this market anomaly exist?
                    </Label>
                    <textarea
                      value={thesis}
                      onChange={(e) => setThesis(e.target.value)}
                      placeholder="Document the core thesis (e.g. institutional participants need to sweep resting retail stop orders to engineer fill liquidity...)"
                      className="w-full text-xs p-2.5 rounded-xl bg-white/[0.03] border border-border/60 text-foreground resize-none h-20 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3.5">
          <div className="text-[11px] text-muted-foreground font-mono">
            Step {step} of 4 &mdash; {stepLabels[step].title}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep((step - 1) as Step)}
                className="h-8 text-xs"
              >
                Back
              </Button>
            )}

            {step < 4 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canProceed(step)}
                className="h-8 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30 press-scale disabled:opacity-40"
              >
                Continue
                <ArrowRight size={13} className="ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving || !canProceed(step)}
                className="h-8 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-950/30 press-scale disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={13} className="mr-1.5" />
                    Create Strategy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
