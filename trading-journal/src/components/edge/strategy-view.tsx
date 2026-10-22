"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { StrategyListPanel } from "@/components/edge/strategy-list-panel";
import { StrategyDetail } from "@/components/edge/strategy-detail";
import { StrategyRightPanel } from "@/components/edge/strategy-right-panel";
import { AddStrategyModal } from "@/components/edge/add-strategy-modal";
import type { Strategy } from "@/types/strategy";

interface StrategyViewProps {
  initialStrategies: Strategy[];
}

export function StrategyView({ initialStrategies }: StrategyViewProps) {
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStrategies[0]?.id || null
  );
  const [addModalOpen, setAddModalOpen] = useState(false);

  const selectedStrategy = strategies.find((s) => s.id === selectedId) || null;

  const handleSelectStrategy = (id: string) => {
    setSelectedId(id);
  };

  const handleSaveNewStrategy = (saved: Strategy) => {
    setStrategies((prev) => [saved, ...prev]);
    setSelectedId(saved.id);
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

  return (
    <>
      {/* Full-height 3-column layout */}
      <div className="flex h-full w-full overflow-hidden">
        {/* ─── Left: Strategy List ─── */}
        <div className="hidden md:flex w-[220px] xl:w-[240px] shrink-0 h-full">
          <StrategyListPanel
            strategies={strategies}
            selectedStrategyId={selectedId}
            onSelectStrategy={handleSelectStrategy}
            onOpenAddModal={() => setAddModalOpen(true)}
          />
        </div>

        {/* ─── Center: Strategy Detail ─── */}
        <div className="flex-1 min-w-0 border-r border-border/70 bg-background h-full overflow-hidden">
          {selectedStrategy ? (
            <StrategyDetail
              strategy={selectedStrategy}
              onUpdateStrategy={handleUpdateStrategy}
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

        {/* ─── Right: Stats Panel ─── */}
        {selectedStrategy && (
          <div className="hidden lg:block w-[220px] xl:w-[240px] shrink-0 overflow-y-auto p-4 bg-background h-full">
            <StrategyRightPanel strategy={selectedStrategy} />
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      <AddStrategyModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSaveSuccess={handleSaveNewStrategy}
      />
    </>
  );
}
