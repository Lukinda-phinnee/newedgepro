"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Gauge,
  HelpCircle,
  Percent,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Strategy, StrategyStatus } from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyTopPillarsProps {
  strategy: Strategy;
  onStatusChange?: (newStatus: StrategyStatus) => void;
}

export function StrategyTopPillars({
  strategy,
  onStatusChange,
}: StrategyTopPillarsProps) {
  const getStatusColor = (status: StrategyStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-400 shadow-emerald-500/50",
          label: "Active Edge",
        };
      case "CALIBRATING":
        return {
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400 shadow-amber-500/50",
          label: "In Calibration",
        };
      case "PROBATION":
        return {
          badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          dot: "bg-rose-400 shadow-rose-500/50",
          label: "On Probation",
        };
      case "ARCHIVED":
        return {
          badge: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
          dot: "bg-neutral-400 shadow-neutral-500/50",
          label: "Archived",
        };
    }
  };

  const statusStyle = getStatusColor(strategy.status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full">
      {/* ─── Pillar 1: Edge State ─── */}
      <motion.div
        layout
        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm hover:border-violet-500/30 transition-colors"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Activity size={15} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Edge State
            </span>
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
              statusStyle.badge
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full shadow-sm animate-pulse",
                statusStyle.dot
              )}
            />
            {statusStyle.label}
          </span>
        </div>

        <div className="mt-3.5 space-y-3">
          {/* Main Stat & Health Score */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Expectancy (EV)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {strategy.expectancyR >= 0 ? `+${strategy.expectancyR}` : strategy.expectancyR}
                  <span className="text-violet-400 text-lg">R</span>
                </span>
                <span className="text-[11px] text-muted-foreground">/ trade</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">
                Health Score
              </span>
              <div className="inline-flex items-center gap-1.5 mt-0.5">
                <div className="flex items-center justify-center size-7 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                  {strategy.edgeScore}
                </div>
                <span className="text-[10px] text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
            <div className="rounded-xl bg-white/[0.03] p-2">
              <span className="text-[10px] text-muted-foreground block">Win Target</span>
              <span className="text-xs font-semibold text-foreground font-mono">
                {strategy.winRateTarget}%
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2">
              <span className="text-[10px] text-muted-foreground block">Profit Factor</span>
              <span className="text-xs font-semibold text-foreground font-mono">
                {strategy.profitFactor.toFixed(2)}
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-2">
              <span className="text-[10px] text-muted-foreground block">Sample Size</span>
              <span className="text-xs font-semibold text-foreground font-mono">
                {strategy.sampleSize} <span className="text-[10px] text-muted-foreground font-normal">trades</span>
              </span>
            </div>
          </div>

          {strategy.edgeStateNotes && (
            <p className="text-[11px] text-muted-foreground/90 line-clamp-2 leading-relaxed italic bg-white/[0.02] p-2 rounded-lg border border-border/30">
              &ldquo;{strategy.edgeStateNotes}&rdquo;
            </p>
          )}
        </div>
      </motion.div>

      {/* ─── Pillar 2: Risk Control ─── */}
      <motion.div
        layout
        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm hover:border-violet-500/30 transition-colors"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert size={15} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Control
            </span>
          </div>

          <span className="text-[11px] font-mono font-medium text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded border border-border/40">
            Hard Guardrails
          </span>
        </div>

        <div className="mt-3.5 space-y-3">
          {/* Key Risk Parameters */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-white/[0.03] p-2.5 border border-border/30">
              <span className="text-[10px] text-muted-foreground block">Max Risk / Trade</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold font-mono text-rose-400">
                  {strategy.maxRiskPercent}%
                </span>
                <span className="text-[10px] text-muted-foreground">equity</span>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-2.5 border border-border/30">
              <span className="text-[10px] text-muted-foreground block">Min Target R:R</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold font-mono text-emerald-400">
                  1:{strategy.minRrRatio.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          {/* Invalidation Rule */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Target size={11} className="text-amber-400" />
              Structural Invalidation
            </span>
            <p className="text-[11px] text-foreground/90 leading-snug line-clamp-2 bg-white/[0.02] p-2 rounded-lg border border-border/30">
              {strategy.invalidationRule || "Hard invalidation on 5m candle close beyond the signal extreme."}
            </p>
          </div>

          {/* Kill Switch Rule */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <Zap size={13} className="text-rose-400 shrink-0" />
            <span className="truncate">
              {strategy.killSwitchRule || "2 consecutive stops pauses setup"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Pillar 3: Trading Window ─── */}
      <motion.div
        layout
        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm hover:border-violet-500/30 transition-colors"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Clock size={15} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trading Window
            </span>
          </div>

          <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            {strategy.timeZone || "EST"}
          </span>
        </div>

        <div className="mt-3.5 space-y-3">
          {/* Active Sessions */}
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">
              Active Execution Sessions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {strategy.tradingSessions.map((session) => (
                <Badge
                  key={session}
                  variant="secondary"
                  className="bg-sky-500/10 text-sky-300 border-sky-500/20 text-[11px] font-medium px-2 py-0.5"
                >
                  {session}
                </Badge>
              ))}
            </div>
          </div>

          {/* Kill Zone Hours */}
          <div className="rounded-xl bg-white/[0.03] p-2.5 border border-border/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground block">
                Peak Kill Zone
              </span>
              <span className="text-sm font-semibold text-foreground font-mono">
                {strategy.killZoneStart} &ndash; {strategy.killZoneEnd}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Prime Days</span>
              <span className="text-xs font-medium text-foreground">
                {strategy.daysOfWeek.slice(0, 3).map(d => d.slice(0, 3)).join(", ")}
              </span>
            </div>
          </div>

          {/* News Blackout Policy */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={11} className="text-amber-400" />
              News Blackout Policy
            </span>
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
              {strategy.newsBlackoutRule || "Blackout 15m before/after Red Folder High Impact news"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
