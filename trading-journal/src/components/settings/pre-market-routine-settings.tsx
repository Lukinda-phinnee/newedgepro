"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  ChartNoAxesCombined,
  Check,
  GripVertical,
  Info,
  Leaf,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import {
  DEFAULT_PRE_MARKET_ROUTINE,
  DEFAULT_DURING_MARKET_ROUTINE,
  DEFAULT_POST_MARKET_ROUTINE,
  ROUTINE_PHASE_CONFIG,
  type Routine,
  type RoutineAction,
  type RoutineIcon,
  type RoutinePhase,
  type RoutineStep,
} from "@/lib/routines";

const actions: { value: RoutineAction; label: string }[] = [
  { value: "news", label: "Go to Economic Calendar" },
  { value: "plan", label: "Go to Trading Plan" },
  { value: "edge", label: "Go to Edge / Strategies" },
  { value: "rules", label: "Go to Rule Engine" },
  { value: "sanctuary", label: "Go to Sanctuary (Mental Reset)" },
  { value: "trading", label: "Go to Trade Log" },
  { value: "review", label: "Go to Trade Review" },
  { value: "none", label: "No action" },
];

const iconMap: Record<RoutineIcon, React.ComponentType<{ size?: number; className?: string }>> = {
  calendar: BarChart3,
  plan: Pencil,
  meditation: Leaf,
  charts: ChartNoAxesCombined,
  custom: Check,
};

export function PreMarketRoutineSettings() {
  const [activePhase, setActivePhase] = useState<RoutinePhase>("premarket");

  const [savedRoutines, setSavedRoutines] = useState<Record<RoutinePhase, Routine>>({
    premarket: DEFAULT_PRE_MARKET_ROUTINE,
    intraday: DEFAULT_DURING_MARKET_ROUTINE,
    postmarket: DEFAULT_POST_MARKET_ROUTINE,
  });

  const [draftRoutines, setDraftRoutines] = useState<Record<RoutinePhase, Routine>>({
    premarket: DEFAULT_PRE_MARKET_ROUTINE,
    intraday: DEFAULT_DURING_MARKET_ROUTINE,
    postmarket: DEFAULT_POST_MARKET_ROUTINE,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const { showFeedback, showProcessing } = useOperationFeedback();

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (active) {
          const loaded: Record<RoutinePhase, Routine> = {
            premarket: (data.preMarketRoutine as Routine) ?? DEFAULT_PRE_MARKET_ROUTINE,
            intraday: (data.duringMarketRoutine as Routine) ?? DEFAULT_DURING_MARKET_ROUTINE,
            postmarket: (data.postMarketRoutine as Routine) ?? DEFAULT_POST_MARKET_ROUTINE,
          };
          setSavedRoutines(loaded);
          setDraftRoutines(loaded);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          showFeedback({
            kind: "failure",
            title: "Routines couldn’t load",
            description: e instanceof Error ? e.message : "Please refresh and try again.",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showFeedback]);

  const currentDraft = draftRoutines[activePhase];
  const currentSaved = savedRoutines[activePhase];
  const changed = JSON.stringify(currentSaved) !== JSON.stringify(currentDraft);

  const patchCurrent = (changes: Partial<Routine>) => {
    setDraftRoutines((prev) => ({
      ...prev,
      [activePhase]: {
        ...prev[activePhase],
        ...changes,
      },
    }));
  };

  const saveCurrent = async () => {
    setSaving(true);
    showProcessing("Saving routine…");
    try {
      const payloadKey =
        activePhase === "premarket"
          ? "preMarketRoutine"
          : activePhase === "intraday"
          ? "duringMarketRoutine"
          : "postMarketRoutine";

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [payloadKey]: currentDraft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t save routine.");

      setSavedRoutines((prev) => ({
        ...prev,
        [activePhase]: currentDraft,
      }));

      showFeedback({
        kind: "success",
        title: `${ROUTINE_PHASE_CONFIG[activePhase].label} saved`,
        description: "Your checklist and options have been updated.",
      });
    } catch (e) {
      showFeedback({
        kind: "failure",
        title: "Routine wasn’t saved",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const reorder = (target: string) => {
    if (!dragging || dragging === target) return;
    const rows = [...currentDraft.steps];
    const from = rows.findIndex((s) => s.id === dragging);
    const to = rows.findIndex((s) => s.id === target);
    const [step] = rows.splice(from, 1);
    rows.splice(to, 0, step);
    patchCurrent({ steps: rows });
    setDragging(null);
  };

  const addStep = () => {
    if (currentDraft.steps.length >= 8) return;
    const id = `step-${Date.now()}`;
    patchCurrent({
      steps: [
        ...currentDraft.steps,
        { id, icon: "custom", title: "New routine step", action: "none" },
      ],
    });
  };

  const resetToDefault = () => {
    const defaultVal =
      activePhase === "premarket"
        ? DEFAULT_PRE_MARKET_ROUTINE
        : activePhase === "intraday"
        ? DEFAULT_DURING_MARKET_ROUTINE
        : DEFAULT_POST_MARKET_ROUTINE;
    patchCurrent(defaultVal);
  };

  return (
    <section role="tabpanel" aria-label="Daily Routine Settings" className="max-w-[1000px] pt-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Trading Routine Tracking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure daily checklists for before, during, and after your trading windows. Completed routines are linked to each trading day in your trade log so you can correlate routine execution with performance.
        </p>
      </div>

      {/* Routine Phase Switcher Pills */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        {(["premarket", "intraday", "postmarket"] as RoutinePhase[]).map((phase) => {
          const isSelected = activePhase === phase;
          const isPhaseEnabled = draftRoutines[phase].enabled;

          return (
            <button
              key={phase}
              type="button"
              onClick={() => setActivePhase(phase)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "border-violet-500 bg-violet-500/10 text-foreground ring-1 ring-violet-500/30"
                  : "border-border/70 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {phase === "premarket" && <Sun size={14} className="text-amber-400" />}
              {phase === "intraday" && <Zap size={14} className="text-violet-400" />}
              {phase === "postmarket" && <Moon size={14} className="text-indigo-400" />}

              <span>{ROUTINE_PHASE_CONFIG[phase].label}</span>

              <span
                className={`size-2 rounded-full ${
                  isPhaseEnabled ? "bg-emerald-500" : "bg-muted-foreground/40"
                }`}
                title={isPhaseEnabled ? "Active" : "Disabled"}
              />
            </button>
          );
        })}
      </div>

      {/* Phase Description */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground">
        {ROUTINE_PHASE_CONFIG[activePhase].description}
      </div>

      {/* Switches Grid */}
      <div className="grid max-w-[700px] gap-x-6 gap-y-3 sm:grid-cols-2">
        {([
          ["enabled", `Enable ${ROUTINE_PHASE_CONFIG[activePhase].shortLabel} Routine`, "Show this routine in the dashboard banner and tracker."],
          ["startSessionPrompt", "Session prompt", "Prompt completion when the trading window starts."],
          ["showOnAllPages", "Show on all pages", "Keep banner visible across EdgeFlo navigation."],
          ["autoHideOnComplete", "Auto-hide on complete", "Hide banner when all steps are completed."],
        ] as const).map(([key, label, help]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-foreground select-none">
            <button
              type="button"
              role="switch"
              aria-checked={currentDraft[key]}
              aria-label={label}
              disabled={loading}
              onClick={() => patchCurrent({ [key]: !currentDraft[key] })}
              className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                currentDraft[key] ? "bg-violet-500" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none block size-3.5 rounded-full bg-white shadow-sm transition-[margin] duration-150 ${
                  currentDraft[key] ? "ml-3.5" : "ml-0"
                }`}
              />
            </button>
            <span className="text-xs font-medium">{label}</span>
            <span title={help} className="text-muted-foreground cursor-help">
              <Info size={13} />
            </span>
          </label>
        ))}
      </div>

      {/* Reset time */}
      <label className="block w-[250px] space-y-1.5 text-xs text-muted-foreground">
        Daily reset time (Europe/Paris)
        <Input
          type="time"
          aria-label="Daily reset time (Europe/Paris)"
          value={currentDraft.resetTime}
          disabled={loading}
          onChange={(e) => patchCurrent({ resetTime: e.target.value })}
          className="h-9 px-2.5 text-sm"
        />
      </label>

      {/* Steps Table header */}
      <div className="flex max-w-[986px] items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {ROUTINE_PHASE_CONFIG[activePhase].shortLabel} Steps ({currentDraft.steps.length} / 8)
          </h3>
          <p className="text-xs text-muted-foreground">Customize titles and link actions to open EdgePro tools.</p>
        </div>

        <Button size="sm" variant="outline" onClick={resetToDefault}>
          Reset to default
        </Button>
      </div>

      {/* Steps List */}
      <div className="max-w-[986px]">
        <div className="grid grid-cols-[20px_36px_minmax(160px,1fr)_minmax(160px,220px)_36px] items-center gap-2 border-b border-border/70 px-1 pb-2 text-xs text-muted-foreground">
          <span />
          <span>Icon</span>
          <span>Step Title</span>
          <span>Tool Link Action</span>
          <span />
        </div>

        <div className="space-y-1.5 pt-2">
          {currentDraft.steps.map((step) => {
            const Icon = iconMap[step.icon] ?? Check;
            return (
              <div
                key={step.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(step.id)}
                className="grid grid-cols-[20px_36px_minmax(160px,1fr)_minmax(160px,220px)_36px] items-center gap-2"
              >
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragging(step.id)}
                  onDragEnd={() => setDragging(null)}
                  aria-label={`Reorder ${step.title}`}
                  className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                >
                  <GripVertical size={16} />
                </button>

                <span
                  className={`flex size-8 items-center justify-center rounded-lg ${
                    step.icon === "calendar"
                      ? "bg-blue-500/10 text-blue-500"
                      : step.icon === "plan"
                      ? "bg-red-500/10 text-red-500"
                      : step.icon === "meditation"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-violet-500/10 text-violet-500"
                  }`}
                >
                  <Icon size={16} />
                </span>

                <Input
                  aria-label="Routine step"
                  maxLength={80}
                  value={step.title}
                  onChange={(e) =>
                    patchCurrent({
                      steps: currentDraft.steps.map((s) =>
                        s.id === step.id ? { ...s, title: e.target.value } : s
                      ),
                    })
                  }
                  className="h-9 min-w-0 text-sm"
                />

                <select
                  aria-label="Step action"
                  value={step.action}
                  onChange={(e) =>
                    patchCurrent({
                      steps: currentDraft.steps.map((s) =>
                        s.id === step.id
                          ? { ...s, action: e.target.value as RoutineAction }
                          : s
                      ),
                    })
                  }
                  className="h-9 min-w-0 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {actions.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>

                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`Delete ${step.title}`}
                  disabled={currentDraft.steps.length <= 1}
                  onClick={() =>
                    patchCurrent({
                      steps: currentDraft.steps.filter((s) => s.id !== step.id),
                    })
                  }
                  className="size-8 text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentDraft.steps.length >= 8}
          onClick={addStep}
          className="mt-3.5"
        >
          <Plus size={14} />
          Add step ({currentDraft.steps.length} / 8 used)
        </Button>
      </div>

      {/* Save Button Row */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!changed || saving}
          onClick={() =>
            setDraftRoutines((prev) => ({
              ...prev,
              [activePhase]: currentSaved,
            }))
          }
        >
          Cancel
        </Button>

        <Button
          size="sm"
          disabled={
            !changed ||
            saving ||
            loading ||
            currentDraft.steps.some((step) => !step.title.trim())
          }
          onClick={saveCurrent}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}
