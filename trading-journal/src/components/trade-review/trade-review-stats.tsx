"use client";

import { useMemo } from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Brain,
  ShieldAlert,
} from "lucide-react";
import type { Trade } from "@/types/trade";

interface TradeReviewStatsProps {
  trades: Trade[];
  currency?: string;
}

export function TradeReviewStats({ trades, currency = "USD" }: TradeReviewStatsProps) {
  const stats = useMemo(() => {
    const total = trades.length;
    const reviewed = trades.filter((t) => t.reviewStatus === "reviewed");
    const unreviewed = trades.filter((t) => !t.reviewStatus || t.reviewStatus === "unreviewed");
    const flagged = trades.filter((t) => t.reviewStatus === "flagged");

    const reviewRate = total > 0 ? Math.round((reviewed.length / total) * 100) : 0;

    // Rule adherence on reviewed trades
    const withRuleStatus = reviewed.filter((t) => t.followedRules);
    const followedRulesCount = withRuleStatus.filter((t) => t.followedRules === "yes").length;
    const ruleAdherenceRate =
      withRuleStatus.length > 0 ? Math.round((followedRulesCount / withRuleStatus.length) * 100) : 0;

    // Execution Quality Score
    const ratedTrades = reviewed.filter((t) => t.reviewRating && t.reviewRating > 0);
    const avgRating =
      ratedTrades.length > 0
        ? (ratedTrades.reduce((acc, t) => acc + (t.reviewRating || 0), 0) / ratedTrades.length).toFixed(1)
        : null;

    // Grade counts
    const gradeACount = reviewed.filter(
      (t) => t.executionGrade === "A+" || t.executionGrade === "A"
    ).length;

    // Leak / mistake frequency
    const leakCounts: Record<string, number> = {};
    for (const t of trades) {
      if (t.mistakeTags && Array.isArray(t.mistakeTags)) {
        for (const tag of t.mistakeTags) {
          leakCounts[tag] = (leakCounts[tag] || 0) + 1;
        }
      }
    }
    const topLeaks = Object.entries(leakCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Expectancy comparison: Disciplined vs Rule-Violating trades PnL
    const disciplinedTrades = reviewed.filter((t) => t.followedRules === "yes");
    const undisciplinedTrades = reviewed.filter(
      (t) => t.followedRules === "no" || t.followedRules === "partial"
    );

    const disciplinedAvgPnl =
      disciplinedTrades.length > 0
        ? disciplinedTrades.reduce((acc, t) => acc + t.pnl, 0) / disciplinedTrades.length
        : null;

    const undisciplinedAvgPnl =
      undisciplinedTrades.length > 0
        ? undisciplinedTrades.reduce((acc, t) => acc + t.pnl, 0) / undisciplinedTrades.length
        : null;

    return {
      total,
      reviewedCount: reviewed.length,
      unreviewedCount: unreviewed.length,
      flaggedCount: flagged.length,
      reviewRate,
      ruleAdherenceRate,
      avgRating,
      gradeACount,
      topLeaks,
      disciplinedAvgPnl,
      undisciplinedAvgPnl,
    };
  }, [trades]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Review Queue Progress */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4.5 shadow-xs transition hover:border-violet-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Review Queue
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Clock size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {stats.reviewRate}%
          </span>
          <span className="text-xs text-foreground/70">
            ({stats.reviewedCount} / {stats.total} trades)
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.reviewRate}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-foreground/70">
          {stats.unreviewedCount > 0 ? (
            <span className="font-semibold text-amber-400">
              {stats.unreviewedCount} trade{stats.unreviewedCount > 1 ? "s" : ""} awaiting review
            </span>
          ) : (
            <span className="font-medium text-emerald-400">All trades reviewed</span>
          )}
        </p>
      </div>

      {/* 2. Rule Adherence & Discipline */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4.5 shadow-xs transition hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Rule Adherence
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {stats.ruleAdherenceRate}%
          </span>
          <span className="text-xs text-foreground/70">followed plan</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-foreground/70">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium ${
              stats.ruleAdherenceRate >= 80
                ? "bg-emerald-500/10 text-emerald-400"
                : stats.ruleAdherenceRate >= 60
                ? "bg-amber-500/10 text-amber-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {stats.ruleAdherenceRate >= 80
              ? "High Discipline"
              : stats.ruleAdherenceRate >= 60
              ? "Moderate Leaks"
              : "Rule Drift Risk"}
          </span>
          <span className="text-foreground/70">on reviewed setups</span>
        </div>
        <p className="mt-2 text-[11px] text-foreground/70 truncate" suppressHydrationWarning>
          {stats.disciplinedAvgPnl !== null ? (
            <>
              Disciplined Avg:{" "}
              <span className={stats.disciplinedAvgPnl >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400"}>
                {stats.disciplinedAvgPnl >= 0 ? "+" : ""}${Math.round(stats.disciplinedAvgPnl).toLocaleString("en-US")}
              </span>
            </>
          ) : (
            "Review trades to audit rule discipline"
          )}
        </p>
      </div>

      {/* 3. Execution Quality */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4.5 shadow-xs transition hover:border-violet-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Execution Grade
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Award size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {stats.avgRating ? `${stats.avgRating} / 5.0` : "—"}
          </span>
          {stats.avgRating && (
            <span className="text-xs font-medium text-amber-400">★ Quality</span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-foreground/70">
          <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 font-bold text-violet-300">
            {stats.gradeACount} Grade A Setups
          </span>
          <span className="text-foreground/70">in journal</span>
        </div>
        <p className="mt-2 text-[11px] text-foreground/70">
          Institutional execution standard benchmark
        </p>
      </div>

      {/* 4. Top Leak Identified */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4.5 shadow-xs transition hover:border-rose-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Primary Leak
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <ShieldAlert size={16} />
          </div>
        </div>
        <div className="mt-3">
          {stats.topLeaks.length > 0 ? (
            <div>
              <div className="text-base font-bold tracking-tight text-foreground truncate">
                {stats.topLeaks[0][0]}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-foreground/70">
                <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-400">
                  {stats.topLeaks[0][1]} occurrence{stats.topLeaks[0][1] > 1 ? "s" : ""}
                </span>
                <span className="text-foreground/70">top leakage source</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold text-foreground">No leaks logged</div>
              <p className="mt-1 text-[11px] text-foreground/70">
                Tag mistakes during review to isolate leaks
              </p>
            </div>
          )}
        </div>
        <p className="mt-2 text-[11px] text-foreground/70">
          Focus: eliminate recurring psychological traps
        </p>
      </div>
    </div>
  );
}
