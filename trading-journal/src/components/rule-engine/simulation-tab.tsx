"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  RuleEvaluationResult,
  TradeIntent,
  TriggeredRule,
} from "@/types/rules";
import type { TradingAccount } from "@/types/account";
import { cn } from "@/lib/utils";

interface SimulationTabProps {
  accounts: TradingAccount[];
  selectedAccountId: string | null;
}

interface TestPreset {
  name: string;
  badge: string;
  badgeColor: string;
  intent: TradeIntent;
}

const PRESETS: TestPreset[] = [
  {
    name: "Valid Playbook Trade",
    badge: "Pass Intent",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    intent: {
      symbol: "EURUSD",
      side: "long",
      entryPrice: 1.085,
      stopLoss: 1.0825,
      takeProfit: 1.091,
      quantity: 1.0,
      lotSize: 1.0,
      marketSession: "London",
      accountBalance: 50000,
      dayOfWeek: "Tuesday",
    },
  },
  {
    name: "Excessive Risk (> 2%)",
    badge: "Risk Breach",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    intent: {
      symbol: "EURUSD",
      side: "long",
      entryPrice: 1.085,
      stopLoss: 1.07,
      takeProfit: 1.095,
      quantity: 4.5,
      lotSize: 4.5,
      marketSession: "New York",
      accountBalance: 50000,
      dayOfWeek: "Wednesday",
    },
  },
  {
    name: "Prohibited Symbol (DOGE)",
    badge: "Eligibility",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    intent: {
      symbol: "DOGEUSD",
      side: "long",
      entryPrice: 0.185,
      stopLoss: 0.175,
      takeProfit: 0.22,
      quantity: 5000,
      lotSize: 1.0,
      marketSession: "New York",
      accountBalance: 50000,
      dayOfWeek: "Wednesday",
    },
  },
  {
    name: "Missing Stop Loss",
    badge: "Checklist Breach",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    intent: {
      symbol: "GBPUSD",
      side: "short",
      entryPrice: 1.295,
      stopLoss: null,
      takeProfit: 1.285,
      quantity: 1.0,
      lotSize: 1.0,
      marketSession: "London",
      accountBalance: 50000,
      dayOfWeek: "Thursday",
    },
  },
  {
    name: "Sub-par Risk:Reward (< 1.5)",
    badge: "R:R Rejection",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    intent: {
      symbol: "NQ",
      side: "long",
      entryPrice: 20500,
      stopLoss: 20450,
      takeProfit: 20540,
      quantity: 1.0,
      lotSize: 1.0,
      marketSession: "New York",
      accountBalance: 50000,
      dayOfWeek: "Monday",
    },
  },
];

export function SimulationTab({ accounts, selectedAccountId }: SimulationTabProps) {
  const { showFeedback } = useOperationFeedback();
  const [intent, setIntent] = useState<TradeIntent>({
    symbol: "EURUSD",
    side: "long",
    entryPrice: 1.085,
    stopLoss: 1.0825,
    takeProfit: 1.091,
    quantity: 1.0,
    lotSize: 1.0,
    marketSession: "London",
    accountBalance: 50000,
    dayOfWeek: "Tuesday",
  });

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RuleEvaluationResult | null>(null);

  // Calculations
  const calculations = useMemo(() => {
    const slDist =
      intent.entryPrice && intent.stopLoss
        ? Math.abs(intent.entryPrice - intent.stopLoss)
        : 0;
    const tpDist =
      intent.entryPrice && intent.takeProfit
        ? Math.abs(intent.takeProfit - intent.entryPrice)
        : 0;
    const rr = slDist > 0 && tpDist > 0 ? Number((tpDist / slDist).toFixed(2)) : 0;
    const qty = intent.lotSize || intent.quantity || 1;
    const balance = intent.accountBalance || 50000;
    const estimatedRiskAmount = slDist * qty * (intent.symbol.includes("USD") ? 100000 : 1);
    const estimatedRiskPct =
      balance > 0 ? Math.min(100, (slDist * qty * 100) / balance) : 0;

    return {
      slDist,
      tpDist,
      rr,
      estimatedRiskPct: Number(estimatedRiskPct.toFixed(2)),
    };
  }, [intent]);

  const handleApplyPreset = (preset: TestPreset) => {
    setIntent(preset.intent);
    setResult(null);
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/rules/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId || null,
          tradeIntent: intent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to evaluate intent");
      }

      const evalResult: RuleEvaluationResult = await res.json();
      setResult(evalResult);
      showFeedback({ kind: "success", title: "Simulation complete", description: "The trade intent was evaluated against the selected rules." });
    } catch (err: unknown) {
      showFeedback({ kind: "failure", title: "Simulation failed", description: err instanceof Error ? err.message : "Simulation failed" });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Test Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="flex flex-col text-left p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-violet-500/40 transition shadow-sm press-scale-sm"
            >
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border self-start", p.badgeColor)}>
                {p.badge}
              </span>
              <span className="text-xs font-bold text-foreground mt-2">{p.name}</span>
              <span className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {p.intent.symbol} • {p.intent.side.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Live Simulation Verdict on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Trade Parameters (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-violet-600/15 text-violet-400">
                <Play size={14} />
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Hypothetical Order Intent
              </h3>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Pre-trade Gate
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-foreground">Symbol / Ticker</Label>
              <Input
                value={intent.symbol}
                onChange={(e) => setIntent({ ...intent, symbol: e.target.value.toUpperCase() })}
                placeholder="EURUSD"
                className="mt-1 h-9 text-xs bg-background/50 border-border/70 uppercase font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Order Direction</Label>
              <div className="mt-1 grid grid-cols-2 gap-1 p-0.5 rounded-lg border border-border/70 bg-background/50">
                <button
                  type="button"
                  onClick={() => setIntent({ ...intent, side: "long" })}
                  className={cn(
                    "py-1 text-xs font-semibold rounded transition press-scale-sm",
                    intent.side === "long" ? "bg-emerald-600 text-white" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setIntent({ ...intent, side: "short" })}
                  className={cn(
                    "py-1 text-xs font-semibold rounded transition press-scale-sm",
                    intent.side === "short" ? "bg-rose-600 text-white" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  SHORT
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Entry Price</Label>
              <Input
                type="number"
                step="any"
                value={intent.entryPrice || ""}
                onChange={(e) => setIntent({ ...intent, entryPrice: Number(e.target.value) })}
                className="mt-1 h-9 text-xs bg-background/50 border-border/70 font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Position Size (Lots)</Label>
              <Input
                type="number"
                step="0.01"
                value={intent.quantity || ""}
                onChange={(e) =>
                  setIntent({
                    ...intent,
                    quantity: Number(e.target.value),
                    lotSize: Number(e.target.value),
                  })
                }
                className="mt-1 h-9 text-xs bg-background/50 border-border/70 font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Stop Loss</Label>
              <Input
                type="number"
                step="any"
                value={intent.stopLoss ?? ""}
                onChange={(e) =>
                  setIntent({
                    ...intent,
                    stopLoss: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Optional"
                className="mt-1 h-9 text-xs bg-background/50 border-border/70 font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Take Profit</Label>
              <Input
                type="number"
                step="any"
                value={intent.takeProfit ?? ""}
                onChange={(e) =>
                  setIntent({
                    ...intent,
                    takeProfit: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Optional"
                className="mt-1 h-9 text-xs bg-background/50 border-border/70 font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Market Session</Label>
              <select
                value={intent.marketSession || "London"}
                onChange={(e) => setIntent({ ...intent, marketSession: e.target.value })}
                className="mt-1 w-full h-9 rounded-lg border border-border/70 bg-background/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="London" className="bg-neutral-900 text-white">London</option>
                <option value="New York" className="bg-neutral-900 text-white">New York</option>
                <option value="Asian" className="bg-neutral-900 text-white">Asian</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Day of Week</Label>
              <select
                value={intent.dayOfWeek || "Tuesday"}
                onChange={(e) => setIntent({ ...intent, dayOfWeek: e.target.value })}
                className="mt-1 w-full h-9 rounded-lg border border-border/70 bg-background/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                  <option key={d} value={d} className="bg-neutral-900 text-white">{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics preview */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="rounded-xl border border-border/60 bg-black/25 p-2.5">
              <span className="text-[11px] text-muted-foreground block">Projected R:R</span>
              <span className={cn("text-base font-bold font-mono mt-0.5 block", calculations.rr >= 1.5 ? "text-emerald-400" : "text-amber-400")}>
                {calculations.rr > 0 ? `1 : ${calculations.rr}` : "N/A (No TP/SL)"}
              </span>
            </div>
            <div className="rounded-xl border border-border/60 bg-black/25 p-2.5">
              <span className="text-[11px] text-muted-foreground block">Stop Distance</span>
              <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                {calculations.slDist > 0 ? calculations.slDist.toFixed(4) : "None"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/40 press-scale-sm"
          >
            {isRunning ? "Simulating Constraints..." : "Run Simulation Check"}
          </Button>

        </div>

        {/* Right: Simulation Verdict & Triggered Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={`result-${result.verdict}`}
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ type: "spring", damping: 25, stiffness: 280 }}
                className="space-y-4"
              >
                {/* Verdict Banner */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-6 text-center shadow-lg transition-all",
                  result.verdict === "ACCEPT"
                    ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-card"
                    : result.verdict === "WARN"
                      ? "border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card"
                      : "border-rose-500/40 bg-gradient-to-b from-rose-500/15 via-rose-500/5 to-card",
                )}
              >
                <div className="flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-2xl mb-3 shadow-md",
                      result.verdict === "ACCEPT"
                        ? "bg-emerald-500 text-white shadow-emerald-950/40"
                        : result.verdict === "WARN"
                          ? "bg-amber-500 text-white shadow-amber-950/40"
                          : "bg-rose-500 text-white shadow-rose-950/40",
                    )}
                  >
                    {result.verdict === "ACCEPT" && <ShieldCheck size={32} />}
                    {result.verdict === "WARN" && <AlertTriangle size={32} />}
                    {result.verdict === "BLOCK" && <AlertOctagon size={32} />}
                  </span>

                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    Pre-trade Evaluation Verdict
                  </span>
                  <h3
                    className={cn(
                      "text-3xl sm:text-4xl font-extrabold tracking-tight mt-1",
                      result.verdict === "ACCEPT"
                        ? "text-emerald-400"
                        : result.verdict === "WARN"
                          ? "text-amber-400"
                          : "text-rose-400",
                    )}
                  >
                    {result.verdict === "ACCEPT" && "TRADE ACCEPTED"}
                    {result.verdict === "WARN" && "WARNING — PROCEED WITH CAUTION"}
                    {result.verdict === "BLOCK" && "TRADE BLOCKED"}
                  </h3>

                  <p className="mt-2 text-xs text-muted-foreground/90 max-w-md">
                    {result.verdict === "ACCEPT" &&
                      "Order parameters satisfy all active discipline rules, risk limits, and eligibility constraints."}
                    {result.verdict === "WARN" &&
                      "Execution is permitted, but trade triggered cautionary guardrails. Review notices below."}
                    {result.verdict === "BLOCK" &&
                      "Execution halted by rule engine. Submitting this order violates your active trading plan."}
                  </p>
                </div>
              </div>

              {/* Triggered Rules List */}
              {result.triggeredRules.length > 0 && (
                <div className="rounded-2xl border border-rose-500/25 bg-card/60 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-rose-500/15 text-rose-400">
                      <AlertOctagon size={14} />
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Triggered Rules & Breaches ({result.triggeredRules.length})
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {result.triggeredRules.map((trig, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border/70 bg-black/25 p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">
                            {trig.ruleName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            {trig.consequence}
                          </span>
                        </div>
                        <p className="text-xs text-rose-300/90">{trig.message}</p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                          <span>Metric: <strong className="text-violet-300">{trig.metric}</strong></span>
                          <span>Actual: <strong className="text-rose-400">{String(trig.actualValue ?? "N/A")}</strong></span>
                          <span>Threshold: <strong className="text-foreground">{JSON.stringify(trig.threshold)}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passed Rules Checklist */}
              {result.passedRules.length > 0 && (
                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 size={14} />
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Passed Guardrails ({result.passedRules.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {result.passedRules.map((pr) => (
                      <div
                        key={pr.ruleId}
                        className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-border/50 text-muted-foreground"
                      >
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{pr.ruleName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Empty state prompt */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center flex flex-col items-center justify-center min-h-[380px]"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-400 mb-4">
                <Shield size={28} />
              </span>
              <h3 className="text-base font-bold text-foreground">Simulator Ready</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                Configure hypothetical order parameters or click one of the quick test presets above, then click <strong>Run Simulation Check</strong> to test your guardrails.
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApplyPreset(PRESETS[0])}
                  className="text-xs bg-violet-600 hover:bg-violet-500 text-white press-scale-sm"
                >
                  Load Valid Setup
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyPreset(PRESETS[1])}
                  className="text-xs border-border/70 press-scale-sm"
                >
                  Test Risk Breach
                </Button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
