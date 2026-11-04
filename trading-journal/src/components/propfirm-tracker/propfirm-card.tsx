"use client";

import { useId, useState } from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layers,
  Moon,
  Newspaper,
  ShieldAlert,
  Sun,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PropfirmRecord } from "@/types/propfirm-tracker";

interface PropfirmCardProps {
  firm: PropfirmRecord;
  onOpen: (firmId: string) => void;
  onDelete: (firmId: string) => void;
  isDeleting?: boolean;
}

export function PropfirmCard({
  firm,
  onOpen,
  onDelete,
  isDeleting = false,
}: PropfirmCardProps) {
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [showAllRules, setShowAllRules] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cardId = useId();

  const phases = firm.phases || [];
  const currentPhase = phases[selectedPhaseIndex] || phases[0];

  // Derive firm monogram for placeholder logo
  const monogram = firm.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  // Gather secondary conditions for active phase
  const secondaryRules: { label: string; value: string; icon?: React.ReactNode; tone?: "default" | "positive" | "warning" | "neutral" }[] = [];

  if (currentPhase) {
    if (currentPhase.drawdownType && currentPhase.drawdownType !== "not-set") {
      const typeLabel =
        currentPhase.drawdownType === "end-of-day"
          ? "End of Day"
          : currentPhase.drawdownType.charAt(0).toUpperCase() + currentPhase.drawdownType.slice(1);
      secondaryRules.push({
        label: "Drawdown type",
        value: `${typeLabel} trailing`,
        icon: <TrendingUp size={11} />,
        tone: "neutral",
      });
    }

    if (currentPhase.newsTrading && currentPhase.newsTrading !== "not-set") {
      const isAllowed = currentPhase.newsTrading === "allowed";
      const isRestricted = currentPhase.newsTrading === "restricted";
      secondaryRules.push({
        label: "News trading",
        value: isAllowed ? "Allowed" : isRestricted ? "Restricted" : "Prohibited",
        icon: <Newspaper size={11} />,
        tone: isAllowed ? "positive" : isRestricted ? "warning" : "default",
      });
    }

    if (currentPhase.overnightHolding) {
      secondaryRules.push({
        label: "Overnight",
        value: "Allowed",
        icon: <Moon size={11} />,
        tone: "positive",
      });
    }

    if (currentPhase.weekendHolding) {
      secondaryRules.push({
        label: "Weekend",
        value: "Allowed",
        icon: <Sun size={11} />,
        tone: "positive",
      });
    }

    if (currentPhase.minTradingDays) {
      secondaryRules.push({
        label: "Min trading days",
        value: `${currentPhase.minTradingDays} days`,
        icon: <Calendar size={11} />,
        tone: "neutral",
      });
    }

    if (currentPhase.riskPerTrade) {
      secondaryRules.push({
        label: "Risk / trade",
        value: `${currentPhase.riskPerTrade}%`,
        tone: "neutral",
      });
    }

    if (currentPhase.maxOpenRisk) {
      secondaryRules.push({
        label: "Max open risk",
        value: `${currentPhase.maxOpenRisk}%`,
        tone: "neutral",
      });
    }

    if (currentPhase.maxTradesPerDay) {
      secondaryRules.push({
        label: "Trades / day",
        value: currentPhase.maxTradesPerDay,
        icon: <Clock size={11} />,
        tone: "neutral",
      });
    }

    if (currentPhase.consistencyLimit) {
      secondaryRules.push({
        label: "Consistency limit",
        value: `${currentPhase.consistencyLimit}%`,
        tone: "neutral",
      });
    }
  }

  const visibleRules = showAllRules ? secondaryRules : secondaryRules.slice(0, 4);
  const hasMoreRules = secondaryRules.length > 4;

  const tradeCount = firm.trackerData?.trades?.filter((t) => !t.generated).length ?? 0;

  return (
    <article
      aria-labelledby={`firm-title-${cardId}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/85 p-5 shadow-xs backdrop-blur-md transition-all duration-200 ease-out hover:border-violet-500/35 hover:shadow-lg hover:shadow-violet-950/5 dark:border-white/[0.08] dark:bg-[#151518]/90 dark:hover:shadow-black/40"
    >
      <div className="space-y-4">
        {/* Header: Firm Identity & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-border/70 bg-muted/40 shadow-xs transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:scale-100 dark:border-white/[0.08] dark:bg-white/[0.03]">
              {firm.logo ? (
                <img
                  src={firm.logo}
                  alt={`${firm.name} logo`}
                  className="size-full object-contain p-1"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-violet-500/10 font-semibold text-xs text-violet-600 dark:text-violet-300">
                  {monogram || <Building2 size={18} />}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h2
                id={`firm-title-${cardId}`}
                className="truncate font-semibold text-[15px] tracking-[-0.015em] text-foreground"
              >
                {firm.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 font-semibold text-[10px] text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-300">
                  {firm.evaluation}
                </span>

                {tradeCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    {tradeCount} {tradeCount === 1 ? "trade" : "trades"} logged
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Destructive Action with Safe Forgiveness */}
          <div className="relative shrink-0">
            {confirmDelete ? (
              <div className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => onDelete(firm.id)}
                  disabled={isDeleting}
                  className="rounded px-2 py-0.5 font-medium text-[11px] text-destructive hover:bg-destructive/20 active:scale-95"
                >
                  {isDeleting ? "Deleting…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label={`Remove ${firm.name}`}
                onClick={() => setConfirmDelete(true)}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 opacity-80 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 active:scale-95 motion-reduce:transition-none"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Phase Selector Segmented Control (Apple HIG style) */}
        {phases.length > 1 ? (
          <div
            role="tablist"
            aria-label="Evaluation phases"
            className="flex w-full items-center gap-1 rounded-xl border border-border/70 bg-muted/60 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]"
          >
            {phases.map((phase, index) => {
              const isSelected = index === selectedPhaseIndex;
              return (
                <button
                  key={`${phase.name}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedPhaseIndex(index)}
                  className={`flex-1 rounded-lg px-2.5 py-1 text-center text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer ${isSelected
                      ? "bg-violet-600 text-white shadow-xs font-semibold"
                      : "font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    }`}
                >
                  {phase.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-400/20 dark:text-violet-300">
              <Layers size={12} className="text-violet-600 dark:text-violet-400" />
              <span>{currentPhase?.name || "Challenge limits"}</span>
            </span>
          </div>
        )}

        {/* Primary Constraints: 3 Hero Metrics */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-muted/25 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="min-w-0">
            <span className="block font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider">
              Target
            </span>
            <p className="mt-0.5 truncate font-semibold text-foreground text-sm tracking-tight sm:text-base tabular-nums">
              {currentPhase?.profitTarget ? `${currentPhase.profitTarget}%` : "—"}
            </p>
          </div>

          <div className="min-w-0 border-x border-border/50 px-2 dark:border-white/[0.06]">
            <span className="block font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider">
              Max DD
            </span>
            <p className="mt-0.5 truncate font-semibold text-foreground text-sm tracking-tight sm:text-base tabular-nums">
              {currentPhase?.maxDrawdown ? `${currentPhase.maxDrawdown}%` : "—"}
            </p>
          </div>

          <div className="min-w-0">
            <span className="block font-medium text-[10px] text-muted-foreground/80 uppercase tracking-wider">
              Daily Limit
            </span>
            <p className="mt-0.5 truncate font-semibold text-foreground text-sm tracking-tight sm:text-base tabular-nums">
              {currentPhase?.dailyLossLimit ? `${currentPhase.dailyLossLimit}%` : "—"}
            </p>
          </div>
        </div>

        {/* Glanceable Rule Badges */}
        {secondaryRules.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleRules.map((rule, idx) => (
                <div
                  key={`${rule.label}-${idx}`}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-normal text-[11px] ${rule.tone === "positive"
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 dark:border-emerald-500/20 dark:text-emerald-300"
                      : rule.tone === "warning"
                        ? "border-amber-500/20 bg-amber-500/5 text-amber-400 dark:border-amber-500/20 dark:text-amber-300"
                        : "border-border/60 bg-muted/30 text-muted-foreground dark:border-white/[0.06] dark:bg-white/[0.02]"
                    }`}
                >
                  {rule.icon}
                  <span className="text-muted-foreground/70">{rule.label}:</span>
                  <span className="font-medium text-foreground">{rule.value}</span>
                </div>
              ))}
            </div>

            {hasMoreRules && (
              <button
                type="button"
                onClick={() => setShowAllRules(!showAllRules)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 active:scale-95 cursor-pointer"
              >
                <span>{showAllRules ? "Show less" : `+${secondaryRules.length - 4} more rules`}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${showAllRules ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-border/50 dark:border-white/[0.06]">
        <Button
          type="button"
          onClick={() => onOpen(firm.id)}
          className="group/btn h-9 w-full justify-between rounded-xl bg-violet-600 px-3.5 text-xs font-medium text-white shadow-sm shadow-violet-950/25 transition-all duration-150 hover:bg-violet-500 hover:shadow-md hover:shadow-violet-900/30 active:scale-[0.98] cursor-pointer motion-reduce:transition-none motion-reduce:active:transform-none"
        >
          <span>Open tracker</span>
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover/btn:translate-x-0.5 motion-reduce:group-hover/btn:transform-none"
          />
        </Button>
      </div>
    </article>
  );
}

