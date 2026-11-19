"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronRight,
  ChartNoAxesCombined,
  Leaf,
  Pencil,
  X,
  Flame,
  Circle,
  Clock,
  Sparkles,
  ShieldCheck,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACTION_LINKS,
  DEFAULT_PRE_MARKET_ROUTINE,
  DEFAULT_DURING_MARKET_ROUTINE,
  DEFAULT_POST_MARKET_ROUTINE,
  getCurrentRoutinePhase,
  ROUTINE_PHASE_CONFIG,
  type Routine,
  type RoutineCompletionRecord,
  type RoutinePhase,
  type RoutineStep,
} from "@/lib/routines";

const iconMap: Record<RoutineStep["icon"], React.ComponentType<{ size?: number; className?: string }>> = {
  calendar: BarChart3,
  plan: Pencil,
  meditation: Leaf,
  charts: ChartNoAxesCombined,
  custom: Check,
};

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

interface RoutineBannerProps {
  /** If false, banner is hidden */
  visible?: boolean;
  /** Optional trading window times from rule engine or strategy, e.g. "09:30" */
  tradingWindowStart?: string;
  tradingWindowEnd?: string;
  timezone?: string;
}

export function RoutineBanner({
  visible = true,
  tradingWindowStart = "09:30",
  tradingWindowEnd = "16:00",
  timezone = "Europe/Paris",
}: RoutineBannerProps) {
  const [routines, setRoutines] = useState<Record<RoutinePhase, Routine>>({
    premarket: DEFAULT_PRE_MARKET_ROUTINE,
    intraday: DEFAULT_DURING_MARKET_ROUTINE,
    postmarket: DEFAULT_POST_MARKET_ROUTINE,
  });

  const [completions, setCompletions] = useState<Record<RoutinePhase, RoutineCompletionRecord | null>>({
    premarket: null,
    intraday: null,
    postmarket: null,
  });

  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingStep, setSavingStep] = useState<string | null>(null);

  // Active phase for the modal view
  const detectedPhase = useMemo(
    () => getCurrentRoutinePhase(timezone, tradingWindowStart, tradingWindowEnd),
    [timezone, tradingWindowStart, tradingWindowEnd]
  );
  const [activeTab, setActiveTab] = useState<RoutinePhase>(detectedPhase);

  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = todayDateKey();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/routines/completions?date=${today}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.routines) {
        setRoutines({
          premarket: data.routines.premarket ?? DEFAULT_PRE_MARKET_ROUTINE,
          intraday: data.routines.intraday ?? DEFAULT_DURING_MARKET_ROUTINE,
          postmarket: data.routines.postmarket ?? DEFAULT_POST_MARKET_ROUTINE,
        });
      }
      const rawCompletions = (data.completions as RoutineCompletionRecord[]) ?? [];
      const map: Record<RoutinePhase, RoutineCompletionRecord | null> = {
        premarket: rawCompletions.find((c) => c.routine_type === "premarket") ?? null,
        intraday: rawCompletions.find((c) => c.routine_type === "intraday" || c.routine_type === "duringmarket") ?? null,
        postmarket: rawCompletions.find((c) => c.routine_type === "postmarket") ?? null,
      };
      setCompletions(map);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Keep activeTab aligned with detected phase on initial load
  useEffect(() => {
    setActiveTab(detectedPhase);
  }, [detectedPhase]);

  // Check overall completion
  const totalRoutinesEnabled = [routines.premarket.enabled, routines.intraday.enabled, routines.postmarket.enabled].filter(Boolean).length;
  const completedRoutinesCount = [
    completions.premarket?.all_completed,
    completions.intraday?.all_completed,
    completions.postmarket?.all_completed,
  ].filter(Boolean).length;

  const allPhasesDone = totalRoutinesEnabled > 0 && completedRoutinesCount >= totalRoutinesEnabled;

  // Auto-hide after full completion if setting is on
  useEffect(() => {
    const shouldAutoHide = allPhasesDone && routines.premarket.autoHideOnComplete;
    if (shouldAutoHide) {
      autoHideTimer.current = setTimeout(() => setDismissed(true), 5000);
    }
    return () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    };
  }, [allPhasesDone, routines.premarket.autoHideOnComplete]);

  const toggleStep = async (phase: RoutinePhase, stepId: string, currentlyComplete: boolean) => {
    if (savingStep) return;
    setSavingStep(stepId);

    // Optimistic UI update
    setCompletions((prev) => {
      const current = prev[phase];
      const currentSteps = current?.completed_steps ?? [];
      const newSteps = currentlyComplete
        ? currentSteps.filter((id) => id !== stepId)
        : [...new Set([...currentSteps, stepId])];
      const totalSteps = routines[phase]?.steps?.length ?? 0;
      const allDone = totalSteps > 0 && newSteps.length >= totalSteps;
      return {
        ...prev,
        [phase]: {
          ...(current ?? {
            id: `temp-${Date.now()}`,
            user_id: "",
            date: today,
            routine_type: phase,
            created_at: new Date().toISOString(),
          }),
          completed_steps: newSteps,
          all_completed: allDone,
          completed_at: allDone ? new Date().toISOString() : null,
        },
      };
    });

    try {
      const res = await fetch("/api/routines/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          routineType: phase,
          stepId,
          completed: !currentlyComplete,
        }),
      });
      if (!res.ok) return;
      const updated: RoutineCompletionRecord = await res.json();
      setCompletions((prev) => ({
        ...prev,
        [phase]: updated,
      }));
    } catch {
      // Re-sync on failure
      fetchStatus();
    } finally {
      setSavingStep(null);
    }
  };

  if (!visible || loading || dismissed) return null;

  // Current active routine status for the banner CTA
  const activeRoutine = routines[detectedPhase];
  const activeCompletion = completions[detectedPhase];
  const activeCompletedCount = activeCompletion?.completed_steps?.length ?? 0;
  const activeTotalSteps = activeRoutine?.steps?.length ?? 0;
  const activePhaseDone = activeCompletion?.all_completed ?? false;

  // Button label determination
  let buttonLabel = "Go through Routines";
  if (!activePhaseDone) {
    if (detectedPhase === "premarket") {
      buttonLabel = activeCompletedCount > 0 ? "Continue Pre-Market" : "Start Pre-Market Routine";
    } else if (detectedPhase === "intraday") {
      buttonLabel = activeCompletedCount > 0 ? "Continue During Market" : "Start Intraday Routine";
    } else {
      buttonLabel = activeCompletedCount > 0 ? "Continue After Market" : "Start Post-Market Review";
    }
  } else if (!allPhasesDone) {
    // Current phase is done, find next incomplete phase
    if (!completions.intraday?.all_completed) {
      buttonLabel = "Start During-Market Routine";
    } else if (!completions.postmarket?.all_completed) {
      buttonLabel = "Start After-Market Routine";
    } else {
      buttonLabel = "Review Routines";
    }
  } else {
    buttonLabel = "View Completed Routines";
  }

  return (
    <>
      {/* ─── Modern Sleek Banner ─── */}
      <div
        role="banner"
        aria-label="Daily trading routine tracker"
        className={cn(
          "relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300",
          allPhasesDone
            ? "border-emerald-500/30 bg-emerald-500/[0.06] dark:bg-emerald-950/20"
            : "border-border/80 bg-card/85 dark:bg-card/60 backdrop-blur-md"
        )}
      >
        {/* Left Side: Icon, Phase Chips, and Context Message */}
        <div className="flex items-center gap-3.5 min-w-0">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs transition-colors",
              allPhasesDone
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                : "bg-violet-500/15 text-violet-400 border border-violet-500/30"
            )}
          >
            {allPhasesDone ? <Flame size={20} /> : <Sparkles size={20} />}
          </span>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Daily Routine Tracker
              </span>

              {/* Phase Status Badges */}
              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                {(["premarket", "intraday", "postmarket"] as RoutinePhase[]).map((p) => {
                  const comp = completions[p];
                  const done = comp?.all_completed;
                  const count = comp?.completed_steps?.length ?? 0;
                  const total = routines[p]?.steps?.length ?? 0;
                  const isCurrent = detectedPhase === p;

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setActiveTab(p);
                        setModalOpen(true);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer border",
                        done
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : isCurrent
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/40 ring-1 ring-violet-500/30 font-semibold"
                          : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      {done ? <Check size={10} strokeWidth={3} /> : <Circle size={8} />}
                      <span>{ROUTINE_PHASE_CONFIG[p].shortLabel}</span>
                      <span className="font-mono text-[9px] opacity-80">
                        {count}/{total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-muted-foreground truncate">
              {allPhasesDone ? (
                <span className="text-emerald-500 dark:text-emerald-400 font-medium">
                  ✓ All daily routines completed — logged with today&apos;s trades for discipline tracking.
                </span>
              ) : (
                <span>
                  Track pre-market prep, during-market discipline, and post-market review linked directly to your trade log.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Primary Single Action Button + Dismiss */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Button
            size="sm"
            onClick={() => {
              // Open modal at the next uncompleted phase or detected phase
              if (!activePhaseDone) {
                setActiveTab(detectedPhase);
              } else if (!completions.premarket?.all_completed) {
                setActiveTab("premarket");
              } else if (!completions.intraday?.all_completed) {
                setActiveTab("intraday");
              } else if (!completions.postmarket?.all_completed) {
                setActiveTab("postmarket");
              }
              setModalOpen(true);
            }}
            className={cn(
              "gap-1.5 font-medium transition-all shadow-xs",
              allPhasesDone
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            )}
          >
            <span>{buttonLabel}</span>
            <ChevronRight size={14} />
          </Button>

          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-muted-foreground/70 transition hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ─── Routine Tracker Walkthrough Modal ─── */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Daily Routine Checklist"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-violet-500" />
                  <h2 className="text-base font-semibold text-foreground">
                    Trading Routine Checklist
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · Linked to today&apos;s trade log
                </p>
              </div>

              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Phase Selector Tabs */}
            <div className="flex border-b border-border/60 bg-muted/30 px-3 pt-2 gap-1 overflow-x-auto">
              {(["premarket", "intraday", "postmarket"] as RoutinePhase[]).map((phase) => {
                const isSelected = activeTab === phase;
                const comp = completions[phase];
                const done = comp?.all_completed;
                const count = comp?.completed_steps?.length ?? 0;
                const total = routines[phase]?.steps?.length ?? 0;

                return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setActiveTab(phase)}
                    className={cn(
                      "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                      isSelected
                        ? "border-violet-500 text-foreground font-semibold bg-background rounded-t-lg"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    {phase === "premarket" && <Sun size={13} className={done ? "text-emerald-500" : "text-amber-400"} />}
                    {phase === "intraday" && <Zap size={13} className={done ? "text-emerald-500" : "text-violet-400"} />}
                    {phase === "postmarket" && <Moon size={13} className={done ? "text-emerald-500" : "text-indigo-400"} />}

                    <span>{ROUTINE_PHASE_CONFIG[phase].label}</span>

                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                        done
                          ? "bg-emerald-500/20 text-emerald-500 font-bold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}/{total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Content Description & Progress Bar */}
            {(() => {
              const currentRoutine = routines[activeTab];
              const currentComp = completions[activeTab];
              const completedSteps = currentComp?.completed_steps ?? [];
              const totalSteps = currentRoutine?.steps?.length ?? 0;
              const count = completedSteps.length;
              const isPhaseComplete = currentComp?.all_completed ?? false;
              const pct = totalSteps > 0 ? Math.round((count / totalSteps) * 100) : 0;

              return (
                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
                  {/* Phase Description and Progress */}
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {ROUTINE_PHASE_CONFIG[activeTab].description}
                      </p>
                      <span
                        className={cn(
                          "text-xs font-semibold font-mono",
                          isPhaseComplete ? "text-emerald-500" : "text-violet-400"
                        )}
                      >
                        {pct}% ({count}/{totalSteps})
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isPhaseComplete ? "bg-emerald-500" : "bg-violet-600"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist Steps */}
                  <ul className="space-y-2.5" role="list">
                    {currentRoutine?.steps?.map((step, idx) => {
                      const Icon = iconMap[step.icon] ?? Check;
                      const isDone = completedSteps.includes(step.id);
                      const isSaving = savingStep === step.id;
                      const actionUrl = ACTION_LINKS[step.action];

                      return (
                        <li key={step.id}>
                          <div
                            onClick={() => toggleStep(activeTab, step.id, isDone)}
                            className={cn(
                              "group flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all cursor-pointer select-none",
                              isDone
                                ? "border-emerald-500/30 bg-emerald-500/[0.06] text-foreground"
                                : "border-border/70 bg-card/60 hover:border-violet-500/30 hover:bg-violet-500/[0.03]",
                              isSaving && "opacity-60 cursor-wait"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Step Checkbox Pill */}
                              <span
                                className={cn(
                                  "flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all",
                                  isDone
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-border/80 bg-background text-muted-foreground group-hover:border-violet-500"
                                )}
                              >
                                {isDone ? <Check size={13} strokeWidth={3} /> : idx + 1}
                              </span>

                              {/* Icon */}
                              <span
                                className={cn(
                                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                                  isDone
                                    ? "bg-emerald-500/15 text-emerald-500"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                <Icon size={14} />
                              </span>

                              {/* Title */}
                              <span
                                className={cn(
                                  "text-sm font-medium transition-colors truncate",
                                  isDone ? "line-through text-muted-foreground" : "text-foreground"
                                )}
                              >
                                {step.title}
                              </span>
                            </div>

                            {/* Action Link button */}
                            {actionUrl && (
                              <a
                                href={actionUrl}
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 text-xs font-medium text-violet-500 hover:text-violet-400 hover:underline px-2 py-1 rounded-md hover:bg-violet-500/10 transition-colors"
                              >
                                Open →
                              </a>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Phase Complete Banner */}
                  {isPhaseComplete && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-500 dark:text-emerald-400">
                      <Flame size={16} className="shrink-0" />
                      <span>
                        <strong>{ROUTINE_PHASE_CONFIG[activeTab].shortLabel} complete!</strong> Great discipline. This is recorded in your journal for performance correlation.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-3.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                <span>Resets daily at 00:00 · Configurable in Settings</span>
              </span>

              <Button size="sm" onClick={() => setModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
