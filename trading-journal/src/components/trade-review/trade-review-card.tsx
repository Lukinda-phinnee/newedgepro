"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  Image as LucideImage,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface TradeReviewCardProps {
  trade: Trade;
  onReviewClick: (trade: Trade) => void;
  onToggleFlag: (trade: Trade) => void;
  currency?: string;
}

export function TradeReviewCard({
  trade,
  onReviewClick,
  onToggleFlag,
  currency = "USD",
}: TradeReviewCardProps) {
  const isProfitable = trade.pnl > 0;
  const isLoss = trade.pnl < 0;
  const isReviewed = trade.reviewStatus === "reviewed";
  const isFlagged = trade.reviewStatus === "flagged";
  const isUnreviewed = !trade.reviewStatus || trade.reviewStatus === "unreviewed";

  const dateObj = new Date(trade.openedAt);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border-border/70 bg-card/80 p-4.5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-xs",
        isUnreviewed && "border-amber-500/25 bg-amber-500/[0.015]",
        isFlagged && "border-violet-500/30 bg-violet-500/[0.015]"
      )}
    >
      <div>
        {/* Top Status Bar: Status Pill & Flag Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isUnreviewed ? (
              <Badge variant="warning" size="sm">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Awaiting Review
              </Badge>
            ) : isFlagged ? (
              <Badge variant="violet" size="sm">
                <Bookmark size={10} fill="currentColor" />
                Flagged for Study
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                <CheckCircle2 size={10} />
                Reviewed
              </Badge>
            )}

            {/* Execution Grade Badge */}
            {trade.executionGrade && (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tabular-nums tracking-wide border",
                  trade.executionGrade === "A+" || trade.executionGrade === "A"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : trade.executionGrade === "B"
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                    : trade.executionGrade === "C"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                Grade {trade.executionGrade}
              </span>
            )}

            {/* Star Rating */}
            {trade.reviewRating && trade.reviewRating > 0 && (
              <div className="flex items-center gap-0.5 text-amber-400/90 pl-1">
                {Array.from({ length: trade.reviewRating }).map((_, i) => (
                  <Star key={i} size={10} fill="currentColor" />
                ))}
              </div>
            )}
          </div>

          {/* Quiet Quick Flag Toggle */}
          <button
            type="button"
            onClick={() => onToggleFlag(trade)}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg text-xs transition active:scale-95",
              isFlagged
                ? "bg-violet-500/15 text-violet-500 dark:text-violet-300"
                : "text-muted-foreground/60 hover:bg-secondary hover:text-foreground"
            )}
            title={isFlagged ? "Remove study flag" : "Flag for weekend study"}
          >
            <Bookmark size={13} fill={isFlagged ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Trade Information Header */}
        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base font-bold tracking-tight text-foreground">
                {trade.symbol}
              </span>

              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  trade.side === "long"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {trade.side === "long" ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                {trade.side}
              </span>

              {trade.strategy && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  • {trade.strategy}
                </span>
              )}

              {trade.screenshots && trade.screenshots.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  title={`${trade.screenshots.length} chart screenshot${trade.screenshots.length === 1 ? "" : "s"}`}
                >
                  <LucideImage size={10} />
                  {trade.screenshots.length}
                </span>
              )}
            </div>

            <div
              className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
              suppressHydrationWarning
            >
              <Clock size={11} className="text-muted-foreground/70" />
              <span>{dateStr}</span>
              <span>•</span>
              <span>{timeStr}</span>
              {trade.marketSession && (
                <>
                  <span>•</span>
                  <span>{trade.marketSession}</span>
                </>
              )}
            </div>
          </div>

          {/* PnL & R-Multiple */}
          <div className="text-right">
            <div
              className={cn(
                "text-lg font-bold tracking-tight tabular-nums",
                isProfitable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isLoss
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {isProfitable ? "+" : ""}
              ${trade.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {isProfitable ? "+" : ""}
              {trade.pnlPercentage.toFixed(2)}%
              {trade.rMultiple !== undefined && ` (${trade.rMultiple >= 0 ? "+" : ""}${trade.rMultiple}R)`}
            </div>
          </div>
        </div>

        {/* Rule Adherence Indicator */}
        {(trade.followedRules || trade.ruleVerdict) && (
          <div className="mt-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium",
                trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no")
                  ? "text-rose-600 dark:text-rose-400"
                  : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial")
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no") ? (
                <>
                  <Flame size={12} />
                  Rule Breach
                </>
              ) : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial") ? (
                <>
                  <ShieldAlert size={12} />
                  Minor Deviation
                </>
              ) : (
                <>
                  <ShieldCheck size={12} />
                  Rule Compliant
                </>
              )}
            </span>
          </div>
        )}

        {/* Tags preview */}
        {trade.mistakeTags && trade.mistakeTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {trade.mistakeTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border/50 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80"
              >
                {tag}
              </span>
            ))}
            {trade.mistakeTags.length > 3 && (
              <span className="rounded-md bg-secondary/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{trade.mistakeTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Refined Reflection / Notes Quote */}
        <div className="mt-3 border-l-2 border-border/80 pl-2.5 text-xs text-foreground/80">
          {trade.lessonsLearned ? (
            <p className="line-clamp-2 leading-relaxed">
              <span className="font-semibold text-foreground">Rule: </span>
              {trade.lessonsLearned}
            </p>
          ) : trade.whatToImprove ? (
            <p className="line-clamp-2 leading-relaxed">
              <span className="font-semibold text-rose-500 dark:text-rose-400">Leak: </span>
              {trade.whatToImprove}
            </p>
          ) : trade.whatWentWell ? (
            <p className="line-clamp-2 leading-relaxed">
              <span className="font-semibold text-emerald-500 dark:text-emerald-400">Win: </span>
              {trade.whatWentWell}
            </p>
          ) : trade.notes ? (
            <p className="line-clamp-2 leading-relaxed text-muted-foreground">
              {trade.notes}
            </p>
          ) : (
            <p className="italic text-muted-foreground/50">No review notes recorded yet</p>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div className="text-[11px] text-muted-foreground" suppressHydrationWarning>
          {trade.reviewedAt ? (
            <span>Audited {new Date(trade.reviewedAt).toLocaleDateString()}</span>
          ) : (
            <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Clock size={11} />
              Needs review
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant={isUnreviewed ? "default" : "outline"}
          onClick={() => onReviewClick(trade)}
          className={cn(
            "h-8 gap-1.5 text-xs font-medium active:scale-[0.98] transition-transform",
            isUnreviewed && "shadow-xs"
          )}
        >
          <Edit3 size={12} />
          {isUnreviewed ? "Review" : "Edit"}
        </Button>
      </div>
    </Card>
  );
}
