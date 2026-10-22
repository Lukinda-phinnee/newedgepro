"use client";

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
import type { Strategy, StrategyStatus } from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyRightPanelProps {
  strategy: Strategy;
}

export function StrategyRightPanel({ strategy }: StrategyRightPanelProps) {
  return (
    <aside className="flex flex-col gap-4 w-full">
      {/* ─── Plan Stats (Edge State) ─── */}
      <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <Activity size={12} className="text-violet-400" />
            Plan Stats
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
            title="Edit stats"
          >
            <Edit3 size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border/40">
          <div className="bg-card/60 px-4 py-3">
            <span className="text-xl font-bold font-mono text-foreground tracking-tight">
              {strategy.sampleSize}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Trades Taken
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3">
            <span className="text-xl font-bold font-mono text-foreground tracking-tight">
              {strategy.winRateTarget}%
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Win Rate
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3">
            <span
              className={cn(
                "text-lg font-bold font-mono tracking-tight",
                strategy.expectancyR >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {strategy.expectancyR >= 0 ? "+" : ""}
              {strategy.expectancyR}R
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Expectancy
            </span>
          </div>
          <div className="bg-card/60 px-4 py-3">
            <span className="text-lg font-bold font-mono text-foreground tracking-tight">
              {strategy.profitFactor.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Profit Factor
            </span>
          </div>
        </div>
      </div>

      {/* ─── Risk Controls ─── */}
      <div className="rounded-xl border border-border/70 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-rose-400" />
            Risk Controls
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
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
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <Clock size={12} className="text-sky-400" />
            Trading Window
          </span>
        </div>

        <div className="px-4 pb-4 space-y-2.5">
          <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/[0.03] border border-border/40">
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
                variant="muted"
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
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                      : "bg-white/[0.02] text-muted-foreground/50 border border-border/30"
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
