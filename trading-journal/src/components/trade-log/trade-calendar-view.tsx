"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DAYS_OF_WEEK } from "@/lib/trade-calendar";
import { DayDetailPanel } from "@/components/trade-log/day-detail-panel";
import type { MonthTradeSummary, DayTradeSummary, Trade } from "@/types/trade";

interface TradeCalendarViewProps {
  monthSummary: MonthTradeSummary;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  currency?: string;
  onLogTradeClick?: () => void;
}

export function TradeCalendarView({
  monthSummary,
  onPrevMonth,
  onNextMonth,
  onToday,
  currency = "USD",
  onLogTradeClick,
}: TradeCalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayTradeSummary | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  // Flatten calendar days to enable < and > navigation across dates
  const allDays = useMemo(
    () => monthSummary.weeks.flatMap((w) => w.days),
    [monthSummary.weeks]
  );

  const handleDayClick = (day: DayTradeSummary) => {
    setSelectedDay(day);
    setDayModalOpen(true);
  };

  const handleNavigatePrev = () => {
    if (!selectedDay) return;
    const currentIndex = allDays.findIndex((d) => d.date === selectedDay.date);
    if (currentIndex > 0) {
      setSelectedDay(allDays[currentIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (!selectedDay) return;
    const currentIndex = allDays.findIndex((d) => d.date === selectedDay.date);
    if (currentIndex >= 0 && currentIndex < allDays.length - 1) {
      setSelectedDay(allDays[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation & Performance Quick Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border/80 bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[140px] text-center text-sm font-bold text-foreground">
              {monthSummary.monthName} {monthSummary.year}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="h-9 px-3 text-xs font-medium"
          >
            Today
          </Button>
        </div>

        {/* Month Summary Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-bold ${
              monthSummary.totalPnl >= 0
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}
          >
            {monthSummary.totalPnl >= 0 ? (
              <TrendingUp size={13} className="shrink-0" />
            ) : (
              <TrendingDown size={13} className="shrink-0" />
            )}
            <span>
              Month Net: {monthSummary.totalPnl >= 0 ? "+" : ""}
              ${monthSummary.totalPnl.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-muted-foreground">
            Win Rate:{" "}
            <span className="font-semibold text-foreground">
              {monthSummary.winRate}%
            </span>
          </div>

          <div className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-muted-foreground">
            Trades:{" "}
            <span className="font-semibold text-foreground">
              {monthSummary.totalTrades}
            </span>
          </div>

          <div className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-muted-foreground">
            Profit Factor:{" "}
            <span className="font-semibold text-foreground">
              {monthSummary.profitFactor > 0 ? monthSummary.profitFactor.toFixed(2) : "—"}
            </span>
          </div>
        </div>
      </div>      {/* Main Layout: Calendar Grid + Inline Side Detail Panel */}
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Calendar Grid Container (pushes width dynamically) */}
        <div className="w-full flex-1 min-w-0 overflow-x-auto rounded-2xl border border-border/80 bg-card/40 p-3 shadow-sm transition-all duration-300">
          <div className="min-w-[720px] space-y-2 xl:min-w-[780px]">
            {/* Calendar Header Row: 7 Days + 1 Dedicated Week Column */}
            <div className="grid grid-cols-[repeat(7,1fr)_140px] gap-2 text-xs font-semibold text-muted-foreground">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="rounded-lg bg-secondary/40 py-2 text-center uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
              <div className="rounded-lg bg-secondary/60 py-2 text-center font-bold text-foreground uppercase tracking-wider">
                Week Total
              </div>
            </div>

            {/* Calendar Weeks */}
            <div className="space-y-2">
              {monthSummary.weeks.map((week) => {
                const weekProfitable = week.totalPnl > 0;
                const weekLosing = week.totalPnl < 0;

                return (
                  <div
                    key={week.weekLabel + week.startDate}
                    className="grid grid-cols-[repeat(7,1fr)_140px] gap-2"
                  >
                    {/* 7 Days in Week */}
                    {week.days.map((day) => {
                      const hasTrades = day.tradeCount > 0;
                      const isProfitable = day.totalPnl > 0;
                      const isLosing = day.totalPnl < 0;
                      const isSelected = dayModalOpen && selectedDay?.date === day.date;

                      return (
                        <div
                          key={day.date}
                          onClick={() => handleDayClick(day)}
                          className={`group relative flex min-h-[110px] cursor-pointer flex-col justify-between rounded-xl border p-2.5 transition-all sm:min-h-[120px] ${
                            !day.isCurrentMonth
                              ? "border-border/30 bg-secondary/10 opacity-30 hover:border-border/50 hover:opacity-60"
                              : hasTrades
                              ? isProfitable
                                ? "border-emerald-500/30 bg-emerald-500/[0.08] dark:bg-emerald-950/20 hover:border-emerald-500/50 hover:bg-emerald-500/[0.14] hover:shadow-md hover:shadow-emerald-950/20"
                                : isLosing
                                ? "border-rose-500/30 bg-rose-500/[0.08] dark:bg-rose-950/20 hover:border-rose-500/50 hover:bg-rose-500/[0.14] hover:shadow-md hover:shadow-rose-950/20"
                                : "border-border/70 bg-card hover:border-border hover:bg-secondary/40"
                              : "border-border/60 bg-card/60 hover:border-border hover:bg-secondary/30"
                          } ${
                            isSelected
                              ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-background border-violet-500/80 shadow-md"
                              : day.isToday
                              ? "ring-2 ring-blue-500/60 ring-offset-1 ring-offset-background"
                              : ""
                          }`}
                        >
                          {/* Day Number and Today Indicator */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`flex size-6 items-center justify-center rounded-md text-xs font-semibold ${
                                isSelected
                                  ? "bg-violet-600 font-bold text-white shadow-xs"
                                  : day.isToday
                                  ? "bg-blue-600 font-bold text-white shadow-xs"
                                  : hasTrades
                                  ? "text-foreground"
                                  : "text-muted-foreground/70"
                              }`}
                            >
                              {day.dayOfMonth}
                            </span>

                            {hasTrades && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  isProfitable
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : isLosing
                                    ? "bg-rose-500/20 text-rose-400"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {day.tradeCount}T
                              </span>
                            )}
                          </div>

                          {/* Middle: Day P&L or Empty State */}
                          <div className="my-auto py-1">
                            {hasTrades ? (
                              <div>
                                <div
                                  className={`text-sm font-bold tracking-tight sm:text-base ${
                                    isProfitable
                                      ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                                      : isLosing
                                      ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                                      : "text-foreground/80"
                                  }`}
                                >
                                  {isProfitable ? "+" : ""}
                                  ${Math.abs(day.totalPnl).toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </div>

                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <span>
                                    {day.wins}W · {day.losses}L
                                  </span>
                                  {day.winRate > 0 && (
                                    <span>· {day.winRate}%</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              day.isCurrentMonth && (
                                <div className="text-[11px] text-muted-foreground/30 group-hover:text-muted-foreground/60">
                                  —
                                </div>
                              )
                            )}
                          </div>

                          {/* Bottom: Symbols Traded Chips */}
                          <div className="flex flex-wrap gap-1">
                            {hasTrades &&
                              Array.from(new Set(day.trades.map((t) => t.symbol)))
                                .slice(0, 2)
                                .map((sym) => (
                                  <span
                                    key={sym}
                                    className="rounded border border-border/60 bg-background/60 px-1 py-0.5 text-[9px] font-semibold text-foreground/80"
                                  >
                                    {sym}
                                  </span>
                                ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Dedicated Week Total Column */}
                    <div
                      className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                        week.tradeCount > 0
                          ? weekProfitable
                            ? "border-emerald-500/35 bg-emerald-500/[0.1] dark:bg-emerald-950/30 hover:border-emerald-500/50"
                            : weekLosing
                            ? "border-rose-500/35 bg-rose-500/[0.1] dark:bg-rose-950/30 hover:border-rose-500/50"
                            : "border-border/70 bg-secondary/40"
                          : "border-border/50 bg-secondary/20"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            {week.weekLabel}
                          </span>
                          {week.tradeCount > 0 && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                weekProfitable
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : weekLosing
                                  ? "bg-rose-500/20 text-rose-400"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {week.winRate}%
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5">
                          <div
                            className={`text-base font-extrabold tracking-tight sm:text-lg ${
                              weekProfitable
                                ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                                : weekLosing
                                ? "text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                                : "text-muted-foreground"
                            }`}
                          >
                            {week.tradeCount > 0 ? (
                              <>
                                {weekProfitable ? "+" : ""}
                                ${Math.abs(week.totalPnl).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </>
                            ) : (
                              "$0.00"
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Trades:</span>
                          <span className="font-semibold text-foreground">
                            {week.tradeCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Record:</span>
                          <span className="font-semibold text-foreground">
                            {week.wins}W - {week.losses}L
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Clicked Day Breakdown Side Right Panel (pushes calendar width & matches calendar height) */}
        {dayModalOpen && selectedDay && (
          <div className="flex w-full shrink-0 flex-col lg:w-[420px] xl:w-[450px] animate-in fade-in slide-in-from-right-3 duration-200">
            <DayDetailPanel
              day={selectedDay}
              open={dayModalOpen}
              onOpenChange={setDayModalOpen}
              onNavigatePrev={handleNavigatePrev}
              onNavigateNext={handleNavigateNext}
              currency={currency}
              onLogTradeClick={onLogTradeClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
