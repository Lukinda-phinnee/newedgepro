"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Shield,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { TradingAccount, PortfolioSummary } from "@/types/account";

interface PortfolioSummaryBannerProps {
  accounts: TradingAccount[];
  summary: PortfolioSummary;
}

const ALLOCATION_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-rose-500",
];

export function PortfolioSummaryBanner({
  accounts,
  summary,
}: PortfolioSummaryBannerProps) {
  const isProfitable = summary.totalPnl >= 0;

  // Compute daily loss & drawdown allowance across accounts
  const totalDailyLossAllowance = accounts.reduce(
    (sum, a) => sum + a.startingBalance * (a.maxDailyLossPercent / 100),
    0,
  );
  const totalDrawdownAllowance = accounts.reduce(
    (sum, a) => sum + a.startingBalance * (a.maxDrawdownPercent / 100),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Equity */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Consolidated Equity</span>
            <Wallet size={16} className="text-violet-400" />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
            {summary.primaryCurrency} {summary.totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Starting: {summary.primaryCurrency} {summary.totalStartingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Total Net P&L */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Portfolio Net Return</span>
            <TrendingUp size={16} className={isProfitable ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"} />
          </div>
          <div className={`mt-3 text-2xl font-bold tracking-tight sm:text-[26px] ${isProfitable ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
            {isProfitable ? "+" : ""}
            {summary.primaryCurrency} {summary.totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 flex items-center text-[11px] font-medium text-muted-foreground">
            {isProfitable ? (
              <ArrowUpRight size={13} className="text-emerald-500 dark:text-emerald-400 mr-0.5" />
            ) : (
              <ArrowDownRight size={13} className="text-rose-500 dark:text-rose-400 mr-0.5" />
            )}
            <span className={isProfitable ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}>
              {isProfitable ? "+" : ""}
              {summary.totalPnlPercent.toFixed(2)}%
            </span>
            <span className="ml-1 text-muted-foreground/80">cumulative return</span>
          </p>
        </div>

        {/* Daily Loss Guardrail Capacity */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Daily Loss Capacity</span>
            <Shield size={16} className="text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
            {summary.primaryCurrency} {totalDailyLossAllowance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Aggregated max daily loss limits
          </p>
        </div>

        {/* Active Accounts Breakdown */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Monitored Accounts</span>
            <ShieldCheck size={16} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
            {summary.activeAccounts}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {summary.totalAccounts} active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary.demoAccounts} demo · {summary.liveAccounts} live
          </p>
        </div>
      </div>
    </div>
  );
}
