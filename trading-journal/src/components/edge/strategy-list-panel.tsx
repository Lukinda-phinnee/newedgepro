"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Strategy, StrategyStatus } from "@/types/strategy";
import { cn } from "@/lib/utils";

interface StrategyListPanelProps {
  strategies: Strategy[];
  selectedStrategyId: string | null;
  onSelectStrategy: (id: string) => void;
  onOpenAddModal: () => void;
}

const statusDot: Record<StrategyStatus, string> = {
  ACTIVE: "bg-violet-500",
  CALIBRATING: "bg-amber-400",
  PROBATION: "bg-rose-400",
  ARCHIVED: "bg-neutral-500",
};

export function StrategyListPanel({
  strategies,
  selectedStrategyId,
  onSelectStrategy,
  onOpenAddModal,
}: StrategyListPanelProps) {
  const [search, setSearch] = useState("");

  const activeStrategies = useMemo(
    () =>
      strategies
        .filter((s) => s.status !== "ARCHIVED")
        .filter(
          (s) =>
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.category.toLowerCase().includes(search.toLowerCase())
        ),
    [strategies, search]
  );

  const archivedStrategies = useMemo(
    () =>
      strategies
        .filter((s) => s.status === "ARCHIVED")
        .filter(
          (s) =>
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase())
        ),
    [strategies, search]
  );

  return (
    <aside className="flex flex-col h-full border-r border-border/70 bg-sidebar overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          My Strategies
        </span>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors press-scale-sm"
          title="New strategy"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Search */}
      {strategies.length > 3 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter..."
              className="w-full h-7 pl-7 pr-2 text-[11px] bg-white/[0.04] border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
            />
          </div>
        </div>
      )}

      {/* Strategy Items */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {activeStrategies.map((item) => {
          const isSelected = item.id === selectedStrategyId;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectStrategy(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStrategy(item.id);
                }
              }}
              className={cn(
                "group w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-colors relative cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-violet-500",
                isSelected
                  ? "bg-violet-500/[0.10] text-foreground"
                  : "hover:bg-white/[0.04] text-foreground/90"
              )}
            >
              {/* Status dot */}
              <span
                className={cn(
                  "size-2 rounded-full mt-1.5 shrink-0 ring-2 ring-background",
                  statusDot[item.status]
                )}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[13px] font-medium truncate leading-tight",
                      isSelected ? "text-foreground" : "text-foreground/90"
                    )}
                  >
                    {item.name}
                  </span>

                  {item.status === "ACTIVE" && (
                    <Badge
                      variant="success"
                      size="sm"
                      className="shrink-0 px-1.5 py-0 text-[9px]"
                    >
                      Active
                    </Badge>
                  )}
                </div>

                <span className="text-[11px] text-muted-foreground truncate block mt-0.5 leading-snug">
                  {item.category}
                </span>
              </div>

              {/* 3-dot menu */}
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity shrink-0 mt-0.5 rounded"
              >
                <MoreVertical size={14} />
              </button>
            </div>
          );
        })}

        {/* Archived / Presets Section */}
        {archivedStrategies.length > 0 && (
          <>
            <div className="px-2.5 pt-4 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Archived
              </span>
            </div>

            {archivedStrategies.map((item) => {
              const isSelected = item.id === selectedStrategyId;

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectStrategy(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectStrategy(item.id);
                    }
                  }}
                  className={cn(
                    "group w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-violet-500",
                    isSelected
                      ? "bg-violet-500/[0.10]"
                      : "hover:bg-white/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full mt-1.5 shrink-0",
                      statusDot[item.status]
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-muted-foreground truncate block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70 truncate block mt-0.5">
                      {item.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity shrink-0 rounded"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </aside>
  );
}
