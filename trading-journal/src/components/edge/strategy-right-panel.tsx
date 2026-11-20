"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  Edit3,
  ShieldAlert,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Strategy } from "@/types/strategy";
import type { Trade } from "@/types/trade";
import { cn } from "@/lib/utils";
import { useActiveAccount } from "@/components/active-account-context";

interface StrategyRightPanelProps {
  strategy: Strategy;
}

export function StrategyRightPanel({ strategy }: StrategyRightPanelProps) {
  const { activeAccount } = useActiveAccount();
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const tradeAccountId = strategy.accountId ?? activeAccount?.id ?? null;

  useEffect(() => {
    const controller = new AbortController();
    setTrades(null);
    const query = tradeAccountId ? `?accountId=${encodeURIComponent(tradeAccountId)}` : "";
    const loadTrades = async () => {
      try {
        const response = await fetch(`/api/trades${query}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load plan trades");
        const data = (await response.json()) as { trades?: Trade[] };
        setTrades(data.trades ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTrades([]);
      }
    };
    void loadTrades();
    window.addEventListener("trade-log:updated", loadTrades);
    return () => {
      controller.abort();
      window.removeEventListener("trade-log:updated", loadTrades);
    };
  }, [tradeAccountId, strategy.id, strategy.name]);

  const planTrades = useMemo(
    () => (trades ?? []).filter((trade) => trade.strategy?.trim().toLocaleLowerCase() === strategy.name.trim().toLocaleLowerCase()),
    [trades, strategy.name],
  );
  const closedPlanTrades = planTrades.filter((trade) => trade.status === "closed");
  const winningTrades = closedPlanTrades.filter((trade) => trade.pnl > 0);
  const grossProfit = winningTrades.reduce((total, trade) => total + trade.pnl, 0);
  const grossLoss = Math.abs(closedPlanTrades.filter((trade) => trade.pnl < 0).reduce((total, trade) => total + trade.pnl, 0));
  const rMultiples = closedPlanTrades
    .map((trade) => trade.rMultiple)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const hasClosedTrades = closedPlanTrades.length > 0;
  const hasLoggedTrades = planTrades.length > 0;
  const actualWinRate = hasClosedTrades ? (winningTrades.length / closedPlanTrades.length) * 100 : null;
  const actualExpectancy = rMultiples.length > 0 ? rMultiples.reduce((total, value) => total + value, 0) / rMultiples.length : null;
  const actualProfitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : null;

  return (
    <aside className="edge-type-scale flex flex-col gap-4 w-full">
      {/* ─── Plan Stats (Edge State) ─── */}
      <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Activity size={13} className="text-violet-400" />
            Plan Stats
          </span>
          <Badge variant="muted" size="sm" className="text-[9px]">
            {strategy.status === "ACTIVE"
              ? "Active"
              : strategy.status === "CALIBRATING"
              ? "Calibrating"
              : strategy.status === "PROBATION"
              ? "Probation"
              : "Archived"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border/40">
          <div className="bg-card/60 px-4 py-3">
            <span className="text-xl font-bold font-mono text-foreground tracking-tight">
              {trades === null ? "—" : planTrades.length}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Trades Logged
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3">
            <span className="text-xl font-bold font-mono text-foreground tracking-tight">
              {hasLoggedTrades
                ? actualWinRate === null ? "—" : `${actualWinRate.toFixed(1)}%`
                : `${strategy.winRateTarget}%`}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {hasLoggedTrades ? actualWinRate === null ? "Win Rate (after close)" : "Win Rate" : "Win Rate Target"}
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3">
            <span
              className={cn(
                "text-lg font-bold font-mono tracking-tight",
                (actualExpectancy ?? strategy.expectancyR) >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {actualExpectancy === null
                ? hasLoggedTrades
                  ? "—"
                  : `${strategy.expectancyR >= 0 ? "+" : ""}${strategy.expectancyR}R`
                : `${actualExpectancy >= 0 ? "+" : ""}${actualExpectancy.toFixed(2)}R`}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {hasLoggedTrades ? "Actual Expectancy" : "Expectancy Target"}
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3">
            <span className="text-lg font-bold font-mono text-foreground tracking-tight">
              {actualProfitFactor === null
                ? hasLoggedTrades ? "—" : strategy.profitFactor.toFixed(2)
                : actualProfitFactor === Infinity
                ? "∞"
                : actualProfitFactor.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {hasLoggedTrades ? "Actual Profit Factor" : "Profit Factor Target"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Risk Controls ─── */}
      <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-rose-400" />
            Risk Controls
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground p-0.5 transition-colors cursor-pointer"
            title="Edit risk controls"
          >
            <Edit3 size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border/40">
          <div className="bg-card/60 px-4 py-3">
            <span className="text-base font-bold font-mono text-foreground tracking-tight">
              1:{strategy.minRrRatio.toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Min R:R Ratio
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3">
            <span className="text-base font-bold font-mono text-rose-400 tracking-tight">
              {strategy.maxRiskPercent}%
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Risk per trade
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3 col-span-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Zap size={11} className="text-amber-400 shrink-0" />
              <span className="truncate">
                {strategy.killSwitchRule || "2 stops → session freeze"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Trading Window ─── */}
      <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock size={13} className="text-sky-600 dark:text-sky-400" />
            Trading Window
          </span>
        </div>

        <div className="px-4 pb-4 space-y-2.5">
          <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-muted/50 border border-border/70">
            <span className="text-lg font-bold font-mono text-foreground tracking-tight">
              {strategy.killZoneStart}
            </span>
            <span className="text-xs text-muted-foreground">–</span>
            <span className="text-lg font-bold font-mono text-foreground tracking-tight">
              {strategy.killZoneEnd}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({strategy.timeZone?.split(" ")[0] || "EST"})
            </span>
          </div>

          {/* Sessions */}
          <div className="flex flex-wrap gap-1">
            {strategy.tradingSessions.map((s) => (
              <Badge
                key={s}
                variant="violet"
                size="sm"
                className="text-[9px]"
              >
                {s}
              </Badge>
            ))}
          </div>

          {/* Days */}
          <div className="flex gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => {
              const isActive = strategy.daysOfWeek.some((day) =>
                day.toLowerCase().startsWith(d.toLowerCase())
              );
              return (
                <span
                  key={d}
                  className={cn(
                    "flex-1 text-center py-1 text-[10px] font-medium rounded",
                    isActive
                      ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30"
                      : "bg-muted/40 text-muted-foreground border border-border/60"
                  )}
                >
                  {d}
                </span>
              );
            })}
          </div>

          {/* News blackout */}
          {strategy.newsBlackoutRule && (
            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground pt-1">
              <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{strategy.newsBlackoutRule}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
