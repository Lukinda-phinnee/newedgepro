"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, AlignJustify, ArrowLeft, Check, Clock, Edit3, Files, FileText, ListChecks, ShieldAlert } from "lucide-react";
import { PlaybookBlockEditor } from "@/components/edge/playbook-block-editor";
import { StrategyListPanel } from "@/components/edge/strategy-list-panel";
import { StrategyDetail } from "@/components/edge/strategy-detail";
import { StrategyRightPanel } from "@/components/edge/strategy-right-panel";
import { AddStrategyModal } from "@/components/edge/add-strategy-modal";
import type { CreateStrategyInput, Strategy, StrategyStatus } from "@/types/strategy";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StrategyViewProps {
  initialStrategies: Strategy[];
}

function formatPlaybookMarkdown(s: Strategy): string {
  const lines: string[] = [
    `# ${s.name} (${s.version || "v1.0"})`,
    `**Category:** ${s.category} | **Status:** ${s.status}`,
    `**Market Regime:** ${s.marketRegime || "General"}`,
    `**Targets:** Win Rate: ${s.winRateTarget}% | Expectancy: +${s.expectancyR}R | Min R:R: 1:${s.minRrRatio} | Max Risk: ${s.maxRiskPercent}%`,
    `**Execution Window:** Sessions: ${(s.tradingSessions || []).join(", ") || "N/A"} (${s.killZoneStart || "09:30"} - ${s.killZoneEnd || "11:30"} ${s.timeZone || "EST"}) | Days: ${(s.daysOfWeek || []).join(", ") || "All"}`,
    "",
  ];

  if (s.thesis) {
    lines.push("## Thesis", s.thesis, "");
  }

  if (s.invalidationRule) {
    lines.push("## Invalidation Rule", s.invalidationRule, "");
  }

  if (s.stopLossLogic) {
    lines.push("## Stop Loss Logic", s.stopLossLogic, "");
  }

  if (s.killSwitchRule) {
    lines.push("## Kill Switch Rule", s.killSwitchRule, "");
  }

  if (s.newsBlackoutRule) {
    lines.push("## News Blackout", s.newsBlackoutRule, "");
  }

  if (s.entryChecklist && s.entryChecklist.length > 0) {
    lines.push("## Entry Checklist");
    for (const item of s.entryChecklist) {
      lines.push(
        `- [ ] [${item.phase}] ${item.label}${item.notes ? ` (${item.notes})` : ""}`
      );
    }
    lines.push("");
  }

  if (s.disqualifiers && s.disqualifiers.length > 0) {
    lines.push("## Disqualifiers");
    for (const item of s.disqualifiers) {
      lines.push(
        `- ⚠️ [${item.severity}] ${item.condition}${item.explanation ? ` — ${item.explanation}` : ""}`
      );
    }
    lines.push("");
  }

  if (s.exitStrategy) {
    lines.push("## Exit Strategy");
    if (s.exitStrategy.tp1Ratio) {
      lines.push(
        `- TP1: 1:${s.exitStrategy.tp1Ratio}R (${s.exitStrategy.tp1Percent || 50}%)`
      );
    }
    if (s.exitStrategy.tp2Ratio) {
      lines.push(
        `- TP2: 1:${s.exitStrategy.tp2Ratio}R (${s.exitStrategy.tp2Percent || 35}%)`
      );
    }
    if (s.exitStrategy.runnerRule) {
      lines.push(`- Runner Rule: ${s.exitStrategy.runnerRule}`);
    }
    if (s.exitStrategy.breakevenRule) {
      lines.push(`- Breakeven Rule: ${s.exitStrategy.breakevenRule}`);
    }
    if (s.exitStrategy.timeStopMinutes) {
      lines.push(`- Time Stop: ${s.exitStrategy.timeStopMinutes} minutes`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function StrategyDetailSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-150">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between px-6 lg:px-8 pt-5 pb-4 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-3 rounded-full bg-violet-500/40 animate-pulse" />
          <div className="h-6 w-52 sm:w-72 rounded-md bg-muted/80 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-5 w-20 rounded-full bg-muted/60 animate-pulse" />
          <div className="h-5 w-12 rounded-md bg-muted/60 animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-6 max-w-3xl">
        {/* Section 1: Plan Type Skeleton */}
        <section className="pb-6 border-b border-border/70 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-violet-500/30 animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted/80 animate-pulse" />
          </div>
          <div className="h-5 w-48 rounded bg-muted/70 animate-pulse" />
          <div className="h-3.5 w-full max-w-md rounded bg-muted/50 animate-pulse" />
        </section>

        {/* Section 2: Charting Process Skeleton */}
        <section className="pb-6 border-b border-border/70 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-violet-500/30 animate-pulse" />
            <div className="h-4 w-36 rounded bg-muted/80 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-muted/60 animate-pulse" />
            <div className="h-3.5 w-4/5 rounded bg-muted/50 animate-pulse" />
            <div className="h-3.5 w-3/5 rounded bg-muted/40 animate-pulse" />
          </div>
        </section>

        {/* Section 3: Entry Criteria Skeleton */}
        <section className="pb-6 border-b border-border/70 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-violet-500/30 animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted/80 animate-pulse" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-1"
              >
                <div className="size-4 rounded border border-border/70 bg-muted/50 animate-pulse shrink-0" />
                <div className="h-3.5 flex-1 rounded bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Rules & Exit Criteria Skeleton */}
        <section className="pb-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-violet-500/30 animate-pulse" />
            <div className="h-4 w-44 rounded bg-muted/80 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-muted/50 animate-pulse" />
            <div className="h-3.5 w-3/4 rounded bg-muted/40 animate-pulse" />
          </div>
        </section>
      </div>
    </div>
  );
}

function StrategyRightPanelSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="h-4 w-28 rounded bg-muted/70 animate-pulse" />
      <div className="rounded-xl border border-border/70 bg-card/70 p-3.5 space-y-2.5 shadow-2xs">
        <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
        <div className="h-8 w-24 rounded bg-muted/80 animate-pulse" />
        <div className="h-12 w-full rounded bg-muted/40 animate-pulse" />
      </div>
      <div className="rounded-xl border border-border/70 bg-card/70 p-3.5 space-y-2.5 shadow-2xs">
        <div className="h-3 w-24 rounded bg-muted/60 animate-pulse" />
        <div className="h-3.5 w-full rounded bg-muted/50 animate-pulse" />
        <div className="h-3.5 w-4/5 rounded bg-muted/50 animate-pulse" />
      </div>
    </div>
  );
}

function EmptyPlaybookRightPanel() {
  return (
    <aside className="flex w-full flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
        <div className="flex items-center gap-1.5 px-4 pb-2 pt-3.5 text-xs font-semibold text-foreground">
          <Activity size={13} className="text-violet-400" /> Plan Stats
        </div>
        <div className="grid grid-cols-2 gap-px bg-border/40">
          {["Trades Taken", "Win Rate", "Expectancy", "Profit Factor"].map((label) => (
            <div key={label} className="bg-card/60 px-4 py-3">
              <span className="font-mono text-lg font-bold tracking-tight text-muted-foreground/50">—</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
        <div className="flex items-center gap-1.5 px-4 pb-2 pt-3.5 text-xs font-semibold text-foreground">
          <ShieldAlert size={13} className="text-rose-400" /> Risk Controls
        </div>
        <div className="grid grid-cols-2 gap-px bg-border/40">
          {["Min R:R Ratio", "Risk per trade"].map((label) => (
            <div key={label} className="bg-card/60 px-4 py-3">
              <span className="font-mono text-base font-bold tracking-tight text-muted-foreground/50">—</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="col-span-2 bg-card/60 px-4 py-3 text-[11px] text-muted-foreground">Add strategy details to define risk controls.</div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
        <div className="flex items-center gap-1.5 px-4 pb-2 pt-3.5 text-xs font-semibold text-foreground">
          <Clock size={13} className="text-sky-400" /> Trading Window
        </div>
        <div className="px-4 pb-4 text-center text-[11px] text-muted-foreground">No trading hours set</div>
      </div>
    </aside>
  );
}

export function StrategyView({ initialStrategies }: StrategyViewProps) {
  const { showFeedback } = useOperationFeedback();
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStrategies[0]?.id || null
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addChoiceOpen, setAddChoiceOpen] = useState(false);
  const initialPlaybook = initialStrategies.find((strategy) => strategy.id === initialStrategies[0]?.id && strategy.playbookContent !== null);
  const [blankPlaybookOpen, setBlankPlaybookOpen] = useState(!!initialPlaybook);
  const [blankPlaybookId, setBlankPlaybookId] = useState<string | null>(initialPlaybook?.id ?? null);
  const [continuousPlaybook, setContinuousPlaybook] = useState(initialPlaybook?.playbookContinuous ?? false);
  const [playbookTitle, setPlaybookTitle] = useState(initialPlaybook?.name ?? "Untitled playbook");
  const [playbookIsActive, setPlaybookIsActive] = useState(initialPlaybook?.status === "ACTIVE");
  const [playbookContent, setPlaybookContent] = useState(initialPlaybook?.playbookContent ?? "<p><br></p>");
  const [playbookReviewed, setPlaybookReviewed] = useState(initialPlaybook?.isReviewed ?? false);
  const [playbookReviewedAt, setPlaybookReviewedAt] = useState(initialPlaybook?.reviewedAt ?? null);
  const [playbookSaveState, setPlaybookSaveState] = useState<"saving" | "saved" | "failed">("saved");
  const saveSequenceRef = useRef(0);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const showToast = (msg: string) => showFeedback({
    kind: /fail|error|network/i.test(msg) ? "failure" : "success",
    title: /fail|error|network/i.test(msg) ? "Operation failed" : "Changes saved",
    description: msg,
  });

  const selectedStrategy = strategies.find((s) => s.id === selectedId) || null;

  useEffect(() => {
    if (!blankPlaybookOpen || !blankPlaybookId) return;
    const sequence = ++saveSequenceRef.current;
    setPlaybookSaveState("saving");
    const timer = window.setTimeout(async () => {
      const status = playbookIsActive ? "ACTIVE" : "CALIBRATING";
      setStrategies((previous) => previous.map((strategy) => strategy.id === blankPlaybookId
        ? { ...strategy, name: playbookTitle.trim() || "Untitled playbook", status, playbookContent, playbookContinuous: continuousPlaybook, isReviewed: playbookReviewed, reviewedAt: playbookReviewedAt }
        : strategy));
      try {
        const response = await fetch(`/api/strategies/${blankPlaybookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: playbookTitle.trim() || "Untitled playbook",
            status,
            playbookContent,
            playbookContinuous: continuousPlaybook,
            isReviewed: playbookReviewed,
            reviewedAt: playbookReviewedAt,
          }),
        });
        if (!response.ok) throw new Error("Failed to autosave playbook");
        if (saveSequenceRef.current === sequence) setPlaybookSaveState("saved");
      } catch (error) {
        console.error("Failed to autosave playbook:", error);
        if (saveSequenceRef.current === sequence) {
          setPlaybookSaveState("failed");
          showFeedback({ kind: "failure", title: "Playbook wasn’t saved", description: error instanceof Error ? error.message : "Please try again." });
        }
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [blankPlaybookOpen, blankPlaybookId, playbookTitle, playbookIsActive, playbookContent, continuousPlaybook, playbookReviewed, playbookReviewedAt, showFeedback]);

  const handleSelectStrategy = (id: string) => {
    if (id === selectedId) {
      const selected = strategies.find((item) => item.id === id);
      if (selected?.playbookContent !== null && selected && !blankPlaybookOpen) {
        setBlankPlaybookId(selected.id);
        setPlaybookTitle(selected.name);
        setPlaybookIsActive(selected.status === "ACTIVE");
        setPlaybookContent(selected.playbookContent || "<p><br></p>");
        setContinuousPlaybook(selected.playbookContinuous);
        setPlaybookReviewed(selected.isReviewed);
        setPlaybookReviewedAt(selected.reviewedAt);
        setBlankPlaybookOpen(true);
      }
      return;
    }
    setLoadingId(id);
    setTimeout(() => {
      const strategy = strategies.find((item) => item.id === id);
      setSelectedId(id);
      setLoadingId(null);
      if (strategy?.playbookContent !== null && strategy) {
        setBlankPlaybookId(strategy.id);
        setPlaybookTitle(strategy.name);
        setPlaybookIsActive(strategy.status === "ACTIVE");
        setPlaybookContent(strategy.playbookContent || "<p><br></p>");
        setContinuousPlaybook(strategy.playbookContinuous);
        setPlaybookReviewed(strategy.isReviewed);
        setPlaybookReviewedAt(strategy.reviewedAt);
        setBlankPlaybookOpen(true);
      } else {
        setBlankPlaybookOpen(false);
        setBlankPlaybookId(null);
      }
    }, 320);
  };

  const handleOpenAddModal = () => {
    setEditingStrategy(null);
    setAddChoiceOpen(true);
  };

  const handleChooseStrategyForm = () => {
    setAddChoiceOpen(false);
    setEditingStrategy(null);
    setAddModalOpen(true);
  };

  const handleChooseEmptyPlaybook = () => {
    setAddChoiceOpen(false);
    setPlaybookTitle("Untitled playbook");
    setPlaybookIsActive(false);
    setContinuousPlaybook(false);
    setPlaybookContent("<p><br></p>");
    setPlaybookReviewed(false);
    setPlaybookReviewedAt(null);
    setPlaybookSaveState("saving");
    setBlankPlaybookId(null);
    setBlankPlaybookOpen(true);
    void fetch("/api/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled playbook", status: "CALIBRATING", playbookContent: "<p><br></p>" }),
    }).then(async (response) => {
      if (!response.ok) throw new Error("Could not create empty playbook");
      const result = await response.json();
      const saved = result.strategy as Strategy;
      setStrategies((previous) => [saved, ...previous.filter((strategy) => strategy.id !== saved.id)]);
      setSelectedId(saved.id);
      setBlankPlaybookId(saved.id);
      setPlaybookSaveState("saved");
    }).catch((error) => {
      console.error("Failed to create empty playbook:", error);
      setPlaybookSaveState("failed");
      showFeedback({ kind: "failure", title: "Playbook wasn’t created", description: error instanceof Error ? error.message : "Please try again." });
    });
  };

  const handleOpenEditModal = (strategy: Strategy) => {
    setBlankPlaybookOpen(false);
    setEditingStrategy(strategy);
    setAddModalOpen(true);
  };

  const handleSaveStrategy = (saved: Strategy) => {
    setBlankPlaybookOpen(false);
    setStrategies((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setSelectedId(saved.id);
    showToast(editingStrategy ? `Updated "${saved.name}"` : `Created "${saved.name}"`);
  };

  const handleUpdateStrategy = async (partial: Partial<Strategy>) => {
    if (!selectedStrategy) return;

    // Optimistic update
    setStrategies((prev) =>
      prev.map((s) =>
        s.id === selectedStrategy.id ? { ...s, ...partial } : s
      )
    );

    // Persist
    try {
      const res = await fetch(`/api/strategies/${selectedStrategy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!res.ok) throw new Error("Failed to save changes to database");
      showToast("Changes saved");
    } catch (err) {
      console.error("Failed to persist strategy update:", err);
      setStrategies((prev) => prev.map((s) => s.id === selectedStrategy.id ? selectedStrategy : s));
      showFeedback({ kind: "failure", title: "Strategy wasn’t updated", description: err instanceof Error ? err.message : "Network error saving changes" });
    }
  };

  const handleStatusChange = async (id: string, status: StrategyStatus) => {
    const previousStatus = strategies.find((strategy) => strategy.id === id)?.status;
    // Optimistic update
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("The server couldn’t update this strategy.");
      showToast(`Status changed to ${status.toLowerCase()}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      if (previousStatus) setStrategies((prev) => prev.map((strategy) => strategy.id === id ? { ...strategy, status: previousStatus } : strategy));
      showFeedback({ kind: "failure", title: "Status wasn’t changed", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

  const handleDuplicateStrategy = async (strategy: Strategy) => {
    const duplicateInput: CreateStrategyInput = {
      accountId: strategy.accountId,
      name: `${strategy.name} (Copy)`,
      category: strategy.category,
      version: strategy.version || "v1.0",
      status: "CALIBRATING",
      description: strategy.description,
      thesis: strategy.thesis,
      assetUniverse: strategy.assetUniverse || [],
      marketRegime: strategy.marketRegime || "High Volatility Trend",
      edgeScore: strategy.edgeScore ?? 80,
      expectancyR: strategy.expectancyR ?? 0.8,
      winRateTarget: strategy.winRateTarget ?? 60,
      profitFactor: strategy.profitFactor ?? 2.0,
      sampleSize: 0,
      edgeStateNotes: strategy.edgeStateNotes,
      maxRiskPercent: strategy.maxRiskPercent ?? 1.0,
      minRrRatio: strategy.minRrRatio ?? 2.0,
      invalidationRule: strategy.invalidationRule,
      stopLossLogic: strategy.stopLossLogic,
      killSwitchRule: strategy.killSwitchRule,
      tradingSessions: strategy.tradingSessions || ["New York AM"],
      killZoneStart: strategy.killZoneStart || "09:30",
      killZoneEnd: strategy.killZoneEnd || "11:30",
      timeZone: strategy.timeZone || "EST (UTC-5)",
      daysOfWeek: strategy.daysOfWeek || ["Tuesday", "Wednesday", "Thursday"],
      newsBlackoutRule: strategy.newsBlackoutRule,
      entryChecklist: strategy.entryChecklist || [],
      disqualifiers: strategy.disqualifiers || [],
      exitStrategy: strategy.exitStrategy,
      refinements: [],
    };

    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateInput),
      });

      if (!res.ok) {
        throw new Error("Failed to duplicate strategy");
      }

      const { strategy: cloned } = await res.json();
      setStrategies((prev) => [cloned, ...prev]);
      setSelectedId(cloned.id);
      showToast(`Duplicated "${strategy.name}"`);
    } catch (err) {
      console.error("Failed to duplicate strategy:", err);
      showToast("Failed to duplicate strategy");
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    const target = strategies.find((s) => s.id === id);
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("The server couldn’t delete this strategy.");
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(strategies.find((strategy) => strategy.id !== id)?.id || null);
      showToast(`Deleted "${target?.name || "Strategy"}"`);
    } catch (err) {
      console.error("Failed to delete strategy:", err);
      showFeedback({ kind: "failure", title: "Strategy wasn’t deleted", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

  const handleCopyPlaybook = (strategy: Strategy) => {
    const markdown = formatPlaybookMarkdown(strategy);
    void navigator.clipboard.writeText(markdown).then(
      () => showToast(`Playbook copied for "${strategy.name}"`),
      (error) => showFeedback({ kind: "failure", title: "Playbook wasn’t copied", description: error instanceof Error ? error.message : "Clipboard access failed." }),
    );
  };

  return (
    <>
      {/* Full-height 3-column layout */}
      <div className="flex h-full w-full overflow-hidden">
        {/* ─── Left: Strategy List with Card Background in Light and Dark Mode ─── */}
        <div className="hidden md:flex w-[280px] lg:w-[295px] xl:w-[320px] shrink-0 h-full bg-card">
          <StrategyListPanel
            strategies={strategies}
            selectedStrategyId={selectedId}
            loadingStrategyId={loadingId}
            onSelectStrategy={handleSelectStrategy}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onDuplicateStrategy={handleDuplicateStrategy}
            onStatusChange={handleStatusChange}
            onDeleteStrategy={handleDeleteStrategy}
            onCopyPlaybook={handleCopyPlaybook}
          />
        </div>

        {/* ─── Center: Strategy Detail with Loading Animation on Selection ─── */}
        <div className="flex-1 min-w-0 border-r border-border/70 bg-background h-full overflow-hidden">
          {blankPlaybookOpen ? (
            <div className="flex h-full flex-col bg-background">
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3 lg:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBlankPlaybookOpen(false)} className="h-8 gap-1.5 px-2 text-xs">
                    <ArrowLeft size={14} /> Back
                  </Button>
                  <span className="size-3 shrink-0 rounded-full bg-violet-500/50" />
                  <input
                    aria-label="Playbook title"
                    value={playbookTitle}
                    onChange={(event) => setPlaybookTitle(event.target.value)}
                    placeholder="Untitled playbook"
                    className="w-full min-w-0 bg-transparent text-lg font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={playbookIsActive}
                    onClick={() => setPlaybookIsActive((active) => !active)}
                    className="flex items-center gap-2 text-xs font-semibold text-foreground"
                  >
                    <span className={`relative h-5 w-9 rounded-full transition-colors ${playbookIsActive ? "bg-violet-500" : "bg-white/[0.12]"}`}>
                      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${playbookIsActive ? "translate-x-4" : "translate-x-0.5"}`} />
                    </span>
                    <span className="hidden xl:inline">{playbookIsActive ? "Active" : "Calibrating"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStrategy(null);
                      setAddModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
                  >
                    <Edit3 size={13} />
                    <span className="hidden sm:inline">Full Edit</span>
                  </button>
                  <div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5" aria-label="Document page layout">
                    <button type="button" aria-label="Paged layout" title="Paged layout" aria-pressed={!continuousPlaybook} onClick={() => setContinuousPlaybook(false)} className={`rounded-md p-1.5 transition-colors ${!continuousPlaybook ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <Files size={15} />
                    </button>
                    <button type="button" aria-label="Continuous layout" title="Continuous layout" aria-pressed={continuousPlaybook} onClick={() => setContinuousPlaybook(true)} className={`rounded-md p-1.5 transition-colors ${continuousPlaybook ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <AlignJustify size={15} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-muted/30 px-4 py-8 sm:px-8">
                <article
                  className={`playbook-document-editor mx-auto min-h-[1123px] w-full max-w-[794px] border border-border/60 shadow-sm ${continuousPlaybook ? "bg-card" : "bg-transparent border-0 shadow-none"}`}
                  style={continuousPlaybook ? undefined : {
                    backgroundColor: "transparent",
                    backgroundImage: "linear-gradient(to bottom, var(--card) 0, var(--card) 1123px, transparent 1123px, transparent 1147px)",
                    backgroundSize: "100% 1147px",
                  }}
                >
                  <PlaybookBlockEditor key={blankPlaybookId ?? "new-playbook"} initialContent={playbookContent} onChange={setPlaybookContent} />
                </article>
              </div>
              <div className="flex shrink-0 items-center gap-3 border-t border-border/60 bg-card/40 px-6 py-3 backdrop-blur-md lg:px-8">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setPlaybookReviewed(true);
                    setPlaybookReviewedAt(new Date().toISOString());
                  }}
                  disabled={playbookReviewed}
                  className={`h-9 cursor-pointer px-5 text-xs font-semibold ${playbookReviewed ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-violet-600 text-white shadow-sm shadow-violet-950/30 hover:bg-violet-500"}`}
                >
                  <Check size={14} className="mr-1.5" />
                  {playbookReviewed ? "Reviewed" : "Mark as reviewed"}
                </Button>
                <span className="text-[11px] font-medium text-foreground">
                  Last reviewed {playbookReviewedAt ? new Date(playbookReviewedAt).toLocaleString() : "—"}
                </span>
                <span className={`ml-auto text-[10px] ${playbookSaveState === "failed" ? "text-rose-400" : "text-muted-foreground"}`} aria-live="polite">
                  {playbookSaveState === "saving" ? "Saving…" : playbookSaveState === "failed" ? "Save failed" : "Saved"}
                </span>
              </div>
            </div>
          ) : loadingId ? (
            <StrategyDetailSkeleton />
          ) : selectedStrategy ? (
            <StrategyDetail
              strategy={selectedStrategy}
              onUpdateStrategy={handleUpdateStrategy}
              onOpenEdit={handleOpenEditModal}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Activity className="size-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                No strategy selected
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Select a strategy from the library, or create a new one to begin
                documenting your edge.
              </p>
            </div>
          )}
        </div>

        {/* ─── Right: Stats Panel with Loading Animation on Selection ─── */}
        {(selectedStrategy || blankPlaybookOpen) && (
          <div className="hidden lg:block w-[220px] xl:w-[240px] shrink-0 overflow-y-auto p-4 bg-background h-full">
            {blankPlaybookOpen ? (
              <EmptyPlaybookRightPanel />
            ) : loadingId ? (
              <StrategyRightPanelSkeleton />
            ) : (
              selectedStrategy && <StrategyRightPanel strategy={selectedStrategy} />
            )}
          </div>
        )}
      </div>

      <Dialog open={addChoiceOpen} onOpenChange={setAddChoiceOpen}>
        <DialogContent className="max-w-lg p-6">
          <div className="mb-5">
            <DialogTitle>What would you like to create?</DialogTitle>
            <DialogDescription className="mt-1.5">Start with a structured strategy form or a blank playbook document.</DialogDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={handleChooseEmptyPlaybook} className="group rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:border-violet-500/60 hover:bg-violet-500/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400"><FileText size={18} /></span>
              <span className="block text-sm font-semibold text-foreground">Empty document</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Open a clean, blank playbook.</span>
            </button>
            <button type="button" onClick={handleChooseStrategyForm} className="group rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:border-violet-500/60 hover:bg-violet-500/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"><ListChecks size={18} /></span>
              <span className="block text-sm font-semibold text-foreground">Form</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Create a strategy with the guided form.</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add / Edit Modal ─── */}
      <AddStrategyModal
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) setEditingStrategy(null);
        }}
        onSaveSuccess={handleSaveStrategy}
        editingStrategy={editingStrategy}
      />

    </>
  );
}
