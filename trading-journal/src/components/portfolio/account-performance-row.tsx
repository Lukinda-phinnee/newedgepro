"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Target,
  TrendingUp,
} from "lucide-react";
import type { TradingAccount } from "@/types/account";
import type { Trade } from "@/types/trade";

interface AccountPerformanceRowProps {
  accounts: TradingAccount[];
  selectedAccount: TradingAccount;
  onSelectAccount: (accountId: string) => void;
}

type Timeframe = "daily" | "weekly" | "monthly" | "yearly";

export function AccountPerformanceRow({
  accounts,
  selectedAccount,
  onSelectAccount,
}: AccountPerformanceRowProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setTrades([]);
    fetch(`/api/trades?accountId=${encodeURIComponent(selectedAccount.id)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { trades?: Trade[] }) => setTrades(data.trades ?? []))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTrades([]);
      });
    return () => controller.abort();
  }, [selectedAccount.id]);

  const startingBalance = selectedAccount.startingBalance;
  const closedTrades = useMemo(
    () => trades
      .filter((trade) => trade.status === "closed" && trade.closedAt && Number.isFinite(trade.pnl))
      .map((trade) => ({ trade, date: new Date(trade.closedAt!) }))
      .filter(({ date }) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [trades],
  );
  const hasTradeHistory = closedTrades.length > 0;
  const currentBalance = selectedAccount.currentBalance;
  const netPnl = currentBalance - startingBalance;

  // Guardrail calculations
  const dailyLossLimitAmount = startingBalance * (selectedAccount.maxDailyLossPercent / 100);
  const drawdownLimitAmount = startingBalance * (selectedAccount.maxDrawdownPercent / 100);
  const profitTargetAmount = startingBalance * (selectedAccount.profitTargetPercent / 100);
  const riskPerTradeAmount = startingBalance * (selectedAccount.riskPerTradePercent / 100);

  // Drawdown tracking
  const currentDrawdownAmount = Math.max(0, startingBalance - currentBalance);
  const drawdownUsedPercent =
    drawdownLimitAmount > 0
      ? Math.min(100, (currentDrawdownAmount / drawdownLimitAmount) * 100)
      : 0;
  const drawdownRemaining = Math.max(0, drawdownLimitAmount - currentDrawdownAmount);

  // Profit target progress
  const profitProgress =
    profitTargetAmount > 0
      ? Math.min(100, Math.max(0, (Math.max(0, netPnl) / profitTargetAmount) * 100))
      : 0;

  // Daily loss used estimate (or from metrics)
  const dailyLossUsedPercent = selectedAccount.metrics?.dailyLossUsedPercent ?? 0;
  const dailyLossUsedAmount = dailyLossLimitAmount * (dailyLossUsedPercent / 100);

  // Build the equity curve from this account's closed trades.
  const chartConfig = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date(now);
    if (timeframe === "daily") rangeStart.setHours(0, 0, 0, 0);
    if (timeframe === "weekly") rangeStart.setDate(now.getDate() - 6);
    if (timeframe === "monthly") rangeStart.setDate(now.getDate() - 29);
    if (timeframe === "yearly") rangeStart.setFullYear(now.getFullYear() - 1);

    let equity = startingBalance + closedTrades
      .filter(({ date }) => date < rangeStart)
      .reduce((total, { trade }) => total + trade.pnl, 0);
    const periodTrades = closedTrades.filter(({ date }) => date >= rangeStart && date <= now);
    const values = hasTradeHistory ? [equity] : [startingBalance, selectedAccount.currentBalance];
    for (const { trade } of periodTrades) {
      equity += trade.pnl;
      values.push(equity);
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || Math.max(Math.abs(max) * 0.02, 1);
    const points = values.map((value, index) => ({
      x: values.length === 1 ? 700 : (index / (values.length - 1)) * 700,
      y: 170 - ((value - (min - spread * 0.1)) / (spread * 1.2)) * 140,
    }));
    const periodPnl = hasTradeHistory
      ? periodTrades.reduce((total, { trade }) => total + trade.pnl, 0)
      : selectedAccount.currentBalance - startingBalance;
    const formatTick = (value: number) => `${selectedAccount.currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    return {
      label: `${periodTrades.length} closed trades in selected period`,
      change: `${periodPnl >= 0 ? "+" : ""}${periodPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isUp: periodPnl >= 0,
      labels: [rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }), now.toLocaleDateString("en-US", { month: "short", day: "numeric" })],
      points,
      pathD: "",
      yTicks: [formatTick(max), formatTick((max + min) / 2), formatTick(min)],
    };
  }, [timeframe, closedTrades, hasTradeHistory, startingBalance, selectedAccount.currentBalance, selectedAccount.currency]);

  const linearPath = chartConfig.points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(' ');

  return (
    <div className="grid w-full items-stretch gap-4 lg:grid-cols-12">
      {/* CARD 1: Trading Performance & Equity Curve (Takes ~70% width -> 8 cols of 12) */}
      <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:col-span-8">
        <div className="flex min-h-full flex-1 flex-col">
          {/* Header Row: Title, Account Selector, and Timeframe Filter */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 dark:text-violet-400">
                <TrendingUp size={15} />
              </span>
              <h3 className="text-sm font-semibold text-foreground">Trading Performance</h3>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
              {(["daily", "weekly", "monthly", "yearly"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-md px-3 py-1 text-[11px] font-semibold capitalize transition-all ${
                    timeframe === tf
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-border/50 py-3">
            <div>
              <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Current Equity
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {selectedAccount.currency}{" "}
                {currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Net Period P&L
              </span>
              <span
                className={`flex items-center text-sm font-semibold sm:text-base ${
                  chartConfig.isUp
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400"
                }`}
              >
                {chartConfig.isUp ? (
                  <ArrowUpRight size={15} className="mr-0.5 inline" />
                ) : (
                  <ArrowDownRight size={15} className="mr-0.5 inline" />
                )}
                {chartConfig.change}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Starting Capital
              </span>
              <span className="text-xs font-semibold text-foreground/80 sm:text-sm">
                {selectedAccount.currency}{" "}
                {startingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Max Drawdown Cushion
              </span>
              <span className="text-xs font-semibold text-violet-500 dark:text-violet-400 sm:text-sm">
                ${drawdownRemaining.toLocaleString("en-US", { maximumFractionDigits: 0 })} buffer
              </span>
            </div>
          </div>

          {/* SVG Equity Curve Canvas — fills remaining card height */}
          <div className="relative mt-4 flex min-h-[210px] flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-muted/20">
            {/* Horizontal Dashed Gridlines */}
            <div className="absolute inset-x-2 inset-y-3 flex flex-col justify-between">
              {chartConfig.yTicks.map((tick, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-9 text-right text-[10px] font-medium text-muted-foreground/70">
                    {tick}
                  </span>
                  <span className="h-px flex-1 border-t border-dashed border-border/60" />
                </div>
              ))}
            </div>

            {/* SVG Trendline — stretches to fill */}
            <svg
              viewBox="0 0 700 200"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full pl-12 pr-4 pt-3 pb-6"
            >
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={chartConfig.isUp ? "#8b5cf6" : "#f43f5e"}
                    stopOpacity="0.28"
                  />
                  <stop
                    offset="100%"
                    stopColor={chartConfig.isUp ? "#8b5cf6" : "#f43f5e"}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path
                d={`${linearPath} L 700 200 L 0 200 Z`}
                fill="url(#equityGrad)"
              />

              {/* Curve Line */}
              <path
                d={linearPath}
                fill="none"
                stroke={chartConfig.isUp ? "#8b5cf6" : "#f43f5e"}
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />

              {/* Final Point Glowing Dot */}
              <circle
                cx="700"
                cy={chartConfig.points[chartConfig.points.length - 1].y}
                r="4.5"
                fill={chartConfig.isUp ? "#8b5cf6" : "#f43f5e"}
                className="animate-pulse"
              />
            </svg>

            {/* Timeframe Axis Labels — pinned at bottom of chart */}
            <div className="mt-auto flex justify-between px-4 pb-2 pl-12 text-[10px] font-medium text-muted-foreground/70">
              {chartConfig.labels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: Account Rules & Limits (~30% width -> 4 cols of 12) */}
      <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:col-span-4">
        <div>
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-violet-500 dark:text-violet-400" />
                <h3 className="text-sm font-semibold text-foreground">Rules & Limits</h3>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Active guardrails for{" "}
                <span className="font-semibold text-foreground">{selectedAccount.name}</span>
              </p>
            </div>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                drawdownUsedPercent > 70
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                  : dailyLossUsedPercent > 70
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {drawdownUsedPercent > 70
                ? "Risk Alert"
                : dailyLossUsedPercent > 70
                ? "Caution"
                : "Safe & On Track"}
            </span>
          </div>

          {/* Rules List */}
          <div className="mt-4 space-y-3.5">
            {/* Rule 1: Daily Loss Limit */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldAlert size={13} className="text-rose-500" />
                  Daily Loss Limit
                </span>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    dailyLossUsedPercent > 75
                      ? "border-rose-500/30 bg-rose-500/15 text-rose-500"
                      : dailyLossUsedPercent > 45
                      ? "border-amber-500/30 bg-amber-500/15 text-amber-500"
                      : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {dailyLossUsedPercent > 75
                    ? "Risky (75%+ used)"
                    : dailyLossUsedPercent > 45
                    ? "Moderate Risk"
                    : "Safe"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.08]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    dailyLossUsedPercent > 75
                      ? "bg-rose-500"
                      : dailyLossUsedPercent > 45
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${dailyLossUsedPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  -${dailyLossUsedAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} used
                </span>
                <span className="font-semibold text-foreground/80">
                  -${dailyLossLimitAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} max (
                  {selectedAccount.maxDailyLossPercent}%)
                </span>
              </div>
            </div>

            {/* Rule 2: Max Drawdown Limit */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck size={13} className="text-violet-500" />
                  Max Drawdown Buffer
                </span>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    drawdownUsedPercent > 70
                      ? "border-rose-500/30 bg-rose-500/15 text-rose-500"
                      : drawdownUsedPercent > 35
                      ? "border-amber-500/30 bg-amber-500/15 text-amber-500"
                      : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {drawdownUsedPercent > 70
                    ? "Critical Risk"
                    : drawdownUsedPercent > 35
                    ? "Drawdown Warning"
                    : "Optimal (Safe)"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.08]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    drawdownUsedPercent > 70
                      ? "bg-rose-500"
                      : drawdownUsedPercent > 35
                      ? "bg-amber-400"
                      : "bg-violet-500"
                  }`}
                  style={{ width: `${Math.max(4, drawdownUsedPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  ${drawdownRemaining.toLocaleString("en-US", { maximumFractionDigits: 0 })} buffer left
                </span>
                <span className="font-semibold text-foreground/80">
                  ${drawdownLimitAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} max (
                  {selectedAccount.maxDrawdownPercent}%)
                </span>
              </div>
            </div>

            {/* Rule 3: Profit Target Milestone */}
            <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Target size={13} className="text-emerald-500" />
                  Profit Target Milestone
                </span>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    profitProgress >= 100
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : profitProgress >= 50
                      ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-500"
                      : "border-violet-500/30 bg-violet-500/15 text-violet-400"
                  }`}
                >
                  {profitProgress >= 100
                    ? "Goal Achieved"
                    : profitProgress >= 50
                    ? "Near Milestone"
                    : "Building Progress"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${profitProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{profitProgress.toFixed(1)}% completed</span>
                <span className="font-semibold text-foreground/80">
                  +${profitTargetAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} target (
                  {selectedAccount.profitTargetPercent}%)
                </span>
              </div>
            </div>

            {/* Rule 4: Risk Per Trade Limit */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Sliders size={13} className="text-blue-500" />
                  Risk Per Trade
                </span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  ${riskPerTradeAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} maximum per setup
                </span>
              </div>
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                  selectedAccount.riskPerTradePercent <= 1.0
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : selectedAccount.riskPerTradePercent <= 2.0
                    ? "border-blue-500/30 bg-blue-500/15 text-blue-500"
                    : "border-amber-500/30 bg-amber-500/15 text-amber-500"
                }`}
              >
                {selectedAccount.riskPerTradePercent <= 1.0
                  ? "Disciplined (Safe)"
                  : selectedAccount.riskPerTradePercent <= 2.0
                  ? "Standard"
                  : "Aggressive"}
              </span>
            </div>

            {/* Rule 5: Daily Trades Limit */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Clock size={13} className="text-amber-500" />
                  Daily Execution Cap
                </span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  Prevents overtrading & revenge entries
                </span>
              </div>
              <div className="text-right">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  {selectedAccount.maxTradesPerDay} trades max
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




