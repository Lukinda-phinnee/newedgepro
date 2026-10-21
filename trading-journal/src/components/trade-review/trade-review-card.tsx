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
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-card p-4 sm:p-5 shadow-xs transition duration-200",
        isUnreviewed
          ? "border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-b from-card to-amber-500/[0.02]"
          : isFlagged
          ? "border-violet-500/40 hover:border-violet-500/70 bg-gradient-to-b from-card to-violet-500/[0.02]"
          : "border-border/80 hover:border-border"
      )}
    >
      <div>
        {/* Top bar: Review Status Badge & Flag Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isUnreviewed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unreviewed
              </span>
            ) : isFlagged ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
                <Bookmark size={11} fill="currentColor" />
                Flagged for Study
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 size={11} />
                Reviewed
              </span>
            )}

            {/* Execution Grade Pill (if reviewed) */}
            {trade.executionGrade && (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase",
                  trade.executionGrade === "A+" || trade.executionGrade === "A"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : trade.executionGrade === "B"
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : trade.executionGrade === "C"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                )}
              >
                Grade {trade.executionGrade}
              </span>
            )}

            {/* Star rating */}
            {trade.reviewRating && trade.reviewRating > 0 && (
              <div className="hidden sm:flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: trade.reviewRating }).map((_, i) => (
                  <Star key={i} size={11} fill="currentColor" />
                ))}
              </div>
            )}
          </div>

          {/* Quick Flag Button */}
          <button
            type="button"
            onClick={() => onToggleFlag(trade)}
            className={cn(
              "rounded-lg p-1.5 text-xs transition",
              isFlagged
                ? "bg-violet-500/20 text-violet-300"
                : "text-muted-foreground/60 hover:bg-white/5 hover:text-foreground"
            )}
            title={isFlagged ? "Remove study flag" : "Flag for study"}
          >
            <Bookmark size={14} fill={isFlagged ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Trade Information Header */}
        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-border/80 bg-secondary/80 px-2 py-0.5 text-xs font-bold text-foreground">
                {trade.symbol}
              </span>
              {trade.screenshots && trade.screenshots.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-300"
                  title={`${trade.screenshots.length} chart ${trade.screenshots.length === 1 ? "screenshot" : "screenshots"} attached`}
                >
                  <LucideImage size={11} />
                  {trade.screenshots.length}
                </span>
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                  trade.side === "long"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                )}
              >
                {trade.side === "long" ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                {trade.side}
              </span>
              {trade.strategy && (
                <span className="rounded-md border border-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                  {trade.strategy}
                </span>
              )}
            </div>

            <div
              className="mt-1.5 flex items-center gap-2 text-[11px] text-foreground/70"
              suppressHydrationWarning
            >
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
                "text-base font-extrabold tracking-tight",
                isProfitable
                  ? "text-emerald-400"
                  : isLoss
                  ? "text-rose-400"
                  : "text-foreground/60"
              )}
            >
              {isProfitable ? "+" : ""}
              ${trade.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-foreground/70">
              {isProfitable ? "+" : ""}
              {trade.pnlPercentage.toFixed(2)}%
              {trade.rMultiple !== undefined && ` (${trade.rMultiple >= 0 ? "+" : ""}${trade.rMultiple}R)`}
            </div>
          </div>
        </div>

        {/* Rule Adherence Badge */}
        {trade.followedRules && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                trade.followedRules === "yes"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : trade.followedRules === "partial"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-rose-500/10 text-rose-400"
              )}
            >
              {trade.followedRules === "yes" ? (
                <>
                  <ShieldCheck size={12} />
                  Strictly Followed Plan
                </>
              ) : trade.followedRules === "partial" ? (
                <>
                  <ShieldAlert size={12} />
                  Minor Rule Deviation
                </>
              ) : (
                <>
                  <Flame size={12} />
                  Broke Rules / Emotional
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
                className="rounded-md border border-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80"
              >
                {tag}
              </span>
            ))}
            {trade.mistakeTags.length > 3 && (
              <span className="rounded-md bg-secondary/40 px-1.5 py-0.5 text-[10px] text-foreground/70">
                +{trade.mistakeTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Lessons preview or original note */}
        <div className="mt-3 rounded-xl border border-border/50 bg-secondary/20 p-2.5 text-xs text-foreground/80">
          {trade.lessonsLearned ? (
            <div>
              <span className="font-semibold text-foreground mr-1">Lesson:</span>
              <span className="text-foreground/80">{trade.lessonsLearned}</span>
            </div>
          ) : trade.whatToImprove ? (
            <div>
              <span className="font-semibold text-rose-400 mr-1">Leak:</span>
              <span className="text-foreground/80">{trade.whatToImprove}</span>
            </div>
          ) : trade.whatWentWell ? (
            <div>
              <span className="font-semibold text-emerald-400 mr-1">Win:</span>
              <span className="text-foreground/80">{trade.whatWentWell}</span>
            </div>
          ) : trade.notes ? (
            <div className="truncate">
              <span className="font-semibold text-foreground mr-1">Note:</span>
              <span>{trade.notes}</span>
            </div>
          ) : (
            <span className="italic text-foreground/40">No notes recorded yet</span>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="text-[11px] text-foreground/70" suppressHydrationWarning>
          {trade.reviewedAt ? (
            <span>Reviewed {new Date(trade.reviewedAt).toLocaleDateString()}</span>
          ) : (
            <span className="text-amber-400/90 font-medium flex items-center gap-1">
              <Clock size={11} />
              Awaiting review
            </span>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => onReviewClick(trade)}
          className={cn(
            "h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs transition",
            isUnreviewed
              ? "bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-sm"
              : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/70"
          )}
        >
          <Edit3 size={12} />
          {isUnreviewed ? "Review Trade" : "Edit Review"}
        </Button>
      </div>
    </div>
  );
}
