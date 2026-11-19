"use client";

import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Eye,
  Flame,
  Image as LucideImage,
  Quote,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";

interface JournalTradeCardProps {
  trade: Trade;
  currency?: string;
  onClick: (trade: Trade) => void;
}

export function JournalTradeCard({
  trade,
  currency = "USD",
  onClick,
}: JournalTradeCardProps) {
  const isProfitable = trade.pnl > 0;
  const isLoss = trade.pnl < 0;
  const isBreakeven = trade.pnl === 0;

  const dateObj = new Date(trade.openedAt);
  const dateStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : trade.openedAt;

  const timeStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;

  // Formatted caption resolution
  const summaryCaption = useMemo(() => {
    if (trade.lessonsLearned && trade.lessonsLearned.trim()) {
      return {
        label: "Lesson",
        text: trade.lessonsLearned,
        type: "lesson" as const,
      };
    }
    if (trade.notes && trade.notes.trim()) {
      return {
        label: "Journal Note",
        text: trade.notes,
        type: "note" as const,
      };
    }
    if (trade.whatWentWell && trade.whatWentWell.trim()) {
      return {
        label: "Strength",
        text: trade.whatWentWell,
        type: "strength" as const,
      };
    }
    if (trade.whatToImprove && trade.whatToImprove.trim()) {
      return {
        label: "To Improve",
        text: trade.whatToImprove,
        type: "leak" as const,
      };
    }
    if (trade.reviewNotes && trade.reviewNotes.trim()) {
      return {
        label: "Audit Note",
        text: trade.reviewNotes,
        type: "audit" as const,
      };
    }

    // Default generated caption
    const outcomeText = isProfitable
      ? `closed in profit (+${currencySymbol}${trade.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })})`
      : isLoss
      ? `closed in loss (-${currencySymbol}${Math.abs(trade.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })})`
      : "closed at breakeven";

    const stratText = trade.strategy ? ` following ${trade.strategy}` : "";
    const sessionText = trade.marketSession ? ` during ${trade.marketSession}` : "";

    return {
      label: "Summary",
      text: `${trade.side.toUpperCase()} execution on ${trade.symbol}${stratText}${sessionText}, ${outcomeText}.`,
      type: "auto" as const,
    };
  }, [trade, currencySymbol, isProfitable, isLoss]);

  const hasScreenshots = Array.isArray(trade.screenshots) && trade.screenshots.length > 0;
  const firstScreenshot = hasScreenshots ? trade.screenshots![0] : null;

  return (
    <Card
      onClick={() => onClick(trade)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-950/10 cursor-pointer"
    >
      {/* ─── Image Area ─── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40 select-none">
        {firstScreenshot ? (
          <>
            <img
              src={firstScreenshot}
              alt={`${trade.symbol} chart screenshot`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Dark gradient vignettes for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />
          </>
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/80 via-card to-background p-4 text-center">
            {/* SVG Candlestick Watermark Pattern */}
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.06] pointer-events-none stroke-foreground"
              viewBox="0 0 200 120"
              fill="none"
              preserveAspectRatio="none"
            >
              <line x1="20" y1="20" x2="20" y2="100" strokeWidth="1" />
              <rect x="15" y="35" width="10" height="40" fill="currentColor" />
              <line x1="50" y1="10" x2="50" y2="110" strokeWidth="1" />
              <rect x="45" y="25" width="10" height="60" fill="currentColor" />
              <line x1="80" y1="30" x2="80" y2="90" strokeWidth="1" />
              <rect x="75" y="45" width="10" height="25" fill="currentColor" />
              <line x1="110" y1="15" x2="110" y2="105" strokeWidth="1" />
              <rect x="105" y="30" width="10" height="50" fill="currentColor" />
              <line x1="140" y1="25" x2="140" y2="95" strokeWidth="1" />
              <rect x="135" y="40" width="10" height="30" fill="currentColor" />
              <line x1="170" y1="10" x2="170" y2="115" strokeWidth="1" />
              <rect x="165" y="20" width="10" height="70" fill="currentColor" />
            </svg>

            <div className="z-10 flex flex-col items-center gap-1.5 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary/80 border border-border/60">
                <LucideImage size={18} />
              </div>
              <span className="text-[11px] font-medium tracking-wide">No chart attached</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/50 pointer-events-none" />
          </div>
        )}

        {/* Floating Top Left: Side + Symbol */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-md",
              trade.side === "long"
                ? "bg-emerald-500/85 text-white"
                : "bg-rose-500/85 text-white"
            )}
          >
            {trade.side === "long" ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
            {trade.side}
          </span>
          <span className="rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold text-white tracking-tight backdrop-blur-md border border-white/10">
            {trade.symbol}
          </span>
          {trade.isDemo && (
            <span className="rounded bg-amber-500/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur-md">
              Demo
            </span>
          )}
        </div>

        {/* Floating Top Right: PnL Badge */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {hasScreenshots && trade.screenshots!.length > 1 && (
            <span
              className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md border border-white/10"
              title={`${trade.screenshots!.length} screenshots`}
            >
              <LucideImage size={11} />
              +{trade.screenshots!.length - 1}
            </span>
          )}

          <div
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums backdrop-blur-md border shadow-xs",
              isProfitable
                ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400 dark:text-emerald-300"
                : isLoss
                ? "border-rose-500/30 bg-rose-500/20 text-rose-400 dark:text-rose-300"
                : "border-border/60 bg-black/60 text-white/90"
            )}
          >
            {isProfitable ? <TrendingUp size={12} /> : isLoss ? <TrendingDown size={12} /> : null}
            <span>
              {isProfitable ? "+" : isLoss ? "-" : ""}
              {currencySymbol}
              {Math.abs(trade.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Floating Bottom Info (Date & Session) */}
        <div className="absolute inset-x-3 bottom-2.5 z-10 flex items-center justify-between text-[11px] text-white/80">
          <div className="flex items-center gap-1.5 drop-shadow-sm font-medium">
            <Clock size={11} className="text-white/70" />
            <span>{dateStr}</span>
            {trade.marketSession && (
              <>
                <span className="text-white/40">•</span>
                <span className="rounded bg-white/15 px-1.5 py-0.2 text-[10px] font-semibold text-white backdrop-blur-xs">
                  {trade.marketSession}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 drop-shadow-sm font-semibold tabular-nums">
            {trade.rMultiple !== undefined && trade.rMultiple !== null && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.2 text-[10px] backdrop-blur-xs",
                  trade.rMultiple > 0
                    ? "bg-emerald-500/30 text-emerald-200"
                    : trade.rMultiple < 0
                    ? "bg-rose-500/30 text-rose-200"
                    : "bg-white/20 text-white"
                )}
              >
                {trade.rMultiple >= 0 ? "+" : ""}
                {trade.rMultiple}R
              </span>
            )}
            <span className="text-white/70 text-[10px]">
              {isProfitable ? "+" : ""}
              {trade.pnlPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-md">
            <Eye size={13} />
            Quick View
          </span>
        </div>
      </div>

      {/* ─── Summary Caption & Content Area ─── */}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
        {/* Caption Card */}
        <div className="relative rounded-xl border border-border/60 bg-secondary/35 p-3 text-xs">
          <div className="flex items-center gap-1.5 pb-1 font-semibold text-muted-foreground">
            <Quote size={11} className="text-violet-400 rotate-180" />
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider font-bold",
                summaryCaption.type === "lesson"
                  ? "text-violet-400"
                  : summaryCaption.type === "strength"
                  ? "text-emerald-500"
                  : summaryCaption.type === "leak"
                  ? "text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {summaryCaption.label}
            </span>
          </div>
          <p className="line-clamp-2 leading-relaxed text-foreground/90 font-normal">
            {summaryCaption.text}
          </p>
        </div>

        {/* Price & Execution Stats */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
          <div className="flex flex-col rounded-lg bg-secondary/20 p-2 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-medium">Entry Price</span>
            <span className="font-semibold text-foreground tabular-nums">
              {currencySymbol}{trade.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
            </span>
          </div>
          <div className="flex flex-col rounded-lg bg-secondary/20 p-2 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-medium">Exit Price</span>
            <span className="font-semibold text-foreground tabular-nums">
              {trade.exitPrice !== null && trade.exitPrice !== undefined
                ? `${currencySymbol}${trade.exitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })}`
                : "Open Position"}
            </span>
          </div>
        </div>

        {/* Badges & Tags Footer */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {trade.strategy && (
              <Badge variant="secondary" size="sm" className="font-medium text-[10px]">
                {trade.strategy}
              </Badge>
            )}

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

            {(trade.ruleVerdict || trade.followedRules) && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[10px] font-semibold",
                  trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no")
                    ? "text-rose-500 dark:text-rose-400"
                    : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial")
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-emerald-500 dark:text-emerald-400"
                )}
                title={
                  trade.ruleVerdict === "BLOCK"
                    ? "Rule violation"
                    : trade.ruleVerdict === "WARN"
                    ? "Minor rule deviation"
                    : "Complied with rules"
                }
              >
                {trade.ruleVerdict === "BLOCK" || (!trade.ruleVerdict && trade.followedRules === "no") ? (
                  <Flame size={11} />
                ) : trade.ruleVerdict === "WARN" || (!trade.ruleVerdict && trade.followedRules === "partial") ? (
                  <ShieldAlert size={11} />
                ) : (
                  <ShieldCheck size={11} />
                )}
              </span>
            )}
          </div>

          <span className="text-[10px] text-muted-foreground tabular-nums">
            {timeStr}
          </span>
        </div>
      </div>
    </Card>
  );
}

