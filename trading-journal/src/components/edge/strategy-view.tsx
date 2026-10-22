"use client";

import { useRef, useState } from "react";
import { Activity, CheckCircle2 } from "lucide-react";
import { StrategyListPanel } from "@/components/edge/strategy-list-panel";
import { StrategyDetail } from "@/components/edge/strategy-detail";
import { StrategyRightPanel } from "@/components/edge/strategy-right-panel";
import { AddStrategyModal } from "@/components/edge/add-strategy-modal";
import type { CreateStrategyInput, Strategy, StrategyStatus } from "@/types/strategy";

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

export function StrategyView({ initialStrategies }: StrategyViewProps) {
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStrategies[0]?.id || null
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const selectedStrategy = strategies.find((s) => s.id === selectedId) || null;

  const handleSelectStrategy = (id: string) => {
    if (id === selectedId) return;
    setLoadingId(id);
    setTimeout(() => {
      setSelectedId(id);
      setLoadingId(null);
    }, 320);
  };

  const handleOpenAddModal = () => {
    setEditingStrategy(null);
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setAddModalOpen(true);
  };

  const handleSaveStrategy = (saved: Strategy) => {
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
      await fetch(`/api/strategies/${selectedStrategy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
    } catch (err) {
      console.error("Failed to persist strategy update:", err);
    }
  };

  const handleStatusChange = async (id: string, status: StrategyStatus) => {
    // Optimistic update
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    showToast(`Status changed to ${status.toLowerCase()}`);

    try {
      await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
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
    setStrategies((prev) => prev.filter((s) => s.id !== id));

    if (selectedId === id) {
      const remaining = strategies.filter((s) => s.id !== id);
      setSelectedId(remaining[0]?.id || null);
    }

    showToast(`Deleted "${target?.name || "Strategy"}"`);

    try {
      await fetch(`/api/strategies/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete strategy:", err);
    }
  };

  const handleCopyPlaybook = (strategy: Strategy) => {
    const markdown = formatPlaybookMarkdown(strategy);
    navigator.clipboard.writeText(markdown);
    showToast(`Playbook copied for "${strategy.name}"`);
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
          {loadingId ? (
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
        {selectedStrategy && (
          <div className="hidden lg:block w-[220px] xl:w-[240px] shrink-0 overflow-y-auto p-4 bg-background h-full">
            {loadingId ? (
              <StrategyRightPanelSkeleton />
            ) : (
              <StrategyRightPanel strategy={selectedStrategy} />
            )}
          </div>
        )}
      </div>

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

      {/* ─── Toast Feedback ─── */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/95 border border-zinc-700/80 text-xs text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
