"use client";

import { useMemo } from "react";
import { Award, CheckCircle2, Clock, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

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
      <Card className="group relative overflow-hidden rounded-2xl border-border/70 bg-card/80 p-4.5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Audit Progress
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
            <Clock size={14} />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {stats.reviewRate}%
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {stats.reviewedCount} of {stats.total} trades
          </span>
        </div>

        {/* Minimalist Apple Progress Track */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${stats.reviewRate}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          {stats.unreviewedCount > 0 ? (
            <Badge variant="warning" size="sm">
              {stats.unreviewedCount} awaiting review
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              All trades reviewed
            </Badge>
          )}
          {stats.flaggedCount > 0 && (
            <span className="text-muted-foreground tabular-nums">
              {stats.flaggedCount} flagged
            </span>
          )}
        </div>
      </Card>

      {/* 2. Rule Adherence */}
      <Card className="group relative overflow-hidden rounded-2xl border-border/70 bg-card/80 p-4.5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Plan Adherence
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
            <CheckCircle2 size={14} />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {stats.ruleAdherenceRate}%
          </span>
          <span className="text-xs text-muted-foreground">followed rules</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-1 text-[11px]">
          <Badge
            variant={
              stats.ruleAdherenceRate >= 80
                ? "success"
                : stats.ruleAdherenceRate >= 60
                ? "warning"
                : "destructive"
            }
            size="sm"
          >
            {stats.ruleAdherenceRate >= 80
              ? "Disciplined"
              : stats.ruleAdherenceRate >= 60
              ? "Minor Leaks"
              : "Rule Drift"}
          </Badge>

          {stats.disciplinedAvgPnl !== null ? (
            <span className="text-muted-foreground tabular-nums truncate">
              Plan avg:{" "}
              <span
                className={cn(
                  "font-medium",
                  stats.disciplinedAvgPnl >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {stats.disciplinedAvgPnl >= 0 ? "+" : ""}$
                {Math.round(stats.disciplinedAvgPnl).toLocaleString("en-US")}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Needs review</span>
          )}
        </div>
      </Card>

      {/* 3. Execution Quality */}
      <Card className="group relative overflow-hidden rounded-2xl border-border/70 bg-card/80 p-4.5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Execution Quality
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
            <Award size={14} />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {stats.avgRating ? `${stats.avgRating}` : "—"}
          </span>
          {stats.avgRating && (
            <span className="text-xs text-muted-foreground">/ 5.0 rating</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <Badge variant="violet" size="sm">
            {stats.gradeACount} Grade A Setups
          </Badge>
          <span className="text-muted-foreground">playbook benchmark</span>
        </div>
      </Card>

      {/* 4. Primary Leak */}
      <Card className="group relative overflow-hidden rounded-2xl border-border/70 bg-card/80 p-4.5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Top Execution Leak
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
            <ShieldAlert size={14} />
          </div>
        </div>

        <div className="mt-2.5 min-h-[32px]">
          {stats.topLeaks.length > 0 ? (
            <div className="truncate text-base font-semibold tracking-tight text-foreground">
              {stats.topLeaks[0][0]}
            </div>
          ) : (
            <div className="text-sm font-medium text-muted-foreground">
              No leaks identified
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          {stats.topLeaks.length > 0 ? (
            <>
              <Badge variant="destructive" size="sm">
                {stats.topLeaks[0][1]} {stats.topLeaks[0][1] === 1 ? "time" : "times"}
              </Badge>
              <span className="text-muted-foreground">recurring leak</span>
            </>
          ) : (
            <span className="text-muted-foreground">tag leaks during review</span>
          )}
        </div>
      </Card>
    </div>
  );
}
