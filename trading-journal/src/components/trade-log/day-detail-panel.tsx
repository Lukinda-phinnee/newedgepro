"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DayTradeSummary, Trade } from "@/types/trade";

interface DayDetailPanelProps {
  day: DayTradeSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  currency?: string;
  onLogTradeClick?: () => void;
}

export function DayDetailPanel({
  day,
  open,
  onOpenChange,
  onNavigatePrev,
  onNavigateNext,
  currency = "USD",
  onLogTradeClick,
}: DayDetailPanelProps) {
  // Trade filter inside panel
  const [outcomeTab, setOutcomeTab] = useState<"all" | "wins" | "losses">("all");
  const [instrumentSearch, setInstrumentSearch] = useState("");

  // Selected trade for detail popover / inspection
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Compute metrics for the selected day
  const metrics = useMemo(() => {
    if (!day) {
      return {
        netPnl: 0,
        winRate: 0,
        averageR: "-",
        totalTrades: 0,
        wins: 0,
        losses: 0,
        rMultiplesCount: 0,
      };
    }

    const rValues = day.trades
      .map((t) => t.rMultiple)
      .filter((r): r is number => r !== undefined && !isNaN(r));

    const avgR =
      rValues.length > 0
        ? (rValues.reduce((sum, r) => sum + r, 0) / rValues.length).toFixed(1) + "R"
        : "-";

    return {
      netPnl: day.totalPnl,
      winRate: day.winRate,
      averageR: avgR,
      totalTrades: day.tradeCount,
      wins: day.wins,
      losses: day.losses,
      rMultiplesCount: rValues.length,
    };
  }, [day]);

  // Filter trades for the bottom list
  const filteredTrades = useMemo(() => {
    if (!day) return [];
    return day.trades.filter((trade) => {
      if (outcomeTab === "wins" && trade.pnl <= 0) return false;
      if (outcomeTab === "losses" && trade.pnl >= 0) return false;
      if (instrumentSearch.trim()) {
        const q = instrumentSearch.toLowerCase();
        if (!trade.symbol.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [day, outcomeTab, instrumentSearch]);

  if (!open || !day) return null;

  // Format date: "Tue, October 20"
  const dateObj = new Date(day.date + "T00:00:00");
  const formattedDayStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  const isProfitable = metrics.netPnl > 0;
  const isLosing = metrics.netPnl < 0;

  return (
    <aside
      role="region"
      aria-labelledby="day-detail-panel-title"
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-foreground shadow-md transition-all duration-250"
    >
      {/* 1. Header with < > Day Navigation, Date Title, and Close Button */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-5">
        <div className="flex items-center gap-3">
          {/* Prev / Next day arrow buttons */}
          <div className="flex items-center rounded-xl border border-border/80 bg-secondary/30 p-0.5">
            <button
              type="button"
              onClick={onNavigatePrev}
              aria-label="Previous day"
              className="rounded-lg p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onNavigateNext}
              aria-label="Next day"
              className="rounded-lg p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Date & Today indicator */}
          <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <span id="day-detail-panel-title">{formattedDayStr}</span>
            {day.isToday && (
              <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">
                · Today
              </span>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close panel"
          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
            {/* HERO NET PNL */}
            <div className="py-1 text-center">
              <div
                className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${
                  isLosing
                    ? "text-rose-500 dark:text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                    : "text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                }`}
              >
                {isLosing ? "-" : "+"}
                ${Math.abs(metrics.netPnl).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="mt-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                NET PNL
              </div>
            </div>

            {/* 2x2 METRICS MATRIX CARD */}
            <div className="rounded-2xl border border-border/80 bg-card/70 shadow-xs">
              <div className="grid grid-cols-2 divide-x divide-border/70">
                {/* Top-Left: WIN RATE */}
                <div className="py-2.5 px-3 text-center">
                  <div
                    className={`text-lg font-bold tracking-tight ${
                      metrics.winRate > 0
                        ? "text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {metrics.winRate.toFixed(1)}%
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    WIN RATE
                  </div>
                </div>

                {/* Top-Right: AVERAGE R */}
                <div className="py-2.5 px-3 text-center">
                  <div className="text-lg font-bold tracking-tight text-foreground">
                    {metrics.averageR}
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    AVERAGE R
                  </div>
                </div>
              </div>

              <div className="border-t border-border/70">
                <div className="grid grid-cols-2 divide-x divide-border/70">
                  {/* Bottom-Left: TOTAL TRADES */}
                  <div className="py-2.5 px-3 text-center">
                    <div className="text-lg font-bold tracking-tight text-foreground">
                      {metrics.totalTrades}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      TOTAL TRADES
                    </div>
                  </div>

                  {/* Bottom-Right: WINS & LOSSES */}
                  <div className="flex items-center justify-center gap-7 py-2.5 px-3 text-center">
                    <div>
                      <div className="text-lg font-bold tracking-tight text-emerald-500 dark:text-emerald-400">
                        {metrics.wins}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        WINS
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold tracking-tight text-rose-500 dark:text-rose-400">
                        {metrics.losses}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        LOSSES
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DISCIPLINE & EXECUTION CHECKLIST */}
            <div className="space-y-2">
              {/* Plan Followed */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-xs transition hover:bg-card">
                <span className="font-semibold text-foreground">Plan Followed</span>
                <span className="font-medium text-muted-foreground">
                  {metrics.totalTrades > 0 ? "Followed (100%)" : "No trades"}
                </span>
              </div>

              {/* Guardrail Violations */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-xs transition hover:bg-card">
                <span className="font-semibold text-foreground">Guardrail Violations</span>
                <span className="flex items-center gap-1 font-medium text-emerald-500 dark:text-emerald-400">
                  <Check size={18} strokeWidth={2.5} />
                </span>
              </div>

              {/* Pre-Market Routine */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-xs transition hover:bg-card">
                <span className="font-semibold text-foreground">Pre-Market Routine</span>
                <span className="font-medium text-muted-foreground">
                  {metrics.totalTrades > 0 ? "Completed" : "Not completed"}
                </span>
              </div>

              {/* Trades Journaled */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-xs transition hover:bg-card">
                <span className="font-semibold text-foreground">Trades Journaled</span>
                <span className="font-medium text-muted-foreground">
                  {metrics.totalTrades > 0
                    ? `${metrics.totalTrades} / ${metrics.totalTrades} logged`
                    : "No trades"}
                </span>
              </div>
            </div>

            {/* TRADES SECTION */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold tracking-wider text-foreground uppercase">
                  TRADES
                </div>
                <div className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  TAP A TRADE TO SEE DETAILS
                </div>
              </div>

              {/* Filters Bar: ALL, WINS, LOSSES + Instrument Search */}
              <div className="flex items-center justify-between gap-2">
                {/* Outcome Pill tabs */}
                <div className="flex rounded-full border border-border/80 bg-secondary/40 p-1">
                  <button
                    type="button"
                    onClick={() => setOutcomeTab("all")}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase transition ${
                      outcomeTab === "all"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcomeTab("wins")}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase transition ${
                      outcomeTab === "wins"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    WINS
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcomeTab("losses")}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase transition ${
                      outcomeTab === "losses"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    LOSSES
                  </button>
                </div>

                {/* Instrument Search box */}
                <div className="relative w-36">
                  <Input
                    value={instrumentSearch}
                    onChange={(e) => setInstrumentSearch(e.target.value)}
                    placeholder="Instrument"
                    className="h-8 rounded-xl bg-secondary/40 pr-7 text-xs placeholder:text-muted-foreground/60"
                  />
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>

              {/* Trades List Table */}
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
                {/* Table Header */}
                <div className="grid grid-cols-[80px_60px_80px_1fr_75px] border-b border-border/70 bg-secondary/30 px-3 py-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <div>INSTRUMENT</div>
                  <div>TIME</div>
                  <div>DIRECTION</div>
                  <div>EMOTIONS</div>
                  <div className="text-right">PNL</div>
                </div>

                {/* Table Rows or Empty State */}
                {filteredTrades.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <p>No trades found for this filter.</p>
                    {onLogTradeClick && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={onLogTradeClick}
                        className="mt-3 h-7 gap-1 bg-violet-600 px-3 text-[11px] text-white hover:bg-violet-500"
                      >
                        <Plus size={12} />
                        Log Trade
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {filteredTrades.map((t) => {
                      const tradeProfit = t.pnl > 0;
                      const tradeLoss = t.pnl < 0;
                      const isExpanded = expandedTradeId === t.id;

                      const timeFormatted = t.openedAt
                        ? new Date(t.openedAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";

                      return (
                        <div key={t.id}>
                          <div
                            onClick={() =>
                              setExpandedTradeId(isExpanded ? null : t.id)
                            }
                            className="grid cursor-pointer grid-cols-[80px_60px_80px_1fr_75px] items-center px-3 py-2.5 text-xs transition hover:bg-secondary/40"
                          >
                            {/* Instrument */}
                            <div className="font-bold text-foreground">
                              {t.symbol}
                            </div>

                            {/* Time */}
                            <div className="text-[11px] text-muted-foreground">
                              {timeFormatted}
                            </div>

                            {/* Direction */}
                            <div>
                              <span
                                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  t.side === "long"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-rose-500/15 text-rose-400"
                                }`}
                              >
                                {t.side === "long" ? (
                                  <ArrowUpRight size={10} />
                                ) : (
                                  <ArrowDownLeft size={10} />
                                )}
                                {t.side}
                              </span>
                            </div>

                            {/* Emotions / Strategy */}
                            <div className="truncate pr-2 text-[11px] text-muted-foreground">
                              {t.notes?.slice(0, 20) || t.strategy || "Disciplined"}
                            </div>

                            {/* PnL */}
                            <div
                              className={`text-right font-bold ${
                                tradeProfit
                                  ? "text-emerald-400"
                                  : tradeLoss
                                  ? "text-rose-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {tradeProfit ? "+" : ""}
                              ${Math.abs(t.pnl).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>

                          {/* Expanded Trade Detail Card */}
                          {isExpanded && (
                            <div className="border-t border-border/50 bg-secondary/20 p-3 text-[11px] text-muted-foreground">
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div>
                                  <span className="text-muted-foreground/70">
                                    Entry:
                                  </span>{" "}
                                  <span className="font-semibold text-foreground">
                                    ${t.entryPrice.toLocaleString("en-US")}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground/70">
                                    Exit:
                                  </span>{" "}
                                  <span className="font-semibold text-foreground">
                                    {t.exitPrice
                                      ? `$${t.exitPrice.toLocaleString("en-US")}`
                                      : "Open"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground/70">
                                    Size:
                                  </span>{" "}
                                  <span className="font-semibold text-foreground">
                                    {t.quantity} contracts
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground/70">
                                    Stop:
                                  </span>{" "}
                                  <span className="font-semibold text-foreground">
                                    {t.stopLoss
                                      ? `$${t.stopLoss.toLocaleString("en-US")}`
                                      : "None"}
                                  </span>
                                </div>
                              </div>
                              {/* Review & Rule Discipline Status Banner */}
                              <div className="mt-2.5 flex flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Review:</span>
                                      {t.reviewStatus === "reviewed" ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                          Reviewed {t.executionGrade ? `(${t.executionGrade})` : ""}
                                        </span>
                                      ) : t.reviewStatus === "flagged" ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                                          Flagged
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                          <span className="size-1 rounded-full bg-amber-400 animate-pulse" />
                                          Unreviewed
                                        </span>
                                      )}
                                    </div>

                                    {/* Rule Discipline Pill */}
                                    <div className="flex items-center gap-1.5 border-l border-border/60 pl-2">
                                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Rules:</span>
                                      {t.ruleVerdict === "BLOCK" || (!t.ruleVerdict && t.followedRules === "no") ? (
                                        <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                          <AlertTriangle size={10} className="text-rose-400" />
                                          Violated
                                        </span>
                                      ) : t.ruleVerdict === "WARN" || (!t.ruleVerdict && t.followedRules === "partial") ? (
                                        <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                          <ShieldAlert size={10} className="text-amber-400" />
                                          Warning
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                          <ShieldCheck size={10} className="text-emerald-400" />
                                          Compliant
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <a
                                    href="/trade-review"
                                    className="text-[11px] font-medium text-violet-400 hover:text-violet-300 hover:underline shrink-0"
                                  >
                                    {t.reviewStatus === "reviewed" ? "Review Studio →" : "Audit Trade →"}
                                  </a>
                                </div>

                                {t.ruleEvaluation?.triggeredRules && t.ruleEvaluation.triggeredRules.length > 0 && (
                                  <div className="rounded border border-rose-500/20 bg-rose-500/5 px-2 py-1 text-[10px] text-rose-300">
                                    <span className="font-semibold">Detected Guardrail Alert:</span>{" "}
                                    {t.ruleEvaluation.triggeredRules[0].message}
                                  </div>
                                )}
                              </div>
                              {t.notes && (
                                <p className="mt-2 rounded-lg border border-border/50 bg-background/50 p-2 text-foreground/80">
                                  {t.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
    </aside>
  );
}
