"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Gauge,
  Lock,
  Percent,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Zap,
} from "lucide-react";
import type {
  RuleCategory,
  RuleEngineCompliance,
  RuleEngineStatus,
  RuleSet,
  RuleViolation,
} from "@/types/rules";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
  status: RuleEngineStatus | null;
  compliance: RuleEngineCompliance | null;
  activeRuleSet: RuleSet | null;
  onSelectCategory?: (category: RuleCategory) => void;
  onOpenSimulator: () => void;
}

const CATEGORY_ICONS: Record<RuleCategory, any> = {
  Risk: TrendingDown,
  Frequency: Clock,
  Eligibility: CheckCircle2,
  Recovery: RotateCcw,
  Discipline: ShieldAlert,
  Checklist: ShieldCheck,
};

const CATEGORY_COLORS: Record<RuleCategory, { text: string; bg: string; border: string }> = {
  Risk: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  Frequency: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  Eligibility: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  Recovery: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  Discipline: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  Checklist: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

export function OverviewTab({
  status,
  compliance,
  activeRuleSet,
  onSelectCategory,
  onOpenSimulator,
}: OverviewTabProps) {
  const disciplineScore = status?.disciplineScore ?? 95;
  const passRate = compliance?.passRate ?? 96.4;
  const violationsToday = compliance?.violationsToday ?? 0;
  const violationsThisWeek = compliance?.violationsThisWeek ?? 1;
  const totalActiveRules = status?.totalActiveRules ?? (activeRuleSet?.rules?.length || 7);

  // Grade badge derived from score
  const grade = useMemo(() => {
    if (disciplineScore >= 95) return { letter: "A+", label: "Elite Discipline", color: "text-emerald-400" };
    if (disciplineScore >= 88) return { letter: "A", label: "Strong Adherence", color: "text-emerald-300" };
    if (disciplineScore >= 78) return { letter: "B", label: "Acceptable", color: "text-amber-300" };
    if (disciplineScore >= 68) return { letter: "C", label: "Needs Discipline", color: "text-orange-400" };
    return { letter: "F", label: "Discipline Breakdown", color: "text-rose-400" };
  }, [disciplineScore]);

  const categories: RuleCategory[] = [
    "Risk",
    "Frequency",
    "Eligibility",
    "Recovery",
    "Discipline",
    "Checklist",
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Status + Discipline Score + Guardrails */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Discipline Score */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card to-card/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Discipline Score
            </span>
            <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border border-current/20 bg-current/5", grade.color)}>
              {grade.letter} • {grade.label}
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {disciplineScore}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              {/* Apple §4: Spring-animated progress indicator */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${disciplineScore}%` }}
                transition={{ type: "spring", damping: 24, stiffness: 120 }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Execution consistency</span>
              <span className="font-mono">{passRate}% rule pass rate</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Enforcement Status */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card to-card/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guardrail Status
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-muted-foreground">
              {status?.isGlobal ? "Global Scope" : "Account Scope"}
            </span>
          </div>

          <div className="mt-4">
            {status?.isLocked ? (
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                  <Lock size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-rose-400">Trading Lock Active</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Account locked for {status.lockRemainingMinutes || 60} mins to protect capital after rule breach.
                  </p>
                </div>
              </div>
            ) : status?.isCooldown ? (
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                  <Clock size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-400">Cooldown Active</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {status.cooldownRemainingMinutes || 45} mins remaining in mandatory timeout.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-foreground">All Systems Nominal</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalActiveRules} rules actively protecting trades. No lockouts or cooldowns in effect.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Rule Set:</span>
            <span className="font-medium text-foreground truncate max-w-[180px]">
              {activeRuleSet?.name || "System Global Guardrails"}
            </span>
          </div>
        </div>

        {/* Card 3: Compliance & Violation Velocity */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card to-card/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Adherence Summary
            </span>
            <button
              onClick={onOpenSimulator}
              className="text-xs font-medium text-violet-400 hover:text-violet-300 transition inline-flex items-center gap-1 press-scale-sm"
            >
              <Zap size={13} /> Test Trade
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 bg-black/25 p-3">
              <span className="text-[11px] text-muted-foreground block">Violations Today</span>
              <span className={cn("text-2xl font-bold mt-0.5 block", violationsToday > 0 ? "text-rose-400" : "text-emerald-400")}>
                {violationsToday}
              </span>
            </div>
            <div className="rounded-xl border border-border/60 bg-black/25 p-3">
              <span className="text-[11px] text-muted-foreground block">7-Day Infractions</span>
              <span className={cn("text-2xl font-bold mt-0.5 block", violationsThisWeek > 3 ? "text-amber-400" : "text-foreground")}>
                {violationsThisWeek}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Escalation level:</span>
            <span className="font-semibold text-foreground uppercase tracking-wider">
              {status?.escalationLevel || "Normal"}
            </span>
          </div>
        </div>
      </div>

      {/* Categories Breakdown Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Guardrails by Category
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {totalActiveRules} active / 6 categories
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const colors = CATEGORY_COLORS[cat];
            const count = status?.activeRulesByCategory[cat] ?? 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory?.(cat)}
                className="group flex flex-col justify-between text-left p-4 rounded-2xl border border-border/70 bg-card hover:bg-card hover:border-violet-500/50 transition-all shadow-md press-scale"
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <span className={cn("flex size-8 items-center justify-center rounded-xl", colors.bg, colors.text)}>
                    <Icon size={16} />
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {count}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-semibold text-foreground block group-hover:text-violet-400 transition">
                    {cat}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {count === 1 ? "1 active rule" : `${count} active rules`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Violation Records & Enforcement Log */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle size={15} />
            </span>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Recent Rule Enforcement & Violations Log
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Audit trail of triggered pre-trade and post-trade safety constraints.
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {compliance?.recentViolations.length || 0} recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-black/20 text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Violation / Rule Name</th>
                <th className="px-4 py-3 font-semibold">Logged Trade</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Action Enforced</th>
                <th className="px-4 py-3 font-semibold">Metric &amp; Values</th>
                <th className="px-5 py-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {compliance?.recentViolations && compliance.recentViolations.length > 0 ? (
                compliance.recentViolations.map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-foreground block">
                        {v.violationName}
                      </span>
                      {v.metadata.message && (
                        <span className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-0.5">
                          {String(v.metadata.message)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {v.metadata.tradeSymbol ? (
                        <a
                          href="/trade-log"
                          className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/60 px-2 py-0.5 text-xs font-bold text-foreground hover:border-violet-500/50 hover:text-violet-300 transition"
                          title="View trade in Trade Log"
                        >
                          {String(v.metadata.tradeSymbol)}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.05] text-muted-foreground">
                        {v.ruleType || "RISK"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          v.severity === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : v.severity === "HIGH"
                              ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30",
                        )}
                      >
                        {v.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {v.actionTaken}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {v.metadata.actualValue !== undefined && v.metadata.threshold !== undefined ? (
                        <span>
                          Actual: <strong className="text-rose-400">{String(v.metadata.actualValue)}</strong> / Limit: {String(v.metadata.threshold)}
                        </span>
                      ) : (
                        <span>{v.metadata.metric || "Trade Intent"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground/80 text-[11px] whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-400/80 mb-2" />
                    <p className="text-xs font-medium text-foreground">No recent rule violations recorded</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Your trades are adhering to all active guardrails. Keep up the disciplined execution!
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
