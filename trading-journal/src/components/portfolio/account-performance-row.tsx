"use client";

import { useMemo, useState } from "react";
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

  const startingBalance = selectedAccount.startingBalance;
  const currentBalance = selectedAccount.currentBalance;
  const netPnl = currentBalance - startingBalance;
  const netPnlPercent = startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;
  const isProfitable = netPnl >= 0;

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
  const dailyLossUsedPercent = selectedAccount.metrics?.dailyLossUsedPercent ?? 28;
  const dailyLossUsedAmount = dailyLossLimitAmount * (dailyLossUsedPercent / 100);

  // Timeframe chart data simulation relative to actual balance
  const chartConfig = useMemo(() => {
    const pnl = netPnl;
    const start = startingBalance;
    const curr = currentBalance;

    if (timeframe === "daily") {
      // Intraday curve
      const dayPnl = pnl !== 0 ? pnl * 0.35 : 420;
      return {
        label: "Today's Intraday Equity",
        change: `${dayPnl >= 0 ? "+" : ""}${dayPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isUp: dayPnl >= 0,
        labels: ["09:30 AM", "11:00 AM", "01:00 PM", "02:45 PM", "04:00 PM"],
        points: [
          { x: 0, y: 140 },
          { x: 175, y: 125 },
          { x: 350, y: 145 },
          { x: 525, y: 95 },
          { x: 700, y: dayPnl >= 0 ? 50 : 160 },
        ],
        pathD:
          dayPnl >= 0
            ? "M0,140 C90,135 120,110 175,125 S300,160 350,145 S460,110 525,95 S620,70 700,50"
            : "M0,140 C90,135 120,150 175,155 S300,140 350,145 S460,165 525,170 S620,155 700,160",
        yTicks: [
          `$${((curr + Math.abs(curr * 0.02)) / 1000).toFixed(1)}k`,
          `$${(curr / 1000).toFixed(1)}k`,
          `$${((curr - Math.abs(curr * 0.02)) / 1000).toFixed(1)}k`,
        ],
      };
    } else if (timeframe === "weekly") {
      // 7 days curve
      const weekPnl = pnl !== 0 ? pnl * 0.6 : 780;
      return {
        label: "Past 7 Days Equity",
        change: `${weekPnl >= 0 ? "+" : ""}${weekPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isUp: weekPnl >= 0,
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        points: [
          { x: 0, y: 150 },
          { x: 175, y: 135 },
          { x: 350, y: 120 },
          { x: 525, y: 90 },
          { x: 700, y: weekPnl >= 0 ? 45 : 160 },
        ],
        pathD: weekPnl >= 0
          ? "M0,150 C80,145 120,130 175,135 S280,125 350,120 S450,100 525,90 S630,60 700,45"
          : "M0,150 C80,148 120,155 175,152 S280,150 350,155 S450,158 525,160 S630,162 700,160",
        yTicks: [
          `$${(Math.max(curr, start) * 1.03 / 1000).toFixed(1)}k`,
          `$${(start / 1000).toFixed(1)}k`,
          `$${(Math.min(curr, start) * 0.97 / 1000).toFixed(1)}k`,
        ],
      };
    } else if (timeframe === "monthly") {
      // 30 days curve
      return {
        label: "Past 30 Days Growth",
        change: `${pnl >= 0 ? "+" : ""}${pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${isProfitable ? "+" : ""}${netPnlPercent.toFixed(2)}%)`,
        isUp: isProfitable,
        labels: ["Day 1", "Day 8", "Day 15", "Day 22", "Day 30"],
        points: [
          { x: 0, y: 155 },
          { x: 175, y: 130 },
          { x: 350, y: 110 },
          { x: 525, y: 75 },
          { x: 700, y: isProfitable ? 35 : 165 },
        ],
        pathD: isProfitable
          ? "M0,155 C70,145 120,150 175,130 S280,135 350,110 S450,90 525,75 S620,50 700,35"
          : "M0,155 C70,145 120,160 175,160 S280,150 350,155 S450,160 525,162 S620,170 700,165",
        yTicks: [
          `$${(Math.max(curr, start) * 1.05 / 1000).toFixed(1)}k`,
          `$${(start / 1000).toFixed(1)}k`,
          `$${(Math.min(curr, start) * 0.95 / 1000).toFixed(1)}k`,
        ],
      };
    } else {
      // Yearly curve
      const yearPnl = pnl !== 0 ? pnl : 2840;
      return {
        label: "Annual Portfolio Progression",
        change: `${yearPnl >= 0 ? "+" : ""}${yearPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isUp: yearPnl >= 0,
        labels: ["Q1 Jan", "Q2 Apr", "Q3 Jul", "Q4 Oct", "Year End"],
        points: [
          { x: 0, y: 160 },
          { x: 175, y: 140 },
          { x: 350, y: 95 },
          { x: 525, y: 60 },
          { x: 700, y: yearPnl >= 0 ? 30 : 165 },
        ],
        pathD:
          yearPnl >= 0
            ? "M0,160 C80,150 110,135 175,140 S280,110 350,95 S460,75 525,60 S630,45 700,30"
            : "M0,160 C80,150 110,155 175,155 S280,145 350,150 S460,160 525,162 S630,160 700,165",
        yTicks: [
          `$${((start + Math.abs(pnl) * 1.5) / 1000).toFixed(1)}k`,
          `$${(start / 1000).toFixed(1)}k`,
          `$${((start - Math.abs(pnl) * 0.8) / 1000).toFixed(1)}k`,
        ],
      };
    }
  }, [timeframe, netPnl, startingBalance, currentBalance, isProfitable, netPnlPercent]);

  return (
    <div className="grid w-full gap-4 lg:grid-cols-12">
      {/* CARD 1: Trading Performance & Equity Curve (Takes ~70% width -> 8 cols of 12) */}
      <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:col-span-8">
        <div>
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
                d={`${chartConfig.pathD} L 700 200 L 0 200 Z`}
                fill="url(#equityGrad)"
              />

              {/* Curve Line */}
              <path
                d={chartConfig.pathD}
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
